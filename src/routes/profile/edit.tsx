import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Page } from "~/routes/admin/-components/page";
import { PageHeader } from "~/routes/admin/-components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AppCard } from "~/components/app-card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
import {
  getUserProfileFn,
  updateProfileFn,
  getProfileImageUploadUrlFn,
  getUserProjectsFn,
  createProjectFn,
  updateProjectFn,
  deleteProjectFn,
} from "~/fn/profiles";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Upload,
  X,
  Plus,
  ExternalLink,
  Github,
  Save,
  Trash2,
  User,
  Settings,
  FolderOpen,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { authenticatedMiddleware } from "~/lib/auth";
import { assertAuthenticatedFn } from "~/fn/auth";

const profileFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(100),
  realName: z.string().max(100).optional().or(z.literal("")),
  useDisplayName: z.boolean().optional(),
  bio: z.string().max(500).optional(),
  twitterHandle: z.string().max(50).optional(),
  githubHandle: z.string().max(50).optional(),
  websiteUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  isPublicProfile: z.boolean().optional(),
});

const projectFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  projectUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  repositoryUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  technologies: z.string().optional(),
  isVisible: z.boolean().optional(),
});

export const Route = createFileRoute("/profile/edit")({
  beforeLoad: () => assertAuthenticatedFn(),
  component: EditProfilePage,
});

function EditProfilePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile", "user"],
    queryFn: () => getUserProfileFn(),
  });

  const { data: projects } = useSuspenseQuery({
    queryKey: ["projects", "user"],
    queryFn: () => getUserProjectsFn(),
  });

  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: profile?.displayName || "",
      realName: profile?.realName || "",
      useDisplayName: profile?.useDisplayName ?? true,
      bio: profile?.bio || "",
      twitterHandle: profile?.twitterHandle || "",
      githubHandle: profile?.githubHandle || "",
      websiteUrl: profile?.websiteUrl || "",
      isPublicProfile: profile?.isPublicProfile || false,
    },
  });

  const projectForm = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      projectUrl: "",
      repositoryUrl: "",
      technologies: "",
      isVisible: true,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfileFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated", {
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to update profile. Please try again.",
      });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: createProjectFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsAddingProject(false);
      projectForm.reset();
      toast.success("Project added", {
        description: "Your project has been added successfully.",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to add project. Please try again.",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: updateProjectFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingProject(null);
      toast.success("Project updated", {
        description: "Your project has been updated successfully.",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to update project. Please try again.",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProjectFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted", {
        description: "Your project has been deleted successfully.",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to delete project. Please try again.",
      });
    },
  });

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const { presignedUrl, imageKey } =
        await getProfileImageUploadUrlFn({
          data: {
            fileName: file.name,
            contentType: file.type,
          },
        });

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      // Only store the imageId (R2 key), not the presigned URL
      await updateProfileMutation.mutateAsync({
        data: {
          imageId: imageKey,
        },
      });

      // Clear preview after successful upload
      setPreviewImage(null);
    } catch (error) {
      toast.error("Upload failed", {
        description: "Failed to upload image. Please try again.",
      });
      // Clear preview on error
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate({ data });
  };

  const onProjectSubmit = (data: z.infer<typeof projectFormSchema>) => {
    const projectData = {
      ...data,
      technologies: data.technologies
        ? JSON.stringify(data.technologies.split(",").map((t) => t.trim()))
        : undefined,
    };

    if (editingProject) {
      updateProjectMutation.mutate({
        data: { id: editingProject, ...projectData },
      });
    } else {
      createProjectMutation.mutate({ data: projectData });
    }
  };

  return (
    <Page>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/profile/$userId"
                    params={{ userId: profile?.id?.toString() || "" }}
                  >
                    Profile
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button variant="outline" size="sm" asChild>
            <Link
              to="/profile/$userId"
              params={{ userId: profile?.id?.toString() || "" }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>
        </div>

        <PageHeader
          title="Edit Profile"
          highlightedWord="Profile"
          description="Update your profile information and showcase your projects"
        />

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Information */}
          <div className="lg:col-span-1">
            <AppCard
              icon={User}
              title="Profile Information"
              description="Update your personal details"
            >
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-6 p-6"
              >
                {/* Profile Image */}
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage
                        src={previewImage || profile?.image || undefined}
                        alt="Profile"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-theme-500 text-white text-2xl font-semibold">
                        {profile?.displayName
                          ? profile.displayName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploading..." : "Upload Image"}
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG or GIF. Max 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      {...profileForm.register("displayName")}
                      placeholder="Your display name"
                    />
                    {profileForm.formState.errors.displayName && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>

                  {/* Use Display Name Toggle */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="useDisplayName" className="text-base">
                        Use Display Name
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Show your alias instead of real name publicly
                      </p>
                    </div>
                    <Controller
                      name="useDisplayName"
                      control={profileForm.control}
                      render={({ field }) => (
                        <Switch
                          id="useDisplayName"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  {/* Real Name */}
                  <div className="space-y-2">
                    <Label htmlFor="realName">Real Name</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="realName"
                        {...profileForm.register("realName")}
                        placeholder="Your real name (optional)"
                      />
                      {profileForm.watch("realName") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            profileForm.setValue("realName", "");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for affiliate program. Clear for privacy.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...profileForm.register("bio")}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.bio.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website</Label>
                    <Input
                      id="websiteUrl"
                      {...profileForm.register("websiteUrl")}
                      placeholder="https://yourwebsite.com"
                    />
                    {profileForm.formState.errors.websiteUrl && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.websiteUrl.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitterHandle">Twitter Handle</Label>
                    <Input
                      id="twitterHandle"
                      {...profileForm.register("twitterHandle")}
                      placeholder="username (without @)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="githubHandle">GitHub Handle</Label>
                    <Input
                      id="githubHandle"
                      {...profileForm.register("githubHandle")}
                      placeholder="username"
                    />
                  </div>

                  {/* Public Profile Toggle */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="isPublicProfile" className="text-base">
                        Public Profile
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Show your profile on the community members page
                      </p>
                    </div>
                    <Controller
                      name="isPublicProfile"
                      control={profileForm.control}
                      render={({ field }) => (
                        <Switch
                          id="isPublicProfile"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending
                      ? "Saving..."
                      : "Save Profile"}
                  </Button>
                </div>
              </form>
            </AppCard>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger
                  value="projects"
                  className="flex items-center gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  Projects
                </TabsTrigger>
              </TabsList>

              {/* Projects Tab */}
              <TabsContent value="projects">
                <AppCard
                  icon={FolderOpen}
                  title="Projects & Showcases"
                  description="Manage your project portfolio"
                  actions={
                    <Button
                      onClick={() => setIsAddingProject(true)}
                      disabled={isAddingProject}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  }
                >
                  <div className="p-6">
                    {/* Add Project Form */}
                    {isAddingProject && (
                      <Card className="mb-6">
                        <CardContent className="p-4">
                          <form
                            onSubmit={projectForm.handleSubmit(onProjectSubmit)}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="title">Project Title *</Label>
                                <Input
                                  id="title"
                                  {...projectForm.register("title")}
                                  placeholder="My Awesome Project"
                                />
                                {projectForm.formState.errors.title && (
                                  <p className="text-sm text-destructive">
                                    {projectForm.formState.errors.title.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="technologies">
                                  Technologies
                                </Label>
                                <Input
                                  id="technologies"
                                  {...projectForm.register("technologies")}
                                  placeholder="React, TypeScript, Node.js"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Comma-separated list
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="projectUrl">
                                  Live Demo URL
                                </Label>
                                <Input
                                  id="projectUrl"
                                  {...projectForm.register("projectUrl")}
                                  placeholder="https://myproject.com"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="repositoryUrl">
                                  Repository URL
                                </Label>
                                <Input
                                  id="repositoryUrl"
                                  {...projectForm.register("repositoryUrl")}
                                  placeholder="https://github.com/username/repo"
                                />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="imageUrl">Image URL</Label>
                                <Input
                                  id="imageUrl"
                                  {...projectForm.register("imageUrl")}
                                  placeholder="https://example.com/image.jpg"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Description *</Label>
                              <Textarea
                                id="description"
                                {...projectForm.register("description")}
                                placeholder="Describe your project..."
                                rows={3}
                              />
                              {projectForm.formState.errors.description && (
                                <p className="text-sm text-destructive">
                                  {
                                    projectForm.formState.errors.description
                                      .message
                                  }
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="submit"
                                disabled={createProjectMutation.isPending}
                              >
                                {createProjectMutation.isPending
                                  ? "Adding..."
                                  : "Add Project"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsAddingProject(false);
                                  projectForm.reset();
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    )}

                    {/* Projects List */}
                    {projects && projects.length > 0 ? (
                      <div className="space-y-4">
                        {projects.map((project) => (
                          <Card key={project.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">
                                    {project.title}
                                  </h3>
                                  <p className="text-muted-foreground text-sm mb-2">
                                    {project.description}
                                  </p>
                                  {project.technologies && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {JSON.parse(project.technologies).map(
                                        (tech: string, index: number) => (
                                          <Badge
                                            key={index}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {tech}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    {project.projectUrl && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        asChild
                                      >
                                        <a
                                          href={project.projectUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="h-3 w-3 mr-1" />
                                          Demo
                                        </a>
                                      </Button>
                                    )}
                                    {project.repositoryUrl && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        asChild
                                      >
                                        <a
                                          href={project.repositoryUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <Github className="h-3 w-3 mr-1" />
                                          Code
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setEditingProject(project.id)
                                    }
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      deleteProjectMutation.mutate({
                                        data: { id: project.id },
                                      })
                                    }
                                    disabled={deleteProjectMutation.isPending}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-900 dark:to-theme-800 shadow-elevation-2 inline-block">
                            <FolderOpen className="h-8 w-8 text-theme-600 dark:text-theme-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-2">
                              No Projects Yet
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              Start building your portfolio by adding your first
                              project.
                            </p>
                            <Button
                              onClick={() => setIsAddingProject(true)}
                              disabled={isAddingProject}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Your First Project
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </AppCard>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Page>
  );
}
