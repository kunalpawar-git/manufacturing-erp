import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role, Department } from '../models/index.js';
import { logAudit } from './auditService.js';

export const login = async (email, password, ipAddress = null) => {
  const user = await User.findOne({
    where: { email },
    include: [
      { model: Role, attributes: ['id', 'name', 'description'] },
      { model: Department, attributes: ['id', 'code', 'name'] },
    ],
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.status !== 'Active') {
    throw new Error('Your account is deactivated. Please contact administrator.');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  const secret = process.env.JWT_SECRET || 'mfg_erp_super_secret_jwt_key_2026_antigravity';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.Role ? user.Role.name : null,
    },
    secret,
    { expiresIn }
  );

  await logAudit({
    userId: user.id,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    newValues: { email: user.email },
    reason: 'Successful login',
    ipAddress,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.Role ? user.Role.name : null,
      role_id: user.role_id,
      department: user.Department ? user.Department.name : null,
      department_id: user.department_id,
      operational_permissions: user.operational_permissions || [],
      status: user.status,
    },
  };
};

export const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    include: [{ model: Role }, { model: Department }],
  });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isOldValid = await bcrypt.compare(oldPassword, user.password);
  if (!isOldValid) {
    throw new Error('Current password does not match');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  await logAudit({
    userId,
    action: 'PASSWORD_CHANGE',
    entityType: 'User',
    entityId: userId,
    reason: 'User changed account password',
  });

  return { success: true };
};
