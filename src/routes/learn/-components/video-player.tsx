import { useQuery } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import { AuthenticationError } from "~/use-cases/errors";
import { getSegmentByIdUseCase } from "~/use-cases/segments";
import { getAuthenticatedUser } from "~/utils/auth";
import { getStorage } from "~/utils/storage";
import type { IStorage } from "~/utils/storage/storage.interface";
import { Play, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getAvailableQualitiesFn } from "~/fn/video-transcoding";

const VIDEO_AVAILABILITY_MAX_ATTEMPTS = 5;
const VIDEO_AVAILABILITY_INITIAL_DELAY_MS = 300;
const GLOBAL_QUALITY_PREFERENCE_KEY = "video-quality-preference-global";

function wait(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function getStoredQualityPreference(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(GLOBAL_QUALITY_PREFERENCE_KEY);
  } catch {
    return null;
  }
}

function setStoredQualityPreference(quality: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GLOBAL_QUALITY_PREFERENCE_KEY, quality);
  } catch {
    // Ignore localStorage errors
  }
}

// Map display quality names to actual quality values
const QUALITY_DISPLAY_TO_VALUE: Record<string, string> = {
  "480p": "480p",
  "720p": "720p",
  "1080p": "original",
};

const QUALITY_VALUE_TO_DISPLAY: Record<string, string> = {
  "480p": "480p",
  "720p": "720p",
  original: "1080p",
};

// Order of quality tabs
const QUALITY_ORDER = ["480p", "720p", "1080p"];

function getAvailableQualityTabs(availableQualities: string[]): string[] {
  // Filter and order qualities according to QUALITY_ORDER
  return QUALITY_ORDER.filter((displayQuality) => {
    const value = QUALITY_DISPLAY_TO_VALUE[displayQuality];
    return availableQualities.includes(value);
  });
}

interface VideoPlayerProps {
  segmentId: number;
  videoKey: string;
}

export function VideoPlayer({ segmentId, videoKey }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("original");
  const getAvailableQualities = useServerFn(getAvailableQualitiesFn);
  const getVideoUrl = useServerFn(getVideoUrlFn);

  // Fetch available qualities
  const { data: qualitiesData, isLoading: isLoadingQualities } = useQuery({
    queryKey: ["available-qualities", segmentId],
    queryFn: () => getAvailableQualities({ data: { segmentId } }),
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 55, // 55 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    enabled: Boolean(videoKey),
  });

  // Initialize quality preference from localStorage or default to 1080p
  useEffect(() => {
    if (qualitiesData?.availableQualities) {
      const stored = getStoredQualityPreference();
      const available = qualitiesData.availableQualities as string[];

      // Use stored preference if it exists and is available, otherwise default to 1080p (original)
      let initialQuality: string;
      if (stored && (available as string[]).includes(stored)) {
        initialQuality = stored;
      } else {
        // Fallback to 1080p (original) if stored preference doesn't exist or isn't available
        initialQuality = (available as string[]).includes("original")
          ? "original"
          : (available as string[])[0] || "original";
      }

      setSelectedQuality(initialQuality);
    }
  }, [qualitiesData]);

  // Get video URL for selected quality
  const { data, isLoading, error } = useQuery({
    queryKey: ["video-url", segmentId, selectedQuality, qualitiesData?.urls],
    queryFn: async () => {
      if (qualitiesData?.urls) {
        const urls = qualitiesData.urls as Record<string, string>;
        const url = urls[selectedQuality];
        if (url) {
          return { videoUrl: url };
        }
      }
      // Fallback to original getVideoUrlFn
      return getVideoUrl({ data: { segmentId } });
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 55, // 55 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    enabled: Boolean(videoKey && qualitiesData),
  });

  const handleQualityChange = (displayQuality: string) => {
    const video = videoRef.current;
    const currentTime = video?.currentTime || 0;
    const wasPlaying = !video?.paused;

    // Convert display quality (e.g., "1080p") to actual quality value (e.g., "original")
    const actualQuality =
      QUALITY_DISPLAY_TO_VALUE[displayQuality] || displayQuality;

    setSelectedQuality(actualQuality);
    // Store globally so it applies to all videos
    setStoredQualityPreference(actualQuality);

    // Restore playback position after a short delay to allow video to load
    if (video) {
      setTimeout(() => {
        if (video) {
          video.currentTime = currentTime;
          if (wasPlaying) {
            video.play().catch(() => {
              // Ignore play errors
            });
          }
        }
      }, 100);
    }
  };

  if (isLoading || isLoadingQualities) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-4 text-foreground">
          <div className="relative">
            <div className="p-4 rounded-full bg-foreground/10 backdrop-blur-sm">
              <Play className="h-8 w-8" />
            </div>
            <Loader2 className="absolute -top-1 -left-1 h-10 w-10 animate-spin text-theme-500" />
          </div>
          <p className="text-sm text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-4 text-foreground p-8">
          <div className="p-4 rounded-full bg-destructive/20">
            <Play className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Unable to load video
            </p>
            <p className="text-xs text-muted-foreground">
              Please try refreshing the page
            </p>
          </div>
        </div>
      </div>
    );
  }

  const availableQualities = qualitiesData?.availableQualities || [];
  const availableTabs = getAvailableQualityTabs(availableQualities);
  const showQualitySelector = availableTabs.length > 1;

  // Get the display quality for the currently selected quality value
  const selectedDisplayQuality =
    QUALITY_VALUE_TO_DISPLAY[selectedQuality] || selectedQuality;

  if (data) {
    return (
      <>
        {showQualitySelector && (
          <div className="absolute top-[-34px] right-0 z-10">
            <Tabs
              value={selectedDisplayQuality}
              onValueChange={handleQualityChange}
            >
              <TabsList className="h-8 bg-background/90 backdrop-blur-sm border-border/50">
                {availableTabs.map((displayQuality) => (
                  <TabsTrigger
                    key={displayQuality}
                    value={displayQuality}
                    className="h-7 px-3 text-xs"
                  >
                    {displayQuality}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
        <div className="w-full h-full overflow-hidden rounded-xl">
          <video
            ref={videoRef}
            src={data.videoUrl}
            controls
            className="w-full h-full object-contain bg-background"
            preload="metadata"
            poster=""
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </>
    );
  }

  return null;
}

export const getVideoUrlFn = createServerFn({ method: "GET" })
  .validator(z.object({ segmentId: z.number() }))
  .handler(async ({ data }) => {
    const { storage, type } = getStorage();

    if (type !== "r2") {
      return { videoUrl: `/api/segments/${data.segmentId}/video` };
    }

    const user = await getAuthenticatedUser();

    const segment = await getSegmentByIdUseCase(data.segmentId);
    if (!segment) throw new Error("Segment not found");
    if (!segment.videoKey) throw new Error("Video not attached to segment");

    if (segment.isPremium) {
      if (!user) throw new AuthenticationError();
      if (!user.isPremium && !user.isAdmin) {
        throw new Error("You don't have permission to access this video");
      }
    }

    await ensureVideoAvailability(storage, segment.videoKey);

    const url = await storage.getPresignedUrl(segment.videoKey);
    return { videoUrl: url };
  });

async function ensureVideoAvailability(storage: IStorage, key: string) {
  for (let attempt = 0; attempt < VIDEO_AVAILABILITY_MAX_ATTEMPTS; attempt++) {
    const exists = await storage.exists(key);
    if (exists) {
      return;
    }

    const delay = VIDEO_AVAILABILITY_INITIAL_DELAY_MS * Math.pow(2, attempt);
    await wait(delay);
  }

  throw new Error("Video is still processing. Please try again shortly.");
}
