import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"]
    },
    targetType: {
      type: String,
      enum: ["Question", "Answer", "Comment"],
      required: [true, "Target type is required"]
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target ID is required"]
    },
    voteType: {
      type: String,
      enum: ["upvote", "downvote"],
      required: [true, "Vote type is required"]
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one vote per user per target
voteSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// Additional indexes for performance
voteSchema.index({ targetType: 1, targetId: 1 });
voteSchema.index({ user: 1, createdAt: -1 });

// Static method to cast a vote
voteSchema.statics.castVote = async function(userId, targetType, targetId, voteType) {
  try {
    // Check if user already voted
    const existingVote = await this.findOne({
      user: userId,
      targetType,
      targetId
    });

    let voteChange = 0;
    let oldVoteType = null;

    if (existingVote) {
      oldVoteType = existingVote.voteType;
      
      if (existingVote.voteType === voteType) {
        // User is removing their vote
        await this.deleteOne({ _id: existingVote._id });
        voteChange = voteType === "upvote" ? -1 : 1;
        return { voteChange, action: "removed", oldVoteType };
      } else {
        // User is changing their vote
        existingVote.voteType = voteType;
        await existingVote.save();
        voteChange = voteType === "upvote" ? 2 : -2; // +1 for new vote, -1 for removing old vote
        return { voteChange, action: "changed", oldVoteType };
      }
    } else {
      // New vote
      await this.create({
        user: userId,
        targetType,
        targetId,
        voteType
      });
      voteChange = voteType === "upvote" ? 1 : -1;
      return { voteChange, action: "created", oldVoteType: null };
    }
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - handle race condition
      return this.castVote(userId, targetType, targetId, voteType);
    }
    throw error;
  }
};

// Static method to get user's vote on a target
voteSchema.statics.getUserVote = function(userId, targetType, targetId) {
  return this.findOne({
    user: userId,
    targetType,
    targetId
  }).select('voteType');
};

// Static method to get votes for multiple targets
voteSchema.statics.getUserVotesForTargets = function(userId, targets) {
  const conditions = targets.map(target => ({
    user: userId,
    targetType: target.type,
    targetId: target.id
  }));

  return this.find({ $or: conditions })
    .select('targetType targetId voteType');
};

// Static method to get vote statistics for a target
voteSchema.statics.getVoteStats = function(targetType, targetId) {
  return this.aggregate([
    {
      $match: { targetType, targetId }
    },
    {
      $group: {
        _id: '$voteType',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get user's voting history
voteSchema.statics.getUserVotingHistory = function(userId, options = {}) {
  const { page = 1, limit = 20, targetType } = options;
  const skip = (page - 1) * limit;

  const query = { user: userId };
  if (targetType) {
    query.targetType = targetType;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export default mongoose.model("Vote", voteSchema);
