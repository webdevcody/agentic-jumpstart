import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useCallback, useEffect, useRef } from "react";
import { getSegmentBySlugUseCase } from "~/use-cases/segments";
import { getSegments } from "~/data-access/segments";
import { type Segment, type Progress } from "~/db/schema";
import { getStorage } from "~/utils/storage";
import { getThumbnailKey } from "~/utils/video-transcoding";

import { VideoPlayer } from "~/routes/learn/-components/video-player";

import { unauthenticatedMiddleware } from "~/lib/auth";
import { isAdminFn, isUserPremiumFn } from "~/fn/auth";
import { getAllProgressForUserUseCase } from "~/use-cases/progress";
import { useSegment } from "../-components/segment-context";
import { setLastWatchedSegment } from "~/utils/local-storage";

import { useAuth } from "~/hooks/use-auth";

import { getCommentsQuery } from "~/lib/queries/comments";
import { VideoControls, markedAsWatchedFn } from "./-components/video-controls";
import { VideoContentTabsPanel } from "./-components/video-content-tabs-panel";
import { UpgradePlaceholder } from "./-components/upgrade-placeholder";
import { isFeatureEnabledForUserFn } from "~/fn/app-settings";
import { GlassPanel } from "~/components/ui/glass-panel";

export const Route = createFileRoute("/learn/$slug/_layout/")({
  component: RouteComponent,
  validateSearch: z.object({
    tab: z.enum(["content", "transcripts", "comments"]).optional(),
    commentId: z.number().optional(),
  }),
  head: ({ loaderData }) => {
    const thumbnailUrl = (loaderData as any)?.thumbnailUrl;
    return {
      links: thumbnailUrl
        ? [
            {
              rel: "preload",
              as: "image",
              href: thumbnailUrl,
            },
          ]
        : [],
    };
  },
  loader: async ({ context: { queryClient }, params }) => {
    const [
      { segment, segments, progress, thumbnailUrl },
      isPremium,
      isAdmin,
      showContentTabs,
    ] = await Promise.all([
      getSegmentInfoFn({ data: { slug: params.slug } }),
      isUserPremiumFn(),
      isAdminFn(),
      isFeatureEnabledForUserFn({ data: { flagKey: "VIDEO_SEGMENT_CONTENT_TABS" } }),
    ]);

    if (segments.length === 0) {
      throw redirect({ to: "/learn/no-segments" });
    }

    if (!segment) {
      throw redirect({ to: "/learn/not-found" });
    }

    queryClient.ensureQueryData(getCommentsQuery(segment.id));

    return {
      segment,
      segments,
      progress,
      isPremium,
      isAdmin,
      showContentTabs,
      thumbnailUrl,
    };
  },
});

export const getSegmentInfoFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data, context }) => {
    const segment = await getSegmentBySlugUseCase(data.slug);
    const [segments, progress] = await Promise.all([
      getSegments(),
      context.userId ? getAllProgressForUserUseCase(context.userId) : [],
    ]);

    // Get thumbnail URL server-side if available
    let thumbnailUrl: string | null = null;
    if (segment?.videoKey) {
      const { storage, type } = getStorage();
      if (type === "r2") {
        const thumbnailKey =
          segment.thumbnailKey || getThumbnailKey(segment.videoKey);
        const exists = await storage.exists(thumbnailKey);
        if (exists) {
          thumbnailUrl = await storage.getPresignedUrl(thumbnailKey);
        }
      }
    }

    return { segment, segments, progress, thumbnailUrl };
  });

