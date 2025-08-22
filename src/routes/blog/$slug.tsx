import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getBlogPostBySlugFn, trackBlogPostViewFn } from "~/fn/blog";
import { isAdminFn } from "~/fn/auth";
import { queryOptions } from "@tanstack/react-query";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Calendar, User, ArrowLeft, Share2, Edit } from "lucide-react";
import { NotFound } from "~/components/NotFound";
import { MarkdownRenderer } from "~/components/markdown-renderer";
import { BlogImage } from "~/components/blog-image";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(blogPostQuery(params.slug));
  },
  component: BlogPost,
});

const blogPostQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog", "post", slug],
    queryFn: () => getBlogPostBySlugFn({ data: { slug } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

const isAdminQuery = () =>
  queryOptions({
    queryKey: ["auth", "isAdmin"],
    queryFn: () => isAdminFn(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

// Simple session ID generator for analytics
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Get or create session ID
function getSessionId() {
  const key = 'blog_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// Hash IP address (simplified client-side approach)
function hashIP() {
  // In a real implementation, this would be done server-side
  // For now, we'll use a simple approach
  return 'client_' + Math.random().toString(36).substr(2, 9);
}

function BlogPost() {
  const { slug } = Route.useParams();
  const { data: blogPost, isLoading, error } = useQuery(blogPostQuery(slug));
  const { data: isAdmin } = useQuery(isAdminQuery());

  // Track blog post view
  useEffect(() => {
    if (blogPost) {
      const trackView = async () => {
        try {
          await trackBlogPostViewFn({
            data: {
              blogPostId: blogPost.id,
              sessionId: getSessionId(),
              ipAddressHash: hashIP(),
              userAgent: navigator.userAgent,
              referrer: document.referrer || undefined,
            },
          });
        } catch (error) {
          // Silently fail - analytics shouldn't break the user experience
          console.log('Failed to track blog view:', error);
        }
      };
      
      trackView();
    }
  }, [blogPost]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">
          <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
          <div className="space-y-4">
            <div className="h-10 w-3/4 bg-muted animate-pulse rounded"></div>
            <div className="flex gap-4">
              <div className="h-5 w-32 bg-muted animate-pulse rounded"></div>
              <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
          <div className="h-64 bg-muted animate-pulse rounded"></div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return <NotFound />;
  }

  const tags = blogPost.tags ? JSON.parse(blogPost.tags) : [];

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: blogPost.title,
        url: window.location.href,
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Back button and admin edit button */}
      <div className="mb-8 flex justify-between items-center">
        <Link to="/blog">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
        
        {isAdmin && blogPost && (
          <Link to="/admin/blog/$id/edit" params={{ id: blogPost.id.toString() }}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      {/* Article header */}
      <article className="space-y-8">
        <header className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {blogPost.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(blogPost.publishedAt!).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            
            {blogPost.author?.displayName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{blogPost.author.displayName}</span>
                {blogPost.author.image && (
                  <img
                    src={blogPost.author.image}
                    alt={blogPost.author.displayName}
                    className="w-6 h-6 rounded-full"
                  />
                )}
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={sharePost}
              className="gap-1 ml-auto"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {/* Featured image */}
        {blogPost.featuredImage && (
          <div className="w-full h-64 md:h-96 overflow-hidden rounded-lg">
            <BlogImage
              imageKey={blogPost.featuredImage}
              alt={blogPost.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <MarkdownRenderer content={blogPost.content} />
        </div>

        {/* Footer */}
        <footer className="border-t pt-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(blogPost.updatedAt).toLocaleDateString()}
            </div>
            
            <Link to="/blog">
              <Button variant="outline" size="sm">
                View All Posts
              </Button>
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}