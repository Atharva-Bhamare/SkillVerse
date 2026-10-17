
import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

// Get the authenticated user's notifications.
router.get("/", authenticate, notificationController.getMyNotifications);

// Mark all notifications as read.
// Keep this route before /:notificationId/read for clarity.
router.patch(
  "/read-all",
  authenticate,
  notificationController.markAllNotificationsAsRead
);

// Mark one notification as read.
router.patch(
  "/:notificationId/read",
  authenticate,
  notificationController.markNotificationAsRead
);

export default router;
