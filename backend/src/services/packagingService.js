import sequelize from '../config/database.js';
import {
  PackagingOrder,
  ProductionWorkOrder,
  ProductionMaterialConsumption,
  MasterBox,
  PartInstance,
  BoxPartMapping,
  QrCode,
  Product,
  User,
} from '../models/index.js';
import { generateBusinessId, generateSecureToken } from '../utils/idGenerator.js';
import { generateQrDataUrl, createSecureQrPayload } from '../utils/qrGenerator.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { PACKAGING_STATUS, ROLES } from '../constants/index.js';

export const getPackagingOrders = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;

  return await PackagingOrder.findAll({
    where,
    include: [
      {
        model: ProductionWorkOrder,
        as: 'work_order',
        include: [{ model: Product, as: 'product' }],
      },
      { model: Product, as: 'product' },
      { model: User, as: 'operator', attributes: ['id', 'full_name'] },
      {
        model: MasterBox,
        as: 'boxes',
        include: [{ model: PartInstance, as: 'parts' }],
      },
      {
        model: PartInstance,
        as: 'parts',
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getPackagingOrderById = async (id) => {
  return await PackagingOrder.findByPk(id, {
    include: [
      {
        model: ProductionWorkOrder,
        as: 'work_order',
        include: [
          { model: Product, as: 'product' },
          {
            model: ProductionMaterialConsumption,
            as: 'consumptions',
          },
        ],
      },
      { model: Product, as: 'product' },
      { model: User, as: 'operator', attributes: ['id', 'full_name'] },
      {
        model: MasterBox,
        as: 'boxes',
        include: [{ model: PartInstance, as: 'parts' }],
      },
      { model: PartInstance, as: 'parts' },
    ],
  });
};

/**
 * Approves packaging and generates Part Instances, Master Boxes, and QR codes.
 * ENFORCEMENT: Never generate QR codes prior to packaging approval!
 */
export const approvePackagingOrder = async (id, { component_verification, condition_verification, box_capacity = 20, remarks }, operatorId) => {
  const t = await sequelize.transaction();
  try {
    const pkgOrder = await PackagingOrder.findByPk(id, {
      include: [
        {
          model: ProductionWorkOrder,
          as: 'work_order',
          include: [{ model: ProductionMaterialConsumption, as: 'consumptions' }],
        },
      ],
      transaction: t,
    });

    if (!pkgOrder) throw new Error('Packaging Order not found');

    if (!component_verification || !condition_verification) {
      throw new Error('Component count verification and physical condition verification are mandatory prior to packaging approval.');
    }

    if (pkgOrder.status === PACKAGING_STATUS.APPROVED || pkgOrder.status === PACKAGING_STATUS.PACKED) {
      throw new Error('This packaging order has already been approved and packed.');
    }

    const totalQty = parseInt(pkgOrder.total_quantity, 10);
    const capacityPerBox = parseInt(box_capacity || 20, 10);
    const totalBoxesNeeded = Math.ceil(totalQty / capacityPerBox);

    // Retrieve consumed source batch (if any) to map to parts
    const consumedBatches = pkgOrder.work_order.consumptions || [];
    const primaryBatchId = consumedBatches.length > 0 ? consumedBatches[0].batch_id : null;

    // Get current counts for sequential human-readable IDs
    const currentBoxCount = await MasterBox.count({ transaction: t });
    const currentPartCount = await PartInstance.count({ transaction: t });

    let partIndex = currentPartCount;
    const createdBoxes = [];
    const createdParts = [];

    for (let b = 0; b < totalBoxesNeeded; b++) {
      const box_number = generateBusinessId('BX', currentBoxCount + b + 1);
      const boxToken = generateSecureToken('box', box_number);

      const boxQrPayload = createSecureQrPayload('box', box_number, boxToken);
      const boxQrDataUrl = await generateQrDataUrl(boxQrPayload);

      const currentBoxQty = Math.min(capacityPerBox, totalQty - b * capacityPerBox);

      const box = await MasterBox.create(
        {
          box_number,
          packaging_order_id: pkgOrder.id,
          qr_code: boxQrDataUrl,
          qr_token: boxToken,
          capacity: capacityPerBox,
          packed_count: currentBoxQty,
          status: 'Packed',
          created_by: operatorId,
        },
        { transaction: t }
      );

      // Register QR Code in central registry
      await QrCode.create(
        {
          code_type: 'BOX',
          code_value: box_number,
          token: boxToken,
          entity_type: 'MasterBox',
          entity_id: box.id,
          qr_image_data: boxQrDataUrl,
        },
        { transaction: t }
      );

      createdBoxes.push(box);

      // Generate Parts for this box
      for (let p = 0; p < currentBoxQty; p++) {
        partIndex++;
        const part_number = generateBusinessId('PT', partIndex);
        const partToken = generateSecureToken('part', part_number);

        const partQrPayload = createSecureQrPayload('part', part_number, partToken);
        const partQrDataUrl = await generateQrDataUrl(partQrPayload);

        const part = await PartInstance.create(
          {
            part_number,
            packaging_order_id: pkgOrder.id,
            box_id: box.id,
            work_order_id: pkgOrder.work_order_id,
            product_id: pkgOrder.product_id,
            qr_code: partQrDataUrl,
            qr_token: partToken,
            status: 'Active',
            serial_number: `SN-${Date.now()}-${partIndex}`,
            created_by: operatorId,
          },
          { transaction: t }
        );

        // Register part QR in registry
        await QrCode.create(
          {
            code_type: 'PART',
            code_value: part_number,
            token: partToken,
            entity_type: 'PartInstance',
            entity_id: part.id,
            qr_image_data: partQrDataUrl,
          },
          { transaction: t }
        );

        // Map Part to Box and Source Batch
        await BoxPartMapping.create(
          {
            box_id: box.id,
            part_id: part.id,
            batch_id: primaryBatchId,
          },
          { transaction: t }
        );

        createdParts.push(part);
      }
    }

    pkgOrder.status = PACKAGING_STATUS.APPROVED;
    pkgOrder.packed_quantity = totalQty;
    pkgOrder.component_verification = true;
    pkgOrder.condition_verification = true;
    pkgOrder.operator_id = operatorId;
    pkgOrder.inspected_at = new Date();
    pkgOrder.approved_by = operatorId;
    pkgOrder.approved_at = new Date();
    pkgOrder.remarks = remarks || 'Component count and condition verified. Box & Part QR codes generated.';
    await pkgOrder.save({ transaction: t });

    await logAudit({
      userId: operatorId,
      action: 'APPROVE_PACKAGING_AND_GENERATE_QRS',
      entityType: 'PackagingOrder',
      entityId: pkgOrder.id,
      newValues: {
        total_boxes: createdBoxes.length,
        total_parts: createdParts.length,
        status: pkgOrder.status,
      },
      transaction: t,
    });

    await createNotification({
      role: ROLES.ACCOUNTS,
      title: 'Packaging Approved - Dispatch Clearance Ready',
      message: `Packaging Order ${pkgOrder.packaging_number} approved (${createdBoxes.length} boxes, ${createdParts.length} parts). Ready for Accounts checklist.`,
      entityType: 'PackagingOrder',
      entityId: pkgOrder.id,
      transaction: t,
    });

    await t.commit();
    return await getPackagingOrderById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
