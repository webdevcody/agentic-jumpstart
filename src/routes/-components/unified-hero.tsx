import { Button, buttonVariants } from "~/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { createServerFn } from "@tanstack/react-start";
import { getSegments } from "~/data-access/segments";
import { VideoPlayer } from "~/routes/learn/-components/video-player";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { ScrollAnimation, ScrollScale } from "~/components/scroll-animation";
import { NewsletterForm } from "./newsletter-form";

const getFirstVideoSegmentFn = createServerFn().handler(async () => {
  const segments = await getSegments();
  // Find the first segment that has a video
  const firstVideoSegment = segments
    .sort((a, b) => a.order - b.order)
    .find((segment) => segment.videoKey);
  return firstVideoSegment;
});

interface UnifiedHeroProps {
  isEarlyAccess: boolean;
}

export function UnifiedHero({ isEarlyAccess }: UnifiedHeroProps) {
  const continueSlug = useContinueSlug();

  const { data: firstVideoSegment } = useQuery({
    queryKey: ["first-video-segment"],
    queryFn: () => getFirstVideoSegmentFn(),
  });

  if (isEarlyAccess) {
    return <EarlyAccessHeroContent />;
  }

  return (
    <section className="relative w-full py-8 md:py-12">
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 h-full">
          <div className="flex items-center h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 w-full items-center">
              {/* Left side - Content */}
              <div className="hero-content">
                {/* Badge */}
                <ScrollAnimation direction="down" delay={0}>
                  <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-xs md:text-sm font-medium mb-6 md:mb-8">
                    <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                    Agentic Coding Mastery Course
                  </div>
                </ScrollAnimation>

                <ScrollAnimation direction="up" delay={0}>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight mb-8">
                    Coding is <span className="text-theme-400">Changing</span>,
                    Master{" "}
                    <span className="text-theme-400">Agentic Coding</span>{" "}
                  </h1>
                </ScrollAnimation>

                <ScrollAnimation direction="up" delay={0.2}>
                  <p className="text-base md:text-lg text-description mb-8 md:mb-12 max-w-xl">
                    Master AI-first development with Cursor IDE, Claude Code
                    CLI, and advanced AI models. Learn how to leverage Opus 4.5,
                    Composer1, GPT-5.1 Codex, and cutting-edge agentic
                    programming techniques to accelerate your development
                    workflow and build applications 10x faster than traditional
                    programming methods.
                  </p>
                </ScrollAnimation>

                <ScrollAnimation direction="up" delay={0.3}>
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
                      <ShoppingCart
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
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
                </ScrollAnimation>
              </div>

              {/* Right side - Video player */}
              <ScrollAnimation
                direction="left"
                delay={0.4}
                className="flex items-center justify-center lg:justify-end"
              >
                {firstVideoSegment && (
                  <div className="w-full max-w-lg lg:max-w-xl">
                    {/* Video container with glass morphism effect */}
                    <div className="video-container">
                      <div className="video-wrapper">
                        <VideoPlayer
                          segmentId={firstVideoSegment.id}
                          videoKey={firstVideoSegment.videoKey!}
                        />
                      </div>

                      {/* Decorative elements - using theme colors */}
                      <div className="video-decorative-1"></div>
                      <div className="video-decorative-2"></div>
                    </div>
                  </div>
                )}
              </ScrollAnimation>
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

function EarlyAccessHeroContent() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero background similar to main hero */}
      <div className="absolute inset-0 hero-background-ai"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/5 dark:via-theme-950/20 to-transparent"></div>

      {/* Circuit pattern overlay */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="circuit-pattern absolute inset-0"></div>
      </div>

      {/* Floating elements for ambiance */}
      <div className="floating-elements">
        <div className="floating-element-1"></div>
        <div className="floating-element-2"></div>
        <div className="floating-element-3"></div>
        <div className="floating-element-small top-20 right-20"></div>
        <div className="floating-element-small bottom-20 left-20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo with glow effect */}
          <ScrollScale delay={0}>
            <div className="mb-8 relative inline-block group">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Agentic Jumpstart"
                  className="size-24 md:size-32 mx-auto transition-transform duration-500 group-hover:scale-110"
                />
                {/* Pulsing glow effect */}
                <div className="absolute inset-0 rounded-full bg-theme-500/20 blur-xl animate-pulse"></div>
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-full bg-theme-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          </ScrollScale>

          <div className="mb-12">
            {/* Badge */}
            <ScrollAnimation direction="down" delay={0.1}>
              <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-xs md:text-sm font-medium mb-4 md:mb-6">
                <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                Early Access Registration
              </div>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.2}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent animate-gradient leading-normal pb-1">
                Coming Soon
              </h1>
            </ScrollAnimation>
            <ScrollAnimation direction="up" delay={0.3}>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-4">
                Ship full-stack apps 10x faster using Claude Code and Cursor—let
                AI agents write production code while you focus on architecture.
              </p>
            </ScrollAnimation>
            <ScrollAnimation direction="up" delay={0.4}>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto px-4 md:px-0">
                Learn to build real-world applications by commanding AI coding
                agents. From React frontends to Node.js backends, discover how
                to leverage Claude and Cursor to transform your ideas into
                deployed applications in hours, not weeks.
              </p>
            </ScrollAnimation>
            
            <ScrollAnimation direction="up" delay={0.45}>
              <div className="mt-6 p-4 rounded-lg bg-theme-50/50 dark:bg-theme-900/20 border border-theme-200 dark:border-theme-500/30 max-w-lg mx-auto">
                <p className="text-sm md:text-base text-theme-700 dark:text-theme-300 font-medium">
                  🎁 <strong>Bonus:</strong> Waitlist members get access to a free Hans hook that reads your completed features out loud!
                </p>
              </div>
            </ScrollAnimation>
          </div>

          <ScrollAnimation direction="up" delay={0.5}>
            <NewsletterForm />
          </ScrollAnimation>
        </div>
      </div>

      {/* Bottom gradient divider */}
      <div className="section-divider-glow-bottom"></div>
    </div>
  );
}
