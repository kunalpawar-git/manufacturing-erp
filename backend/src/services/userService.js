import bcrypt from 'bcryptjs';
import { User, Role, Department } from '../models/index.js';
import { logAudit } from './auditService.js';

export const getAllUsers = async () => {
  return await User.findAll({
    attributes: { exclude: ['password'] },
    include: [
      { model: Role, attributes: ['id', 'name'] },
      { model: Department, attributes: ['id', 'code', 'name'] },
    ],
    order: [['created_at', 'ASC']],
  });
};

export const createUser = async (userData, creatorId) => {
  const existing = await User.findOne({ where: { email: userData.email } });
  if (existing) {
    throw new Error('A user with this email address already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password || 'Demo@123', 10);
  const user = await User.create({
    email: userData.email,
    password: hashedPassword,
    full_name: userData.full_name,
    role_id: userData.role_id,
    department_id: userData.department_id || null,
    phone: userData.phone || null,
    operational_permissions: userData.operational_permissions || [],
    status: userData.status || 'Active',
  });

  await logAudit({
    userId: creatorId,
    action: 'CREATE_USER',
    entityType: 'User',
    entityId: user.id,
    newValues: { email: user.email, role_id: user.role_id },
  });

  return await User.findByPk(user.id, {
    attributes: { exclude: ['password'] },
    include: [{ model: Role }, { model: Department }],
  });
};

export const updateUser = async (id, updateData, actorId) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }

  const oldValues = {
    role_id: user.role_id,
    status: user.status,
    operational_permissions: user.operational_permissions,
  };

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  await user.update(updateData);

  await logAudit({
    userId: actorId,
    action: 'UPDATE_USER',
    entityType: 'User',
    entityId: id,
    oldValues,
    newValues: updateData,
  });

  return await User.findByPk(id, {
    attributes: { exclude: ['password'] },
    include: [{ model: Role }, { model: Department }],
  });
};

export const getRolesAndDepartments = async () => {
  const roles = await Role.findAll({ order: [['name', 'ASC']] });
  const departments = await Department.findAll({ order: [['name', 'ASC']] });
  return { roles, departments };
};
