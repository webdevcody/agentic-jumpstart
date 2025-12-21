import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getAllRecentCommentsFn,
  deleteCommentAsAdminFn,
  createCommentFn,
} from "~/fn/comments";
import { getTimeAgo } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  Reply,
  MessageSquare,
  Send,
  Calendar,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { queryOptions } from "@tanstack/react-query";
import { AllCommentsWithDetails } from "~/data-access/comments";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { PageHeader } from "./-components/page-header";
import { Page } from "./-components/page";

// Skeleton component for count cards
function CountSkeleton() {
  return <div className="h-8 w-16 bg-muted/50 rounded animate-pulse"></div>;
}

const allCommentsQuery = (filterAdminReplied: boolean) =>
  queryOptions({
    queryKey: ["admin", "comments", filterAdminReplied],
    queryFn: () => getAllRecentCommentsFn({ data: { filterAdminReplied } }),
  });

export const Route = createFileRoute("/admin/comments")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(allCommentsQuery(false));
  },
  component: AdminComments,
});

function AdminComments() {
  const [filterAdminReplied, setFilterAdminReplied] = useState(true);
  const { data: comments, isLoading } = useQuery(
    allCommentsQuery(filterAdminReplied)
  );
  const queryClient = useQueryClient();
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(
    null
  );
  const [replyContent, setReplyContent] = useState("");

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      deleteCommentAsAdminFn({ data: { commentId } }),
    onSuccess: async () => {
      // Invalidate and refetch to ensure the UI updates
      await queryClient.refetchQueries({ queryKey: ["admin", "comments"] });
      setDeleteCommentId(null);
      toast.success("Comment deleted", {
        description: "The comment has been successfully deleted.",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to delete the comment. Please try again.",
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({
      segmentId,
      content,
      parentId,
    }: {
      segmentId: number;
      content: string;
      parentId: number | null;
    }) =>
      createCommentFn({
        data: { segmentId, content, parentId, repliedToId: null },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
      setReplyingToCommentId(null);
      setReplyContent("");
      toast.success("Reply posted", {
        description: "Your reply has been posted successfully.",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to post reply. Please try again.",
      });
    },
  });

  const handleConfirmDelete = () => {
    if (deleteCommentId) {
      deleteCommentMutation.mutate(deleteCommentId);
    }
  };

  const handleSubmitReply = (segmentId: number, parentId: number) => {
    // Check if reply content is empty
    const trimmedContent = replyContent.trim();

    if (!trimmedContent) {
      toast.error("Validation Error", {
        description: "Please enter a reply message before posting.",
      });
      return;
    }

    // Check if reply content is too short
    if (trimmedContent.length < 3) {
      toast.error("Validation Error", {
        description: "Reply must be at least 3 characters long.",
      });
      return;
    }

    // Check if reply content is too long
    if (trimmedContent.length > 5000) {
      toast.error("Validation Error", {
        description: "Reply must be less than 5000 characters.",
      });
      return;
    }

    replyMutation.mutate({
      segmentId,
      content: trimmedContent,
      parentId,
    });
  };

  const totalComments = comments?.length ?? 0;
  const addressedComments =
    comments?.filter((c) => (c as any).hasAdminReply).length ?? 0;
  const pendingComments = totalComments - (addressedComments ?? 0);

  return (
    <Page>
      <PageHeader
        title="Comment Management"
        highlightedWord="Management"
        description="Manage and moderate all user comments across the platform"
        actions={
          <div className="flex items-center gap-4 bg-card/60 dark:bg-card/40 border border-border/50 rounded-xl px-4 py-3 backdrop-blur-sm">
            <Filter className="h-4 w-4 text-theme-500 dark:text-theme-400" />
            <Label htmlFor="filter-toggle" className="text-sm font-medium">
              Hide Addressed
            </Label>
            <Switch
              id="filter-toggle"
              checked={filterAdminReplied}
              onCheckedChange={setFilterAdminReplied}
            />
          </div>
        }
      />

      {/* Stats Overview */}
      <div
        className="grid gap-6 md:grid-cols-3 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.1s", animationFillMode: "both" }}
      >
        {/* Total Comments */}
        <div
          className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Total Comments
              </div>
              <div className="w-10 h-10 rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center group-hover:bg-theme-500/20 dark:group-hover:bg-theme-400/30 transition-colors duration-300">
                <MessageSquare className="h-5 w-5 text-theme-500 dark:text-theme-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
              {isLoading ? <CountSkeleton /> : totalComments}
            </div>
            <p className="text-sm text-muted-foreground">All user comments</p>
          </div>
        </div>

        {/* Pending Comments */}
        <div
          className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Pending
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/10 dark:bg-orange-400/20 flex items-center justify-center group-hover:bg-orange-500/20 dark:group-hover:bg-orange-400/30 transition-colors duration-300">
                <Calendar className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
              {isLoading ? <CountSkeleton /> : pendingComments}
            </div>
            <p className="text-sm text-muted-foreground">Awaiting response</p>
          </div>
        </div>

        {/* Addressed Comments */}
        <div
          className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "0.4s", animationFillMode: "both" }}
        >
          <div className="module-card p-6 h-full">
            <div className="flex flex-row items-center justify-between space-y-0 mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Addressed
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 dark:bg-green-400/20 flex items-center justify-center group-hover:bg-green-500/20 dark:group-hover:bg-green-400/30 transition-colors duration-300">
                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
              {isLoading ? <CountSkeleton /> : addressedComments}
            </div>
            <p className="text-sm text-muted-foreground">Admin replied</p>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div
        className="module-card animate-in fade-in slide-in-from-bottom-2 duration-500"
        style={{ animationDelay: "0.5s", animationFillMode: "both" }}
      >
        <div className="p-6 border-b border-border/50">
          <h2 className="text-2xl font-semibold mb-2">All Comments</h2>
          <p className="text-muted-foreground">
            View and respond to user comments
          </p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                  style={{
                    animationDelay: `${0.6 + idx * 0.1}s`,
                    animationFillMode: "both",
                  }}
                >
                  <div className="flex flex-col gap-3">
                    <div className="h-6 w-1/3 bg-muted/50 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-1/2 bg-muted/30 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-1/4 bg-muted/20 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-6 opacity-30" />
              <p className="text-lg">No comments to display</p>
              <p className="text-sm mt-2">
                {filterAdminReplied
                  ? "All comments have been addressed"
                  : "No comments yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments?.map((comment, index) => (
                <div
                  key={comment.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                  style={{
                    animationDelay: `${0.6 + index * 0.1}s`,
                    animationFillMode: "both",
                  }}
                >
                  <CommentItem
                    comment={comment}
                    onDelete={(id) => setDeleteCommentId(id)}
                    onReply={(id) => setReplyingToCommentId(id)}
                    replyingToThis={replyingToCommentId === comment.id}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    onSubmitReply={() =>
                      handleSubmitReply(comment.segmentId, comment.id)
                    }
                    onCancelReply={() => {
                      setReplyingToCommentId(null);
                      setReplyContent("");
                    }}
                    isPendingReply={replyMutation.isPending}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={deleteCommentId !== null}
        onOpenChange={(open) => !open && setDeleteCommentId(null)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Comment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this comment? This action cannot
              be undone.
              {deleteCommentId &&
              comments?.find((c) => c.id === deleteCommentId)?.children
                ?.length ? (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Warning
                  </div>
                  <p className="text-sm text-destructive/80 mt-1">
                    This comment has replies that will also be deleted.
                  </p>
                </div>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Comment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}

interface CommentItemProps {
  comment: AllCommentsWithDetails[0];
  onDelete: (id: number) => void;
  onReply: (id: number) => void;
  replyingToThis: boolean;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
  isPendingReply: boolean;
  level?: number;
}

function CommentItem({
  comment,
  onDelete,
  onReply,
  replyingToThis,
  replyContent,
  setReplyContent,
  onSubmitReply,
  onCancelReply,
  isPendingReply,
  level = 0,
}: CommentItemProps) {
  const hasAdminReply = (comment as any).hasAdminReply;

  return (
    <div className={level > 0 ? "ml-12 mt-4" : ""}>
      <div className="group relative overflow-hidden rounded-xl bg-card/60 dark:bg-card/40 border border-border/50 p-6 hover:bg-card/80 dark:hover:bg-card/60 hover:border-theme-400/30 hover:shadow-elevation-2 transition-all duration-300">
        {/* Subtle hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"></div>

        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="relative flex shrink-0 size-12 rounded-full overflow-hidden bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-800 dark:to-theme-700 ring-2 ring-border/30">
                <img
                  className="size-full object-cover"
                  src={
                    comment.profile.image ??
                    `https://api.dicebear.com/9.x/initials/svg?seed=${comment.profile.publicName || "user"}&backgroundColor=6366f1&textColor=ffffff`
                  }
                  alt={comment.profile.publicName || "User"}
                />
                {hasAdminReply && (
                  <div className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                    <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-foreground">
                    {comment.profile.publicName || comment.profile.displayName || "Anonymous"}
                    {comment.profile.useDisplayName !== false && comment.profile.realName && (
                      <span className="text-muted-foreground font-normal ml-2 text-sm">
                        (real: {comment.profile.realName})
                      </span>
                    )}
                    {comment.profile.useDisplayName === false && comment.profile.displayName && (
                      <span className="text-muted-foreground font-normal ml-2 text-sm">
                        (alias: {comment.profile.displayName})
                      </span>
                    )}
                  </span>
                  {hasAdminReply && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Admin Replied
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {getTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <Link
                  to="/learn/$slug"
                  params={{ slug: comment.segment.slug }}
                  search={{ tab: "comments", commentId: comment.id }}
                  className="inline-flex items-center gap-2 text-sm text-theme-600 dark:text-theme-400 hover:text-theme-700 dark:hover:text-theme-300 transition-colors mb-3 font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {comment.segment.title}
                </Link>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/30">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative z-10 h-8 w-8"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onDelete(comment.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Comment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reply Interface */}
          <div className="ml-16 mt-6">
            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-theme-50/30 to-theme-100/20 dark:from-theme-950/20 dark:to-theme-900/10 border border-theme-200/30 dark:border-theme-700/30">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Reply className="h-4 w-4 text-theme-500 dark:text-theme-400" />
                Admin Reply
              </div>
              <Textarea
                placeholder="Type your reply to this comment..."
                value={replyingToThis ? replyContent : ""}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[100px] resize-none bg-background/60 dark:bg-background/40"
                onFocus={() => onReply(comment.id)}
                maxLength={5000}
              />
              <div className="flex gap-3 justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {replyingToThis && replyContent.length > 0 && (
                    <span
                      className={
                        replyContent.length > 4900 ? "text-orange-500" : ""
                      }
                    >
                      {replyContent.length} / 5000
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  {replyingToThis && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelReply}
                      className="border-border/50"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={onSubmitReply}
                    disabled={isPendingReply}
                    className="btn-gradient"
                  >
                    {isPendingReply ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white/70"></div>
                        <span>Posting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-3.5 w-3.5" />
                        <span>Post Reply</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Replies */}
          {comment.children && comment.children.length > 0 && (
            <div className="ml-16 mt-6 pt-6 border-t border-border/50">
              <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2 font-medium">
                <MessageSquare className="h-4 w-4 text-theme-500 dark:text-theme-400" />
                {comment.children.length}{" "}
                {comment.children.length === 1 ? "Reply" : "Replies"}
              </div>
              <div className="space-y-4">
                {comment.children.map((child) => (
                  <div
                    key={child.id}
                    className="p-4 rounded-lg bg-gradient-to-br from-background/80 to-muted/30 border border-border/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex shrink-0 size-10 rounded-full overflow-hidden bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-800 dark:to-theme-700">
                        <img
                          className="size-full object-cover"
                          src={
                            child.profile.image ??
                            `https://api.dicebear.com/9.x/initials/svg?seed=${child.profile.publicName || "user"}&backgroundColor=6366f1&textColor=ffffff`
                          }
                          alt={child.profile.publicName || "User"}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-foreground">
                            {child.profile.publicName || child.profile.displayName || "Anonymous"}
                            {child.profile.useDisplayName !== false && child.profile.realName && (
                              <span className="text-muted-foreground font-normal ml-1 text-xs">
                                (real: {child.profile.realName})
                              </span>
                            )}
                            {child.profile.useDisplayName === false && child.profile.displayName && (
                              <span className="text-muted-foreground font-normal ml-1 text-xs">
                                (alias: {child.profile.displayName})
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(child.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                          {child.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
