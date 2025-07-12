// routes/admin.routes.js
import express from 'express';
import { 
  getSystemStats, 
  toggleUserStatus, 
  updateUserRole, 
  resetUserPassword, 
  bulkUpdateUsers, 
  getUserActivity, 
  exportUserData,
  searchUsers
} from '../controllers/admin.controller.js';
import { requireAdmin, requireSuperAdmin } from '../controllers/auth.controller.js';
import { authenticateToken } from '../controllers/auth.controller.js'; // Your existing auth middleware
import { deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateToken);

// System statistics - Admin only
router.get('/stats', requireAdmin, getSystemStats);

// User management - Admin only
router.patch('/users/:userId/status', requireAdmin, toggleUserStatus);
router.patch('/users/:userId/role', requireAdmin, updateUserRole);
router.patch('/users/:userId/reset-password', requireAdmin, resetUserPassword);
router.get('/users/:userId/activity', requireAdmin, getUserActivity);

// Bulk operations - Admin only
router.patch('/users/bulk-update', requireAdmin, bulkUpdateUsers);

// Data export - Admin only
router.get('/export/users', requireAdmin, exportUserData);

// Advanced search - Admin only
router.get('/search/users', requireAdmin, searchUsers);

// Super admin only routes
router.delete('/users/:userId/permanent-delete', requireSuperAdmin, deleteUser);

export default router;