import { useQuery } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AuthenticationError } from "~/use-cases/errors";
import { getSegmentByIdUseCase } from "~/use-cases/segments";
import { getAuthenticatedUser } from "~/utils/auth";
import { getStorage } from "~/utils/storage";
import { Play, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  segmentId: number;
}

export function VideoPlayer({ segmentId }: VideoPlayerProps) {
  const getVideoUrl = useServerFn(getVideoUrlFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["video-url", segmentId],
    queryFn: () => getVideoUrl({ data: { segmentId } }),
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 55, // 55 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading) {
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
            <p className="text-sm text-muted-foreground mb-2">Unable to load video</p>
            <p className="text-xs text-muted-foreground">
              Please try refreshing the page
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <video
        src={data.videoUrl}
        controls
        className="w-full h-full object-cover bg-background"
        preload="metadata"
        poster=""
      >
        Your browser does not support the video tag.
      </video>
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

    const url = await storage.getPresignedUrl(segment.videoKey);
    return { videoUrl: url };
  });
