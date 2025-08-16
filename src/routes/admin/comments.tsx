import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  getAllRecentCommentsFn, 
  deleteCommentAsAdminFn,
  createCommentFn 
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
  Shield,
  User,
  Calendar,
  ExternalLink,
  Filter,
  CheckCircle2
} from "lucide-react";
import { toast } from "~/hooks/use-toast";
import { adminMiddleware } from "~/lib/auth";
import { queryOptions } from "@tanstack/react-query";
import { AllCommentsWithDetails } from "~/data-access/comments";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/hooks/use-auth";

const allCommentsQuery = (filterAdminReplied: boolean) => queryOptions({
  queryKey: ["admin", "comments", filterAdminReplied],
  queryFn: () => getAllRecentCommentsFn({ data: { filterAdminReplied } }),
});

export const Route = createFileRoute("/admin/comments")({
  middleware: [adminMiddleware],
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(allCommentsQuery(false));
  },
  component: AdminComments,
});

function AdminComments() {
  const user = useAuth();
  const [filterAdminReplied, setFilterAdminReplied] = useState(false);
  const { data: comments } = useSuspenseQuery(allCommentsQuery(filterAdminReplied));
  const queryClient = useQueryClient();
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => 
      deleteCommentAsAdminFn({ data: { commentId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
      setDeleteCommentId(null);
      toast({
        title: "Comment deleted",
        description: "The comment has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ segmentId, content, parentId }: { 
      segmentId: number; 
      content: string; 
      parentId: number | null;
    }) => createCommentFn({ 
      data: { segmentId, content, parentId, repliedToId: null } 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
      setReplyingToCommentId(null);
      setReplyContent("");
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    if (deleteCommentId) {
      deleteCommentMutation.mutate(deleteCommentId);
    }
  };

  const handleSubmitReply = (segmentId: number, parentId: number) => {
    if (replyContent.trim()) {
      replyMutation.mutate({
        segmentId,
        content: replyContent.trim(),
        parentId,
      });
    }
  };

  return (
    <div className="container mx-auto py-20 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Comments</h1>
            <p className="text-muted-foreground">
              Manage and moderate all user comments across the platform
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="filter-toggle" className="text-sm">
              Hide admin-replied
            </Label>
            <Switch
              id="filter-toggle"
              checked={filterAdminReplied}
              onCheckedChange={setFilterAdminReplied}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="module-card p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No comments yet</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={(id) => setDeleteCommentId(id)}
              onReply={(id) => setReplyingToCommentId(id)}
              replyingToThis={replyingToCommentId === comment.id}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={() => handleSubmitReply(comment.segmentId, comment.id)}
              onCancelReply={() => {
                setReplyingToCommentId(null);
                setReplyContent("");
              }}
              isPendingReply={replyMutation.isPending}
            />
          ))
        )}
      </div>

      <AlertDialog 
        open={deleteCommentId !== null} 
        onOpenChange={(open) => !open && setDeleteCommentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
              {deleteCommentId && comments.find(c => c.id === deleteCommentId)?.children?.length ? (
                <span className="block mt-2 font-semibold text-destructive">
                  Warning: This comment has replies that will also be deleted.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
  level = 0 
}: CommentItemProps) {
  const user = useAuth();
  const hasAdminReply = (comment as any).hasAdminReply;

  return (
    <div className={level > 0 ? "ml-12 mt-3" : ""}>
      <div className="module-card">
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex shrink-0 size-10 rounded-full overflow-hidden bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-800 dark:to-theme-700">
                <img
                  className="max-h-10 w-auto object-cover"
                  src={
                    comment.profile.image ??
                    `https://api.dicebear.com/9.x/initials/svg?seed=${comment.profile.displayName || "user"}&backgroundColor=6366f1&textColor=ffffff`
                  }
                  alt={comment.profile.displayName || "User"}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {comment.profile.displayName || "Anonymous"}
                  </span>
                  {hasAdminReply && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
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
                  className="inline-flex items-center gap-1 text-sm text-theme-600 dark:text-theme-400 hover:underline mb-2"
                >
                  {comment.segment.title}
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onReply(comment.id)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(comment.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {replyingToThis && (
            <div className="mt-4 pl-13">
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px]"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancelReply}
                    disabled={isPendingReply}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSubmitReply}
                    disabled={!replyContent.trim() || isPendingReply}
                    className="btn-gradient"
                  >
                    {isPendingReply ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white/70"></div>
                        <span>Posting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-3 w-3" />
                        <span>Reply</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {comment.children && comment.children.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {comment.children.length} {comment.children.length === 1 ? "reply" : "replies"}
              </div>
              {comment.children.map((child) => (
                <div key={child.id} className="ml-8 mt-2">
                  <div className="flex items-start gap-2">
                    <div className="flex shrink-0 size-8 rounded-full overflow-hidden bg-gradient-to-br from-theme-100 to-theme-200 dark:from-theme-800 dark:to-theme-700">
                      <img
                        className="max-h-8 w-auto object-cover"
                        src={
                          child.profile.image ??
                          `https://api.dicebear.com/9.x/initials/svg?seed=${child.profile.displayName || "user"}&backgroundColor=6366f1&textColor=ffffff`
                        }
                        alt={child.profile.displayName || "User"}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {child.profile.displayName || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(child.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{child.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}