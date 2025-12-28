import { Badge } from "~/components/ui/badge";
import { Lock, CheckCircle, Circle, Edit } from "lucide-react";
import { type Segment, type Progress } from "~/db/schema";
import { useMutation } from "@tanstack/react-query";
import { markAsCompletedFn, unmarkAsCompletedFn } from "~/fn/progress";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { DeleteSegmentButton } from "./delete-segment-button";
import { useSegment } from "~/routes/learn/-components/segment-context";

interface VideoHeaderProps {
  currentSegment: Segment;
  isAdmin: boolean;
  currentSegmentId: number;
  isLoggedIn: boolean;
  progress: Progress[];
  isPremium: boolean;
}

export function VideoHeader({
  currentSegment,
  isAdmin,
  currentSegmentId,
  isLoggedIn,
  progress,
  isPremium,
}: VideoHeaderProps) {
  const {
    locallyCompletedSegmentIds,
    locallyUncompletedSegmentIds,
    markSegmentAsLocallyCompleted,
    unmarkSegmentAsLocallyCompleted,
  } = useSegment();

  // Check both server progress and locally completed segments (for immediate UI feedback)
  const isCompleted = locallyUncompletedSegmentIds.has(currentSegmentId)
    ? false
    : progress.some((p) => p.segmentId === currentSegmentId) ||
      locallyCompletedSegmentIds.has(currentSegmentId);
  const canAccessVideo =
    isLoggedIn &&
    !currentSegment.isComingSoon &&
    (!currentSegment.isPremium || isPremium || isAdmin);

  const markCompleteMutation = useMutation({
    mutationFn: (segmentId: number) =>
      markAsCompletedFn({ data: { segmentId } }),
    onSuccess: () => {
      markSegmentAsLocallyCompleted(currentSegmentId);
      toast.success("Video marked as complete");
    },
    onError: () => {
      toast.error("Failed to mark video as complete");
    },
  });

  const unmarkCompleteMutation = useMutation({
    mutationFn: (segmentId: number) =>
      unmarkAsCompletedFn({ data: { segmentId } }),
    onSuccess: () => {
      unmarkSegmentAsLocallyCompleted(currentSegmentId);
      toast.success("Video marked as incomplete");
    },
    onError: () => {
      toast.error("Failed to mark video as incomplete");
    },
  });

  const handleToggleComplete = () => {
    if (isCompleted) {
      unmarkCompleteMutation.mutate(currentSegmentId);
    } else {
      markCompleteMutation.mutate(currentSegmentId);
    }
  };

  const isPending = markCompleteMutation.isPending || unmarkCompleteMutation.isPending;

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-[#0b101a]/40 backdrop-blur-md z-20 shrink-0">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {currentSegment.title}
          </h2>
          {isAdmin && currentSegment.isPremium && (
            <Badge
              variant="outline"
              className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              PREMIUM
            </Badge>
          )}
        </div>
        {currentSegment.length && (
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold font-mono">
            {currentSegment.length}
          </p>
        )}
      </div>

      <div className="flex items-center gap-5">
        {canAccessVideo && (
          <button
            onClick={handleToggleComplete}
            disabled={isPending}
            className={`cursor-pointer flex items-center gap-2 glass px-5 py-2 rounded-xl text-xs font-bold transition ${
              isCompleted
                ? "text-emerald-600 dark:text-emerald-400 hover:bg-red-50 dark:hover:bg-white/10"
                : "text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-white/10"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Completed
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5" />
                Mark as Complete
              </>
            )}
          </button>
        )}

        {isAdmin && (
          <>
            <Link
              to="/learn/$slug/edit"
              params={{ slug: currentSegment.slug }}
              className="btn-cyan px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Edit className="w-4 h-4 stroke-[3.5px]" />
              Edit
            </Link>
            <DeleteSegmentButton currentSegmentId={currentSegmentId} />
          </>
        )}
      </div>
    </header>
  );
}
