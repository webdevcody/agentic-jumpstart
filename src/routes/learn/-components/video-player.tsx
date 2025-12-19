import { useQuery } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useState, useRef, useEffect, useMemo } from "react";
import { AuthenticationError } from "~/use-cases/errors";
import { getSegmentByIdUseCase } from "~/use-cases/segments";
import { getAuthenticatedUser } from "~/utils/auth";
import { getStorage } from "~/utils/storage";
import type { IStorage } from "~/utils/storage/storage.interface";
import { Play, Loader2, Settings } from "lucide-react";
import ReactPlayer from "react-player";
import {
  getAvailableQualitiesFn,
  getThumbnailUrlFn,
} from "~/fn/video-transcoding";
import { unauthenticatedMiddleware } from "~/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

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

// Map quality values to display labels
const QUALITY_TO_LABEL: Record<string, string> = {
  original: "1080p",
  "720p": "720p",
  "480p": "480p",
};

// Order of qualities (highest to lowest)
const QUALITY_ORDER = ["original", "720p", "480p"];

interface VideoPlayerProps {
  segmentId: number;
  videoKey: string;
  initialThumbnailUrl?: string | null;
}

export function VideoPlayer({
  segmentId,
  videoKey,
  initialThumbnailUrl,
}: VideoPlayerProps) {
  const [isClient, setIsClient] = useState(false);
  const playerRef = useRef<HTMLVideoElement>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("original");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    initialThumbnailUrl || null
  );
  const [playing, setPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const getAvailableQualities = useServerFn(getAvailableQualitiesFn);
  const getThumbnailUrl = useServerFn(getThumbnailUrlFn);

  // Ensure client-side only rendering for ReactPlayer
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // Reset state when navigating to a different video segment
  useEffect(() => {
    setThumbnailUrl(initialThumbnailUrl || null);
    setPlaying(false);
    setPlayedSeconds(0);
    setIsReady(false);
    setHasError(false);
  }, [segmentId, initialThumbnailUrl]);

  // Fetch thumbnail URL independently (never blocks video loading)
  // Only fetch if we don't already have an initial thumbnail
  useEffect(() => {
    if (!videoKey || initialThumbnailUrl) return;

    getThumbnailUrl({ data: { segmentId } })
      .then((result) => {
        if (result?.thumbnailUrl) {
          setThumbnailUrl(result.thumbnailUrl);
        }
      })
      .catch(() => {
        // Silently ignore - thumbnail is optional
      });
  }, [segmentId, videoKey, getThumbnailUrl, initialThumbnailUrl]);

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

  // Get available quality URLs
  const qualityUrls = useMemo(() => {
    if (!qualitiesData?.urls) return {};
    return qualitiesData.urls as Record<string, string>;
  }, [qualitiesData?.urls]);

  // Get available qualities list
  const availableQualities = useMemo(() => {
    if (!qualitiesData?.availableQualities) return [];
    return qualitiesData.availableQualities as string[];
  }, [qualitiesData?.availableQualities]);

  // Get current video URL based on selected quality
  const currentVideoUrl = useMemo(() => {
    if (!qualityUrls[selectedQuality]) {
      // Fallback to first available quality
      return qualityUrls[availableQualities[0]] || null;
    }
    return qualityUrls[selectedQuality];
  }, [qualityUrls, selectedQuality, availableQualities]);

  // Initialize quality preference from localStorage
  useEffect(() => {
    if (availableQualities.length > 0) {
      const stored = getStoredQualityPreference();
      if (stored && availableQualities.includes(stored)) {
        setSelectedQuality(stored);
      } else {
        // Default to highest available quality
        if (availableQualities.includes("original")) {
          setSelectedQuality("original");
        } else if (availableQualities.includes("720p")) {
          setSelectedQuality("720p");
        } else if (availableQualities.includes("480p")) {
          setSelectedQuality("480p");
        } else {
          setSelectedQuality(availableQualities[0]);
        }
      }
    }
  }, [availableQualities]);

  // Handle quality change
  const handleQualityChange = (quality: string) => {
    const videoElement = playerRef.current;
    const currentTime = videoElement?.currentTime || playedSeconds;
    const wasPlaying = playing;

    setSelectedQuality(quality);
    setStoredQualityPreference(quality);
    setShowQualityMenu(false);

    // Restore playback position after a short delay
    setTimeout(() => {
      if (videoElement) {
        videoElement.currentTime = currentTime;
        if (wasPlaying) {
          setPlaying(true);
        }
      }
    }, 100);
  };

  // Get available quality options for dropdown
  const qualityOptions = useMemo(() => {
    return QUALITY_ORDER.filter((quality) =>
      availableQualities.includes(quality)
    );
  }, [availableQualities]);

  // Show thumbnail immediately if available, otherwise show minimal loading
  if (!isClient || isLoadingQualities) {
    // If we have a thumbnail, show it immediately without any spinner or text
    if (thumbnailUrl) {
      return (
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${thumbnailUrl})`,
          }}
        />
      );
    }

    // Only show spinner if no thumbnail available
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-theme-500" />
      </div>
    );
  }

  if (!qualitiesData || !currentVideoUrl) {
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

  const handlePlayClick = () => {
    setPlaying(true);
  };

  return (
    <div className="w-full h-full overflow-hidden relative group">
      {/* Thumbnail overlay that fades out when video starts playing */}
      {thumbnailUrl && !playing && !hasError && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 z-[1]"
          style={{
            backgroundImage: `url(${thumbnailUrl})`,
          }}
        >
          {/* Play button overlay - shows when video is ready or if we have thumbnail */}
          {(isReady || thumbnailUrl) && (
            <button
              onClick={handlePlayClick}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group/play"
              aria-label="Play video"
            >
              <div className="relative">
                <div className="p-6 rounded-full bg-white/90 dark:bg-white/80 backdrop-blur-sm group-hover/play:scale-110 transition-transform shadow-lg">
                  <Play
                    className="h-12 w-12 text-slate-900 dark:text-slate-900 ml-1"
                    fill="currentColor"
                  />
                </div>
              </div>
            </button>
          )}
        </div>
      )}
      <div className="relative z-10 w-full h-full">
        <ReactPlayer
          ref={playerRef}
          src={currentVideoUrl}
          playing={playing}
          controls
          width="100%"
          height="100%"
          onReady={() => setIsReady(true)}
          onPlay={() => {
            setPlaying(true);
            setHasError(false);
          }}
          onPause={() => setPlaying(false)}
          onError={(error) => {
            console.error("Video player error:", error);
            setHasError(true);
            setIsReady(false);
          }}
          light={false}
        />
      </div>
      {hasError && (
        <div className="absolute inset-0 z-[20] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center p-4">
            <p className="text-sm text-white mb-2">Unable to load video</p>
            <p className="text-xs text-white/70">
              Please try refreshing the page
            </p>
          </div>
        </div>
      )}
      {qualityOptions.length > 1 && (
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu
            open={showQualityMenu}
            onOpenChange={setShowQualityMenu}
          >
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm border border-border/50 rounded-md text-sm hover:bg-background transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQualityMenu(!showQualityMenu);
                }}
              >
                <Settings className="h-4 w-4" />
                <span>
                  {QUALITY_TO_LABEL[selectedQuality] || selectedQuality}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {qualityOptions.map((quality) => (
                <DropdownMenuItem
                  key={quality}
                  onClick={() => handleQualityChange(quality)}
                  className={
                    selectedQuality === quality ? "bg-accent font-medium" : ""
                  }
                >
                  {QUALITY_TO_LABEL[quality] || quality}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

export const getVideoUrlFn = createServerFn({ method: "GET" })
  .middleware([unauthenticatedMiddleware])
  .validator(z.object({ segmentId: z.number() }))
  .handler(async ({ data, context }) => {
    const { storage, type } = getStorage();

    if (type !== "r2") {
      return { videoUrl: `/api/segments/${data.segmentId}/video` };
    }

    const segment = await getSegmentByIdUseCase(data.segmentId);
    if (!segment) throw new Error("Segment not found");
    if (!segment.videoKey) throw new Error("Video not attached to segment");

    if (segment.isPremium) {
      if (!context.userId) throw new AuthenticationError();
      const user = await getAuthenticatedUser();
      if (!user || (!user.isPremium && !user.isAdmin)) {
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
