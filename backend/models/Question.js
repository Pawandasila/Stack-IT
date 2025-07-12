import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      minlength: [5, "Title must be at least 5 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [10, "Content must be at least 10 characters"],
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
    type: {
      type: String,
      default: "question",
      enum: ["question", "discussion", "poll"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    votes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
    answersCount: {
      type: Number,
      default: 0,
      min: [0, "Answer count cannot be negative"],
    },
    hasAcceptedAnswer: {
      type: Boolean,
      default: false,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    closeReason: {
      type: String,
      enum: ["duplicate", "off-topic", "unclear", "solved", "spam", "other"],
      required: function () {
        return this.isClosed;
      },
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
        validate: {
          validator: function (tags) {
            return tags.length <= 5;
          },
          message: "Cannot have more than 5 tags",
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

questionSchema.index({ author: 1, createdAt: -1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ votes: -1 });
questionSchema.index({ views: -1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ title: "text", content: "text" });

questionSchema.virtual("age").get(function () {
  return Date.now() - this.createdAt.getTime();
});

questionSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

questionSchema.statics.findPopular = function (limit = 10) {
  return this.find({ isClosed: false })
    .sort({ votes: -1, views: -1 })
    .limit(limit)
    .populate("author", "name reputation rank")
    .populate("tags", "name");
};

questionSchema.statics.findRecent = function (limit = 10) {
  return this.find({ isClosed: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "name reputation rank")
    .populate("tags", "name");
};

export default mongoose.model("Question", questionSchema);