function ViewSegment({
  segments,
  currentSegment,
  currentSegmentId,
  isPremium,
  isAdmin,
  defaultTab,
  commentId,
  showContentTabs,
  progress,
  thumbnailUrl,
}: {
  segments: Segment[];
  currentSegment: Segment;
  currentSegmentId: number;
  isPremium: boolean;
  isAdmin: boolean;
  defaultTab?: "content" | "transcripts" | "comments";
  commentId?: number;
  showContentTabs: boolean;
  progress: Progress[];
  thumbnailUrl?: string | null;
}) {
  const { setCurrentSegmentId, markSegmentAsLocallyCompleted } = useSegment();

  useEffect(() => {
    setLastWatchedSegment(currentSegment.slug);
  }, [currentSegment.slug]);

  const user = useAuth();
  const isLoggedIn = !!user?.id;

  const showUpgradePanel = currentSegment.isPremium && !isPremium && !isAdmin;
  const showComingSoonPlaceholder =
    currentSegment.isComingSoon && !currentSegment.videoKey;

  // Track if we've already auto-completed this segment to prevent duplicate calls
  const hasAutoCompletedRef = useRef(false);

  // Reset auto-complete tracking when segment changes
  useEffect(() => {
    hasAutoCompletedRef.current = false;
  }, [currentSegmentId]);

  // Handle auto-completion when user watches 95% of the video
  const handleAutoComplete = useCallback(async () => {
    // Only mark as watched if user can actually access the video content
    const canAccessVideo = !currentSegment.isPremium || isPremium || isAdmin;
    if (
      isLoggedIn &&
      !currentSegment.isComingSoon &&
      canAccessVideo &&
      !hasAutoCompletedRef.current
    ) {
      hasAutoCompletedRef.current = true;
      await markedAsWatchedFn({
        data: { segmentId: currentSegmentId },
      });
      // Update local state immediately so the UI reflects the change
      // without needing to invalidate the router (which would pause the video)
      markSegmentAsLocallyCompleted(currentSegmentId);
    }
  }, [
    currentSegment.isPremium,
    currentSegment.isComingSoon,
    isPremium,
    isAdmin,
    isLoggedIn,
    currentSegmentId,
    markSegmentAsLocallyCompleted,
  ]);

  return (
    <div className="w-full h-full flex flex-col min-w-0">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 lg:p-4 space-y-6">
        {showUpgradePanel ? (
          <UpgradePlaceholder currentSegment={currentSegment} />
        ) : showComingSoonPlaceholder ? (
          <div className="relative">
            <GlassPanel
              variant="cyan"
              className="aspect-video flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <div className="text-6xl opacity-20">🚀</div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    This video content is currently being prepared and will be
                    available soon.
                  </p>
                </div>
              </div>
            </GlassPanel>
          </div>
        ) : currentSegment.videoKey ? (
          <div className="relative">
            <GlassPanel
              variant="cyan"
              className="aspect-video relative overflow-hidden"
              style={
                thumbnailUrl
                  ? {
                      background: "transparent",
                    }
                  : undefined
              }
            >
              {/* Thumbnail background - shows immediately, even during SSR */}
              {thumbnailUrl && (
                <>
                  {/* Thumbnail image positioned absolutely behind content */}
                  <img
                    src={thumbnailUrl}
                    alt="Video thumbnail"
                    className="absolute inset-0 z-0 w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  {/* Very light overlay - just enough to make glass effect work */}
                  <div className="absolute inset-0 z-[1] bg-background/5 dark:bg-background/10 backdrop-blur-[12px]" />
                </>
              )}
              {/* Video player content */}
              <div className="relative z-[2] w-full h-full">
                <VideoPlayer
                  segmentId={currentSegment.id}
                  videoKey={currentSegment.videoKey}
                  initialThumbnailUrl={thumbnailUrl}
                  onAutoComplete={handleAutoComplete}
                />
              </div>
            </GlassPanel>
          </div>
        ) : null}

        {/* Navigation Section - Moved here after video */}
        <VideoControls
          currentSegmentId={currentSegmentId}
          segments={segments}
          isLoggedIn={isLoggedIn}
          setCurrentSegmentId={setCurrentSegmentId}
          currentSegment={currentSegment}
          isPremium={isPremium}
          isAdmin={isAdmin}
        />

        {/* Tabs Section - Hide when coming soon is enabled */}
        {!showComingSoonPlaceholder && (
          <VideoContentTabsPanel
            currentSegment={currentSegment}
            isLoggedIn={isLoggedIn}
            defaultTab={defaultTab}
            commentId={commentId}
            showContentTabs={showContentTabs}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
}

function RouteComponent() {
  const loaderData = Route.useLoaderData() as {
    segment: Segment;
    segments: Segment[];
    isPremium: boolean;
    isAdmin: boolean;
    showContentTabs: boolean;
    progress: Progress[];
    thumbnailUrl?: string | null;
  };
  const {
    segment,
    segments,
    isPremium,
    isAdmin,
    showContentTabs,
    progress,
    thumbnailUrl,
  } = loaderData;
  const { tab, commentId } = Route.useSearch();

  return (
    <>
      <ViewSegment
        segments={segments}
        currentSegment={segment}
        currentSegmentId={segment.id}
        isPremium={isPremium}
        isAdmin={isAdmin}
        defaultTab={tab}
        commentId={commentId}
        showContentTabs={showContentTabs}
        progress={progress}
        thumbnailUrl={thumbnailUrl}
      />
      {/* <FloatingFeedbackButton /> */}
    </>
  );
}
