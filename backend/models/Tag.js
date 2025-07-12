import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [50, "Tag name cannot exceed 50 characters"],
      minlength: [2, "Tag name must be at least 2 characters"],
      match: [/^[a-z0-9-]+$/, "Tag name can only contain lowercase letters, numbers, and hyphens"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Tag description cannot exceed 500 characters"]
    },
    color: {
      type: String,
      default: '#3B82F6',
      validate: {
        validator: function(color) {
          return /^#[0-9A-Fa-f]{6}$/.test(color);
        },
        message: "Color must be a valid hex color code (e.g., #3B82F6)"
      }
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, "Usage count cannot be negative"]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    category: {
      type: String,
      enum: ["technology", "programming", "science", "business", "general", "other"],
      default: "general"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    moderators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
tagSchema.index({ name: 1 });
tagSchema.index({ usageCount: -1 });
tagSchema.index({ category: 1 });
tagSchema.index({ isActive: 1 });
tagSchema.index({ createdAt: -1 });
tagSchema.index({ name: "text", description: "text" });

// Virtual for tag popularity level
tagSchema.virtual('popularityLevel').get(function() {
  if (this.usageCount >= 1000) return 'very-popular';
  if (this.usageCount >= 100) return 'popular';
  if (this.usageCount >= 10) return 'moderate';
  if (this.usageCount >= 1) return 'low';
  return 'unused';
});

// Virtual for display name (capitalized)
tagSchema.virtual('displayName').get(function() {
  return this.name.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
});

// Pre-save middleware to ensure name is lowercase and formatted
tagSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

// Instance method to increment usage count
tagSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Instance method to decrement usage count
tagSchema.methods.decrementUsage = function() {
  if (this.usageCount > 0) {
    this.usageCount -= 1;
  }
  return this.save();
};

// Static method to find popular tags
tagSchema.statics.findPopular = function(limit = 20) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('name description color usageCount category');
};

// Static method to find tags by category
tagSchema.statics.findByCategory = function(category, limit = 50) {
  return this.find({ category, isActive: true })
    .sort({ usageCount: -1, name: 1 })
    .limit(limit)
    .select('name description color usageCount');
};

// Static method to search tags
tagSchema.statics.searchTags = function(searchTerm, limit = 10) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  })
    .sort({ usageCount: -1, name: 1 })
    .limit(limit)
    .select('name description color usageCount category');
};

// Static method to find or create tags
tagSchema.statics.findOrCreateTags = async function(tagNames, createdBy = null) {
  const tags = [];
  
  for (const tagName of tagNames) {
    const formattedName = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    let tag = await this.findOne({ name: formattedName });
    
    if (!tag) {
      tag = await this.create({
        name: formattedName,
        createdBy
      });
    }
    
    tags.push(tag);
  }
  
  return tags;
};

// Static method to get unused tags (for cleanup)
tagSchema.statics.findUnused = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.find({
    usageCount: 0,
    createdAt: { $lt: cutoffDate }
  }).sort({ createdAt: 1 });
};

// Static method to update usage counts (for maintenance)
tagSchema.statics.updateUsageCounts = async function() {
  const Question = mongoose.model('Question');
  
  // Get all active tags
  const tags = await this.find({ isActive: true });
  
  for (const tag of tags) {
    // Count questions that use this tag
    const count = await Question.countDocuments({ 
      tags: tag._id,
      isClosed: false 
    });
    
    // Update usage count
    tag.usageCount = count;
    await tag.save();
  }
  
  return { updated: tags.length };
};

// Static method to get trending tags (high recent usage)
tagSchema.statics.findTrending = function(days = 7, limit = 10) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.aggregate([
    {
      $lookup: {
        from: 'questions',
        localField: '_id',
        foreignField: 'tags',
        as: 'recentQuestions',
        pipeline: [
          {
            $match: {
              createdAt: { $gte: cutoffDate },
              isClosed: false
            }
          }
        ]
      }
    },
    {
      $addFields: {
        recentUsage: { $size: '$recentQuestions' }
      }
    },
    {
      $match: {
        isActive: true,
        recentUsage: { $gt: 0 }
      }
    },
    {
      $sort: { recentUsage: -1, usageCount: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        name: 1,
        description: 1,
        color: 1,
        usageCount: 1,
        category: 1,
        recentUsage: 1
      }
    }
  ]);
};

export default mongoose.model("Tag", tagSchema);
