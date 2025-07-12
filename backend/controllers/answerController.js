import Answer from "../models/Answer.js";
import Question from "../models/Question.js";
import User from "../models/user.model.js";
import { HTTPSTATUS } from "../config/https.config.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Create a new answer
export const createAnswer = asyncHandler(async (req, res) => {
  try {
    const { content, questionId } = req.body;
    const author = req.user._id;

    if (!content) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Answer content is required",
      });
    }

    if (!questionId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Question ID is required",
      });
    }

    // Verify that the question exists and is not closed
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Question not found",
      });
    }

    if (question.isClosed) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Cannot answer a closed question",
      });
    }

    // Check if question type allows answers (not applicable to polls)
    if (question.type === "poll") {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Cannot create answers for poll-type questions",
      });
    }

    const answer = await Answer.create({
      content,
      question: questionId,
      author,
    });

    // Update question's answer count
    await Question.findByIdAndUpdate(questionId, {
      $inc: { answersCount: 1 }
    });

    const populatedAnswer = await Answer.findById(answer._id)
      .populate("author", "name email reputation rank")
      .populate("question", "title type");

    res.status(HTTPSTATUS.CREATED).json({
      success: true,
      message: "Answer created successfully",
      answer: populatedAnswer,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while creating answer",
      error: error.message,
    });
  }
});

// Get answers for a question
export const getQuestionAnswers = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const { page = 1, limit = 10, sort = "votes", includeDeleted = false } = req.query;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Question not found",
      });
    }

    const answers = await Answer.findByQuestion(questionId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      includeDeleted: includeDeleted === 'true',
    });

    const total = await Answer.countDocuments({
      question: questionId,
      ...(includeDeleted === 'true' ? {} : { isDeleted: false }),
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      answers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAnswers: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching answers",
      error: error.message,
    });
  }
});

// Get a single answer by ID
export const getAnswerById = asyncHandler(async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await Answer.findById(answerId)
      .populate("author", "name email reputation rank")
      .populate("question", "title type author");

    if (!answer) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Answer not found",
      });
    }

    if (answer.isDeleted && req.user.role !== "admin") {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Answer not found",
      });
    }

    // Increment views if it's not the author viewing their own answer
    if (req.user && answer.author._id.toString() !== req.user._id.toString()) {
      await answer.incrementViews();
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching answer",
      error: error.message,
    });
  }
});

// Update an answer
export const updateAnswer = asyncHandler(async (req, res) => {
  try {
    const { answerId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Answer content is required",
      });
    }

    const answer = await Answer.findById(answerId).populate("question");

    if (!answer) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Answer not found",
      });
    }

    if (answer.isDeleted) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Cannot edit a deleted answer",
      });
    }

    // Check if user is the author or admin
    if (answer.author.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You can only edit your own answers",
      });
    }

    // Check if the associated question is closed
    if (answer.question.isClosed) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Cannot edit answer for a closed question",
      });
    }

    answer.content = content;
    await answer.save(); // This will trigger the pre-save middleware

    const updatedAnswer = await Answer.findById(answerId)
      .populate("author", "name email reputation rank")
      .populate("question", "title type");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Answer updated successfully",
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating answer",
      error: error.message,
    });
  }
});

// Soft delete an answer
export const deleteAnswer = asyncHandler(async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user._id;

    const answer = await Answer.findById(answerId);

    if (!answer) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Answer not found",
      });
    }

    if (answer.isDeleted) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Answer is already deleted",
      });
    }

    // Check if user is the author or admin
    if (answer.author.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You can only delete your own answers",
      });
    }

    await answer.softDelete();

    // Update question's answer count
    await Question.findByIdAndUpdate(answer.question, {
      $inc: { answersCount: -1 }
    });

    // If this was an accepted answer, update question's hasAcceptedAnswer status
    if (answer.isAccepted) {
      const hasOtherAcceptedAnswers = await Answer.exists({
        question: answer.question,
        isAccepted: true,
        isDeleted: false,
        _id: { $ne: answerId }
      });

      await Question.findByIdAndUpdate(answer.question, {
        hasAcceptedAnswer: !!hasOtherAcceptedAnswers
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Answer deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while deleting answer",
      error: error.message,
    });
  }
});

// Permanently delete an answer (admin only)
export const permanentDeleteAnswer = asyncHandler(async (req, res) => {
  try {
    const { answerId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only admins can permanently delete answers",
      });
    }

    const answer = await Answer.findById(answerId);

    if (!answer) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Answer not found",
      });
    }

    // Update question's answer count if answer wasn't already soft deleted
    if (!answer.isDeleted) {
      await Question.findByIdAndUpdate(answer.question, {
        $inc: { answersCount: -1 }
      });
    }

    // Update question's hasAcceptedAnswer status if this was an accepted answer
    if (answer.isAccepted) {
      const hasOtherAcceptedAnswers = await Answer.exists({
        question: answer.question,
        isAccepted: true,
        _id: { $ne: answerId }
      });

      await Question.findByIdAndUpdate(answer.question, {
        hasAcceptedAnswer: !!hasOtherAcceptedAnswers
      });
    }

    // Delete all comments for this answer
    const Comment = mongoose.model('Comment');
    await Comment.deleteMany({ answer: answerId });

    // Delete the answer itself
    await Answer.findByIdAndDelete(answerId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Answer permanently deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while permanently deleting answer",
      error: error.message,
    });
  }
});

