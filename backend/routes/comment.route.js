import express from "express";
import {
  createComment,
  getQuestionComments,
  getAnswerComments,
  getCommentReplies,
  updateComment,
  deleteComment,
  permanentDeleteComment,
  getUserComments,
  getCommentById,
} from "../controllers/commentController.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { isAdmin, isAnyUser } from "../middlewares/role.middleware.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const router = express.Router();

// Create a new comment
router.post(
  "/",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(createComment)
);

// Get current user's comments
router.get(
  "/user",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserComments)
);

// Get specific user's comments
router.get(
  "/user/:userId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserComments)
);

// Get comments for a question
router.get(
  "/question/:questionId",
  asyncHandler(getQuestionComments)
);

// Get comments for an answer
router.get(
  "/answer/:answerId",
  asyncHandler(getAnswerComments)
);

// Get a single comment by ID
router.get(
  "/:commentId",
  asyncHandler(getCommentById)
);

// Get replies for a comment
router.get(
  "/:commentId/replies",
  asyncHandler(getCommentReplies)
);

// Update a comment
router.put(
  "/:commentId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(updateComment)
);

// Delete a comment (soft delete)
router.delete(
  "/:commentId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(deleteComment)
);

// Permanently delete a comment (admin only)
router.delete(
  "/:commentId/permanent",
  verifyAccessToken,
  isAdmin,
  asyncHandler(permanentDeleteComment)
);

export default router;
