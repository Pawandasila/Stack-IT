import express from "express";
import {
  createAnswer,
  getQuestionAnswers,
  getAnswerById,
  updateAnswer,
  deleteAnswer,
  permanentDeleteAnswer,
  acceptAnswer,
  unacceptAnswer,
  getUserAnswers,
  getUserAcceptedAnswers,
  getTopAnswers,
} from "../controllers/answerController.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { isAdmin, isAnyUser } from "../middlewares/role.middleware.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const router = express.Router();

// Create a new answer
router.post(
  "/",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(createAnswer)
);

// Get top answers
router.get(
  "/top",
  asyncHandler(getTopAnswers)
);

// Get current user's answers
router.get(
  "/user",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserAnswers)
);

// Get specific user's answers
router.get(
  "/user/:userId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserAnswers)
);

// Get current user's accepted answers
router.get(
  "/user/accepted",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserAcceptedAnswers)
);

// Get specific user's accepted answers
router.get(
  "/user/:userId/accepted",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserAcceptedAnswers)
);

// Get answers for a question
router.get(
  "/question/:questionId",
  asyncHandler(getQuestionAnswers)
);

// Get a single answer by ID
router.get(
  "/:answerId",
  asyncHandler(getAnswerById)
);

// Update an answer
router.put(
  "/:answerId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(updateAnswer)
);

// Delete an answer (soft delete)
router.delete(
  "/:answerId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(deleteAnswer)
);

// Permanently delete an answer (admin only)
router.delete(
  "/:answerId/permanent",
  verifyAccessToken,
  isAdmin,
  asyncHandler(permanentDeleteAnswer)
);

// Accept an answer
router.patch(
  "/:answerId/accept",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(acceptAnswer)
);

// Unaccept an answer
router.patch(
  "/:answerId/unaccept",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(unacceptAnswer)
);

export default router;
