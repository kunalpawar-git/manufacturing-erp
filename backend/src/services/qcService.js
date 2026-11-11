import sequelize from '../config/database.js';
import {
  SampleQcRecord,
  ProductionWorkOrder,
  Product,
  User,
} from '../models/index.js';
import { generateBusinessId } from '../utils/idGenerator.js';
import { logAudit } from './auditService.js';
import { createNotification } from './notificationService.js';
import { QC_RESULT, WORK_ORDER_STATUS, ROLES } from '../constants/index.js';

export const getQcRecords = async (filters = {}) => {
  const where = {};
  if (filters.result) where.result = filters.result;

  return await SampleQcRecord.findAll({
    where,
    include: [
      {
        model: ProductionWorkOrder,
        as: 'work_order',
        include: [{ model: Product, as: 'product' }],
      },
      { model: User, as: 'inspector', attributes: ['id', 'full_name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const getQcById = async (id) => {
  return await SampleQcRecord.findByPk(id, {
    include: [
      {
        model: ProductionWorkOrder,
        as: 'work_order',
        include: [{ model: Product, as: 'product' }],
      },
      { model: User, as: 'inspector', attributes: ['id', 'full_name', 'email'] },
    ],
  });
};

export const submitSampleQc = async (qcData, userId) => {
  const t = await sequelize.transaction();
  try {
    const wo = await ProductionWorkOrder.findByPk(qcData.work_order_id, { transaction: t });
    if (!wo) throw new Error('Work Order not found');

    const qcCount = await SampleQcRecord.count({ transaction: t });
    const qc_number = generateBusinessId('QC', qcCount + 1);

    const record = await SampleQcRecord.create(
      {
        qc_number,
        work_order_id: wo.id,
        sample_identifier: qcData.sample_identifier || `SMP-${wo.work_order_number}`,
        inspector_id: userId,
        inspection_date: qcData.inspection_date || new Date().toISOString().split('T')[0],
        parameters: qcData.parameters || [
          { name: 'Dimensional Accuracy', status: qcData.result === 'Passed' ? 'Pass' : 'Fail' },
          { name: 'Surface Finish', status: 'Pass' },
          { name: 'Tensile & Fitment Check', status: 'Pass' },
        ],
        result: qcData.result, // Passed or Failed
        defect_details: qcData.defect_details || '',
        rework_instructions: qcData.rework_instructions || '',
        remarks: qcData.remarks || '',
        images: qcData.images || [],
        approved_by: userId,
        approved_at: new Date(),
      },
      { transaction: t }
    );

    if (qcData.result === QC_RESULT.PASSED) {
      wo.sample_status = 'QC Passed';
      wo.status = WORK_ORDER_STATUS.IN_PRODUCTION;
      await wo.save({ transaction: t });

      await createNotification({
        role: ROLES.PRODUCTION,
        title: 'Sample QC Approved',
        message: `Sample for Work Order ${wo.work_order_number} passed QC inspection. Authorized for mass production.`,
        type: 'success',
        entityType: 'SampleQcRecord',
        entityId: record.id,
        transaction: t,
      });
    } else {
      wo.sample_status = 'QC Failed';
      wo.status = WORK_ORDER_STATUS.SAMPLE_QC_FAILED;
      await wo.save({ transaction: t });

      await createNotification({
        role: ROLES.PRODUCTION,
        title: 'Sample QC Failed - Rework Required',
        message: `Sample for Work Order ${wo.work_order_number} failed QC. Reason: ${qcData.defect_details}`,
        type: 'error',
        entityType: 'SampleQcRecord',
        entityId: record.id,
        transaction: t,
      });
    }

    await logAudit({
      userId,
      action: `SAMPLE_QC_${qcData.result.toUpperCase()}`,
      entityType: 'SampleQcRecord',
      entityId: record.id,
      newValues: { result: qcData.result, qc_number, defect_details: qcData.defect_details },
      transaction: t,
    });

    await t.commit();
    return await getQcById(record.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
