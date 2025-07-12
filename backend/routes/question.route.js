import express from "express";
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  closeQuestion,
  reopenQuestion,
  getPopularQuestions,
  getRecentQuestions,
  getUserQuestions,
} from "../controllers/question.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { isAdmin, isAnyUser } from "../middlewares/role.middleware.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const router = express.Router();

// Create a new question
router.post(
  "/",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(createQuestion)
);

// Get all questions
router.get(
  "/",
  asyncHandler(getAllQuestions)
);

// Get popular questions
router.get(
  "/popular",
  asyncHandler(getPopularQuestions)
);

// Get recent questions
router.get(
  "/recent",
  asyncHandler(getRecentQuestions)
);

// Get user's questions (current user)
router.get(
  "/user",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserQuestions)
);

// Get specific user's questions
router.get(
  "/user/:userId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserQuestions)
);

// Get a single question by ID
router.get(
  "/:questionId",
  asyncHandler(getQuestionById)
);

// Update a question
router.put(
  "/:questionId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(updateQuestion)
);

// Delete a question
router.delete(
  "/:questionId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(deleteQuestion)
);

// Close a question
router.patch(
  "/:questionId/close",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(closeQuestion)
);

// Reopen a question
router.patch(
  "/:questionId/reopen",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(reopenQuestion)
);

export default router;
