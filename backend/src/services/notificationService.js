import { Notification } from '../models/index.js';

export const createNotification = async ({
  userId = null,
  role = null,
  title,
  message,
  type = 'info',
  entityType = null,
  entityId = null,
  transaction = null,
}) => {
  try {
    return await Notification.create(
      {
        user_id: userId,
        role,
        title,
        message,
        type,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        is_read: false,
      },
      { transaction }
    );
  } catch (error) {
    console.error('[Notification Error]', error);
  }
};

export const getUserNotifications = async (userId, userRole) => {
  const { Op } = await import('sequelize');
  return await Notification.findAll({
    where: {
      [Op.or]: [
        { user_id: userId },
        { role: userRole },
        { user_id: null, role: null },
      ],
    },
    order: [['created_at', 'DESC']],
    limit: 50,
  });
};

export const markAsRead = async (id, userId) => {
  const notif = await Notification.findByPk(id);
  if (notif) {
    notif.is_read = true;
    await notif.save();
  }
  return notif;
};

export const markAllAsRead = async (userId, userRole) => {
  const { Op } = await import('sequelize');
  return await Notification.update(
    { is_read: true },
    {
      where: {
        [Op.or]: [
          { user_id: userId },
          { role: userRole },
        ],
        is_read: false,
      },
    }
  );
};
