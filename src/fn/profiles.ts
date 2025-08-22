import { createServerFn } from "@tanstack/react-start";
import { authenticatedMiddleware, unauthenticatedMiddleware } from "~/lib/auth";
import { z } from "zod";
import { 
  getProfile, 
  getProfileWithProjects, 
  getPublicProfile, 
  updateProfile,
  createProject,
  updateProject,
  deleteProject,
  getUserProjects 
} from "~/data-access/profiles";
import { getStorage } from "~/utils/storage";

const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  twitterHandle: z.string().max(50).optional(),
  githubHandle: z.string().max(50).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  imageId: z.string().optional(),
});

const projectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  imageUrl: z.string().url().optional().or(z.literal("")),
  projectUrl: z.string().url().optional().or(z.literal("")),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  technologies: z.string().optional(), // JSON string
  order: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
});

// Public profile functions - no auth required
export const getPublicProfileFn = createServerFn({
  method: "GET",
})
  .middleware([unauthenticatedMiddleware])
  .validator(z.object({ userId: z.number() }))
  .handler(async ({ data }) => {
    return await getPublicProfile(data.userId);
  });

// Authenticated profile functions
export const getUserProfileFn = createServerFn({
  method: "GET",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await getProfileWithProjects(context.userId);
  });

export const updateProfileFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator(profileUpdateSchema)
  .handler(async ({ data, context }) => {
    await updateProfile(context.userId, {
      ...data,
      updatedAt: new Date(),
    });
    return { success: true };
  });

// Profile image upload
export const getProfileImageUploadUrlFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator(z.object({
    fileName: z.string(),
    contentType: z.string(),
  }))
  .handler(async ({ data, context }) => {
    const { storage } = getStorage();
    
    // Create organized prefix for profile images
    const imageKey = `profiles/${context.userId}/${Date.now()}-${data.fileName}`;
    
    const presignedUrl = await storage.getPresignedUploadUrl(imageKey, data.contentType);
    
    return { 
      presignedUrl, 
      imageKey,
      imageUrl: await storage.getPresignedUrl(imageKey)
    };
  });

// Project management functions
export const getUserProjectsFn = createServerFn({
  method: "GET",
})
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await getUserProjects(context.userId);
  });

export const createProjectFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator(projectSchema)
  .handler(async ({ data, context }) => {
    const project = await createProject(context.userId, data);
    return project;
  });

export const updateProjectFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator(z.object({
    id: z.number(),
    ...projectSchema.shape,
  }))
  .handler(async ({ data, context }) => {
    const { id, ...projectData } = data;
    const project = await updateProject(id, context.userId, projectData);
    return project;
  });

export const deleteProjectFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await deleteProject(data.id, context.userId);
    return { success: true };
  });