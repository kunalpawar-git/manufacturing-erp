import sequelize from '../config/database.js';
import {
  IqcInspection,
  MaterialReceipt,
  InventoryBatch,
  InventoryTransaction,
  Vendor,
  Material,
  User,
  Location,
} from '../models/index.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { IQC_STATUS, INVENTORY_STATUS, ROLES } from '../constants/index.js';

export const getIqcInspections = async (filters = {}) => {
  const where = {};
  if (filters.division) where.division = filters.division;
  if (filters.status) where.status = filters.status;

  return await IqcInspection.findAll({
    where,
    include: [
      {
        model: MaterialReceipt,
        as: 'receipt',
      },
      { model: Vendor, as: 'vendor' },
      { model: Material, as: 'material' },
      { model: User, as: 'inspector', attributes: ['id', 'full_name', 'email'] },
      { model: InventoryBatch, as: 'batch' },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getIqcById = async (id) => {
  return await IqcInspection.findByPk(id, {
    include: [
      { model: MaterialReceipt, as: 'receipt' },
      { model: Vendor, as: 'vendor' },
      { model: Material, as: 'material' },
      { model: User, as: 'inspector', attributes: ['id', 'full_name'] },
      { model: InventoryBatch, as: 'batch' },
    ],
  });
};

export const createIqcInspection = async (inspectionData, userId) => {
  const t = await sequelize.transaction();
  try {
    const receipt = await MaterialReceipt.findByPk(inspectionData.receipt_id, { transaction: t });
    if (!receipt) throw new Error('Material Receipt not found');

    const iqcCount = await IqcInspection.count({ transaction: t });
    const inspection_number = generateBusinessId('IQC', iqcCount + 1);
    const internal_batch_id = generateBusinessId('B', iqcCount + 1);

    const acceptedQty = parseFloat(inspectionData.accepted_quantity || 0);
    const rejectedQty = parseFloat(inspectionData.rejected_quantity || 0);
    const quarantinedQty = parseFloat(inspectionData.quarantined_quantity || 0);
    const totalAccounted = acceptedQty + rejectedQty + quarantinedQty;

    if (totalAccounted > receipt.received_quantity) {
      throw new Error(`Total inspected quantity (${totalAccounted}) cannot exceed received quantity (${receipt.received_quantity})`);
    }

    let status = IQC_STATUS.PENDING;
    if (acceptedQty > 0 && rejectedQty === 0 && quarantinedQty === 0) {
      status = IQC_STATUS.ACCEPTED;
    } else if (rejectedQty > 0 && acceptedQty === 0) {
      status = IQC_STATUS.REJECTED;
    } else if (quarantinedQty > 0 && acceptedQty === 0) {
      status = IQC_STATUS.QUARANTINED;
    } else if (totalAccounted > 0) {
      status = IQC_STATUS.ACCEPTED; // Partially accepted
    }

    const inspection = await IqcInspection.create(
      {
        inspection_number,
        receipt_id: receipt.id,
        division: inspectionData.division, // Paint, Assembly, Store, Basement
        vendor_id: receipt.vendor_id,
        material_id: receipt.material_id,
        vendor_batch_number: inspectionData.vendor_batch_number, // PRESERVED EXACTLY
        internal_batch_id, // IMMUTABLE INTERNAL ID
        received_quantity: receipt.received_quantity,
        accepted_quantity: acceptedQty,
        rejected_quantity: rejectedQty,
        quarantined_quantity: quarantinedQty,
        status,
        inspector_id: userId,
        inspection_date: inspectionData.inspection_date || new Date().toISOString().split('T')[0],
        checklist_data: inspectionData.checklist_data || {},
        remarks: inspectionData.remarks || '',
        evidence_files: inspectionData.evidence_files || [],
        created_by: userId,
      },
      { transaction: t }
    );

    // Create Inventory Batch
    // CRITICAL RULE: Rejected or Quarantined batches must never enter available inventory!
    const defaultLocation = await Location.findOne({ transaction: t });
    const batch = await InventoryBatch.create(
      {
        internal_batch_id,
        vendor_batch_number: inspectionData.vendor_batch_number,
        vendor_id: receipt.vendor_id,
        material_id: receipt.material_id,
        iqc_id: inspection.id,
        division: inspectionData.division,
        initial_quantity: acceptedQty,
        current_quantity: acceptedQty,
        reserved_quantity: 0,
        rejected_quantity: rejectedQty,
        quarantined_quantity: quarantinedQty,
        consumed_quantity: 0,
        status: acceptedQty > 0 ? INVENTORY_STATUS.AVAILABLE : (rejectedQty > 0 ? INVENTORY_STATUS.REJECTED : INVENTORY_STATUS.QUARANTINED),
        location_id: defaultLocation ? defaultLocation.id : null,
        receipt_date: inspection.inspection_date,
      },
      { transaction: t }
    );

    // Create Initial Stock Ledger Transaction if accepted quantity > 0
    if (acceptedQty > 0) {
      const txnCount = await InventoryTransaction.count({ transaction: t });
      const transaction_number = generateBusinessId('TXN', txnCount + 1);

      await InventoryTransaction.create(
        {
          transaction_number,
          batch_id: batch.id,
          material_id: receipt.material_id,
          transaction_type: 'RECEIPT',
          quantity: acceptedQty,
          previous_quantity: 0,
          new_quantity: acceptedQty,
          reference_type: 'IQC',
          reference_id: inspection_number,
          remarks: `Initial IQC accepted stock for batch ${internal_batch_id} (${inspectionData.division} Division)`,
          created_by: userId,
        },
        { transaction: t }
      );
    }

    await logAudit({
      userId,
      action: 'IQC_INSPECTION_COMPLETED',
      entityType: 'IqcInspection',
      entityId: inspection.id,
      newValues: {
        inspection_number,
        internal_batch_id,
        vendor_batch_number: inspectionData.vendor_batch_number,
        accepted_quantity: acceptedQty,
        rejected_quantity: rejectedQty,
        status,
      },
      transaction: t,
    });

    if (rejectedQty > 0) {
      await createNotification({
        role: ROLES.ADMIN,
        title: 'IQC Material Rejection Alert',
        message: `Batch ${internal_batch_id} rejected at ${inspectionData.division} IQC (${rejectedQty} units rejected).`,
        type: 'error',
        entityType: 'IqcInspection',
        entityId: inspection.id,
        transaction: t,
      });
    }

    await t.commit();
    return await getIqcById(inspection.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
