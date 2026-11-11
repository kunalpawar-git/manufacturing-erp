import { AuditLog } from '../models/index.js';

export const logAudit = async ({
  userId,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  reason = null,
  ipAddress = null,
  transaction = null,
}) => {
  try {
    return await AuditLog.create(
      {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: String(entityId),
        old_values: oldValues,
        new_values: newValues,
        reason,
        ip_address: ipAddress,
      },
      { transaction }
    );
  } catch (error) {
    console.error('[AuditLog Error]', error);
    // Don't fail the primary transaction on audit logging
  }
};

export const getAuditLogs = async ({ page = 1, limit = 50, entityType, action }) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (entityType) where.entity_type = entityType;
  if (action) where.action = action;

  return await AuditLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });
};
