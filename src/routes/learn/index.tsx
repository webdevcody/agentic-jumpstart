import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { unauthenticatedMiddleware } from "~/lib/auth";
import { getSegments } from "~/data-access/segments";
import { Button, buttonVariants } from "~/components/ui/button";
import { isAdminFn } from "~/fn/auth";
import { ScrollAnimation } from "~/components/scroll-animation";
import { ArrowRight, BookOpen, Play } from "lucide-react";

const getSegmentsFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .handler(async () => {
    return await getSegments();
  });

export const Route = createFileRoute("/learn/")({
  component: RouteComponent,
  loader: async () => {
    const isAdmin = await isAdminFn();
    const segments = await getSegmentsFn();
    return { isAdmin, segments };
  },
});

function RouteComponent() {
  const { isAdmin, segments } = Route.useLoaderData();

  if (segments.length === 0) {
    return (
      <section className="relative w-full min-h-screen flex items-center justify-center">
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
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <ScrollAnimation direction="down" delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
                <BookOpen className="w-4 h-4 mr-2" />
                Learning Platform
              </div>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.1}>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent leading-tight">
                {isAdmin ? "Ready to Create?" : "Coming Soon"}
              </h1>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.2}>
              <p className="text-description mb-12 max-w-xl mx-auto">
                {isAdmin
                  ? "You have not added any learning content yet. Get started by creating your first module and begin building your course."
                  : "The course content is still under development. Please check back later for exciting learning materials."}
              </p>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAdmin ? (
                  <Link
                    to="/learn/add"
                    className={buttonVariants({ variant: "default" })}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Create a Module
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to="/"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Back to Home
                  </Link>
                )}
              </div>
            </ScrollAnimation>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        <div className="section-divider-glow-bottom"></div>
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center">
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
        <div className="floating-element-small bottom-20 left-20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollAnimation direction="down" delay={0}>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
              Agentic Coding Course
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="up" delay={0.1}>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Welcome to the{" "}
              <span className="bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent">
                Course
              </span>
            </h1>
          </ScrollAnimation>

          <ScrollAnimation direction="up" delay={0.2}>
            <p className="text-description mb-12 max-w-2xl mx-auto">
              Ready to start your journey into agentic coding? Begin with the
              first lesson and master AI-first development techniques that will
              transform your programming workflow.
            </p>
          </ScrollAnimation>

          <ScrollAnimation direction="up" delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-2xl mx-auto">
              <Link
                to={`/learn/$slug`}
                params={{ slug: segments[0].slug }}
                className={buttonVariants({ variant: "default", size: "lg" })}
              >
                <Play className="mr-2 h-5 w-5" />
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="up" delay={0.4}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="module-card p-6 rounded-xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/10 dark:border-white/10">
                <div className="w-12 h-12 rounded-lg bg-theme-500/10 dark:bg-theme-400/10 flex items-center justify-center mb-4 mx-auto">
                  <Play className="w-6 h-6 text-theme-600 dark:text-theme-400" />
                </div>
                <h3 className="font-semibold mb-2">Interactive Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Hands-on lessons with real code examples
                </p>
              </div>
              <div className="module-card p-6 rounded-xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/10 dark:border-white/10">
                <div className="w-12 h-12 rounded-lg bg-theme-500/10 dark:bg-theme-400/10 flex items-center justify-center mb-4 mx-auto">
                  <BookOpen className="w-6 h-6 text-theme-600 dark:text-theme-400" />
                </div>
                <h3 className="font-semibold mb-2">Structured Modules</h3>
                <p className="text-sm text-muted-foreground">
                  Step-by-step progression through concepts
                </p>
              </div>
              <div className="module-card p-6 rounded-xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/10 dark:border-white/10">
                <div className="w-12 h-12 rounded-lg bg-theme-500/10 dark:bg-theme-400/10 flex items-center justify-center mb-4 mx-auto">
                  <ArrowRight className="w-6 h-6 text-theme-600 dark:text-theme-400" />
                </div>
                <h3 className="font-semibold mb-2">Expert Guidance</h3>
                <p className="text-sm text-muted-foreground">
                  Learn from industry best practices
                </p>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}
