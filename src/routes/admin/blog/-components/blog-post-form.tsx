import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createBlogPostFn, updateBlogPostFn } from "~/fn/blog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { X, Eye, Save, Send } from "lucide-react";
import { cn } from "~/lib/utils";
import { MarkdownRenderer } from "~/components/markdown-renderer";

type BlogPostFormData = {
  title: string;
  content: string;
  excerpt: string;
  isPublished: boolean;
  featuredImage: string;
  tags: string;
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
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const content = watch("content");
  const title = watch("title");

  const createMutation = useMutation({
    mutationFn: createBlogPostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog-posts"] });
      navigate({ to: "/admin/blog" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBlogPostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog-posts"] });
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
    const formData = {
      ...data,
      tags: tags,
      excerpt: data.excerpt || undefined,
      featuredImage: data.featuredImage || undefined,
    };

    if (blogPost) {
      await updateMutation.mutateAsync({
        data: { id: blogPost.id, updates: formData },
      });
    } else {
      await createMutation.mutateAsync({ data: formData });
    }
  };

  const openPreview = () => {
    if (!title || !content) return;
    
    // Create a preview URL with the current content
    const previewData = {
      title,
      content,
      slug: title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    };
    
    // Open in new tab (this would need a preview route)
    window.open(`/blog/preview?data=${encodeURIComponent(JSON.stringify(previewData))}`, '_blank');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
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
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="write" className="mt-4">
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
                      "min-h-[400px] font-mono",
                      errors.content && "border-destructive"
                    )}
                  />
                  {errors.content && (
                    <p className="text-sm text-destructive mt-2">
                      {errors.content.message}
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="min-h-[400px] p-4 border rounded-md bg-background">
                    {content ? (
                      <MarkdownRenderer content={content} />
                    ) : (
                      <p className="text-muted-foreground">
                        No content to preview. Write some content in the Write tab.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublished">Published</Label>
                <Switch
                  id="isPublished"
                  {...register("isPublished")}
                  onCheckedChange={(checked) => setValue("isPublished", checked)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openPreview}
                  disabled={!title || !content}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    "Saving..."
                  ) : blogPost ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register("excerpt")}
                placeholder="Brief description of the post..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                {...register("featuredImage")}
                placeholder="Image URL..."
              />
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}