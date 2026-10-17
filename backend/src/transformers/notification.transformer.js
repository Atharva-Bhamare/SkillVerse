
const getRelatedId = (value) => {
  if (!value) return null;

  // Handle populated Mongoose documents and plain objects.
  if (typeof value === "object") {
    return (value._id ?? value.id)?.toString() ?? null;
  }

  return value.toString();
};

export const buildNotificationResponse = (notification) => {
  if (!notification) return null;

  return {
    id: notification._id?.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedApplication: getRelatedId(
      notification.relatedApplication
    ),
    relatedJob: getRelatedId(notification.relatedJob),
    isRead: notification.isRead,
    readAt: notification.readAt ?? null,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
};

export const buildNotificationsResponse = (notifications = []) =>
  notifications.map(buildNotificationResponse);
