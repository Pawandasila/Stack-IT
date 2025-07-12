// import express from "express";
// import {
//   registerUser,
//   loginUser,
//   getUserProfile,
//   logoutUser,
//   refreshAccessToken,
// } from "../controllers/auth.controller.js";
// import {
//   updateUserProfile,
//   changePassword,
//   getAllUsers,
//   deleteUser,
//   updateUserRankAndReputation,
//   incrementUserReputation,
// } from "../controllers/user.controller.js";
// import { verifyAccessToken } from "../middlewares/auth.middleware.js";
// import { isAdmin, isAnyUser } from "../middlewares/role.middleware.js";
// import asyncHandler from "../middlewares/asyncHandler.js";

// const router = express.Router();

// router.post("/register", asyncHandler(registerUser));
// router.post("/login", asyncHandler(loginUser));
// router.post("/refresh-token", asyncHandler(refreshAccessToken));

// router.get(
//   "/profile",
//   verifyAccessToken,
//   isAnyUser,
//   asyncHandler(getUserProfile)
// );
// router.put(
//   "/profile",
//   verifyAccessToken,
//   isAnyUser,
//   asyncHandler(updateUserProfile)
// );
// router.put(
//   "/change-password",
//   verifyAccessToken,
//   isAnyUser,
//   asyncHandler(changePassword)
// );

// router.put(
//   "/rank-reputation",
//   verifyAccessToken,
//   isAnyUser,
//   asyncHandler(updateUserRankAndReputation)
// );

// router.patch(
//   "/reputation/increment",
//   verifyAccessToken,
//   isAnyUser,
//   asyncHandler(incrementUserReputation)
// );

// router.patch(
//   "/reputation/increment/:userId",
//   verifyAccessToken,
//   isAdmin,
//   asyncHandler(incrementUserReputation)
// );

// router.post("/logout", verifyAccessToken, isAnyUser, asyncHandler(logoutUser));

// router.get("/all", verifyAccessToken, isAdmin, asyncHandler(getAllUsers));
// router.delete("/:userId", verifyAccessToken, isAdmin, asyncHandler(deleteUser));

// export default router;

// ------
// routes/user.routes.js (Updated with admin protection)
import express from 'express';
import { 
  updateUserProfile, 
  changePassword, 
  getAllUsers, 
  deleteUser, 
  updateUserRankAndReputation, 
  incrementUserReputation,
  updateOwnRankAndReputation
} from '../controllers/user.controller.js';
import { requireAdmin, requireAdminOrSelf } from '../middlewares/adminAuth.js';
import { authenticateToken } from '../controllers/auth.controller.js'; // Your existing auth middleware

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Self-service routes (users can access their own data)
router.patch('/profile', updateUserProfile);
router.patch('/change-password', changePassword);
router.patch('/my-rank', updateOwnRankAndReputation); // Users can update their own rank only

// Admin-only routes
router.get('/all', requireAdmin, getAllUsers);
router.delete('/:userId', requireAdmin, deleteUser);
router.patch('/:userId/rank-reputation', requireAdmin, updateUserRankAndReputation);
router.patch('/:userId/reputation', requireAdmin, incrementUserReputation);

export default router;
