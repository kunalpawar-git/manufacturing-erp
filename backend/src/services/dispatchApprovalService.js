import sequelize from '../config/database.js';
import {
  DispatchApproval,
  Shipment,
  Customer,
  MasterBox,
  PartInstance,
  Checklist,
  User,
} from '../models/index.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { APPROVAL_DECISION, SHIPMENT_STATUS, ROLES } from '../constants/index.js';

export const getClearanceRequests = async () => {
  return await Shipment.findAll({
    include: [
      { model: Customer, as: 'customer' },
      {
        model: MasterBox,
        as: 'boxes',
        include: [{ model: PartInstance, as: 'parts' }],
      },
      {
        model: DispatchApproval,
        as: 'approvals',
        include: [{ model: User, as: 'approver', attributes: ['id', 'full_name', 'email'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getClearanceById = async (shipmentId) => {
  const shipment = await Shipment.findByPk(shipmentId, {
    include: [
      { model: Customer, as: 'customer' },
      {
        model: MasterBox,
        as: 'boxes',
        include: [{ model: PartInstance, as: 'parts' }],
      },
      {
        model: DispatchApproval,
        as: 'approvals',
        include: [{ model: User, as: 'approver', attributes: ['id', 'full_name', 'email'] }],
      },
    ],
  });

  if (!shipment) throw new Error('Shipment clearance record not found');

  const checklist = await Checklist.findOne({ where: { shipment_id: shipmentId } });

  // Check 3-way status for the current shipment version
  const currentApprovals = shipment.approvals.filter((a) => a.shipment_version === shipment.version);
  const adminApproval = currentApprovals.find((a) => a.role === 'Admin');
  const salesApproval = currentApprovals.find((a) => a.role === 'Sales');
  const accountsApproval = currentApprovals.find((a) => a.role === 'Accounts');

  const isFullyApproved =
    adminApproval?.decision === APPROVAL_DECISION.APPROVED &&
    salesApproval?.decision === APPROVAL_DECISION.APPROVED &&
    accountsApproval?.decision === APPROVAL_DECISION.APPROVED;

  return {
    shipment,
    checklist,
    clearance_status: {
      version: shipment.version,
      admin: adminApproval || { role: 'Admin', decision: APPROVAL_DECISION.PENDING },
      sales: salesApproval || { role: 'Sales', decision: APPROVAL_DECISION.PENDING },
      accounts: accountsApproval || { role: 'Accounts', decision: APPROVAL_DECISION.PENDING },
      is_fully_cleared: isFullyApproved,
    },
  };
};

export const submitApprovalDecision = async (shipmentId, { decision, comments }, user) => {
  const t = await sequelize.transaction();
  try {
    const shipment = await Shipment.findByPk(shipmentId, { transaction: t });
    if (!shipment) throw new Error('Shipment not found');

    // Determine role of decision maker
    let role = null;
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) {
      role = 'Admin';
    } else if (user.role === ROLES.SALES) {
      role = 'Sales';
    } else if (user.role === ROLES.ACCOUNTS) {
      role = 'Accounts';
    } else {
      throw new Error(`User with role ${user.role} is not authorized for 3-way dispatch approvals.`);
    }

    // Find or create approval record for this role and current shipment version
    let approval = await DispatchApproval.findOne({
      where: {
        shipment_id: shipment.id,
        shipment_version: shipment.version,
        role,
      },
      transaction: t,
    });

    if (!approval) {
      approval = await DispatchApproval.create(
        {
          shipment_id: shipment.id,
          shipment_version: shipment.version,
          role,
          approver_id: user.id,
          decision,
          comments,
          decided_at: new Date(),
        },
        { transaction: t }
      );
    } else {
      approval.approver_id = user.id;
      approval.decision = decision;
      approval.comments = comments;
      approval.decided_at = new Date();
      await approval.save({ transaction: t });
    }

    // Check if all 3 are now approved for current version
    const allApprovals = await DispatchApproval.findAll({
      where: {
        shipment_id: shipment.id,
        shipment_version: shipment.version,
      },
      transaction: t,
    });

    const hasAdmin = allApprovals.some((a) => a.role === 'Admin' && a.decision === APPROVAL_DECISION.APPROVED);
    const hasSales = allApprovals.some((a) => a.role === 'Sales' && a.decision === APPROVAL_DECISION.APPROVED);
    const hasAccounts = allApprovals.some((a) => a.role === 'Accounts' && a.decision === APPROVAL_DECISION.APPROVED);

    if (hasAdmin && hasSales && hasAccounts) {
      shipment.status = SHIPMENT_STATUS.APPROVED;
      await shipment.save({ transaction: t });

      await createNotification({
        role: ROLES.ADMIN,
        title: 'Shipment 3-Way Clearance Complete',
        message: `Shipment ${shipment.shipment_number} has received all 3 approvals (Admin, Sales, Accounts). Authorized for Outward Dispatch!`,
        type: 'success',
        entityType: 'Shipment',
        entityId: shipment.id,
        transaction: t,
      });
    } else if (decision === APPROVAL_DECISION.REJECTED) {
      shipment.status = 'Pending Clearance';
      await shipment.save({ transaction: t });

      await createNotification({
        role: ROLES.ADMIN,
        title: 'Dispatch Clearance Rejected',
        message: `${role} rejected clearance for Shipment ${shipment.shipment_number}: ${comments}`,
        type: 'error',
        entityType: 'Shipment',
        entityId: shipment.id,
        transaction: t,
      });
    }

    await logAudit({
      userId: user.id,
      action: `DISPATCH_APPROVAL_${decision.toUpperCase()}`,
      entityType: 'Shipment',
      entityId: shipment.id,
      newValues: { role, decision, comments, shipment_version: shipment.version },
      transaction: t,
    });

    await t.commit();
    return await getClearanceById(shipmentId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
