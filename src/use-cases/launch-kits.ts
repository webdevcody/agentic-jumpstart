import {
  createLaunchKit,
  deleteLaunchKit,
  getAllLaunchKits,
  getLaunchKitById,
  getLaunchKitBySlug,
  updateLaunchKit,
  incrementCloneCount,
  getAllTags,
  getTagsByCategory,
  createTag,
  deleteTag,
  getLaunchKitTags,
  setLaunchKitTags,
  getLaunchKitComments,
  createLaunchKitComment,
  updateLaunchKitComment,
  deleteLaunchKitComment,
  trackLaunchKitEvent,
  getLaunchKitStats,
} from "~/data-access/launch-kits";
import { PublicError } from "./errors";
import { getUser } from "~/data-access/users";
import type { UserId } from "./types";

export type CreateLaunchKitInput = {
  name: string;
  description: string;
  longDescription?: string;
  repositoryUrl: string;
  demoUrl?: string;
  imageUrl?: string;
  tagIds?: number[];
};

export type UpdateLaunchKitInput = Partial<CreateLaunchKitInput>;

export type CreateTagInput = {
  name: string;
  color?: string;
  category: "framework" | "language" | "database" | "tool" | "deployment" | "other";
};

export type CreateCommentInput = {
  content: string;
  parentId?: number;
};

// Launch Kit Management (Admin Only)
export async function createLaunchKitUseCase(
  userId: UserId,
  data: CreateLaunchKitInput
) {
  // Validate user is admin
  const user = await getUser(userId);
  if (!user?.isAdmin) {
    throw new PublicError("Only admins can create launch kits");
  }

  // Validate required fields
  if (!data.name || data.name.length < 2) {
    throw new PublicError("Launch kit name must be at least 2 characters");
  }

  if (!data.description || data.description.length < 10) {
    throw new PublicError("Launch kit description must be at least 10 characters");
  }

  if (!data.repositoryUrl || !isValidUrl(data.repositoryUrl)) {
    throw new PublicError("Valid repository URL is required");
  }

  if (data.demoUrl && !isValidUrl(data.demoUrl)) {
    throw new PublicError("Demo URL must be a valid URL");
  }

  // Create launch kit
  const launchKit = await createLaunchKit({
    name: data.name,
    description: data.description,
    longDescription: data.longDescription,
    repositoryUrl: data.repositoryUrl,
    demoUrl: data.demoUrl,
    imageUrl: data.imageUrl,
  });

  // Set tags if provided
  if (data.tagIds && data.tagIds.length > 0) {
    await setLaunchKitTags(launchKit.id, data.tagIds);
  }

  return launchKit;
}

export async function updateLaunchKitUseCase(
  userId: UserId,
  launchKitId: number,
  data: UpdateLaunchKitInput
) {
  // Validate user is admin
  const user = await getUser(userId);
  if (!user?.isAdmin) {
    throw new PublicError("Only admins can update launch kits");
  }

  // Check if launch kit exists
  const launchKit = await getLaunchKitById(launchKitId);
  if (!launchKit) {
    throw new PublicError("Launch kit not found");
  }

  // Validate fields if provided
  if (data.name !== undefined && data.name.length < 2) {
    throw new PublicError("Launch kit name must be at least 2 characters");
  }

  if (data.description !== undefined && data.description.length < 10) {
    throw new PublicError("Launch kit description must be at least 10 characters");
  }

  if (data.repositoryUrl !== undefined && !isValidUrl(data.repositoryUrl)) {
    throw new PublicError("Valid repository URL is required");
  }

  if (data.demoUrl !== undefined && data.demoUrl && !isValidUrl(data.demoUrl)) {
    throw new PublicError("Demo URL must be a valid URL");
  }

  // Update launch kit
  const updatedLaunchKit = await updateLaunchKit(launchKitId, data);

  // Update tags if provided
  if (data.tagIds !== undefined) {
    await setLaunchKitTags(launchKitId, data.tagIds);
  }

  return updatedLaunchKit;
}

export async function deleteLaunchKitUseCase(userId: UserId, launchKitId: number) {
  // Validate user is admin
  const user = await getUser(userId);
  if (!user?.isAdmin) {
    throw new PublicError("Only admins can delete launch kits");
  }

  // Check if launch kit exists
  const launchKit = await getLaunchKitById(launchKitId);
  if (!launchKit) {
    throw new PublicError("Launch kit not found");
  }

  return deleteLaunchKit(launchKitId);
}

// Public Launch Kit Access
export async function getAllLaunchKitsUseCase(filters?: {
  tags?: string[];
  search?: string;
}) {
  return getAllLaunchKits(filters);
}

