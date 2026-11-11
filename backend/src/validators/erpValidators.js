import { IQC_DIVISIONS, PO_DIRECTION } from '../constants/index.js';

export const validatePoPayload = (body) => {
  const errors = [];
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    errors.push('Purchase Order must include at least one material or product line item.');
  }
  if (
    body.po_direction &&
    !Object.values(PO_DIRECTION).includes(body.po_direction)
  ) {
    errors.push(`Invalid PO direction. Allowed: ${Object.values(PO_DIRECTION).join(', ')}`);
  }
  return errors;
};

export const validateIqcPayload = (body) => {
  const errors = [];
  if (!body.vendor_batch_number) {
    errors.push('Original vendor batch number is required and immutable.');
  }
  if (!Object.values(IQC_DIVISIONS).includes(body.division)) {
    errors.push(`Invalid IQC division. Must be one of: ${Object.values(IQC_DIVISIONS).join(', ')}`);
  }
  return errors;
};

