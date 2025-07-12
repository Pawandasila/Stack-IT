import Comment from "../models/Comment.js";
import Question from "../models/Question.js";
import User from "../models/user.model.js";
import { HTTPSTATUS } from "../config/https.config.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const createComment = asyncHandler(async (req, res) => {
  try {
    const { content, questionId, answerId, parentCommentId } = req.body;
    const author = req.user._id;

    if (!content) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Comment content is required",
      });
    }

    if (!questionId && !answerId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Comment must belong to either a question or an answer",
      });
    }

    if (questionId && answerId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Comment cannot belong to both question and answer",
      });
    }

    if (questionId) {
      const question = await Question.findById(questionId);
      if (!question) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
          success: false,
          message: "Question not found",
        });
      }
    }

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(HTTPSTATUS.NOT_FOUND).json({
          success: false,
          message: "Parent comment not found",
        });
      }
    }

    const commentData = {
      content,
      author,
      parentComment: parentCommentId || null,
    };

    if (questionId) commentData.question = questionId;
    if (answerId) commentData.answer = answerId;

    const comment = await Comment.create(commentData);

    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id },
        $inc: { repliesCount: 1 },
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "name email reputation rank")
      .populate("question", "title")
      .populate("answer", "content");

    res.status(HTTPSTATUS.CREATED).json({
      success: true,
      message: "Comment created successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while creating comment",
      error: error.message,
    });
  }
});

export const getQuestionComments = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const { page = 1, limit = 10, includeDeleted = false } = req.query;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Question not found",
      });
    }

    const comments = await Comment.findByQuestion(questionId, {
      page: parseInt(page),
      limit: parseInt(limit),
      includeDeleted: includeDeleted === "true",
    });

    const total = await Comment.countDocuments({
      question: questionId,
      parentComment: null,
      ...(includeDeleted === "true" ? {} : { isDeleted: false }),
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching comments",
      error: error.message,
    });
  }
});

export const getAnswerComments = asyncHandler(async (req, res) => {
  try {
    const { answerId } = req.params;
    const { page = 1, limit = 10, includeDeleted = false } = req.query;

    const comments = await Comment.findByAnswer(answerId, {
      page: parseInt(page),
      limit: parseInt(limit),
      includeDeleted: includeDeleted === "true",
    });

    const total = await Comment.countDocuments({
      answer: answerId,
      parentComment: null,
      ...(includeDeleted === "true" ? {} : { isDeleted: false }),
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching comments",
      error: error.message,
    });
  }
});

export const getCommentReplies = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10, includeDeleted = false } = req.query;
    const skip = (page - 1) * limit;

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Comment not found",
      });
    }

    const query = {
      parentComment: commentId,
      ...(includeDeleted === "true" ? {} : { isDeleted: false }),
    };

    const replies = await Comment.find(query)
      .populate("author", "name email reputation rank")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(query);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      replies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReplies: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching replies",
      error: error.message,
    });
  }
});

export const updateComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.isDeleted) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Cannot edit a deleted comment",
      });
    }

    if (
      comment.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate("author", "name email reputation rank")
      .populate("question", "title")
      .populate("answer", "content");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating comment",
      error: error.message,
    });
  }
});

export const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.isDeleted) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Comment is already deleted",
      });
    }

    if (
      comment.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    await comment.softDelete();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while deleting comment",
      error: error.message,
    });
  }
});

export const permanentDeleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only admins can permanently delete comments",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: commentId },
        $inc: { repliesCount: -1 },
      });
    }

    await Comment.deleteMany({ parentComment: commentId });

    await Comment.findByIdAndDelete(commentId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Comment permanently deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while permanently deleting comment",
      error: error.message,
    });
  }
});

export const voteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Vote type must be 'upvote' or 'downvote'",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.isDeleted) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Cannot vote on a deleted comment",
      });
    }

    if (comment.author.toString() === userId.toString()) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "You cannot vote on your own comment",
      });
    }

    const voteValue = voteType === "upvote" ? 1 : -1;

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $inc: { votes: voteValue } },
      { new: true }
    ).populate("author", "name email reputation rank");

    const reputationChange = voteType === "upvote" ? 2 : -1;
    await User.findByIdAndUpdate(comment.author._id, {
      $inc: { reputation: reputationChange },
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `Comment ${voteType}d successfully`,
      comment: updatedComment,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while voting on comment",
      error: error.message,
    });
  }
});

export const getUserComments = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, includeDeleted = false } = req.query;

    const targetUserId = userId || req.user._id;

    const comments = await Comment.findByUser(targetUserId, {
      page: parseInt(page),
      limit: parseInt(limit),
      includeDeleted: includeDeleted === "true",
    });

    const total = await Comment.countDocuments({
      author: targetUserId,
      ...(includeDeleted === "true" ? {} : { isDeleted: false }),
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching user comments",
      error: error.message,
    });
  }
});

export const getCommentById = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId)
      .populate("author", "name email reputation rank")
      .populate("question", "title")
      .populate("answer", "content")
      .populate({
        path: "replies",
        match: { isDeleted: false },
        populate: {
          path: "author",
          select: "name reputation rank",
        },
        options: { sort: { createdAt: 1 } },
      });

    if (!comment) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Comment not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching comment",
      error: error.message,
    });
  }
});
