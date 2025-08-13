import { Button, buttonVariants } from "~/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { createServerFn } from "@tanstack/react-start";
import { getSegments } from "~/data-access/segments";
import { VideoPlayer } from "~/routes/learn/-components/video-player";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShoppingCart } from "lucide-react";

const getFirstVideoSegmentFn = createServerFn().handler(async () => {
  const segments = await getSegments();
  // Find the first segment that has a video
  const firstVideoSegment = segments
    .sort((a, b) => a.order - b.order)
    .find((segment) => segment.videoKey);
  return firstVideoSegment;
});

export function HeroSection() {
  const continueSlug = useContinueSlug();

  const { data: firstVideoSegment } = useQuery({
    queryKey: ["first-video-segment"],
    queryFn: () => getFirstVideoSegmentFn(),
  });

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
                  <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                  Agentic Coding Mastery Course
                </div>

                <h1 className="text-6xl leading-tight mb-8">
                  Coding is <span className="text-theme-400">Changing</span>,
                  Master{" "}
                  <span className="text-theme-400">Agentic Coding</span>{" "}
                </h1>

                <p className="text-description mb-12 max-w-xl">
                  Master AI-first development with Cursor IDE, Claude Code CLI,
                  and advanced AI models. Learn how to leverage Claude Sonnet
                  3.5, Claude Opus, and cutting-edge agentic programming
                  techniques to accelerate your development workflow and build
                  applications 10x faster than traditional programming methods.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/purchase"
                    className={buttonVariants({ variant: "outline" })}
                    onKeyDown={(e) => {
                      if (e.key === " ") {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                    Buy Now
                  </Link>
                  <Link
                    to={"/learn/$slug"}
                    params={{ slug: continueSlug }}
                    className={buttonVariants({ variant: "default" })}
                    onKeyDown={(e) => {
                      if (e.key === " ") {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                  >
                    Start Learning
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Right side - Video player */}
              <div className="flex items-center justify-center lg:justify-end">
                {firstVideoSegment && (
                  <div className="w-full max-w-lg lg:max-w-xl">
                    {/* Video container with glass morphism effect */}
                    <div className="video-container">
                      <div className="video-wrapper">
                        <VideoPlayer segmentId={firstVideoSegment.id} />
                      </div>

                      {/* Decorative elements - using theme colors */}
                      <div className="video-decorative-1"></div>
                      <div className="video-decorative-2"></div>
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
