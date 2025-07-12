import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"]
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"]
    },
    type: {
      type: String,
      enum: [
        "answer_posted",        // Someone answered your question
        "comment_posted",       // Someone commented on your answer/question
        "answer_accepted",      // Your answer was accepted
        "mention",              // Someone mentioned you with @username
        "question_voted",       // Someone voted on your question
        "answer_voted",         // Someone voted on your answer
        "comment_voted",        // Someone voted on your comment
        "question_closed",      // Your question was closed
        "badge_earned"          // You earned a new badge/rank
      ],
      required: [true, "Notification type is required"]
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      maxlength: [500, "Message cannot exceed 500 characters"]
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    // Reference to the related content
    relatedQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question"
    },
    relatedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer"
    },
    relatedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    },
    // Additional data for the notification
    metadata: {
      voteType: String,        // upvote/downvote
      mentionContext: String,  // text around the mention
      badgeType: String,       // type of badge earned
      oldRank: String,         // previous rank
      newRank: String          // new rank
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for notification URL (frontend routing)
notificationSchema.virtual('url').get(function() {
  switch (this.type) {
    case 'answer_posted':
    case 'question_voted':
    case 'question_closed':
      return `/questions/${this.relatedQuestion}`;
    case 'comment_posted':
      if (this.relatedAnswer) {
        return `/questions/${this.relatedQuestion}#answer-${this.relatedAnswer}`;
      }
      return `/questions/${this.relatedQuestion}`;
    case 'answer_accepted':
    case 'answer_voted':
      return `/questions/${this.relatedQuestion}#answer-${this.relatedAnswer}`;
    case 'comment_voted':
      return `/questions/${this.relatedQuestion}#comment-${this.relatedComment}`;
    case 'mention':
      if (this.relatedAnswer) {
        return `/questions/${this.relatedQuestion}#answer-${this.relatedAnswer}`;
      } else if (this.relatedComment) {
        return `/questions/${this.relatedQuestion}#comment-${this.relatedComment}`;
      }
      return `/questions/${this.relatedQuestion}`;
    default:
      return '/notifications';
  }
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const {
    recipient,
    sender,
    type,
    title,
    message,
    relatedQuestion,
    relatedAnswer,
    relatedComment,
    metadata = {}
  } = data;

  // Don't create notification if sender and recipient are the same
  if (sender.toString() === recipient.toString()) {
    return null;
  }

  // Check if similar notification already exists (prevent spam)
  const existingNotification = await this.findOne({
    recipient,
    sender,
    type,
    relatedQuestion,
    relatedAnswer,
    relatedComment,
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
  });

  if (existingNotification) {
    return existingNotification;
  }

  return this.create({
    recipient,
    sender,
    type,
    title,
    message,
    relatedQuestion,
    relatedAnswer,
    relatedComment,
    metadata
  });
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const skip = (page - 1) * limit;

  const query = { recipient: userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  return this.find(query)
    .populate('sender', 'name reputation rank')
    .populate('relatedQuestion', 'title type')
    .populate('relatedAnswer', 'content')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to delete old notifications (cleanup)
notificationSchema.statics.deleteOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

export default mongoose.model("Notification", notificationSchema);
