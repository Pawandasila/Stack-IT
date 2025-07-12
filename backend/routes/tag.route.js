import express from "express";
import {
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTag,
  getPopularTags,
  getTagsByCategory,
  searchTags,
  getTrendingTags,
  getTagQuestions,
  updateTagUsageCounts,
  getUnusedTags,
  addTagModerator,
} from "../controllers/tagController.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { isAdmin, isAnyUser } from "../middlewares/role.middleware.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const router = express.Router();

// Create a new tag
router.post(
  "/",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(createTag)
);

// Get all tags
router.get(
  "/",
  asyncHandler(getAllTags)
);

// Get popular tags
router.get(
  "/popular",
  asyncHandler(getPopularTags)
);

// Get trending tags
router.get(
  "/trending",
  asyncHandler(getTrendingTags)
);

// Search tags
router.get(
  "/search",
  asyncHandler(searchTags)
);

// Get tags by category
router.get(
  "/category/:category",
  asyncHandler(getTagsByCategory)
);

// Get unused tags (admin only)
router.get(
  "/admin/unused",
  verifyAccessToken,
  isAdmin,
  asyncHandler(getUnusedTags)
);

// Update tag usage counts (admin only)
router.post(
  "/admin/update-usage-counts",
  verifyAccessToken,
  isAdmin,
  asyncHandler(updateTagUsageCounts)
);

// Get a single tag by ID or name
router.get(
  "/:tagId",
  asyncHandler(getTagById)
);

// Update a tag
router.put(
  "/:tagId",
  verifyAccessToken,
  isAnyUser,
  asyncHandler(updateTag)
);

// Delete a tag (admin only)
router.delete(
  "/:tagId",
  verifyAccessToken,
  isAdmin,
  asyncHandler(deleteTag)
);

// Get questions for a specific tag
router.get(
  "/:tagId/questions",
  asyncHandler(getTagQuestions)
);

// Add moderator to tag (admin only)
router.post(
  "/:tagId/moderators",
  verifyAccessToken,
  isAdmin,
  asyncHandler(addTagModerator)
);

export default router;
