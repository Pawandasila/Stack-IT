import express from "express";
import {
  voteQuestion,
  voteAnswer,
  voteComment,
  getUserVote,
  getUserVotesForItems,
  getVoteStats,
  getUserVotingHistory,
} from "../controllers/voteController.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { isAnyUser } from "../middlewares/role.middleware.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const router = express.Router();

// Vote on a question
router.post(
  "/questions/:targetId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(voteQuestion)
);

// Vote on an answer
router.post(
  "/answers/:targetId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(voteAnswer)
);

// Vote on a comment
router.post(
  "/comments/:targetId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(voteComment)
);

// Get user's vote on a specific item
router.get(
  "/:targetType/:targetId/user-vote",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserVote)
);

// Get user's votes for multiple items
router.post(
  "/user-votes",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserVotesForItems)
);

// Get vote statistics for an item
router.get(
  "/:targetType/:targetId/stats",
  asyncHandler(getVoteStats)
);

// Get user's voting history
router.get(
  "/user/history",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(getUserVotingHistory)
);

export default router;
