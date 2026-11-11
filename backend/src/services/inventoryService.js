import sequelize from '../config/database.js';
import {
  InventoryBatch,
  InventoryTransaction,
  Material,
  ProductCategory,
  Vendor,
  Location,
  User,
} from '../models/index.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import { logAudit } from './auditService.js';
import { INVENTORY_STATUS } from '../constants/index.js';

export const getInventorySummary = async () => {
  const materials = await Material.findAll({
    include: [{ model: ProductCategory }],
  });

  const batches = await InventoryBatch.findAll({
    include: [
      { model: Material, as: 'material' },
      { model: Vendor, as: 'vendor' },
      { model: Location, as: 'location' },
    ],
    order: [['created_at', 'DESC']],
  });

  // Calculate material-level aggregations
  const materialSummary = materials.map((mat) => {
    const matBatches = batches.filter((b) => b.material_id === mat.id);
    const available = matBatches.reduce((acc, b) => acc + (b.status === INVENTORY_STATUS.AVAILABLE ? (b.current_quantity || 0) : 0), 0);
    const reserved = matBatches.reduce((acc, b) => acc + (b.reserved_quantity || 0), 0);
    const quarantined = matBatches.reduce((acc, b) => acc + (b.quarantined_quantity || 0), 0);
    const rejected = matBatches.reduce((acc, b) => acc + (b.rejected_quantity || 0), 0);
    const consumed = matBatches.reduce((acc, b) => acc + (b.consumed_quantity || 0), 0);

    return {
      material_id: mat.id,
      material_code: mat.material_code,
      name: mat.name,
      category: mat.ProductCategory ? mat.ProductCategory.name : 'General',
      unit: mat.unit,
      reorder_level: mat.reorder_level,
      available_stock: available,
      reserved_stock: reserved,
      quarantined_stock: quarantined,
      rejected_stock: rejected,
      consumed_stock: consumed,
      total_batches: matBatches.length,
      is_low_stock: available <= mat.reorder_level,
    };
  });

  // Division summary
  const divisionSummary = ['Paint', 'Assembly', 'Store', 'Basement'].map((div) => {
    const divBatches = batches.filter((b) => b.division === div);
    return {
      division: div,
      total_batches: divBatches.length,
      available_stock: divBatches.reduce((acc, b) => acc + (b.status === INVENTORY_STATUS.AVAILABLE ? (b.current_quantity || 0) : 0), 0),
      quarantined_stock: divBatches.reduce((acc, b) => acc + (b.quarantined_quantity || 0), 0),
      rejected_stock: divBatches.reduce((acc, b) => acc + (b.rejected_quantity || 0), 0),
    };
  });

  return {
    materials: materialSummary,
    batches,
    divisions: divisionSummary,
  };
};

export const getBatchById = async (id) => {
  return await InventoryBatch.findByPk(id, {
    include: [
      { model: Material, as: 'material' },
      { model: Vendor, as: 'vendor' },
      { model: Location, as: 'location' },
      {
        model: InventoryTransaction,
        as: 'transactions',
        include: [{ model: User, as: 'creator', attributes: ['id', 'full_name'] }],
      },
    ],
  });
};

export const getTransactionsLedger = async (filters = {}) => {
  const where = {};
  if (filters.material_id) where.material_id = filters.material_id;
  if (filters.batch_id) where.batch_id = filters.batch_id;
  if (filters.transaction_type) where.transaction_type = filters.transaction_type;

  return await InventoryTransaction.findAll({
    where,
    include: [
      { model: InventoryBatch, as: 'batch' },
      { model: Material, as: 'material' },
      { model: User, as: 'creator', attributes: ['id', 'full_name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 100,
  });
};

export const adjustStock = async ({ batch_id, adjustment_type, quantity, remarks }, userId) => {
  const t = await sequelize.transaction();
  try {
    const batch = await InventoryBatch.findByPk(batch_id, { transaction: t });
    if (!batch) throw new Error('Inventory Batch not found');

    if (batch.status === INVENTORY_STATUS.REJECTED || batch.status === INVENTORY_STATUS.QUARANTINED) {
      throw new Error(`Cannot adjust stock for batch with status ${batch.status}`);
    }

    const previousQty = batch.current_quantity;
    const adjQty = parseFloat(quantity);
    let newQty = previousQty;

    if (adjustment_type === 'ADD') {
      newQty = previousQty + adjQty;
    } else if (adjustment_type === 'DEDUCT') {
      if (previousQty < adjQty) {
        throw new Error(`Insufficient batch stock. Current: ${previousQty}, requested deduction: ${adjQty}`);
      }
      newQty = previousQty - adjQty;
    } else if (adjustment_type === 'SET') {
      if (adjQty < 0) throw new Error('Stock quantity cannot be negative');
      newQty = adjQty;
    } else {
      throw new Error('Invalid adjustment type. Must be ADD, DEDUCT, or SET.');
    }

    batch.current_quantity = newQty;
    if (newQty === 0) {
      batch.status = INVENTORY_STATUS.CONSUMED;
    }
    await batch.save({ transaction: t });

    const count = await InventoryTransaction.count({ transaction: t });
    const transaction_number = generateBusinessId('TXN', count + 1);

    const txn = await InventoryTransaction.create(
      {
        transaction_number,
        batch_id: batch.id,
        material_id: batch.material_id,
        transaction_type: 'ADJUSTMENT',
        quantity: Math.abs(newQty - previousQty),
        previous_quantity: previousQty,
        new_quantity: newQty,
        reference_type: 'ADJUSTMENT',
        reference_id: transaction_number,
        remarks: remarks || `Manual authorized stock adjustment (${adjustment_type})`,
        created_by: userId,
      },
      { transaction: t }
    );

    await logAudit({
      userId,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'InventoryBatch',
      entityId: batch.id,
      oldValues: { current_quantity: previousQty },
      newValues: { current_quantity: newQty, adjustment_type },
      reason: remarks,
      transaction: t,
    });

    await t.commit();
    return { batch, transaction: txn };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
