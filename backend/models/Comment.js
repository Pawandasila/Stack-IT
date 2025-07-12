import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: [1, "Comment must be at least 1 character"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"]
    },
    contentType: {
      type: String,
      enum: ["plain", "rich"],
      default: "rich"
    },
    plainTextContent: {
      type: String,
      // This will store the plain text version for search
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"]
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: function() {
        return !this.answer;
      }
    },
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      required: function() {
        return !this.question;
      }
    },
    votes: {
      type: Number,
      default: 0
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    replies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }],
    repliesCount: {
      type: Number,
      default: 0,
      min: [0, "Replies count cannot be negative"]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
commentSchema.index({ question: 1, createdAt: -1 });
commentSchema.index({ answer: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ votes: -1 });
commentSchema.index({ isDeleted: 1 });

// Virtual for comment age
commentSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual to check if comment is a reply
commentSchema.virtual('isReply').get(function() {
  return !!this.parentComment;
});

// Validation: Comment must belong to either a question or an answer
commentSchema.pre('validate', function(next) {
  if (!this.question && !this.answer) {
    return next(new Error('Comment must belong to either a question or an answer'));
  }
  if (this.question && this.answer) {
    return next(new Error('Comment cannot belong to both question and answer'));
  }
  next();
});

// Middleware to set editedAt when comment is edited
commentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Instance method to soft delete comment
commentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = "[deleted]";
  return this.save();
};

// Instance method to restore deleted comment
commentSchema.methods.restore = function(originalContent) {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.content = originalContent;
  return this.save();
};

// Static method to find comments for a question
commentSchema.statics.findByQuestion = function(questionId, options = {}) {
  const { page = 1, limit = 10, includeDeleted = false } = options;
  const skip = (page - 1) * limit;
  
  const query = { 
    question: questionId,
    parentComment: null // Only top-level comments
  };
  
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  return this.find(query)
    .populate('author', 'name reputation rank')
    .populate({
      path: 'replies',
      match: includeDeleted ? {} : { isDeleted: false },
      populate: {
        path: 'author',
        select: 'name reputation rank'
      },
      options: { sort: { createdAt: 1 }, limit: 5 } // Show only first 5 replies
    })
    .sort({ votes: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find comments for an answer
commentSchema.statics.findByAnswer = function(answerId, options = {}) {
  const { page = 1, limit = 10, includeDeleted = false } = options;
  const skip = (page - 1) * limit;
  
  const query = { 
    answer: answerId,
    parentComment: null // Only top-level comments
  };
  
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  return this.find(query)
    .populate('author', 'name reputation rank')
    .populate({
      path: 'replies',
      match: includeDeleted ? {} : { isDeleted: false },
      populate: {
        path: 'author',
        select: 'name reputation rank'
      },
      options: { sort: { createdAt: 1 }, limit: 5 }
    })
    .sort({ votes: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get user's comments
commentSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 10, includeDeleted = false } = options;
  const skip = (page - 1) * limit;
  
  const query = { author: userId };
  
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  return this.find(query)
    .populate('author', 'name reputation rank')
    .populate('question', 'title')
    .populate('answer', 'content')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model("Comment", commentSchema);
