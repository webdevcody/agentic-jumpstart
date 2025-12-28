import { Link } from "@tanstack/react-router";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { createServerFn } from "@tanstack/react-start";
import { VideoPlayer } from "~/routes/learn/-components/video-player";
import { useQuery } from "@tanstack/react-query";
import { Play, ShoppingCart } from "lucide-react";
import { getStorage } from "~/utils/storage";
import { getThumbnailKey } from "~/utils/video-transcoding";
import { database } from "~/db";
import { segments, modules } from "~/db/schema";
import { eq } from "drizzle-orm";
import { useAuth } from "~/hooks/use-auth";

const getFirstVideoSegmentFn = createServerFn().handler(async () => {
  // Get segments ordered by module order, then segment order
  const result = await database
    .select({
      segment: segments,
      moduleOrder: modules.order,
    })
    .from(segments)
    .innerJoin(modules, eq(segments.moduleId, modules.id))
    .orderBy(modules.order, segments.order);

  // Find the first segment that has a video and is not premium
  // (Landing page should show free preview content)
  const firstVideoSegment = result
    .map((row) => row.segment)
    .find(
      (segment) =>
        segment.videoKey && !segment.isPremium && !segment.isComingSoon
    );

  // Get thumbnail URL server-side if available
  let thumbnailUrl: string | null = null;
  if (firstVideoSegment?.videoKey) {
    const { storage, type } = getStorage();
    if (type === "r2" || type === "mock") {
      const thumbnailKey =
        firstVideoSegment.thumbnailKey ||
        getThumbnailKey(firstVideoSegment.videoKey);
      const exists = await storage.exists(thumbnailKey);
      if (exists) {
        thumbnailUrl = await storage.getPresignedUrl(thumbnailKey);
      }
    }
  }

  return { segment: firstVideoSegment, thumbnailUrl };
});

export function HeroSection() {
  const continueSlug = useContinueSlug();
  const user = useAuth();

  const {
    data: firstVideoData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["first-video-segment"],
    queryFn: () => getFirstVideoSegmentFn(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const firstVideoSegment = firstVideoData?.segment;
  const thumbnailUrl = firstVideoData?.thumbnailUrl;

  return (
    <section className="relative w-full py-12">
      {/* Modern AI-themed gradient background */}
      <div className="absolute inset-0 hero-background-ai"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/5 dark:via-theme-950/20 to-transparent"></div>

      {/* AI circuit pattern overlay */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="circuit-pattern absolute inset-0"></div>
      </div>

      {/* AI-themed floating elements */}
      <div className="floating-elements">
        <div className="floating-element-1"></div>
        <div className="floating-element-2"></div>
        <div className="floating-element-3"></div>
        <div className="floating-element-small top-10 right-10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-full">
          <div className="flex items-center h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-center">
              {/* Left side - Content */}
              <div className="hero-content">
                {/* Badge */}
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
                  <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2"></span>
                  Agentic Coding Mastery Course
                </div>

                <h1 className="text-6xl leading-tight mb-8">
                  Coding is <span className="text-theme-400">Changing</span>,
                  Master{" "}
                  <span className="text-theme-400">Agentic Coding</span>{" "}
                </h1>

                <p className="text-description mb-12 max-w-xl">
                  Master AI-first development with Cursor IDE, Claude Code CLI,
                  and advanced AI models. Learn how to leverage Opus 4.5,
                  Composer1, GPT-5.1 Codex, and cutting-edge agentic programming
                  techniques to accelerate your development workflow and build
                  applications 10x faster than traditional programming methods.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  {!user?.isPremium && !user?.isAdmin && (
                    <Link
                      to="/purchase"
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 dark:bg-[#22d3ee] px-6 py-2 text-xs font-black text-white dark:text-[#0b101a] shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.preventDefault();
                          e.currentTarget.click();
                        }
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 stroke-[3.5px]" />
                      Buy Now
                    </Link>
                  )}
                  <Link
                    to={"/learn/$slug"}
                    params={{ slug: continueSlug }}
                    className="inline-flex items-center gap-2 rounded-xl glass px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                    onKeyDown={(e) => {
                      if (e.key === " ") {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                  >
                    <Play className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 fill-cyan-600 dark:fill-cyan-400" />
                    Start Learning
                  </Link>
                </div>
              </div>

              {/* Right side - Video player */}
              <div className="flex items-center justify-center lg:justify-end">
                {isLoading ? (
                  <div className="w-full max-w-lg lg:max-w-xl aspect-video flex items-center justify-center bg-background/20 backdrop-blur-sm rounded-xl">
                    <div className="text-sm text-muted-foreground">
                      Loading video...
                    </div>
                  </div>
                ) : error ? (
                  <div className="w-full max-w-lg lg:max-w-xl aspect-video flex items-center justify-center bg-background/20 backdrop-blur-sm rounded-xl">
                    <div className="text-sm text-muted-foreground">
                      Unable to load video
                    </div>
                  </div>
                ) : firstVideoSegment ? (
                  <div className="w-full max-w-lg lg:max-w-xl">
                    {/* Video container with glass morphism effect */}
                    <div className="video-container">
                      <div className="video-wrapper aspect-video relative">
                        <VideoPlayer
                          segmentId={firstVideoSegment.id}
                          videoKey={firstVideoSegment.videoKey!}
                          initialThumbnailUrl={thumbnailUrl}
                        />
                      </div>

                      {/* Decorative elements - using theme colors */}
                      <div className="video-decorative-1"></div>
                      <div className="video-decorative-2"></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-lg lg:max-w-xl aspect-video flex items-center justify-center bg-background/20 backdrop-blur-sm rounded-xl">
                    <div className="text-sm text-muted-foreground">
                      No video available
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade with theme accent */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}
