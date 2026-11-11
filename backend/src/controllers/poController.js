import * as poService from '../services/poService.js';
import * as iqcService from '../services/iqcService.js';

// PO
export const getPurchaseOrders = async (req, res, next) => {
  try {
    const data = await poService.getPurchaseOrders(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const data = await poService.getPurchaseOrderById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'PO not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const { items, ...poData } = req.body;
    const data = await poService.createPurchaseOrder(poData, items || [], req.user.id);
    res.status(201).json({ success: true, message: 'Purchase Order created successfully', data });
  } catch (err) { next(err); }
};

export const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const data = await poService.updatePurchaseOrderStatus(req.params.id, req.body.status, req.user.id);
    res.json({ success: true, message: 'Status updated', data });
  } catch (err) { next(err); }
};

export const receiveMaterial = async (req, res, next) => {
  try {
    const data = await poService.receiveMaterialAgainstPO(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Material received successfully and queued for IQC', data });
  } catch (err) { next(err); }
};

export const getReceipts = async (req, res, next) => {
  try {
    const data = await poService.getReceipts();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// IQC
export const getIqcInspections = async (req, res, next) => {
  try {
    const data = await iqcService.getIqcInspections(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getIqcById = async (req, res, next) => {
  try {
    const data = await iqcService.getIqcById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'IQC inspection record not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createIqcInspection = async (req, res, next) => {
  try {
    const data = await iqcService.createIqcInspection(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: `IQC completed. Internal Batch ${data.internal_batch_id} generated. Status: ${data.status}`,
      data,
    });
  } catch (err) { next(err); }
};
