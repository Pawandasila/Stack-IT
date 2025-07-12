import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Answer content is required"],
      trim: true,
      minlength: [10, "Answer must be at least 10 characters"],
      maxlength: [10000, "Answer cannot exceed 10000 characters"]
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
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question reference is required"]
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"]
    },
    votes: {
      type: Number,
      default: 0
    },
    isAccepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: {
      type: Date
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: [0, "Comments count cannot be negative"]
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
answerSchema.index({ question: 1, createdAt: -1 });
answerSchema.index({ author: 1, createdAt: -1 });
answerSchema.index({ votes: -1 });
answerSchema.index({ isAccepted: 1 });
answerSchema.index({ isDeleted: 1 });
answerSchema.index({ question: 1, isAccepted: -1, votes: -1 });

// Virtual for answer age
answerSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for acceptance status description
answerSchema.virtual('acceptanceStatus').get(function() {
  if (this.isAccepted) {
    return `Accepted on ${this.acceptedAt}`;
  }
  return 'Not accepted';
});

// Middleware to set editedAt when answer is edited
answerSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Middleware to set acceptedAt when answer is accepted
answerSchema.pre('save', function(next) {
  if (this.isModified('isAccepted') && this.isAccepted && !this.acceptedAt) {
    this.acceptedAt = new Date();
  }
  if (this.isModified('isAccepted') && !this.isAccepted) {
    this.acceptedAt = undefined;
  }
  next();
});

// Instance method to accept this answer
answerSchema.methods.acceptAnswer = async function() {
  const Question = mongoose.model('Question');
  
  // First, unaccept any other answers for this question
  await mongoose.model('Answer').updateMany(
    { question: this.question, _id: { $ne: this._id } },
    { isAccepted: false, $unset: { acceptedAt: 1 } }
  );
  
  // Accept this answer
  this.isAccepted = true;
  this.acceptedAt = new Date();
  await this.save();
  
  // Update question to mark it as having an accepted answer
  await Question.findByIdAndUpdate(this.question, {
    hasAcceptedAnswer: true
  });
  
  return this;
};

// Instance method to unaccept this answer
answerSchema.methods.unacceptAnswer = async function() {
  const Question = mongoose.model('Question');
  
  this.isAccepted = false;
  this.acceptedAt = undefined;
  await this.save();
  
  // Check if there are any other accepted answers for this question
  const hasOtherAcceptedAnswers = await mongoose.model('Answer').exists({
    question: this.question,
    isAccepted: true,
    _id: { $ne: this._id }
  });
  
  // Update question accordingly
  await Question.findByIdAndUpdate(this.question, {
    hasAcceptedAnswer: !!hasOtherAcceptedAnswers
  });
  
  return this;
};

// Instance method to soft delete answer
answerSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = "[deleted]";
  return this.save();
};

// Instance method to restore deleted answer
answerSchema.methods.restore = function(originalContent) {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.content = originalContent;
  return this.save();
};

// Instance method to increment views
answerSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to find answers for a question
answerSchema.statics.findByQuestion = function(questionId, options = {}) {
  const { page = 1, limit = 10, sort = "votes", includeDeleted = false } = options;
  const skip = (page - 1) * limit;
  
  const query = { question: questionId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  
  let sortObj = {};
  switch (sort) {
    case "votes":
      sortObj = { isAccepted: -1, votes: -1, createdAt: -1 };
      break;
    case "newest":
      sortObj = { isAccepted: -1, createdAt: -1 };
      break;
    case "oldest":
      sortObj = { isAccepted: -1, createdAt: 1 };
      break;
    default:
      sortObj = { isAccepted: -1, votes: -1, createdAt: -1 };
  }

  return this.find(query)
    .populate('author', 'name reputation rank')
    .sort(sortObj)
    .skip(skip)
    .limit(limit);
};

// Static method to find user's answers
answerSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 10, includeDeleted = false } = options;
  const skip = (page - 1) * limit;
  
  const query = { author: userId };
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  return this.find(query)
    .populate('author', 'name reputation rank')
    .populate('question', 'title type')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find accepted answers by user
answerSchema.statics.findAcceptedByUser = function(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  return this.find({ 
    author: userId, 
    isAccepted: true,
    isDeleted: false 
  })
    .populate('author', 'name reputation rank')
    .populate('question', 'title type')
    .sort({ acceptedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get top answers (highly voted)
answerSchema.statics.findTopAnswers = function(options = {}) {
  const { limit = 10, minVotes = 5 } = options;

  return this.find({ 
    votes: { $gte: minVotes },
    isDeleted: false 
  })
    .populate('author', 'name reputation rank')
    .populate('question', 'title type')
    .sort({ votes: -1, createdAt: -1 })
    .limit(limit);
};

export default mongoose.model("Answer", answerSchema);
