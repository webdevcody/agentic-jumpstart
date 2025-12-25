import { Button, buttonVariants } from "~/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { createServerFn } from "@tanstack/react-start";
import { VideoPlayer } from "~/routes/learn/-components/video-player";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShoppingCart, CheckCircle2 } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";
import { getStorage } from "~/utils/storage";
import { getThumbnailKey } from "~/utils/video-transcoding";
import { database } from "~/db";
import { segments, modules } from "~/db/schema";
import { eq } from "drizzle-orm";
import { GlassPanel } from "~/components/ui/glass-panel";
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
    if (type === "r2") {
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

interface UnifiedHeroProps {
  isEarlyAccess: boolean;
  waitlistCount?: number;
  initialVideoData?: { segment: any; thumbnailUrl: string | null } | null;
}

import { GridPattern } from "~/components/ui/background-patterns";

export function UnifiedHero({
  isEarlyAccess,
  waitlistCount,
  initialVideoData,
}: UnifiedHeroProps) {
  const continueSlug = useContinueSlug();
  const user = useAuth();

  const { data: firstVideoData } = useQuery({
    queryKey: ["first-video-segment"],
    queryFn: () => getFirstVideoSegmentFn(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    initialData: initialVideoData, // Use server-fetched data as initial data
  });

  const firstVideoSegment = firstVideoData?.segment;
  const thumbnailUrl = firstVideoData?.thumbnailUrl;

  if (isEarlyAccess) {
    return <EarlyAccessHeroContent waitlistCount={waitlistCount} />;
  }

  return (
    <section className="relative w-full py-8 md:py-12 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className="opacity-[0.3] dark:opacity-[0.2] stroke-cyan-500/20 fill-cyan-500/20"
          squares={[
            [4, 4],
            [5, 1],
            [8, 2],
            [6, 6],
            [10, 5],
            [13, 3],
          ]}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 h-full">
          <div className="flex items-center h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full items-center">
              {/* Left side - Content */}
              <div className="hero-content lg:col-span-5">
                {/* Badge */}

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-slate-900 dark:text-white">
                  Don't Write Code. <br className="hidden md:block" />
                  <span className="text-cyan-600 dark:text-cyan-400">
                    Direct It.
                  </span>
                </h1>

                <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 mb-8 md:mb-10 max-w-xl leading-relaxed">
                  Stop typing every character manually. Master{" "}
                  <strong className="text-slate-900 dark:text-white">
                    Cursor
                  </strong>
                  ,{" "}
                  <strong className="text-slate-900 dark:text-white">
                    Claude
                  </strong>
                  , and{" "}
                  <strong className="text-slate-900 dark:text-white">
                    Agentic Workflows
                  </strong>{" "}
                  to build production-ready apps 10x faster. Become the
                  architect, not just the typist.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {!user?.isPremium && !user?.isAdmin && (
                    <Link
                      to="/purchase"
                      className={buttonVariants({
                        variant: "cyan",
                        size: "lg",
                        className: "rounded-xl px-6 py-2.5 text-sm font-bold",
                      })}
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.preventDefault();
                          e.currentTarget.click();
                        }
                      }}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" aria-hidden="true" />
                      Get Lifetime Access
                    </Link>
                  )}
                  <Link
                    to={"/learn/$slug"}
                    params={{ slug: continueSlug }}
                    className={buttonVariants({
                      variant: "glass",
                      size: "lg",
                      className: "rounded-xl px-5 py-2.5 text-xs font-bold",
                    })}
                    onKeyDown={(e) => {
                      if (e.key === " ") {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                  >
                    View Curriculum
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Lifetime Updates Included</span>
                  </div>
                  {waitlistCount !== undefined && waitlistCount > 0 && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Join{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {waitlistCount.toLocaleString()}+
                      </span>{" "}
                      developers building with AI
                    </p>
                  )}
                </div>
              </div>

              {/* Right side - Video player */}
              <div className="flex items-center justify-center lg:justify-end lg:col-span-7">
                {/* Always render container to prevent layout shift */}
                <div className="w-full lg:min-w-full lg:mr-0 xl:min-w-[110%] xl:-mr-[10%] 2xl:min-w-[120%] 2xl:-mr-[20%]">
                  {/* Video container with glass morphism effect */}
                  <GlassPanel
                    variant="cyan"
                    padding="none"
                    className="relative"
                  >
                    <div className="video-wrapper aspect-video relative rounded-xl overflow-hidden">
                      {firstVideoSegment ? (
                        <VideoPlayer
                          segmentId={firstVideoSegment.id}
                          videoKey={firstVideoSegment.videoKey!}
                          initialThumbnailUrl={thumbnailUrl}
                        />
                      ) : (
                        /* Placeholder that matches video dimensions to prevent layout shift */
                        <div className="w-full h-full flex items-center justify-center glass rounded-xl">
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Loading video...
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Decorative elements - using theme colors */}
                    <div className="video-decorative-1"></div>
                    <div className="video-decorative-2"></div>
                  </GlassPanel>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade with theme accent */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-[#0b101a] dark:via-[#0b101a]/80"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}

function EarlyAccessHeroContent({ waitlistCount }: { waitlistCount?: number }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className="opacity-[0.3] dark:opacity-[0.2] stroke-cyan-500/20 fill-cyan-500/20"
          squares={[
            [2, 2],
            [10, 10],
            [15, 5],
            [5, 15],
          ]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 relative inline-block group">
            <div className="relative">
              <img
                src="/logo.png"
                alt="Agentic Jumpstart"
                className="size-24 md:size-32 mx-auto"
              />
            </div>
          </div>

          <div className="mb-12">
            {/* Badge */}
            <GlassPanel
              variant="cyan"
              padding="sm"
              className="inline-block mb-4 md:mb-6"
            >
              <div className="inline-flex items-center text-xs md:text-sm font-medium text-slate-700 dark:text-cyan-400">
                <span className="w-2 h-2 bg-cyan-600 dark:bg-cyan-400 rounded-full mr-2"></span>
                Early Access Registration
              </div>
            </GlassPanel>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-600 to-cyan-700 dark:from-cyan-400 dark:to-cyan-500 bg-clip-text text-transparent leading-normal pb-1">
              Coming Soon
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-4">
              Ship full-stack apps 10x faster using Claude Code and Cursor—let
              AI agents write production code while you focus on architecture.
            </p>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto px-4 md:px-0">
              Learn to build real-world applications by commanding AI coding
              agents. From React frontends to Node.js backends, discover how to
              leverage Claude and Cursor to transform your ideas into deployed
              applications in hours, not weeks.
            </p>

            {waitlistCount !== undefined && (
              <GlassPanel
                variant="cyan"
                padding="md"
                className="mt-6 max-w-lg mx-auto"
              >
                <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 font-semibold">
                  <span className="text-2xl md:text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                    {waitlistCount.toLocaleString()}
                  </span>{" "}
                  early access sign ups already
                </p>
              </GlassPanel>
            )}
            <GlassPanel
              variant="orange"
              padding="md"
              className="mt-6 max-w-lg mx-auto"
            >
              <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium">
                🎁 <strong>Bonus:</strong> Waitlist members get access to a free
                Hans hook that reads your completed features out loud!
              </p>
            </GlassPanel>
          </div>

          <NewsletterForm />
        </div>
      </div>

      {/* Bottom gradient divider */}
      <div className="section-divider-glow-bottom"></div>
    </div>
  );
}
