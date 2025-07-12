import Tag from "../models/Tag.js";
import Question from "../models/Question.js";
import { HTTPSTATUS } from "../config/https.config.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Create a new tag
export const createTag = asyncHandler(async (req, res) => {
  try {
    const { name, description, color, category } = req.body;
    const createdBy = req.user._id;

    if (!name) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Tag name is required",
      });
    }

    // Check if tag already exists
    const formattedName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existingTag = await Tag.findOne({ name: formattedName });

    if (existingTag) {
      return res.status(HTTPSTATUS.CONFLICT).json({
        success: false,
        message: "Tag with this name already exists",
        tag: existingTag
      });
    }

    const tag = await Tag.create({
      name: formattedName,
      description,
      color: color || '#3B82F6',
      category: category || 'general',
      createdBy
    });

    res.status(HTTPSTATUS.CREATED).json({
      success: true,
      message: "Tag created successfully",
      tag,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while creating tag",
      error: error.message,
    });
  }
});

// Get all tags with pagination and filters
export const getAllTags = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "popular",
      category,
      search,
      isActive = true
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};
    let sortObj = {};

    // Apply filters
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (category) query.category = category;

    // Apply search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply sorting
    switch (sort) {
      case "popular":
        sortObj = { usageCount: -1, name: 1 };
        break;
      case "alphabetical":
        sortObj = { name: 1 };
        break;
      case "newest":
        sortObj = { createdAt: -1 };
        break;
      case "oldest":
        sortObj = { createdAt: 1 };
        break;
      default:
        sortObj = { usageCount: -1, name: 1 };
    }

    const tags = await Tag.find(query)
      .populate('createdBy', 'name reputation rank')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tag.countDocuments(query);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      tags,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTags: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching tags",
      error: error.message,
    });
  }
});

// Get a single tag by ID or name
export const getTagById = asyncHandler(async (req, res) => {
  try {
    const { tagId } = req.params;

    // Try to find by ID first, then by name
    let tag = await Tag.findById(tagId).populate('createdBy', 'name reputation rank');
    
    if (!tag) {
      tag = await Tag.findOne({ name: tagId }).populate('createdBy', 'name reputation rank');
    }

    if (!tag) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Tag not found",
      });
    }

    res.status(HTTPSTATUS.OK).json({
      success: true,
      tag,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching tag",
      error: error.message,
    });
  }
});

// Update a tag
export const updateTag = asyncHandler(async (req, res) => {
  try {
    const { tagId } = req.params;
    const { name, description, color, category, isActive } = req.body;
    const userId = req.user._id;

    const tag = await Tag.findById(tagId);

    if (!tag) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Tag not found",
      });
    }

    // Check permissions (tag creator, moderator, or admin)
    const isAuthorized = 
      tag.createdBy?.toString() === userId.toString() ||
      tag.moderators.includes(userId) ||
      req.user.role === "admin";

    if (!isAuthorized) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You don't have permission to edit this tag",
      });
    }

    // Check if new name conflicts with existing tag
    if (name && name !== tag.name) {
      const formattedName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const existingTag = await Tag.findOne({ name: formattedName, _id: { $ne: tagId } });
      
      if (existingTag) {
        return res.status(HTTPSTATUS.CONFLICT).json({
          success: false,
          message: "Tag with this name already exists",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;
    if (category) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTag = await Tag.findByIdAndUpdate(
      tagId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name reputation rank');

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Tag updated successfully",
      tag: updatedTag,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating tag",
      error: error.message,
    });
  }
});

