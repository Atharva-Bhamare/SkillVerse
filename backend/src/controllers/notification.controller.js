
import asyncHandler from "../utils/asyncHandler.js";
import * as notificationService from "../services/notification.service.js";
import {
  buildNotificationResponse,
  buildNotificationsResponse,
} from "../transformers/notification.transformer.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getMyNotifications(
    req.user.id,
    req.query
  );

  res.status(200).json({
    success: true,
    data: {
      notifications: buildNotificationsResponse(result.notifications),
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    },
  });
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(
    req.params.notificationId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Notification marked as read.",
    data: buildNotificationResponse(notification),
  });
});

export const markAllNotificationsAsRead = asyncHandler(
  async (req, res) => {
    const result =
      await notificationService.markAllNotificationsAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      data: result,
    });
  }
);
