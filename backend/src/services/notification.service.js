
import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import AppError from "../utils/AppError.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const validateObjectId = (id, fieldName = "notification ID") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }
};

const parsePagination = (page, limit) => {
  const parsedPage = Number(page ?? DEFAULT_PAGE);
  const parsedLimit = Number(limit ?? DEFAULT_LIMIT);

  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1 ||
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1
  ) {
    throw new AppError(
      "Page and limit must be positive integers.",
      400
    );
  }

  return {
    page: parsedPage,
    limit: Math.min(parsedLimit, MAX_LIMIT),
  };
};

// Create a notification for a user.
export const createNotification = async (notificationData) => {
  return Notification.create(notificationData);
};

// Fetch only the authenticated user's notifications.
export const getMyNotifications = async (userId, query = {}) => {
  const { page, limit } = parsePagination(query.page, query.limit);
  const filter = { recipient: userId };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
  .populate({
    path: "relatedApplication",
    select: "status job student",
  })
  .sort({ createdAt: -1, _id: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .lean(),

    Notification.countDocuments(filter),

    Notification.countDocuments({
      recipient: userId,
      isRead: false,
    }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  };
};

// Mark one of the authenticated user's notifications as read.
export const markNotificationAsRead = async (
  notificationId,
  userId
) => {
  validateObjectId(notificationId);

  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

// Mark all unread notifications belonging to the user as read.
export const markAllNotificationsAsRead = async (userId) => {
  const readAt = new Date();

  const result = await Notification.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt,
      },
    }
  );

  return {
    modifiedCount: result.modifiedCount,
  };
};
