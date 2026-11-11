import sequelize from '../config/database.js';
import {
  Shipment,
  ShipmentBox,
  MasterBox,
  PartInstance,
  Customer,
  DispatchApproval,
  Checklist,
  User,
} from '../models/index.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import { generateDispatchGatePass } from '../utils/pdfGenerator.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { SHIPMENT_STATUS, APPROVAL_DECISION, ROLES } from '../constants/index.js';

export const getShipments = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.customer_id) where.customer_id = filters.customer_id;

  return await Shipment.findAll({
    where,
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
        include: [{ model: User, as: 'approver', attributes: ['id', 'full_name'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getShipmentById = async (id) => {
  return await Shipment.findByPk(id, {
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
        include: [{ model: User, as: 'approver', attributes: ['id', 'full_name'] }],
      },
    ],
  });
};

export const createShipment = async (data, boxIds = [], userId) => {
  const t = await sequelize.transaction();
  try {
    const count = await Shipment.count({ transaction: t });
    const shipment_number = generateBusinessId('SH', count + 1);

    // Verify boxes are not already dispatched
    const boxes = await MasterBox.findAll({
      where: { id: boxIds },
      include: [{ model: PartInstance, as: 'parts' }],
      transaction: t,
    });

    if (boxes.length === 0) {
      throw new Error('At least one master box must be included in the shipment.');
    }

    const alreadyDispatched = boxes.filter((b) => b.status === 'Dispatched');
    if (alreadyDispatched.length > 0) {
      throw new Error(`Boxes already dispatched: ${alreadyDispatched.map((b) => b.box_number).join(', ')}`);
    }

    let totalParts = 0;
    boxes.forEach((b) => {
      totalParts += b.packed_count || b.parts.length;
    });

    const shipment = await Shipment.create(
      {
        shipment_number,
        version: 1,
        customer_id: data.customer_id,
        destination_address: data.destination_address,
        total_boxes: boxes.length,
        total_parts: totalParts,
        status: SHIPMENT_STATUS.PENDING_CLEARANCE,
        vehicle_number: data.vehicle_number || '',
        lr_consignment_number: data.lr_consignment_number || '',
        driver_name: data.driver_name || '',
        driver_phone: data.driver_phone || '',
        remarks: data.remarks || '',
        created_by: userId,
      },
      { transaction: t }
    );

    // Associate boxes
    const shipmentBoxes = boxes.map((b) => ({
      shipment_id: shipment.id,
      box_id: b.id,
    }));
    await ShipmentBox.bulkCreate(shipmentBoxes, { transaction: t });

    // Update box status to 'In Shipment'
    await MasterBox.update({ status: 'In Shipment' }, { where: { id: boxIds }, transaction: t });

    // Create 3 Pending Dispatch Approvals (Admin, Sales, Accounts)
    const initialApprovals = ['Admin', 'Sales', 'Accounts'].map((role) => ({
      shipment_id: shipment.id,
      shipment_version: 1,
      role,
      decision: APPROVAL_DECISION.PENDING,
    }));
    await DispatchApproval.bulkCreate(initialApprovals, { transaction: t });

    await logAudit({
      userId,
      action: 'CREATE_SHIPMENT',
      entityType: 'Shipment',
      entityId: shipment.id,
      newValues: {
        shipment_number,
        total_boxes: boxes.length,
        total_parts: totalParts,
      },
      transaction: t,
    });

    await createNotification({
      role: ROLES.ADMIN,
      title: 'New Dispatch Clearance Request',
      message: `Shipment ${shipment_number} ready for 3-way clearance (${boxes.length} boxes, ${totalParts} parts).`,
      entityType: 'Shipment',
      entityId: shipment.id,
      transaction: t,
    });

    await t.commit();
    return await getShipmentById(shipment.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Executes Outward Dispatch.
 * ENFORCEMENT: Server-side validation of mandatory 3-way clearance!
 */
export const executeOutwardDispatch = async (id, dispatchData, userId) => {
  const t = await sequelize.transaction();
  try {
    const shipment = await Shipment.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: MasterBox, as: 'boxes', include: [{ model: PartInstance, as: 'parts' }] },
        { model: DispatchApproval, as: 'approvals' },
      ],
      transaction: t,
    });

    if (!shipment) throw new Error('Shipment not found');

    if (shipment.status === SHIPMENT_STATUS.DISPATCHED) {
      throw new Error('This shipment has already been dispatched.');
    }

    // MANDATORY 3-WAY CLEARANCE CHECK
    const currentApprovals = shipment.approvals.filter((a) => a.shipment_version === shipment.version);
    const hasAdmin = currentApprovals.some((a) => a.role === 'Admin' && a.decision === APPROVAL_DECISION.APPROVED);
    const hasSales = currentApprovals.some((a) => a.role === 'Sales' && a.decision === APPROVAL_DECISION.APPROVED);
    const hasAccounts = currentApprovals.some((a) => a.role === 'Accounts' && a.decision === APPROVAL_DECISION.APPROVED);

    if (!hasAdmin || !hasSales || !hasAccounts) {
      throw new Error(
        `OUTWARD DISPATCH FORBIDDEN: 3-way clearance incomplete! (Admin: ${hasAdmin ? 'OK' : 'PENDING'}, Sales: ${hasSales ? 'OK' : 'PENDING'}, Accounts: ${hasAccounts ? 'OK' : 'PENDING'})`
      );
    }

    const boxIds = shipment.boxes.map((b) => b.id);

    // Update MasterBoxes to Dispatched
    await MasterBox.update({ status: 'Dispatched' }, { where: { id: boxIds }, transaction: t });

    // Update PartInstances to Dispatched
    await PartInstance.update({ status: 'Dispatched' }, { where: { box_id: boxIds }, transaction: t });

    // Update Shipment
    shipment.status = SHIPMENT_STATUS.DISPATCHED;
    shipment.dispatch_date = dispatchData.dispatch_date || new Date().toISOString().split('T')[0];
    shipment.gate_out_time = new Date();
    shipment.vehicle_number = dispatchData.vehicle_number || shipment.vehicle_number;
    shipment.lr_consignment_number = dispatchData.lr_consignment_number || shipment.lr_consignment_number;
    shipment.driver_name = dispatchData.driver_name || shipment.driver_name;
    shipment.driver_phone = dispatchData.driver_phone || shipment.driver_phone;
    shipment.receiving_party = dispatchData.receiving_party || shipment.customer?.name || 'Customer Consignee';
    shipment.remarks = dispatchData.remarks || shipment.remarks;
    await shipment.save({ transaction: t });

    await logAudit({
      userId,
      action: 'EXECUTE_OUTWARD_DISPATCH',
      entityType: 'Shipment',
      entityId: shipment.id,
      newValues: {
        status: SHIPMENT_STATUS.DISPATCHED,
        vehicle_number: shipment.vehicle_number,
        lr_consignment_number: shipment.lr_consignment_number,
        gate_out_time: shipment.gate_out_time,
      },
      transaction: t,
    });

    await createNotification({
      role: ROLES.SALES,
      title: 'Shipment Dispatched Successfully',
      message: `Shipment ${shipment.shipment_number} for ${shipment.customer?.name} dispatched via vehicle ${shipment.vehicle_number}.`,
      type: 'success',
      entityType: 'Shipment',
      entityId: shipment.id,
      transaction: t,
    });

    await t.commit();
    return await getShipmentById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const downloadGatePassPdf = async (shipmentId) => {
  const shipment = await getShipmentById(shipmentId);
  if (!shipment) throw new Error('Shipment not found');

  const allParts = [];
  shipment.boxes.forEach((b) => {
    if (b.parts) allParts.push(...b.parts);
  });

  return await generateDispatchGatePass(shipment, shipment.boxes, allParts);
};
