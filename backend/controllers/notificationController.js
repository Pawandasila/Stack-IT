import Notification from "../models/Notification.js";
import { HTTPSTATUS } from "../config/https.config.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Get user's notifications
export const getUserNotifications = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const notifications = await Notification.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });

    const total = await Notification.countDocuments({
      recipient: userId,
      ...(unreadOnly === 'true' ? { isRead: false } : {})
    });

    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching notifications",
      error: error.message,
    });
  }
});

// Get unread notifications count
export const getUnreadCount = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching unread count",
      error: error.message,
    });
  }
});

// Mark notification as read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!notification.isRead) {
      await notification.markAsRead();
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while marking notification as read",
      error: error.message,
    });
  }
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.markAllAsRead(userId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while marking all notifications as read",
      error: error.message,
    });
  }
});

// Delete a notification
export const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while deleting notification",
      error: error.message,
    });
  }
});

// Clean up old notifications (admin only)
export const cleanupOldNotifications = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only admins can cleanup old notifications",
      });
    }

    const { days = 30 } = req.query;
    const result = await Notification.deleteOldNotifications(parseInt(days));

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `Old notifications cleaned up successfully`,
      deletedCount: result.deletedCount,
      criteria: `Older than ${days} days and already read`,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while cleaning up notifications",
      error: error.message,
    });
  }
});

// Helper function to create notifications (used by other controllers)
export const createNotification = async (data) => {
  try {
    return await Notification.createNotification(data);
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};