export async function getLaunchKitByIdUseCase(id: number) {
  const launchKit = await getLaunchKitById(id);
  if (!launchKit) {
    throw new PublicError("Launch kit not found");
  }

  // Get tags for the launch kit
  const tags = await getLaunchKitTags(launchKit.id);

  return {
    ...launchKit,
    tags,
  };
}

export async function getLaunchKitBySlugUseCase(slug: string) {
  const launchKit = await getLaunchKitBySlug(slug);
  if (!launchKit) {
    throw new PublicError("Launch kit not found");
  }

  // Get tags for the launch kit
  const tags = await getLaunchKitTags(launchKit.id);

  return {
    ...launchKit,
    tags,
  };
}

export async function cloneLaunchKitUseCase(slug: string, userId?: UserId) {
  const launchKit = await getLaunchKitBySlug(slug);
  if (!launchKit) {
    throw new PublicError("Launch kit not found");
  }

  // Increment clone count
  await incrementCloneCount(launchKit.id);

  // Track analytics event
  await trackLaunchKitEvent({
    launchKitId: launchKit.id,
    userId: userId || null,
    eventType: "clone",
  });

  return launchKit;
}

// Tag Management (Admin Only)
export async function createTagUseCase(userId: UserId, data: CreateTagInput) {
  // Validate user is admin
  const user = await getUser(userId);
  if (!user?.isAdmin) {
    throw new PublicError("Only admins can create tags");
  }

  // Validate name
  if (!data.name || data.name.length < 2) {
    throw new PublicError("Tag name must be at least 2 characters");
  }

  // Validate category
  const validCategories = ["framework", "language", "database", "tool", "deployment", "other"];
  if (!validCategories.includes(data.category)) {
    throw new PublicError("Invalid tag category");
  }

  // Validate color if provided
  if (data.color && !isValidHexColor(data.color)) {
    throw new PublicError("Color must be a valid hex color");
  }

  return createTag({
    name: data.name,
    color: data.color || "#3B82F6",
    category: data.category,
  });
}

export async function getAllTagsUseCase() {
  return getAllTags();
}

export async function getTagsByCategoryUseCase() {
  return getTagsByCategory();
}

export async function deleteTagUseCase(userId: UserId, tagId: number) {
  // Validate user is admin
  const user = await getUser(userId);
  if (!user?.isAdmin) {
    throw new PublicError("Only admins can delete tags");
  }

  return deleteTag(tagId);
}

// Comments
export async function getLaunchKitCommentsUseCase(launchKitId: number) {
  return getLaunchKitComments(launchKitId);
}

export async function createLaunchKitCommentUseCase(
  userId: UserId,
  launchKitId: number,
  data: CreateCommentInput
) {
  // Validate launch kit exists
  const launchKit = await getLaunchKitById(launchKitId);
  if (!launchKit) {
    throw new PublicError("Launch kit not found");
  }

  // Validate content
  if (!data.content || data.content.length < 1) {
    throw new PublicError("Comment content is required");
  }

  if (data.content.length > 2000) {
    throw new PublicError("Comment content must be less than 2000 characters");
  }

  return createLaunchKitComment({
    userId,
    launchKitId,
    content: data.content,
    parentId: data.parentId,
  });
}

export async function updateLaunchKitCommentUseCase(
  userId: UserId,
  commentId: number,
  content: string
) {
  // TODO: Add ownership check
  if (!content || content.length < 1) {
    throw new PublicError("Comment content is required");
  }

  if (content.length > 2000) {
    throw new PublicError("Comment content must be less than 2000 characters");
  }

  return updateLaunchKitComment(commentId, content);
}

export async function deleteLaunchKitCommentUseCase(
  userId: UserId,
  commentId: number
) {
  // TODO: Add ownership check or admin check
  return deleteLaunchKitComment(commentId);
}

// Analytics
export async function trackLaunchKitViewUseCase(slug: string, userId?: UserId) {
  const launchKit = await getLaunchKitBySlug(slug);
  if (!launchKit) {
    throw new PublicError("Launch kit not found");
  }

  await trackLaunchKitEvent({
    launchKitId: launchKit.id,
    userId: userId || null,
    eventType: "view",
  });
}

export async function getLaunchKitStatsUseCase(userId: UserId) {
  // Validate user is admin
  const user = await getUser(userId);
  if (!user?.isAdmin) {
    throw new PublicError("Only admins can view launch kit stats");
  }

  return getLaunchKitStats();
}

// Utility functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}