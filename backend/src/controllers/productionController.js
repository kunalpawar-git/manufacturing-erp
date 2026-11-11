import * as productionService from '../services/productionService.js';
import * as qcService from '../services/qcService.js';
import * as packagingService from '../services/packagingService.js';

// PRODUCTION
export const getWorkOrders = async (req, res, next) => {
  try {
    const data = await productionService.getWorkOrders(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getWorkOrderById = async (req, res, next) => {
  try {
    const data = await productionService.getWorkOrderById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Work Order not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const prepareSample = async (req, res, next) => {
  try {
    const data = await productionService.prepareSample(req.params.id, req.body.sample_notes, req.user.id);
    res.json({ success: true, message: 'Sample prepared. QC inspection notified.', data });
  } catch (err) { next(err); }
};

export const consumeBatches = async (req, res, next) => {
  try {
    const data = await productionService.recordBatchConsumption(req.params.id, req.body.consumptions || [], req.user.id);
    res.json({ success: true, message: 'Batch materials consumed and recorded', data });
  } catch (err) { next(err); }
};

export const completeProduction = async (req, res, next) => {
  try {
    const data = await productionService.completeProduction(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Production completed! Packaging Order generated.', data });
  } catch (err) { next(err); }
};

// QC
export const getQcRecords = async (req, res, next) => {
  try {
    const data = await qcService.getQcRecords(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const submitSampleQc = async (req, res, next) => {
  try {
    const data = await qcService.submitSampleQc(req.body, req.user.id);
    res.status(201).json({ success: true, message: `Sample QC recorded: ${data.result}`, data });
  } catch (err) { next(err); }
};

// PACKAGING
export const getPackagingOrders = async (req, res, next) => {
  try {
    const data = await packagingService.getPackagingOrders(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getPackagingOrderById = async (req, res, next) => {
  try {
    const data = await packagingService.getPackagingOrderById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Packaging order not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const approvePackagingOrder = async (req, res, next) => {
  try {
    const data = await packagingService.approvePackagingOrder(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'Packaging verified and approved! Unique Part and Master Box QR codes generated successfully.',
      data,
    });
  } catch (err) { next(err); }
};
