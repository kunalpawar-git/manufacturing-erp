import sequelize from '../config/database.js';
import {
  Complaint,
  ComplaintInvestigation,
  Customer,
  PartInstance,
  MasterBox,
  Product,
  ProductionWorkOrder,
  ProductionMaterialConsumption,
  InventoryBatch,
  IqcInspection,
  Vendor,
  User,
} from '../models/index.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import { resolveQrScan } from './qrService.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { COMPLAINT_STATUS, ROLES } from '../constants/index.js';

export const getComplaints = async (filters = {}) => {
  const where = {};
  if (filters.verification_status) where.verification_status = filters.verification_status;
  if (filters.investigation_status) where.investigation_status = filters.investigation_status;

  return await Complaint.findAll({
    where,
    include: [
      { model: Customer, as: 'customer' },
      { model: PartInstance, as: 'part', include: [{ model: Product, as: 'product' }] },
      { model: MasterBox, as: 'box' },
      {
        model: ComplaintInvestigation,
        as: 'investigations',
        include: [{ model: User, as: 'investigator', attributes: ['id', 'full_name'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getComplaintById = async (id) => {
  const complaint = await Complaint.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: PartInstance, as: 'part', include: [{ model: Product, as: 'product' }] },
      { model: MasterBox, as: 'box' },
      {
        model: ComplaintInvestigation,
        as: 'investigations',
        include: [{ model: User, as: 'investigator', attributes: ['id', 'full_name'] }],
      },
    ],
  });

  if (!complaint) throw new Error('Complaint record not found');

  // If part exists, resolve complete traceability
  let fullTraceability = null;
  if (complaint.part || complaint.scanned_part_code) {
    try {
      fullTraceability = await resolveQrScan(complaint.part ? complaint.part.part_number : complaint.scanned_part_code);
    } catch {
      // Traceability retrieval error handled gracefully
    }
  }

  return {
    complaint,
    traceability: fullTraceability,
  };
};

export const registerComplaint = async (data, userId) => {
  const t = await sequelize.transaction();
  try {
    const count = await Complaint.count({ transaction: t });
    const complaint_number = generateBusinessId('CMP', count + 1);

    const discrepancy_flags = [];
    let verification_status = 'Unverified';
    let matchedPart = null;
    let matchedBox = null;

    // Check Part QR or code if provided
    if (data.scanned_part_code) {
      matchedPart = await PartInstance.findOne({
        where: { part_number: data.scanned_part_code.trim() },
        include: [
          { model: MasterBox, as: 'box' },
          {
            model: ProductionWorkOrder,
            as: 'work_order',
            include: [
              {
                model: ProductionMaterialConsumption,
                as: 'consumptions',
                include: [{ model: InventoryBatch, as: 'batch' }],
              },
            ],
          },
        ],
        transaction: t,
      });

      if (!matchedPart) {
        discrepancy_flags.push(`Part code '${data.scanned_part_code}' was NOT found in ERP database records.`);
      }
    }

    // Check Box code if provided
    if (data.scanned_box_code) {
      matchedBox = await MasterBox.findOne({
        where: { box_number: data.scanned_box_code.trim() },
        transaction: t,
      });

      if (!matchedBox) {
        discrepancy_flags.push(`Master Box code '${data.scanned_box_code}' was NOT found in ERP records.`);
      } else if (matchedPart && matchedPart.box_id !== matchedBox.id) {
        discrepancy_flags.push(
          `Part ${matchedPart.part_number} belongs to Box ${matchedPart.box?.box_number}, NOT claimed Box ${matchedBox.box_number}.`
        );
      }
    }

    // Check Claimed Internal / Vendor Batch
    if (matchedPart && (data.claimed_internal_batch || data.claimed_vendor_batch)) {
      // Trace source batches consumed
      const trace = await resolveQrScan(matchedPart.part_number, t);
      if (trace && trace.source_batch) {
        if (data.claimed_internal_batch && data.claimed_internal_batch.trim() !== trace.source_batch.internal_batch_id) {
          discrepancy_flags.push(
            `Claimed Internal Batch '${data.claimed_internal_batch}' does NOT match actual production batch '${trace.source_batch.internal_batch_id}'.`
          );
        }
        if (data.claimed_vendor_batch && data.claimed_vendor_batch.trim() !== trace.source_batch.vendor_batch_number) {
          discrepancy_flags.push(
            `Claimed Vendor Batch '${data.claimed_vendor_batch}' does NOT match supplier record '${trace.source_batch.vendor_batch_number}'.`
          );
        }
      }
    }

    // Verification decision
    if (discrepancy_flags.length > 0) {
      verification_status = 'Mismatch Detected';
    } else if (matchedPart) {
      verification_status = 'Verified Authentic';
    }

    const complaint = await Complaint.create(
      {
        complaint_number,
        customer_id: data.customer_id,
        complaint_date: data.complaint_date || new Date().toISOString().split('T')[0],
        description: data.description,
        defect_category: data.defect_category || 'Dimensional Inaccuracy',
        part_id: matchedPart ? matchedPart.id : null,
        box_id: matchedBox ? matchedBox.id : null,
        scanned_part_code: data.scanned_part_code || null,
        scanned_box_code: data.scanned_box_code || null,
        claimed_vendor_batch: data.claimed_vendor_batch || null,
        claimed_internal_batch: data.claimed_internal_batch || null,
        verification_status,
        discrepancy_flags,
        investigation_status: COMPLAINT_STATUS.OPEN,
        created_by: userId,
      },
      { transaction: t }
    );

    // Initial investigation note
    await ComplaintInvestigation.create(
      {
        complaint_id: complaint.id,
        investigator_id: userId,
        findings:
          discrepancy_flags.length > 0
            ? `DISCREPANCIES FLAGGED ON INGESTION: ${discrepancy_flags.join('; ')}`
            : `Initial verification successful. Part and batch records verified against ERP archives.`,
        status: discrepancy_flags.length > 0 ? 'Flagged for Audit' : 'In Progress',
      },
      { transaction: t }
    );

    await logAudit({
      userId,
      action: 'REGISTER_COMPLAINT',
      entityType: 'Complaint',
      entityId: complaint.id,
      newValues: {
        complaint_number,
        verification_status,
        discrepancies_count: discrepancy_flags.length,
      },
      transaction: t,
    });

    await createNotification({
      role: ROLES.ADMIN,
      title: discrepancy_flags.length > 0 ? 'ALERT: Suspicious / Mismatched Complaint' : 'New Product Complaint Registered',
      message: `Complaint ${complaint_number} registered. Status: ${verification_status}.`,
      type: discrepancy_flags.length > 0 ? 'error' : 'warning',
      entityType: 'Complaint',
      entityId: complaint.id,
      transaction: t,
    });

    await t.commit();
    return await getComplaintById(complaint.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const updateComplaintInvestigation = async (id, updateData, userId) => {
  const t = await sequelize.transaction();
  try {
    const complaint = await Complaint.findByPk(id, { transaction: t });
    if (!complaint) throw new Error('Complaint not found');

    if (updateData.investigation) {
      await ComplaintInvestigation.create(
        {
          complaint_id: complaint.id,
          investigator_id: userId,
          findings: updateData.investigation.findings,
          root_cause: updateData.investigation.root_cause || '',
          corrective_action: updateData.investigation.corrective_action || '',
          preventive_action: updateData.investigation.preventive_action || '',
          status: updateData.investigation.status || 'In Progress',
        },
        { transaction: t }
      );
    }

    if (updateData.resolution) complaint.resolution = updateData.resolution;
    if (updateData.replacement_details) complaint.replacement_details = updateData.replacement_details;
    if (updateData.capa_summary) complaint.capa_summary = updateData.capa_summary;
    if (updateData.investigation_status) complaint.investigation_status = updateData.investigation_status;

    if (updateData.investigation_status === COMPLAINT_STATUS.CLOSED) {
      complaint.closed_at = new Date();
    }

    await complaint.save({ transaction: t });

    await logAudit({
      userId,
      action: 'UPDATE_COMPLAINT_INVESTIGATION',
      entityType: 'Complaint',
      entityId: id,
      newValues: updateData,
      transaction: t,
    });

    await t.commit();
    return await getComplaintById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
