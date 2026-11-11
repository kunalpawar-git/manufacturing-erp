import sequelize from '../config/database.js';
import {
  Checklist,
  PurchaseOrder,
  Shipment,
  Customer,
  Vendor,
  DispatchApproval,
} from '../models/index.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { CHECKLIST_STATUS, APPROVAL_DECISION, ROLES } from '../constants/index.js';

export const getChecklists = async (filters = {}) => {
  const where = {};
  if (filters.acknowledgement_status) where.acknowledgement_status = filters.acknowledgement_status;

  return await Checklist.findAll({
    where,
    include: [
      { model: PurchaseOrder, as: 'purchase_order' },
      { model: Shipment, as: 'shipment' },
      { model: Customer, as: 'customer' },
      { model: Vendor, as: 'vendor' },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getChecklistById = async (id) => {
  return await Checklist.findByPk(id, {
    include: [
      { model: PurchaseOrder, as: 'purchase_order' },
      { model: Shipment, as: 'shipment' },
      { model: Customer, as: 'customer' },
      { model: Vendor, as: 'vendor' },
    ],
  });
};

export const createChecklist = async (data, userId) => {
  const count = await Checklist.count();
  const checklist_number = generateBusinessId('CK', count + 1);

  const checklist = await Checklist.create({
    ...data,
    checklist_number,
    acknowledgement_status: data.acknowledgement_status || CHECKLIST_STATUS.DRAFT,
    created_by: userId,
  });

  await logAudit({
    userId,
    action: 'CREATE_ACCOUNTS_CHECKLIST',
    entityType: 'Checklist',
    entityId: checklist.id,
    newValues: { checklist_number, acknowledgement_method: checklist.acknowledgement_method },
  });

  return await getChecklistById(checklist.id);
};

export const updateChecklist = async (id, updateData, userId) => {
  const t = await sequelize.transaction();
  try {
    const checklist = await Checklist.findByPk(id, { transaction: t });
    if (!checklist) throw new Error('Checklist not found');

    const oldStatus = checklist.acknowledgement_status;
    await checklist.update(updateData, { transaction: t });

    // CRITICAL BUSINESS RULE:
    // "If shipment contents, quantity or checklist change after approval, invalidate the affected approvals and require reapproval."
    if (checklist.shipment_id) {
      const shipment = await Shipment.findByPk(checklist.shipment_id, { transaction: t });
      if (shipment) {
        // Invalidate all existing approvals for this shipment!
        await DispatchApproval.update(
          {
            decision: APPROVAL_DECISION.INVALIDATED,
            comments: 'Automatically invalidated: Commercial checklist details or terms were revised.',
          },
          {
            where: {
              shipment_id: shipment.id,
              shipment_version: shipment.version,
              decision: APPROVAL_DECISION.APPROVED,
            },
            transaction: t,
          }
        );

        // Bump shipment version
        shipment.version = shipment.version + 1;
        shipment.status = 'Pending Clearance';
        await shipment.save({ transaction: t });

        await createNotification({
          role: ROLES.ADMIN,
          title: 'Dispatch Approvals Invalidated',
          message: `Checklist ${checklist.checklist_number} updated. All previous approvals for Shipment ${shipment.shipment_number} are now INVALIDATED. Re-approval required.`,
          type: 'warning',
          entityType: 'Shipment',
          entityId: shipment.id,
          transaction: t,
        });
      }
    }

    await logAudit({
      userId,
      action: 'UPDATE_ACCOUNTS_CHECKLIST',
      entityType: 'Checklist',
      entityId: id,
      oldValues: { acknowledgement_status: oldStatus },
      newValues: updateData,
      transaction: t,
    });

    await t.commit();
    return await getChecklistById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