// Vote on an answer
export const voteAnswer = asyncHandler(async (req, res) => {
  try {
    const { answerId } = req.params;
    const { voteType } = req.body; // "upvote" or "downvote"
    const userId = req.user._id;

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Vote type must be 'upvote' or 'downvote'",
      });
    }

    const answer = await Answer.findById(answerId);

    if (!answer) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Answer not found",
      });
    }

    if (answer.isDeleted) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Cannot vote on a deleted answer",
      });
    }

    // Prevent voting on own answer
    if (answer.author.toString() === userId.toString()) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "You cannot vote on your own answer",
      });
    }

    const voteValue = voteType === "upvote" ? 1 : -1;

    const updatedAnswer = await Answer.findByIdAndUpdate(
      answerId,
      { $inc: { votes: voteValue } },
      { new: true }
    )
      .populate("author", "name email reputation rank")
      .populate("question", "title type");

    // Update author's reputation based on vote (higher impact than comments)
    const reputationChange = voteType === "upvote" ? 10 : -2;
    await User.findByIdAndUpdate(answer.author._id, {
      $inc: { reputation: reputationChange },
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `Answer ${voteType}d successfully`,
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while voting on answer",
      error: error.message,
    });
  }
});

// Accept an answer (question author only)
export const acceptAnswer = asyncHandler(async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user._id;

    const answer = await Answer.findById(answerId).populate("question");

    if (!answer) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Answer not found",
      });
    }

    if (answer.isDeleted) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Cannot accept a deleted answer",
      });
    }

    // Check if user is the question author
    if (answer.question.author.toString() !== userId.toString()) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only the question author can accept answers",
      });
    }

    if (answer.isAccepted) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Answer is already accepted",
      });
    }

    await answer.acceptAnswer();

    // Give reputation bonus to answer author for getting answer accepted
    await User.findByIdAndUpdate(answer.author, {
      $inc: { reputation: 15 },
    });

    const updatedAnswer = await Answer.findById(answerId)
      .populate("author", "name email reputation rank")
      .populate("question", "title type");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Answer accepted successfully",
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while accepting answer",
      error: error.message,
    });
  }
});

// Unaccept an answer (question author only)
export const unacceptAnswer = asyncHandler(async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user._id;

    const answer = await Answer.findById(answerId).populate("question");

    if (!answer) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Answer not found",
      });
    }

    // Check if user is the question author
    if (answer.question.author.toString() !== userId.toString()) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only the question author can unaccept answers",
      });
    }

    if (!answer.isAccepted) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Answer is not currently accepted",
      });
    }

    await answer.unacceptAnswer();

    // Remove reputation bonus from answer author
    await User.findByIdAndUpdate(answer.author, {
      $inc: { reputation: -15 },
    });

    const updatedAnswer = await Answer.findById(answerId)
      .populate("author", "name email reputation rank")
      .populate("question", "title type");

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Answer unaccepted successfully",
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while unaccepting answer",
      error: error.message,
    });
  }
});

// Get user's answers
export const getUserAnswers = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, includeDeleted = false } = req.query;

    const targetUserId = userId || req.user._id;

    const answers = await Answer.findByUser(targetUserId, {
      page: parseInt(page),
      limit: parseInt(limit),
      includeDeleted: includeDeleted === 'true',
    });

    const total = await Answer.countDocuments({
      author: targetUserId,
      ...(includeDeleted === 'true' ? {} : { isDeleted: false }),
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      answers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAnswers: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching user answers",
      error: error.message,
    });
  }
});

// Get user's accepted answers
export const getUserAcceptedAnswers = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const targetUserId = userId || req.user._id;

    const answers = await Answer.findAcceptedByUser(targetUserId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    const total = await Answer.countDocuments({
      author: targetUserId,
      isAccepted: true,
      isDeleted: false,
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      answers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAnswers: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching accepted answers",
      error: error.message,
    });
  }
});

// Get top answers
export const getTopAnswers = asyncHandler(async (req, res) => {
  try {
    const { limit = 10, minVotes = 5 } = req.query;

    const answers = await Answer.findTopAnswers({
      limit: parseInt(limit),
      minVotes: parseInt(minVotes),
    });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      answers,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching top answers",
      error: error.message,
    });
  }
});
