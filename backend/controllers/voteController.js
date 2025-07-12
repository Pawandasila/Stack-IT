import Vote from "../models/Vote.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import Comment from "../models/Comment.js";
import User from "../models/user.model.js";
import { HTTPSTATUS } from "../config/https.config.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { createNotification } from "./notificationController.js";

// Generic voting function
const handleVote = async (req, res, targetType, TargetModel) => {
  try {
    const { targetId } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Vote type must be 'upvote' or 'downvote'",
      });
    }

    // Find the target item
    const target = await TargetModel.findById(targetId).populate('author', 'name');

    if (!target) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: `${targetType} not found`,
      });
    }

    if (target.isDeleted && targetType !== "Question") {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot vote on a deleted ${targetType.toLowerCase()}`,
      });
    }

    // Prevent voting on own content
    if (target.author._id.toString() === userId.toString()) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: `You cannot vote on your own ${targetType.toLowerCase()}`,
      });
    }

    // Cast the vote
    const voteResult = await Vote.castVote(userId, targetType, targetId, voteType);

    // Update the target's vote count
    await TargetModel.findByIdAndUpdate(targetId, {
      $inc: { votes: voteResult.voteChange }
    });

    // Update author's reputation
    let reputationChange = 0;
    switch (targetType) {
      case "Question":
        reputationChange = voteType === "upvote" ? 5 : -2;
        break;
      case "Answer":
        reputationChange = voteType === "upvote" ? 10 : -2;
        break;
      case "Comment":
        reputationChange = voteType === "upvote" ? 2 : -1;
        break;
    }

    // Apply reputation change based on vote action
    if (voteResult.action === "created") {
      await User.findByIdAndUpdate(target.author._id, {
        $inc: { reputation: reputationChange }
      });
    } else if (voteResult.action === "changed") {
      // Remove old reputation and add new
      const oldReputationChange = voteResult.oldVoteType === "upvote" ? 
        (targetType === "Question" ? 5 : targetType === "Answer" ? 10 : 2) : 
        (targetType === "Question" ? -2 : targetType === "Answer" ? -2 : -1);
      
      await User.findByIdAndUpdate(target.author._id, {
        $inc: { reputation: reputationChange - oldReputationChange }
      });
    } else if (voteResult.action === "removed") {
      await User.findByIdAndUpdate(target.author._id, {
        $inc: { reputation: -reputationChange }
      });
    }

    // Create notification for upvotes on new votes
    if (voteResult.action === "created" && voteType === "upvote") {
      await createNotification({
        recipient: target.author._id,
        sender: userId,
        type: `${targetType.toLowerCase()}_voted`,
        title: `Someone upvoted your ${targetType.toLowerCase()}`,
        message: `Your ${targetType.toLowerCase()} received an upvote`,
        relatedQuestion: targetType === "Question" ? targetId : target.question,
        relatedAnswer: targetType === "Answer" ? targetId : target.answer,
        relatedComment: targetType === "Comment" ? targetId : null,
        metadata: { voteType }
      });
    }

    // Get updated target with new vote count
    const updatedTarget = await TargetModel.findById(targetId)
      .populate('author', 'name reputation rank');

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `${targetType} ${voteResult.action === "removed" ? "vote removed" : voteType + "d"} successfully`,
      target: updatedTarget,
      voteAction: voteResult.action,
      userVote: voteResult.action === "removed" ? null : voteType
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Server error while voting on ${targetType.toLowerCase()}`,
      error: error.message,
    });
  }
};

// Vote on a question
export const voteQuestion = asyncHandler(async (req, res) => {
  await handleVote(req, res, "Question", Question);
});

// Vote on an answer
export const voteAnswer = asyncHandler(async (req, res) => {
  await handleVote(req, res, "Answer", Answer);
});

// Vote on a comment
export const voteComment = asyncHandler(async (req, res) => {
  await handleVote(req, res, "Comment", Comment);
});

// Get user's vote on a specific item
export const getUserVote = asyncHandler(async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user._id;

    if (!["Question", "Answer", "Comment"].includes(targetType)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid target type",
      });
    }

    const vote = await Vote.getUserVote(userId, targetType, targetId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      userVote: vote ? vote.voteType : null,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching user vote",
      error: error.message,
    });
  }
});

// Get user's votes for multiple items
export const getUserVotesForItems = asyncHandler(async (req, res) => {
  try {
    const { targets } = req.body; // Array of {type, id} objects
    const userId = req.user._id;

    if (!Array.isArray(targets)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Targets must be an array",
      });
    }

    const votes = await Vote.getUserVotesForTargets(userId, targets);

    // Format response as object with targetId as key
    const votesMap = {};
    votes.forEach(vote => {
      const key = `${vote.targetType}_${vote.targetId}`;
      votesMap[key] = vote.voteType;
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      votes: votesMap,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching user votes",
      error: error.message,
    });
  }
});

// Get vote statistics for an item
export const getVoteStats = asyncHandler(async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (!["Question", "Answer", "Comment"].includes(targetType)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid target type",
      });
    }

    const stats = await Vote.getVoteStats(targetType, targetId);

    const formattedStats = {
      upvotes: 0,
      downvotes: 0,
      total: 0
    };

    stats.forEach(stat => {
      if (stat._id === "upvote") {
        formattedStats.upvotes = stat.count;
      } else if (stat._id === "downvote") {
        formattedStats.downvotes = stat.count;
      }
    });

    formattedStats.total = formattedStats.upvotes - formattedStats.downvotes;

    res.status(HTTPSTATUS.OK).json({
      success: true,
      stats: formattedStats,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching vote statistics",
      error: error.message,
    });
  }
});

// Get user's voting history
export const getUserVotingHistory = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, targetType } = req.query;

    const votes = await Vote.getUserVotingHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      targetType
    });

    const total = await Vote.countDocuments({
      user: userId,
      ...(targetType ? { targetType } : {})
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      votes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalVotes: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching voting history",
      error: error.message,
    });
  }
});
