import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { 
  getLaunchKitBySlugFn,
  getLaunchKitCommentsFn,
  createLaunchKitCommentFn,
  trackLaunchKitViewFn,
  cloneLaunchKitFn
} from "~/fn/launch-kits";
import { isAuthenticatedFn } from "~/fn/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { 
  GitFork, 
  ExternalLink, 
  ArrowLeft,
  User,
  Clock,
  MessageSquare,
  Send,
  Tag as TagIcon,
  Link as LinkIcon,
  Star,
  Eye,
  Calendar
} from "lucide-react";
import { queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/launch-kits/$slug")({
  loader: async ({ context, params }) => {
    const launchKitQuery = getLaunchKitQuery(params.slug);
    const commentsQuery = getCommentsQuery(params.slug);
    
    await context.queryClient.ensureQueryData(launchKitQuery);
    await context.queryClient.ensureQueryData(commentsQuery);
    
    // Track view
    try {
      const isAuth = await isAuthenticatedFn();
      if (isAuth) {
        // We'll track with user ID in the component after getting user context
      } else {
        await trackLaunchKitViewFn({ data: { slug: params.slug } });
      }
    } catch (error) {
      // Ignore tracking errors
    }
  },
  component: LaunchKitDetailPage,
});

const getLaunchKitQuery = (slug: string) => queryOptions({
  queryKey: ["launch-kit", slug],
  queryFn: () => getLaunchKitBySlugFn({ data: { slug } }),
});

const getCommentsQuery = (slug: string) => queryOptions({
  queryKey: ["launch-kit-comments", slug],
  queryFn: async () => {
    const kit = await getLaunchKitBySlugFn({ data: { slug } });
    return getLaunchKitCommentsFn({ data: { launchKitId: kit.id } });
  },
});

function LaunchKitDetailPage() {
  const { slug } = Route.useParams();
  const { data: launchKit, isLoading } = useQuery(getLaunchKitQuery(slug));
  const { data: comments, isLoading: commentsLoading } = useQuery(getCommentsQuery(slug));
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    isAuthenticatedFn().then(setIsAuthenticated).catch(() => setIsAuthenticated(false));
  }, []);

  const createCommentMutation = useMutation({
    mutationFn: createLaunchKitCommentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launch-kit-comments", slug] });
      setNewComment("");
      toast.success("Comment added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  const handleClone = async () => {
    if (!launchKit) return;
    
    try {
      await cloneLaunchKitFn({ data: { slug: launchKit.slug } });
      toast.success(`${launchKit.name} cloned! Check the repository.`);
      window.open(launchKit.repositoryUrl, '_blank');
    } catch (error) {
      toast.error("Failed to track clone");
      window.open(launchKit.repositoryUrl, '_blank');
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !launchKit) return;

    createCommentMutation.mutate({
      data: {
        launchKitId: launchKit.id,
        content: newComment.trim(),
      }
    });
  };


  if (isLoading || !launchKit) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/launch-kits">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Launch Kits
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <CardTitle className="text-3xl">{launchKit.name}</CardTitle>
                </div>
                <CardDescription className="text-lg leading-relaxed mb-4">
                  {launchKit.description}
                </CardDescription>
                
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(launchKit.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-4 w-4" />
                    {launchKit.cloneCount} clones
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {comments?.length || 0} comments
                  </span>
                </div>
              </div>
              
              {launchKit.imageUrl && (
                <div className="ml-6 flex-shrink-0">
                  <img 
                    src={launchKit.imageUrl} 
                    alt={launchKit.name}
                    className="w-32 h-32 rounded-lg object-cover border shadow-sm"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Long Description */}
            {launchKit.longDescription && (
              <div>
                <h3 className="font-semibold mb-2">About this Launch Kit</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {launchKit.longDescription}
                </p>
              </div>
            )}

            {/* Tags */}
            {launchKit.tags && launchKit.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {launchKit.tags.map((tag: any) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline"
                      style={{ 
                        borderColor: tag.color,
                        color: tag.color,
                        backgroundColor: tag.color + '10'
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
              <Button size="lg" onClick={handleClone} className="group">
                <GitFork className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Clone Repository
              </Button>
              
              {launchKit.demoUrl && (
                <Button variant="outline" size="lg" asChild>
                  <a href={launchKit.demoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    View Demo
                  </a>
                </Button>
              )}

              <Button variant="outline" size="lg" asChild>
                <a href={launchKit.repositoryUrl} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-5 w-5" />
                  View Repository
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({comments?.length || 0})
            </CardTitle>
            <CardDescription>
              Share your thoughts and experiences with this launch kit
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Add Comment Form */}
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <Textarea
                  placeholder="Share your thoughts about this launch kit..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim() || createCommentMutation.isPending}
                    size="sm"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">
                  <Link to="/auth" className="text-theme-600 hover:text-theme-700 font-medium">
                    Sign in
                  </Link>
                  {" "}to leave a comment
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {commentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-16 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/20">
                    <Avatar>
                      <AvatarImage src={comment.user?.image} />
                      <AvatarFallback>
                        {comment.user?.displayName?.[0] || comment.user?.email?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">
                          {comment.user?.displayName || comment.user?.email || 'Anonymous'}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}