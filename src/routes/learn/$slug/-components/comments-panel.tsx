import { MessageSquare } from "lucide-react";
import { Suspense, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCommentsQuery } from "~/lib/queries/comments";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { useCommentFormVisibility } from "../hooks/use-comment-form-visibility";

interface CommentsPanelProps {
  currentSegmentId: number;
  isLoggedIn: boolean;
  activeTab: "content" | "comments";
  commentId?: number;
}

/**
 * Loading skeleton component for comments section
 */
function CommentsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Loading header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-muted animate-pulse"></div>
          <div className="h-5 w-24 rounded bg-muted animate-pulse"></div>
        </div>
        <div className="h-4 w-20 rounded bg-muted animate-pulse"></div>
      </div>

      {/* Loading comments */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="module-card animate-pulse">
          <div className="p-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 rounded bg-muted"></div>
                  <div className="h-3 w-16 rounded bg-muted"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 w-full rounded bg-muted"></div>
                  <div className="h-4 w-3/4 rounded bg-muted"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Header section for the comment form
 */
function CommentFormHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-theme-600 dark:text-theme-400" />
        Join the Discussion
      </h3>
      {isLoggedIn && (
        <div className="text-sm text-muted-foreground">
          Share your thoughts
        </div>
      )}
    </div>
  );
}

export function CommentsPanel({
  currentSegmentId,
  isLoggedIn,
  activeTab,
  commentId,
}: CommentsPanelProps) {
  // Get comments data
  const { data: existingComments } = useQuery(
    getCommentsQuery(currentSegmentId)
  );

  // Use custom hook for form visibility logic
  const { showCommentForm, handleStartDiscussion } = useCommentFormVisibility(existingComments);

  // Memoize the auto-focus condition to prevent unnecessary re-renders
  const shouldAutoFocus = useMemo(() => {
    return showCommentForm && activeTab === "comments";
  }, [showCommentForm, activeTab]);

  // Scroll to specific comment when commentId is provided
  useEffect(() => {
    if (commentId && activeTab === "comments" && existingComments) {
      // Use a timeout to ensure the comments are rendered
      const timeoutId = setTimeout(() => {
        const commentElement = document.getElementById(`comment-${commentId}`);
        if (commentElement) {
          commentElement.scrollIntoView({ 
            behavior: "smooth", 
            block: "center" 
          });
          // Add a temporary highlight effect
          commentElement.style.outline = "2px solid hsl(var(--theme-500))";
          commentElement.style.borderRadius = "8px";
          setTimeout(() => {
            commentElement.style.outline = "";
            commentElement.style.borderRadius = "";
          }, 3000);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [commentId, activeTab, existingComments]);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Comment Form Section */}
      {showCommentForm && (
        <div className="space-y-4">
          <CommentFormHeader isLoggedIn={isLoggedIn} />
          <CommentForm autoFocus={shouldAutoFocus} />
        </div>
      )}

      {/* Comments List Section */}
      <div className={showCommentForm ? "border-t border-border/60 pt-6" : ""}>
        <Suspense fallback={<CommentsLoadingSkeleton />}>
          <CommentList onStartDiscussion={handleStartDiscussion} />
        </Suspense>
      </div>
    </div>
  );
}
