import { randomBytes } from 'crypto';

export const generateBusinessId = (prefix, sequenceNumber, digits = 4) => {
  const year = new Date().getFullYear();
  const padded = String(sequenceNumber).padStart(digits, '0');
  if (prefix === 'BX' || prefix === 'PT') {
    // Standard compact format like BX-0145, PT-0001
    return `${prefix}-${padded}`;
  }
  return `${prefix}-${year}-${padded}`;
};

export const generateSecureToken = (entityType, entityId) => {
  const randomPart = randomBytes(8).toString('hex');
  return `SEC-${entityType.toUpperCase()}-${randomPart}`;
};
