// middlewares/adminAuth.js
import { HTTPSTATUS } from "../config/https.config.js";

export const requireAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error in admin authentication",
    });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== 'superadmin') {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Super admin access required",
      });
    }

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error in super admin authentication",
    });
  }
};

export const requireAdminOrSelf = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const targetUserId = req.params.userId || req.params.id;
    const isTargetingSelf = targetUserId === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (!isTargetingSelf && !isAdmin) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Access denied. Admin privileges or self-access required",
      });
    }

    next();
  } catch (error) {
    console.error('Admin or self middleware error:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error in authorization",
    });
  }
};