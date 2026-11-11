import { ROLES } from '../constants/index.js';

/**
 * Checks if current user belongs to one of allowed roles.
 * Super Admin always has full access.
 */
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
    });
  };
};

/**
 * Checks if user has a required permission, either through operational permissions or role-based mapping.
 */
export const authorizePermission = (permissionCode) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Super Admin has all permissions
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // Check user's direct operational permissions
    if (Array.isArray(req.user.operational_permissions) && req.user.operational_permissions.includes(permissionCode)) {
      return next();
    }

    // Role-based defaults
    const rolePermissionMap = {
      [ROLES.ADMIN]: ['*'], // Admin has operational supervisor rights
      [ROLES.SALES]: ['create_requirement', 'dispatch_approval_sales', 'view_reports', 'view_master_data'],
      [ROLES.ACCOUNTS]: ['prepare_checklist', 'acknowledge_checklist', 'dispatch_approval_accounts', 'view_reports'],
      [ROLES.IQC_OPERATOR]: ['perform_iqc', 'approve_iqc', 'view_inventory'],
      [ROLES.PRODUCTION]: ['manage_production', 'execute_production', 'view_inventory'],
      [ROLES.QC_OPERATOR]: ['perform_qc', 'approve_qc'],
      [ROLES.PACKAGING]: ['perform_packaging', 'approve_packaging', 'generate_qr'],
    };

    const allowed = rolePermissionMap[req.user.role];
    if (allowed && (allowed.includes('*') || allowed.includes(permissionCode))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Missing required permission: ${permissionCode}`,
    });
  };
};
