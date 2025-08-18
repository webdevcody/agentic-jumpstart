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

const loaderFn = createServerFn().handler(async () => {
  const segments = await getSegmentsUseCase();
  const stats = await getCourseStatsUseCase();
  const shouldShowEarlyAccess = await shouldShowEarlyAccessFn();
  return { segments, stats, shouldShowEarlyAccess };
});

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    const [segments] = await Promise.all([loaderFn()]);
    return { ...segments };
  },
});

function Home() {
  const { segments, stats, shouldShowEarlyAccess } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Hero - dynamically switches based on early access mode */}
      <UnifiedHero isEarlyAccess={shouldShowEarlyAccess} />

      {/* Discord Community Section - early access mode only */}
      {shouldShowEarlyAccess && <DiscordCommunitySection />}

      {/* Future of Coding Section - always shown for value */}
      <FutureOfCodingSection />

      {/* Stats Section - when available */}
      {stats && <StatsSection stats={stats} />}

      {/* Research Sources - always shown */}
      <ResearchSourcesSection />

      {/* Course Preview/Modules */}
      {segments.length > 0 && (
        <div className={shouldShowEarlyAccess ? "opacity-80" : ""}>
          <ModulesSection
            segments={segments}
            isDisabled={shouldShowEarlyAccess}
          />
        </div>
      )}

      {/* Instructor Section - always shown */}
      <InstructorSection />

      {/* Testimonials - regular mode only */}
      {!shouldShowEarlyAccess && <TestimonialsSection />}

      {/* Pricing Section - regular mode only */}
      {!shouldShowEarlyAccess && <PricingSection />}

      {/* Enhanced FAQ - always shown with mode-specific questions */}
      <FAQSection isEarlyAccess={shouldShowEarlyAccess} />
    </div>
  );
}
