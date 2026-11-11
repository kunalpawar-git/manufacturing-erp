import sequelize from '../config/database.js';
import {
  ProductionWorkOrder,
  ProductionMaterialConsumption,
  InventoryBatch,
  InventoryTransaction,
  SalesRequirement,
  PurchaseOrder,
  Product,
  BomItem,
  Material,
  User,
  Department,
  SampleQcRecord,
  PackagingOrder,
} from '../models/index.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { WORK_ORDER_STATUS, INVENTORY_STATUS, PACKAGING_STATUS, ROLES } from '../constants/index.js';

export const getWorkOrders = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.product_id) where.product_id = filters.product_id;

  return await ProductionWorkOrder.findAll({
    where,
    include: [
      {
        model: Product,
        as: 'product',
        include: [{ model: BomItem, as: 'bom_items', include: [{ model: Material, as: 'material' }] }],
      },
      { model: SalesRequirement, as: 'sales_requirement' },
      { model: PurchaseOrder, as: 'purchase_order' },
      { model: User, as: 'assignee', attributes: ['id', 'full_name'] },
      { model: Department, as: 'department' },
      {
        model: ProductionMaterialConsumption,
        as: 'consumptions',
        include: [
          { model: InventoryBatch, as: 'batch' },
          { model: Material, as: 'material' },
        ],
      },
      {
        model: SampleQcRecord,
        as: 'qc_records',
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getWorkOrderById = async (id) => {
  return await ProductionWorkOrder.findByPk(id, {
    include: [
      {
        model: Product,
        as: 'product',
        include: [{ model: BomItem, as: 'bom_items', include: [{ model: Material, as: 'material' }] }],
      },
      { model: SalesRequirement, as: 'sales_requirement' },
      { model: PurchaseOrder, as: 'purchase_order' },
      { model: User, as: 'assignee', attributes: ['id', 'full_name'] },
      { model: Department, as: 'department' },
      {
        model: ProductionMaterialConsumption,
        as: 'consumptions',
        include: [
          { model: InventoryBatch, as: 'batch' },
          { model: Material, as: 'material' },
        ],
      },
      { model: SampleQcRecord, as: 'qc_records' },
    ],
  });
};

export const prepareSample = async (id, sampleNotes, userId) => {
  const wo = await ProductionWorkOrder.findByPk(id);
  if (!wo) throw new Error('Work Order not found');

  wo.status = WORK_ORDER_STATUS.SAMPLE_QC_PENDING;
  wo.sample_status = 'Prepared';
  wo.sample_notes = sampleNotes;
  await wo.save();

  await logAudit({
    userId,
    action: 'PREPARE_SAMPLE',
    entityType: 'ProductionWorkOrder',
    entityId: id,
    newValues: { sample_status: 'Prepared', sample_notes: sampleNotes },
  });

  await createNotification({
    role: ROLES.QC_OPERATOR,
    title: 'Sample Ready for Quality Control',
    message: `Sample for Work Order ${wo.work_order_number} is ready for QC inspection.`,
    entityType: 'ProductionWorkOrder',
    entityId: wo.id,
  });

  return await getWorkOrderById(id);
};

export const recordBatchConsumption = async (workOrderId, consumptions = [], userId) => {
  const t = await sequelize.transaction();
  try {
    const wo = await ProductionWorkOrder.findByPk(workOrderId, { transaction: t });
    if (!wo) throw new Error('Work Order not found');

    for (const c of consumptions) {
      const batch = await InventoryBatch.findByPk(c.batch_id, { transaction: t });
      if (!batch) throw new Error(`Batch ${c.batch_id} not found`);

      if (batch.status === INVENTORY_STATUS.REJECTED || batch.status === INVENTORY_STATUS.QUARANTINED) {
        throw new Error(`Cannot consume rejected or quarantined batch ${batch.internal_batch_id}`);
      }

      const qtyToConsume = parseFloat(c.quantity_consumed);
      if (batch.current_quantity < qtyToConsume) {
        throw new Error(`Insufficient stock in batch ${batch.internal_batch_id}. Available: ${batch.current_quantity}, requested: ${qtyToConsume}`);
      }

      // Deduct from batch
      const prevQty = batch.current_quantity;
      batch.current_quantity = prevQty - qtyToConsume;
      batch.consumed_quantity = (batch.consumed_quantity || 0) + qtyToConsume;
      if (batch.current_quantity === 0) {
        batch.status = INVENTORY_STATUS.CONSUMED;
      }
      await batch.save({ transaction: t });

      // Create consumption record
      await ProductionMaterialConsumption.create(
        {
          work_order_id: wo.id,
          batch_id: batch.id,
          material_id: batch.material_id,
          quantity_consumed: qtyToConsume,
          scrap_quantity: parseFloat(c.scrap_quantity || 0),
          notes: c.notes || `Consumed in ${wo.work_order_number}`,
        },
        { transaction: t }
      );

      // Create Stock Ledger Transaction
      const count = await InventoryTransaction.count({ transaction: t });
      const transaction_number = generateBusinessId('TXN', count + 1);

      await InventoryTransaction.create(
        {
          transaction_number,
          batch_id: batch.id,
          material_id: batch.material_id,
          transaction_type: 'CONSUMPTION',
          quantity: qtyToConsume,
          previous_quantity: prevQty,
          new_quantity: batch.current_quantity,
          reference_type: 'PRODUCTION_WO',
          reference_id: wo.work_order_number,
          remarks: `Material consumed for Work Order ${wo.work_order_number}`,
          created_by: userId,
        },
        { transaction: t }
      );
    }

    await logAudit({
      userId,
      action: 'RECORD_PRODUCTION_CONSUMPTION',
      entityType: 'ProductionWorkOrder',
      entityId: wo.id,
      newValues: { consumed_batches_count: consumptions.length },
      transaction: t,
    });

    await t.commit();
    return await getWorkOrderById(workOrderId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const completeProduction = async (id, { produced_quantity, rejected_quantity, remarks }, userId) => {
  const t = await sequelize.transaction();
  try {
    const wo = await ProductionWorkOrder.findByPk(id, { transaction: t });
    if (!wo) throw new Error('Work Order not found');

    if (wo.sample_status !== 'QC Passed') {
      throw new Error('Production cannot be marked complete without an approved Sample QC!');
    }

    wo.produced_quantity = parseFloat(produced_quantity);
    wo.rejected_quantity = parseFloat(rejected_quantity || 0);
    wo.status = WORK_ORDER_STATUS.COMPLETED;
    wo.end_date = new Date().toISOString().split('T')[0];
    wo.remarks = remarks || wo.remarks;
    await wo.save({ transaction: t });

    // Automatically generate Packaging Order!
    const pkgCount = await PackagingOrder.count({ transaction: t });
    const packaging_number = generateBusinessId('PKG', pkgCount + 1);

    const packagingOrder = await PackagingOrder.create(
      {
        packaging_number,
        work_order_id: wo.id,
        product_id: wo.product_id,
        total_quantity: wo.produced_quantity,
        packed_quantity: 0,
        rejected_quantity: 0,
        status: PACKAGING_STATUS.PENDING,
        component_verification: false,
        condition_verification: false,
        created_by: userId,
      },
      { transaction: t }
    );

    await logAudit({
      userId,
      action: 'COMPLETE_PRODUCTION',
      entityType: 'ProductionWorkOrder',
      entityId: wo.id,
      newValues: { produced_quantity, status: wo.status },
      transaction: t,
    });

    await createNotification({
      role: ROLES.PACKAGING,
      title: 'New Packaging Order Ready',
      message: `Packaging Order ${packaging_number} created for ${wo.produced_quantity} finished parts.`,
      entityType: 'PackagingOrder',
      entityId: packagingOrder.id,
      transaction: t,
    });

    await t.commit();
    return await getWorkOrderById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
