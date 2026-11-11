import * as salesService from '../services/salesService.js';

export const getSalesRequirements = async (req, res, next) => {
  try {
    const data = await salesService.getSalesRequirements(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getSalesRequirementById = async (req, res, next) => {
  try {
    const data = await salesService.getSalesRequirementById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Requirement not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createSalesRequirement = async (req, res, next) => {
  try {
    const data = await salesService.createSalesRequirement(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Sales Requirement submitted to Admin', data });
  } catch (err) { next(err); }
};

export const reviewSalesRequirement = async (req, res, next) => {
  try {
    const data = await salesService.reviewSalesRequirement(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: `Requirement decision recorded: ${req.body.decision}`, data });
  } catch (err) { next(err); }
};

export const reviseSalesRequirement = async (req, res, next) => {
  try {
    const data = await salesService.reviseSalesRequirement(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Requirement revised and resubmitted', data });
  } catch (err) { next(err); }
};

