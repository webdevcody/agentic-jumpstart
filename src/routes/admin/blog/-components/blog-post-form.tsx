import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createBlogPostFn, updateBlogPostFn } from "~/fn/blog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { AppCard } from "~/components/app-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import {
  X,
  Save,
  Send,
  FileText,
  Settings,
  Image,
  Tags,
  Upload,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { MarkdownRenderer } from "~/components/markdown-renderer";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import {
  uploadImageWithPresignedUrl,
  type UploadProgress,
} from "~/utils/storage/helpers";
import { generateRandomUUID } from "~/utils/uuid";

type BlogPostFormData = {
  title: string;
  content: string;
  excerpt: string;
  isPublished: boolean;
  featuredImage: string;
  tags: string;
  image?: File;
};

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  isPublished: boolean;
  featuredImage?: string;
  tags?: string;
  createdAt: Date;
  updatedAt: Date;
};

interface BlogPostFormProps {
  blogPost?: BlogPost;
}

export function BlogPostForm({ blogPost }: BlogPostFormProps) {
  const [activeTab, setActiveTab] = useState("write");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    blogPost?.tags ? JSON.parse(blogPost.tags) : []
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BlogPostFormData>({
    defaultValues: {
      title: blogPost?.title || "",
      content: blogPost?.content || "",
      excerpt: blogPost?.excerpt || "",
      isPublished: blogPost?.isPublished || false,
      featuredImage: blogPost?.featuredImage || "",
      tags: blogPost?.tags || "",
    },
  });

  // Reset form when blogPost changes
  useEffect(() => {
    if (blogPost) {
      reset({
        title: blogPost.title,
        content: blogPost.content,
        excerpt: blogPost.excerpt || "",
        isPublished: blogPost.isPublished,
        featuredImage: blogPost.featuredImage || "",
        tags: blogPost.tags || "",
      });
      setTags(blogPost.tags ? JSON.parse(blogPost.tags) : []);
    }
  }, [blogPost, reset]);

  const content = watch("content");
  const title = watch("title");
  const isPublished = watch("isPublished");

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedImage(acceptedFiles[0]);
        setValue("image", acceptedFiles[0]);
      }
    },
  });

  const removeImage = () => {
    setSelectedImage(null);
    setValue("image", undefined);
  };

  const createMutation = useMutation({
    mutationFn: createBlogPostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog-posts"] });
      toast.success("Blog post created successfully!");
      navigate({ to: "/admin/blog" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBlogPostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog-posts"] });
      toast.success("Blog post updated successfully!");
      navigate({ to: "/admin/blog" });
    },
  });

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setValue("tags", JSON.stringify(newTags));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    setValue("tags", JSON.stringify(newTags));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data: BlogPostFormData) => {
    try {
      setIsUploading(true);
      let imageKey = data.featuredImage;

      // Upload image if one is selected
      if (data.image) {
        const extension = data.image.name.split(".").pop() || "jpg";
        imageKey = `blog-images/${generateRandomUUID()}.${extension}`;

        await uploadImageWithPresignedUrl(imageKey, data.image, (progress) =>
          setUploadProgress(progress)
        );
      }

      const formData = {
        ...data,
        tags: tags,
        excerpt: data.excerpt || undefined,
        featuredImage: imageKey || undefined,
      };

      if (blogPost) {
        await updateMutation.mutateAsync({
          data: { id: blogPost.id, updates: formData },
        });
      } else {
        await createMutation.mutateAsync({ data: formData });
      }
    } catch (error) {
      console.error("Failed to submit blog post:", error);
      toast.error("Failed to save blog post. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6 h-full">
          {/* Content */}
          <AppCard
            icon={FileText}
            iconColor="blue"
            title="Content"
            className="h-full flex flex-col"
          >
            <div className="flex flex-col flex-1 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register("title", {
                    required: "Title is required",
                    minLength: {
                      value: 5,
                      message: "Title must be at least 5 characters",
                    },
                  })}
                  placeholder="Enter blog post title..."
                  className={cn(errors.title && "border-destructive")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col flex-1"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="write" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Write
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="write" className="mt-4 flex-1">
                  <Textarea
                    {...register("content", {
                      required: "Content is required",
                      minLength: {
                        value: 50,
                        message: "Content must be at least 50 characters",
                      },
                    })}
                    placeholder="Write your blog post content in Markdown..."
                    className={cn(
                      "h-full min-h-[500px] font-mono resize-none",
                      errors.content && "border-destructive"
                    )}
                  />
                  {errors.content && (
                    <p className="text-sm text-destructive mt-2">
                      {errors.content.message}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="mt-4 flex-1">
                  <div className="h-full min-h-[500px] p-4 border rounded-md bg-background overflow-auto">
                    {content ? (
                      <MarkdownRenderer content={content} />
                    ) : (
                      <p className="text-muted-foreground">
                        No content to preview. Write some content in the Write
                        tab.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </AppCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {/* Publish settings */}
          <AppCard icon={Settings} iconColor="green" title="Publish">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublished">Published</Label>
                <Switch
                  id="isPublished"
                  {...register("isPublished")}
                  checked={isPublished}
                  onCheckedChange={(checked) =>
                    setValue("isPublished", checked)
                  }
                />
              </div>
            </div>
          </AppCard>

          {/* Excerpt */}
          <AppCard icon={FileText} iconColor="orange" title="Excerpt">
            <Textarea
              {...register("excerpt")}
              placeholder="Brief description of the post..."
              className="min-h-[100px]"
            />
          </AppCard>

          {/* Featured Image */}
          <AppCard icon={Image} iconColor="purple" title="Featured Image">
            <div className="space-y-4">
              {/* Image URL input (fallback) */}
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Image URL (optional)</Label>
                <Input
                  id="featuredImage"
                  {...register("featuredImage")}
                  placeholder="Or enter image URL manually..."
                />
              </div>

              {/* Dropzone */}
              <div className="space-y-2">
                <Label>Upload Image</Label>
                {!selectedImage && (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isDragActive
                        ? "Drop the image here..."
                        : "Drag & drop an image here, or click to select"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports: JPEG, PNG, WebP, GIF
                    </p>
                  </div>
                )}

                {/* Selected image preview */}
                {selectedImage && (
                  <div className="space-y-2">
                    <div className="relative bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Image className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {selectedImage.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeImage}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Upload progress */}
                      {uploadProgress && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Uploading...</span>
                            <span>{uploadProgress.percentage}%</span>
                          </div>
                          <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${uploadProgress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AppCard>

          {/* Tags */}
          <AppCard icon={Tags} iconColor="yellow" title="Tags">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AppCard>
        </div>
      </div>

      {/* Action button at the bottom */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="min-w-[120px]"
        >
          {isUploading ? (
            "Uploading image..."
          ) : isSubmitting ? (
            "Saving..."
          ) : blogPost ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Post
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Create Post
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
