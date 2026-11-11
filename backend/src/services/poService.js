import sequelize from '../config/database.js';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialReceipt,
  Vendor,
  Customer,
  Material,
  Product,
  User,
} from '../models/index.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { PO_STATUS, ROLES } from '../constants/index.js';

export const getPurchaseOrders = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.vendor_id) where.vendor_id = filters.vendor_id;
  if (filters.po_direction) where.po_direction = filters.po_direction;

  return await PurchaseOrder.findAll({
    where,
    include: [
      { model: Vendor, as: 'vendor' },
      { model: Customer, as: 'customer' },
      { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] },
      {
        model: PurchaseOrderItem,
        as: 'items',
        include: [
          { model: Material, as: 'material' },
          { model: Product, as: 'product' },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getPurchaseOrderById = async (id) => {
  return await PurchaseOrder.findByPk(id, {
    include: [
      { model: Vendor, as: 'vendor' },
      { model: Customer, as: 'customer' },
      { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] },
      {
        model: PurchaseOrderItem,
        as: 'items',
        include: [
          { model: Material, as: 'material' },
          { model: Product, as: 'product' },
        ],
      },
    ],
  });
};

export const createPurchaseOrder = async (poData, items = [], userId) => {
  const t = await sequelize.transaction();
  try {
    const count = await PurchaseOrder.count({ transaction: t });
    const po_number = generateBusinessId('PO', count + 1);

    let totalAmount = 0;
    items.forEach((item) => {
      const lineTotal = (item.ordered_quantity || 0) * (item.unit_price || 0);
      totalAmount += lineTotal;
    });

    const po = await PurchaseOrder.create(
      {
        ...poData,
        po_number,
        total_amount: totalAmount,
        status: poData.status || PO_STATUS.SUBMITTED,
        created_by: userId,
      },
      { transaction: t }
    );

    if (items.length > 0) {
      const poItems = items.map((it) => ({
        po_id: po.id,
        material_id: it.material_id || null,
        product_id: it.product_id || null,
        ordered_quantity: it.ordered_quantity,
        received_quantity: 0,
        unit_price: it.unit_price || 0,
        total_price: (it.ordered_quantity || 0) * (it.unit_price || 0),
        notes: it.notes || '',
      }));
      await PurchaseOrderItem.bulkCreate(poItems, { transaction: t });
    }

    await logAudit({
      userId,
      action: 'CREATE_PURCHASE_ORDER',
      entityType: 'PurchaseOrder',
      entityId: po.id,
      newValues: { po_number, total_amount: totalAmount, status: po.status },
      transaction: t,
    });

    await createNotification({
      role: ROLES.ADMIN,
      title: 'New Purchase Order Created',
      message: `Purchase Order ${po_number} has been submitted with ${items.length} items.`,
      entityType: 'PurchaseOrder',
      entityId: po.id,
      transaction: t,
    });

    await t.commit();
    return await getPurchaseOrderById(po.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const updatePurchaseOrderStatus = async (id, status, userId) => {
  const po = await PurchaseOrder.findByPk(id);
  if (!po) throw new Error('Purchase Order not found');

  const oldStatus = po.status;
  po.status = status;
  await po.save();

  await logAudit({
    userId,
    action: 'UPDATE_PO_STATUS',
    entityType: 'PurchaseOrder',
    entityId: id,
    oldValues: { status: oldStatus },
    newValues: { status },
  });

  return po;
};

// Material Receipts against PO
export const receiveMaterialAgainstPO = async (receiptData, userId) => {
  const t = await sequelize.transaction();
  try {
    const po = await PurchaseOrder.findByPk(receiptData.po_id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
      transaction: t,
    });

    if (!po) throw new Error('Associated Purchase Order not found');
    if (po.status === PO_STATUS.CLOSED || po.status === PO_STATUS.CANCELLED) {
      throw new Error(`Cannot receive items against ${po.status} Purchase Order`);
    }

    const poItem = po.items.find((i) => i.id === receiptData.po_item_id || i.material_id === receiptData.material_id);
    if (!poItem) {
      throw new Error('Specified material is not part of this Purchase Order');
    }

    const count = await MaterialReceipt.count({ transaction: t });
    const receipt_number = generateBusinessId('MR', count + 1);

    const receipt = await MaterialReceipt.create(
      {
        receipt_number,
        po_id: po.id,
        po_item_id: poItem.id,
        vendor_id: po.vendor_id || receiptData.vendor_id,
        material_id: receiptData.material_id,
        received_quantity: receiptData.received_quantity,
        receipt_date: receiptData.receipt_date || new Date().toISOString().split('T')[0],
        carrier_info: receiptData.carrier_info,
        challan_number: receiptData.challan_number,
        invoice_number: receiptData.invoice_number,
        created_by: userId,
      },
      { transaction: t }
    );

    // Update PO item received quantity
    poItem.received_quantity = (poItem.received_quantity || 0) + parseFloat(receiptData.received_quantity);
    await poItem.save({ transaction: t });

    // Update PO status
    const allItems = await PurchaseOrderItem.findAll({ where: { po_id: po.id }, transaction: t });
    const isAllFullyReceived = allItems.every((item) => item.received_quantity >= item.ordered_quantity);
    po.status = isAllFullyReceived ? PO_STATUS.FULLY_RECEIVED : PO_STATUS.PARTIALLY_RECEIVED;
    await po.save({ transaction: t });

    await logAudit({
      userId,
      action: 'RECEIVE_MATERIAL',
      entityType: 'MaterialReceipt',
      entityId: receipt.id,
      newValues: { receipt_number, received_quantity: receiptData.received_quantity },
      transaction: t,
    });

    // Notify IQC
    await createNotification({
      role: ROLES.IQC_OPERATOR,
      title: 'New Material Received for IQC',
      message: `Receipt ${receipt_number} received for PO ${po.po_number}. Ready for IQC division routing.`,
      entityType: 'MaterialReceipt',
      entityId: receipt.id,
      transaction: t,
    });

    await t.commit();
    return receipt;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const getReceipts = async () => {
  return await MaterialReceipt.findAll({
    include: [
      { model: PurchaseOrder, as: 'purchase_order' },
      { model: Vendor, as: 'vendor' },
      { model: Material, as: 'material' },
      { model: User, as: 'creator', attributes: ['id', 'full_name'] },
    ],
    order: [['created_at', 'DESC']],
  });
};
