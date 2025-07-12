// controllers/admin.controller.js
import User from "../models/user.model.js";
import { HTTPSTATUS } from "../config/https.config.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Get system statistics
export const getSystemStats = asyncHandler(async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    
    const usersByRank = await User.aggregate([
      { $group: { _id: "$rank", count: { $sum: 1 } } }
    ]);
    
    const reputationStats = await User.aggregate([
      {
        $group: {
          _id: null,
          averageReputation: { $avg: "$reputation" },
          totalReputation: { $sum: "$reputation" },
          maxReputation: { $max: "$reputation" },
          minReputation: { $min: "$reputation" }
        }
      }
    ]);

    const recentUsers = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        usersByRank,
        reputationStats: reputationStats[0] || {
          averageReputation: 0,
          totalReputation: 0,
          maxReputation: 0,
          minReputation: 0
        },
        recentUsers
      }
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching system statistics"
    });
  }
});

// Toggle user active/inactive status
export const toggleUserStatus = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "You cannot change your own status"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    user.isActive = isActive !== undefined ? isActive : !user.isActive;
    await user.save();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating user status"
    });
  }
});

// Promote/demote user role
export const updateUserRole = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['customer', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid role. Valid roles are: ${validRoles.join(', ')}`
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "You cannot change your own role"
      });
    }

    // Only superadmin can create other superadmins
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only superadmin can assign superadmin role"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating user role"
    });
  }
});

// Reset user password (admin only)
export const resetUserPassword = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    user.password = newPassword;
    user.refreshToken = null; // Force logout
    await user.save();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Password reset successfully. User will need to login again.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while resetting password"
    });
  }
});

// Bulk update users
export const bulkUpdateUsers = asyncHandler(async (req, res) => {
  try {
    const { userIds, updateData } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Please provide an array of user IDs"
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Please provide update data"
      });
    }

    // Prevent users from updating their own data through bulk update
    if (userIds.includes(req.user._id.toString())) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "You cannot include yourself in bulk updates"
      });
    }

    // Validate update data
    const allowedUpdates = ['isActive', 'role', 'rank', 'reputation'];
    const updates = {};
    
    for (const key in updateData) {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid update fields. Allowed fields: ${allowedUpdates.join(', ')}`
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updates }
    );

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `Updated ${result.modifiedCount} users successfully`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while performing bulk update"
    });
  }
});

// Get user activity/audit logs
export const getUserActivity = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    // This would require an activity/audit log model
    // For now, return basic user info and last login
    const userActivity = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rank: user.rank,
        reputation: user.reputation,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin || null
      },
      // You would add actual activity logs here
      activities: []
    };

    res.status(HTTPSTATUS.OK).json({
      success: true,
      data: userActivity
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching user activity"
    });
  }
});

// Export user data
export const exportUserData = asyncHandler(async (req, res) => {
  try {
    const { format = 'json', role, isActive, dateFrom, dateTo } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const users = await User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = users.map(user => ({
        ID: user._id,
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Rank: user.rank,
        Reputation: user.reputation,
        Active: user.isActive,
        CreatedAt: user.createdAt,
        UpdatedAt: user.updatedAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      
      // Simple CSV conversion (you might want to use a library like csv-parser)
      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      res.status(HTTPSTATUS.OK).send(csv);
    } else {
      res.status(HTTPSTATUS.OK).json({
        success: true,
        data: users,
        count: users.length
      });
    }
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while exporting user data"
    });
  }
});

// Search users with advanced filters
export const searchUsers = asyncHandler(async (req, res) => {
  try {
    const { 
      query, 
      role, 
      rank, 
      isActive, 
      minReputation, 
      maxReputation, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const searchQuery = {};
    
    // Text search
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }

    // Filters
    if (role) searchQuery.role = role;
    if (rank) searchQuery.rank = rank;
    if (isActive !== undefined) searchQuery.isActive = isActive === 'true';
    if (minReputation || maxReputation) {
      searchQuery.reputation = {};
      if (minReputation) searchQuery.reputation.$gte = parseInt(minReputation);
      if (maxReputation) searchQuery.reputation.$lte = parseInt(maxReputation);
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(searchQuery)
      .select("-password -refreshToken")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(searchQuery);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      filters: {
        query,
        role,
        rank,
        isActive,
        minReputation,
        maxReputation,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while searching users"
    });
  }
});