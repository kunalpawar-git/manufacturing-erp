import sequelize from '../config/database.js';
import {
  SalesRequirement,
  RequirementApproval,
  Customer,
  PurchaseOrder,
  Product,
  User,
  ProductionWorkOrder,
} from '../models/index.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { REQUIREMENT_STATUS, WORK_ORDER_STATUS, ROLES } from '../constants/index.js';

export const getSalesRequirements = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.customer_id) where.customer_id = filters.customer_id;

  return await SalesRequirement.findAll({
    where,
    include: [
      { model: Customer, as: 'customer' },
      { model: PurchaseOrder, as: 'purchase_order' },
      { model: Product, as: 'product' },
      { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] },
      {
        model: RequirementApproval,
        as: 'approvals',
        include: [{ model: User, as: 'reviewer', attributes: ['id', 'full_name'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getSalesRequirementById = async (id) => {
  return await SalesRequirement.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: PurchaseOrder, as: 'purchase_order' },
      { model: Product, as: 'product' },
      { model: User, as: 'creator', attributes: ['id', 'full_name', 'email'] },
      {
        model: RequirementApproval,
        as: 'approvals',
        include: [{ model: User, as: 'reviewer', attributes: ['id', 'full_name'] }],
      },
    ],
  });
};

export const createSalesRequirement = async (data, userId) => {
  const count = await SalesRequirement.count();
  const requirement_number = generateBusinessId('REQ', count + 1);

  const req = await SalesRequirement.create({
    ...data,
    requirement_number,
    status: REQUIREMENT_STATUS.SUBMITTED,
    revision_number: 1,
    created_by: userId,
  });

  await logAudit({
    userId,
    action: 'CREATE_SALES_REQUIREMENT',
    entityType: 'SalesRequirement',
    entityId: req.id,
    newValues: { requirement_number, required_quantity: req.required_quantity },
  });

  await createNotification({
    role: ROLES.ADMIN,
    title: 'New Sales Requirement Submitted',
    message: `Sales requirement ${requirement_number} submitted for admin review.`,
    entityType: 'SalesRequirement',
    entityId: req.id,
  });

  return await getSalesRequirementById(req.id);
};

export const reviewSalesRequirement = async (id, { decision, comments }, adminId) => {
  const t = await sequelize.transaction();
  try {
    const requirement = await SalesRequirement.findByPk(id, { transaction: t });
    if (!requirement) throw new Error('Sales Requirement not found');

    const oldStatus = requirement.status;

    if (decision === 'Approved') {
      requirement.status = REQUIREMENT_STATUS.APPROVED;
      requirement.rejection_reason = null;
      await requirement.save({ transaction: t });

      // Automatically create a Production Work Order upon approval!
      const woCount = await ProductionWorkOrder.count({ transaction: t });
      const work_order_number = generateBusinessId('WO', woCount + 1);

      const workOrder = await ProductionWorkOrder.create(
        {
          work_order_number,
          requirement_id: requirement.id,
          po_id: requirement.po_id,
          product_id: requirement.product_id,
          target_quantity: requirement.required_quantity,
          produced_quantity: 0,
          rejected_quantity: 0,
          status: WORK_ORDER_STATUS.PLANNED,
          sample_status: 'Pending',
          start_date: new Date().toISOString().split('T')[0],
          remarks: `Auto-generated from approved sales requirement ${requirement.requirement_number}`,
          created_by: adminId,
        },
        { transaction: t }
      );

      await createNotification({
        role: ROLES.PRODUCTION,
        title: 'New Production Work Order Authorized',
        message: `Work Order ${work_order_number} initiated for ${requirement.requirement_number}.`,
        entityType: 'ProductionWorkOrder',
        entityId: workOrder.id,
        transaction: t,
      });
    } else if (decision === 'Rejected') {
      requirement.status = REQUIREMENT_STATUS.REJECTED;
      requirement.rejection_reason = comments;
      await requirement.save({ transaction: t });

      await createNotification({
        userId: requirement.created_by,
        title: 'Sales Requirement Rejected',
        message: `Requirement ${requirement.requirement_number} was rejected: ${comments}`,
        type: 'error',
        entityType: 'SalesRequirement',
        entityId: requirement.id,
        transaction: t,
      });
    } else {
      throw new Error('Decision must be either Approved or Rejected');
    }

    // Record review decision
    await RequirementApproval.create(
      {
        requirement_id: requirement.id,
        reviewer_id: adminId,
        decision,
        revision_number: requirement.revision_number,
        comments,
        decided_at: new Date(),
      },
      { transaction: t }
    );

    await logAudit({
      userId: adminId,
      action: `REVIEW_SALES_REQUIREMENT_${decision.toUpperCase()}`,
      entityType: 'SalesRequirement',
      entityId: requirement.id,
      oldValues: { status: oldStatus },
      newValues: { status: requirement.status, decision, comments },
      transaction: t,
    });

    await t.commit();
    return await getSalesRequirementById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const reviseSalesRequirement = async (id, updateData, userId) => {
  const req = await SalesRequirement.findByPk(id);
  if (!req) throw new Error('Sales Requirement not found');

  req.required_quantity = updateData.required_quantity || req.required_quantity;
  req.required_delivery_date = updateData.required_delivery_date || req.required_delivery_date;
  req.priority = updateData.priority || req.priority;
  req.description = updateData.description || req.description;
  req.status = REQUIREMENT_STATUS.SUBMITTED;
  req.revision_number = (req.revision_number || 1) + 1;
  req.rejection_reason = null;
  await req.save();

  await logAudit({
    userId,
    action: 'REVISE_SALES_REQUIREMENT',
    entityType: 'SalesRequirement',
    entityId: id,
    newValues: { revision_number: req.revision_number, status: req.status },
  });

  return await getSalesRequirementById(id);
};
