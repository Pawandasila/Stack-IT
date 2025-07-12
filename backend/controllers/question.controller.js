import Question from "../models/Question.js";
import User from "../models/user.model.js";
import { HTTPSTATUS } from "../config/https.config.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const createQuestion = asyncHandler(async (req, res) => {
  try {
    const { title, content, type, tags } = req.body;
    const author = req.user._id;

    if (!title || !content) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const question = await Question.create({
      title,
      content,
      type: type || "question",
      author,
      tags: tags || [],
    });

    const populatedQuestion = await Question.findById(question._id)
      .populate("author", "name email reputation rank")
      .populate("tags", "name");

    res.status(HTTPSTATUS.CREATED).json({
      success: true,
      message: "Question created successfully",
      question: populatedQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while creating question",
      error: error.message,
    });
  }
});

export const getAllQuestions = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "recent",
      type,
      author,
      tag,
      search,
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};
    let sortObj = {};

    if (type) query.type = type;
    if (author) query.author = author;
    if (tag) query.tags = { $in: [tag] };

    if (search) {
      query.$text = { $search: search };
    }

    switch (sort) {
      case "popular":
        sortObj = { votes: -1, views: -1 };
        break;
      case "recent":
        sortObj = { createdAt: -1 };
        break;
      case "oldest":
        sortObj = { createdAt: 1 };
        break;
      case "most-viewed":
        sortObj = { views: -1 };
        break;
      case "unanswered":
        query.answersCount = 0;
        sortObj = { createdAt: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const questions = await Question.find(query)
      .populate("author", "name email reputation rank")
      .populate("tags", "name")
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(query);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalQuestions: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching questions",
      error: error.message,
    });
  }
});

export const getQuestionById = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId)
      .populate("author", "name email reputation rank")
      .populate("tags", "name");

    if (!question) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Question not found",
      });
    }

    if (
      req.user &&
      question.author._id.toString() !== req.user._id.toString()
    ) {
      await question.incrementViews();
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching question",
      error: error.message,
    });
  }
});

export const updateQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const { title, content, type, tags } = req.body;
    const userId = req.user._id;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Question not found",
      });
    }

    if (
      question.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You can only edit your own questions",
      });
    }

    if (question.isClosed) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Cannot edit a closed question",
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (type) updateData.type = type;
    if (tags) updateData.tags = tags;

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("author", "name email reputation rank")
      .populate("tags", "name");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating question",
      error: error.message,
    });
  }
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Question not found",
      });
    }

    if (
      question.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You can only delete your own questions",
      });
    }

    await Question.findByIdAndDelete(questionId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while deleting question",
      error: error.message,
    });
  }
});

export const voteQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Vote type must be 'upvote' or 'downvote'",
      });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Question not found",
      });
    }

    if (question.author.toString() === userId.toString()) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "You cannot vote on your own question",
      });
    }

    const voteValue = voteType === "upvote" ? 1 : -1;

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      { $inc: { votes: voteValue } },
      { new: true }
    )
      .populate("author", "name email reputation rank")
      .populate("tags", "name");

    const reputationChange = voteType === "upvote" ? 5 : -2;
    await User.findByIdAndUpdate(question.author, {
      $inc: { reputation: reputationChange },
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `Question ${voteType}d successfully`,
      question: updatedQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while voting on question",
      error: error.message,
    });
  }
});

export const closeQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const { closeReason } = req.body;
    const userId = req.user._id;

    if (!closeReason) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Close reason is required",
      });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Question not found",
      });
    }

    if (
      question.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You can only close your own questions",
      });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      { isClosed: true, closeReason },
      { new: true, runValidators: true }
    )
      .populate("author", "name email reputation rank")
      .populate("tags", "name");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Question closed successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while closing question",
      error: error.message,
    });
  }
});

export const reopenQuestion = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Question not found",
      });
    }

    if (
      question.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You can only reopen your own questions",
      });
    }

    if (!question.isClosed) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Question is already open",
      });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      { isClosed: false, $unset: { closeReason: 1 } },
      { new: true }
    )
      .populate("author", "name email reputation rank")
      .populate("tags", "name");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Question reopened successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while reopening question",
      error: error.message,
    });
  }
});

export const getPopularQuestions = asyncHandler(async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const questions = await Question.findPopular(parseInt(limit));

    res.status(HTTPSTATUS.OK).json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching popular questions",
      error: error.message,
    });
  }
});

export const getRecentQuestions = asyncHandler(async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const questions = await Question.findRecent(parseInt(limit));

    res.status(HTTPSTATUS.OK).json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching recent questions",
      error: error.message,
    });
  }
});

export const getUserQuestions = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const targetUserId = userId || req.user._id;

    const questions = await Question.find({ author: targetUserId })
      .populate("author", "name email reputation rank")
      .populate("tags", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments({ author: targetUserId });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalQuestions: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching user questions",
      error: error.message,
    });
  }
});
