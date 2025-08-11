import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "./-components/hero";
import { ModulesSection } from "./-components/modules";
import { PricingSection } from "./-components/pricing";
import { FAQSection } from "./-components/faq";
import { createServerFn } from "@tanstack/react-start";
import { getSegmentsUseCase } from "~/use-cases/segments";
import { NewsletterSection } from "./-components/newsletter";
import { TestimonialsSection } from "./-components/testimonials";

const loaderFn = createServerFn().handler(async () => {
  const segments = await getSegmentsUseCase();
  return { segments };
});

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    const [segments] = await Promise.all([loaderFn()]);
    return { ...segments };
  },
});

function Home() {
  const { segments } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      {/* <NewsletterSection /> */}
      <ModulesSection segments={segments} />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
    </div>
  );
}