// Delete a tag (admin only)
export const deleteTag = asyncHandler(async (req, res) => {
  try {
    const { tagId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only admins can delete tags",
      });
    }

    const tag = await Tag.findById(tagId);

    if (!tag) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Tag not found",
      });
    }

    // Check if tag is being used
    const questionsUsingTag = await Question.countDocuments({ tags: tagId });

    if (questionsUsingTag > 0) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot delete tag. It is currently used by ${questionsUsingTag} question(s)`,
      });
    }

    await Tag.findByIdAndDelete(tagId);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while deleting tag",
      error: error.message,
    });
  }
});

// Get popular tags
export const getPopularTags = asyncHandler(async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const tags = await Tag.findPopular(parseInt(limit));

    res.status(HTTPSTATUS.OK).json({
      success: true,
      tags,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching popular tags",
      error: error.message,
    });
  }
});

// Get tags by category
export const getTagsByCategory = asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;

    const tags = await Tag.findByCategory(category, parseInt(limit));

    res.status(HTTPSTATUS.OK).json({
      success: true,
      category,
      tags,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching tags by category",
      error: error.message,
    });
  }
});

// Search tags
export const searchTags = asyncHandler(async (req, res) => {
  try {
    const { q: searchTerm, limit = 10 } = req.query;

    if (!searchTerm) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Search term is required",
      });
    }

    const tags = await Tag.searchTags(searchTerm, parseInt(limit));

    res.status(HTTPSTATUS.OK).json({
      success: true,
      searchTerm,
      tags,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while searching tags",
      error: error.message,
    });
  }
});

// Get trending tags
export const getTrendingTags = asyncHandler(async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const tags = await Tag.findTrending(parseInt(days), parseInt(limit));

    res.status(HTTPSTATUS.OK).json({
      success: true,
      tags,
      period: `${days} days`,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching trending tags",
      error: error.message,
    });
  }
});

// Get questions for a specific tag
export const getTagQuestions = asyncHandler(async (req, res) => {
  try {
    const { tagId } = req.params;
    const { page = 1, limit = 10, sort = "recent" } = req.query;
    const skip = (page - 1) * limit;

    // Find tag by ID or name
    let tag = await Tag.findById(tagId);
    if (!tag) {
      tag = await Tag.findOne({ name: tagId });
    }

    if (!tag) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Tag not found",
      });
    }

    let sortObj = {};
    switch (sort) {
      case "popular":
        sortObj = { votes: -1, views: -1 };
        break;
      case "recent":
        sortObj = { createdAt: -1 };
        break;
      case "unanswered":
        sortObj = { answersCount: 1, createdAt: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const query = { 
      tags: tag._id,
      isClosed: false
    };

    if (sort === "unanswered") {
      query.answersCount = 0;
    }

    const questions = await Question.find(query)
      .populate('author', 'name reputation rank')
      .populate('tags', 'name color')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(query);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      tag,
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
      message: "Server error while fetching tag questions",
      error: error.message,
    });
  }
});

// Update tag usage counts (admin maintenance)
export const updateTagUsageCounts = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only admins can update tag usage counts",
      });
    }

    const result = await Tag.updateUsageCounts();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Tag usage counts updated successfully",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while updating tag usage counts",
      error: error.message,
    });
  }
});

// Get unused tags (admin cleanup)
export const getUnusedTags = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only admins can view unused tags",
      });
    }

    const { days = 30 } = req.query;
    const unusedTags = await Tag.findUnused(parseInt(days));

    res.status(HTTPSTATUS.OK).json({
      success: true,
      unusedTags,
      count: unusedTags.length,
      criteria: `Unused for ${days} days`,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching unused tags",
      error: error.message,
    });
  }
});

// Add moderator to tag (admin only)
export const addTagModerator = asyncHandler(async (req, res) => {
  try {
    const { tagId } = req.params;
    const { userId } = req.body;

    if (req.user.role !== "admin") {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Only admins can add tag moderators",
      });
    }

    const tag = await Tag.findById(tagId);
    if (!tag) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Tag not found",
      });
    }

    if (tag.moderators.includes(userId)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "User is already a moderator for this tag",
      });
    }

    tag.moderators.push(userId);
    await tag.save();

    const updatedTag = await Tag.findById(tagId)
      .populate('moderators', 'name email reputation rank')
      .populate('createdBy', 'name reputation rank');

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Moderator added successfully",
      tag: updatedTag,
    });
  } catch (error) {
    console.error(error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while adding tag moderator",
      error: error.message,
    });
  }
});
