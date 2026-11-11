import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mfg_erp_super_secret_jwt_key_2026_antigravity');

    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role }],
    });

    if (!user || user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or no longer exists',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.Role ? user.Role.name : null,
      role_id: user.role_id,
      department_id: user.department_id,
      operational_permissions: user.operational_permissions || [],
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token',
      error: error.message,
    });
  }
};
