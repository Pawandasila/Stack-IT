import User from "../models/user.model.js";
import { HTTPSTATUS } from "../config/https.config.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const userId = req.user._id;

    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (address) updateData.address = address;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken");

    if (!updatedUser) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while changing password",
    });
  }
});

export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select("-password -refreshToken")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while deleting user",
    });
  }
});

export const updateUserRankAndReputation = asyncHandler(async (req, res) => {
  try {
    const { rank, reputation } = req.body;
    const userId = req.user._id;

    // Validation for rank
    const validRanks = [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
      "Master",
    ];
    if (rank && !validRanks.includes(rank)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid rank. Valid ranks are: ${validRanks.join(", ")}`,
      });
    }

    // Validation for reputation
    if (
      reputation !== undefined &&
      (typeof reputation !== "number" || reputation < 0)
    ) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Reputation must be a non-negative number",
      });
    }

    const updateData = {};
    if (rank) updateData.rank = rank;
    if (reputation !== undefined) updateData.reputation = reputation;

    if (Object.keys(updateData).length === 0) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Please provide rank or reputation to update",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken");

    if (!updatedUser) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Rank and reputation updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        rank: updatedUser.rank,
        reputation: updatedUser.reputation,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating rank and reputation",
    });
  }
});

// Add the missing function that your route is trying to import
export const updateOwnRankAndReputation = asyncHandler(async (req, res) => {
  try {
    const { rank, reputation } = req.body;
    const userId = req.user._id;

    // Validation for rank
    const validRanks = [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
      "Master",
    ];
    if (rank && !validRanks.includes(rank)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid rank. Valid ranks are: ${validRanks.join(", ")}`,
      });
    }

    // Validation for reputation
    if (
      reputation !== undefined &&
      (typeof reputation !== "number" || reputation < 0)
    ) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Reputation must be a non-negative number",
      });
    }

    const updateData = {};
    if (rank) updateData.rank = rank;
    if (reputation !== undefined) updateData.reputation = reputation;

    if (Object.keys(updateData).length === 0) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Please provide rank or reputation to update",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken");

    if (!updatedUser) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Your rank and reputation updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        rank: updatedUser.rank,
        reputation: updatedUser.reputation,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating your rank and reputation",
    });
  }
});

export const incrementUserReputation = asyncHandler(async (req, res) => {
  try {
    const { points = 1 } = req.body; // Default increment by 1 point
    const { userId } = req.params; // Allow admin to increment any user's reputation

    // Validation for points
    if (typeof points !== "number") {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Points must be a number",
      });
    }

    // Find and update user reputation
    const targetUserId = userId || req.user._id; // Use provided userId or current user

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $inc: { reputation: points } },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    // Auto-update rank based on reputation
    let newRank = updatedUser.rank;
    if (updatedUser.reputation >= 1000) {
      newRank = "Master";
    } else if (updatedUser.reputation >= 500) {
      newRank = "Expert";
    } else if (updatedUser.reputation >= 200) {
      newRank = "Advanced";
    } else if (updatedUser.reputation >= 50) {
      newRank = "Intermediate";
    } else {
      newRank = "Beginner";
    }

    // Update rank if it changed
    if (newRank !== updatedUser.rank) {
      updatedUser.rank = newRank;
      await updatedUser.save();
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `Reputation ${
        points > 0 ? "increased" : "decreased"
      } by ${Math.abs(points)} points`,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        rank: updatedUser.rank,
        reputation: updatedUser.reputation,
        role: updatedUser.role,
      },
      rankUpdated: newRank !== updatedUser.rank,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating reputation",
    });
  }
});