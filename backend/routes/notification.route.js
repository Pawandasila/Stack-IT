import express from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
} from "../controllers/notificationController.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { isAdmin, isAnyUser } from "../middlewares/role.middleware.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const router = express.Router();

// Get user's notifications
router.get(
  "/",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserNotifications)
);

// Get unread notifications count
router.get(
  "/unread-count",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUnreadCount)
);

// Mark notification as read
router.patch(
  "/:notificationId/read",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(markNotificationAsRead)
);

// Mark all notifications as read
router.patch(
  "/mark-all-read",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(markAllAsRead)
);

// Delete a notification
router.delete(
  "/:notificationId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(deleteNotification)
);

// Admin: Clean up old notifications
router.delete(
  "/admin/cleanup",
  verifyAccessToken,
  isAdmin,
  asyncHandler(cleanupOldNotifications)
);

export default router;
