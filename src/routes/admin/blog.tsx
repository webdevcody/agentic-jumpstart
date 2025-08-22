import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getBlogPostsFn } from "~/fn/blog";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { queryOptions } from "@tanstack/react-query";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { PageHeader } from "./-components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/admin/blog")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(blogPostsQuery);
  },
  component: AdminBlog,
});

const blogPostsQuery = queryOptions({
  queryKey: ["admin", "blog-posts"],
  queryFn: () => getBlogPostsFn({ data: {} }),
});

function AdminBlog() {
  const { data: blogPosts, isLoading } = useQuery(blogPostsQuery);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const filteredPosts = blogPosts?.filter((post) => {
    if (filter === "published") return post.isPublished;
    if (filter === "draft") return !post.isPublished;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Blog Management"
        highlightedWord="Blog"
        description="Create and manage blog posts for your website"
        action={
          <Link to="/admin/blog/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        }
      />

      {/* Filter buttons */}
      <div className="mb-6">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Posts
          </Button>
          <Button
            variant={filter === "published" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("published")}
          >
            Published
          </Button>
          <Button
            variant={filter === "draft" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("draft")}
          >
            Drafts
          </Button>
        </div>
      </div>

      {/* Blog posts table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-foreground">{post.title}</h3>
                      <Badge
                        variant={post.isPublished ? "default" : "secondary"}
                        className={post.isPublished ? "bg-green-500" : ""}
                      >
                        {post.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {post.isPublished && post.publishedAt
                        ? `Published ${new Date(post.publishedAt).toLocaleDateString()}`
                        : `Created ${new Date(post.createdAt).toLocaleDateString()}`}
                      {post.author?.displayName && ` by ${post.author.displayName}`}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {post.isPublished && (
                      <Link to="/blog/$slug" params={{ slug: post.slug }}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/admin/blog/$id/edit"
                            params={{ id: post.id.toString() }}
                            className="flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {post.isPublished ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No blog posts yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first blog post to get started.
              </p>
              <Link to="/admin/blog/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blog Post
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}