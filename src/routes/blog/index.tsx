import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublishedBlogPostsFn } from "~/fn/blog";
import { queryOptions } from "@tanstack/react-query";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blog/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(blogPostsQuery);
  },
  component: BlogIndex,
});

const blogPostsQuery = queryOptions({
  queryKey: ["blog", "published"],
  queryFn: () => getPublishedBlogPostsFn(),
});

function BlogIndex() {
  const { data: blogPosts, isLoading } = useQuery(blogPostsQuery);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Our <span className="text-theme-600 dark:text-theme-400">Blog</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Insights, tutorials, and updates from our team. Stay up to date with
          the latest in web development and programming.
        </p>
      </div>

      {/* Blog posts */}
      {isLoading ? (
        <div className="space-y-8">
          {[...Array(3)].map((_, idx) => (
            <Card key={idx} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 h-48 bg-muted animate-pulse"></div>
                <div className="flex-1 p-6">
                  <div className="space-y-3">
                    <div className="h-6 w-3/4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-2/3 bg-muted animate-pulse rounded"></div>
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                      <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : blogPosts && blogPosts.length > 0 ? (
        <div className="space-y-8">
          {blogPosts.map((post) => {
            const tags = post.tags ? JSON.parse(post.tags) : [];
            
            return (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="block"
                >
                  <div className="flex flex-col md:flex-row">
                    {post.featuredImage && (
                      <div className="w-full md:w-1/3 h-48 overflow-hidden">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 p-6">
                      <div className="space-y-3">
                        <h2 className="text-xl font-semibold text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors">
                          {post.title}
                        </h2>
                        
                        {post.excerpt && (
                          <p className="text-muted-foreground line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(post.publishedAt!).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          
                          {post.author?.displayName && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {post.author.displayName}
                            </div>
                          )}
                        </div>
                        
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {tags.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center text-theme-600 dark:text-theme-400 text-sm font-medium group-hover:gap-2 transition-all">
                          Read more
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No blog posts yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Check back soon for new content!
          </p>
        </div>
      )}
    </div>
  );
}