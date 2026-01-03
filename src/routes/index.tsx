import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UnifiedHero } from "./-components/unified-hero";
import { StatsSection } from "./-components/stats";
import { ModulesSection } from "./-components/modules";
import { PricingSection } from "./-components/pricing";
import { FAQSection } from "./-components/faq";
import { createServerFn } from "@tanstack/react-start";
import { getSegmentsUseCase } from "~/use-cases/segments";
import { getCourseStatsUseCase } from "~/use-cases/stats";
import { TestimonialsSection } from "./-components/testimonials";
import { FutureOfCodingSection } from "./-components/future-of-coding";
import { ResearchSourcesSection } from "./-components/research-sources";
import { InstructorSection } from "./-components/instructor-section";
import { DiscordCommunitySection } from "./-components/discord-community-section";
import { shouldShowEarlyAccessFn } from "~/fn/early-access";
import { NewsletterSection } from "./-components/newsletter";
import { getNewsletterSignupsCount } from "~/data-access/newsletter";
import { database } from "~/db";
import { segments, modules } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getStorage } from "~/utils/storage";
import { getThumbnailKey } from "~/utils/video-transcoding";
import { ShowcasesCTA } from "./-components/showcases-cta";

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
    .find((segment) => segment.videoKey && !segment.isPremium && !segment.isComingSoon);

  // Get thumbnail URL server-side if available
  let thumbnailUrl: string | null = null;
  if (firstVideoSegment?.videoKey) {
    const { storage, type } = getStorage();
    if (type === "r2") {
      const thumbnailKey =
        firstVideoSegment.thumbnailKey || getThumbnailKey(firstVideoSegment.videoKey);
      const exists = await storage.exists(thumbnailKey);
      if (exists) {
        thumbnailUrl = await storage.getPresignedUrl(thumbnailKey);
      }
    }
  }

  return { segment: firstVideoSegment, thumbnailUrl };
});

const loaderFn = createServerFn().handler(async () => {
  const segments = await getSegmentsUseCase();
  const stats = await getCourseStatsUseCase();
  const shouldShowEarlyAccess = await shouldShowEarlyAccessFn();
  const signupsCount = await getNewsletterSignupsCount();
  const firstVideoData = await getFirstVideoSegmentFn();
  return {
    segments,
    stats,
    shouldShowEarlyAccess,
    waitlistCount: signupsCount.waitlist,
    firstVideoData,
  };
});

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    const [segments] = await Promise.all([loaderFn()]);
    return { ...segments };
  },
});

function Home() {
  const { segments, stats, shouldShowEarlyAccess, waitlistCount, firstVideoData } =
    Route.useLoaderData();

  // Ensure page starts at top on initial load (prevents scroll restoration from jumping to subscribe section)
  React.useEffect(() => {
    // Use requestAnimationFrame to ensure this runs after browser's scroll restoration
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Also ensure after a short delay in case browser tries to restore scroll position
    const timeoutId = setTimeout(scrollToTop, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b101a] text-slate-800 dark:text-slate-200">
      <div className="prism-bg" />
      <UnifiedHero
        isEarlyAccess={shouldShowEarlyAccess}
        waitlistCount={waitlistCount}
        initialVideoData={firstVideoData}
      />
      {!shouldShowEarlyAccess && <ShowcasesCTA />}
      {shouldShowEarlyAccess && <DiscordCommunitySection />}
      <FutureOfCodingSection />
      {stats && <StatsSection stats={stats} />}
      <ResearchSourcesSection />
      {segments.length > 0 && (
        <div className={shouldShowEarlyAccess ? "opacity-80" : ""}>
          <ModulesSection
            segments={segments}
            isDisabled={shouldShowEarlyAccess}
          />
        </div>
      )}
      {!shouldShowEarlyAccess && <NewsletterSection />}
      <InstructorSection />
      {!shouldShowEarlyAccess && <TestimonialsSection />}
      {!shouldShowEarlyAccess && <PricingSection />}
      <FAQSection isEarlyAccess={shouldShowEarlyAccess} />
    </div>
  );
}
