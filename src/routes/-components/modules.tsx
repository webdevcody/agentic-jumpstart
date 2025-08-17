import { Link } from "@tanstack/react-router";
import { type Segment } from "~/db/schema";
import { Badge } from "~/components/ui/badge";
import {
  Lock,
  Play,
  CheckCircle,
  Circle,
  BookOpen,
  Code,
  Brain,
  Rocket,
} from "lucide-react";
import { Stat } from "~/components/ui/stat";
import { createServerFn } from "@tanstack/react-start";
import { getModules } from "~/data-access/modules";
import { useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { ScrollAnimation, ScrollScale } from "~/components/scroll-animation";

function formatDuration(durationInMinutes: number) {
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = Math.round(durationInMinutes % 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function calculateDuration(segments: Segment[]) {
  return segments.reduce((acc, segment) => {
    if (!segment.length) return acc;
    const [minutes, seconds] = segment.length.split(":").map(Number);
    return acc + minutes + seconds / 60;
  }, 0);
}

export const getModulesFn = createServerFn().handler(async ({ context }) => {
  const modules = await getModules();
  return modules;
});

const getModuleIcon = (moduleId: string) => {
  switch (moduleId) {
    case "1":
      return <BookOpen className="w-6 h-6" />;
    case "2":
      return <Code className="w-6 h-6" />;
    case "3":
      return <Brain className="w-6 h-6" />;
    default:
      return <Rocket className="w-6 h-6" />;
  }
};

export function ModulesSection({
  segments,
  isDisabled = false,
}: {
  segments: Segment[];
  isDisabled?: boolean;
}) {
  // Group segments by moduleId
  const modules = segments.reduce(
    (acc, segment) => {
      if (!acc[segment.moduleId]) {
        acc[segment.moduleId] = [];
      }
      acc[segment.moduleId].push(segment);
      return acc;
    },
    {} as Record<string, Segment[]>
  );

  // Sort segments within each module by order
  Object.keys(modules).forEach((moduleId) => {
    modules[moduleId].sort((a, b) => a.order - b.order);
  });

  const { data: moduleData } = useQuery({
    queryKey: ["modules"],
    queryFn: getModulesFn,
  });

  const moduleEntries = Object.entries(modules);

  // Calculate total duration
  const totalDurationMinutes = calculateDuration(segments);
  const formattedTotalDuration = formatDuration(totalDurationMinutes);

  return (
    <section className="relative w-full py-24">
      {/* Modern AI-themed gradient background - matching hero */}
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
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section header */}
          <div className="text-center mb-16">
            {/* Badge - matching hero style */}
            <ScrollAnimation direction="down" delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                Everyone can be a 10x developer
              </div>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.0}>
              <h2 className="text-6xl leading-tight mb-8">
                The Perfect Curriculum to{" "}
                <span className="text-theme-400">Master Agentic Coding</span>
              </h2>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.1}>
              <p className="text-description mb-12 max-w-4xl mx-auto">
                Learn to leverage AI tools like Cursor, Claude Code, and
                advanced models to build applications faster than ever. From
                setup to deployment, master the complete AI-assisted development
                workflow.
              </p>
            </ScrollAnimation>
          </div>

          {/* Module progression */}
          <div className="mb-16">
            <div className="space-y-8">
              {moduleEntries.map(([moduleId, moduleSegments], index) => {
                const moduleInfo = moduleData?.find(
                  (m) => m.id === Number(moduleId)
                );
                const moduleDurationMinutes = calculateDuration(moduleSegments);
                const formattedModuleDuration = formatDuration(
                  moduleDurationMinutes
                );

                return (
                  <ScrollAnimation
                    key={moduleId}
                    direction="up"
                    delay={0.1 + index * 0.15}
                    className="relative"
                  >
                    {/* Connector line */}
                    {index < moduleEntries.length - 1 && (
                      <div className="absolute left-8 top-20 w-px h-16 bg-gradient-to-b from-theme-300 to-theme-100 dark:from-theme-700 dark:to-theme-900"></div>
                    )}

                    <div className="flex gap-6">
                      {/* Module indicator */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full border-4 border-theme-500 bg-theme-100 dark:bg-theme-900/50 flex items-center justify-center">
                          <div className="text-theme-500 dark:text-theme-400">
                            {getModuleIcon(moduleId)}
                          </div>
                        </div>
                      </div>

                      {/* Module content */}
                      <div className="flex-grow bg-gradient-to-b from-white to-theme-50/20 dark:to-gray-900 dark:from-theme-900/40 backdrop-blur-sm p-8 rounded-xl border border-border hover:border-theme-300 dark:hover:border-theme-700 transition-all duration-300">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <h4 className="text-2xl font-bold">
                            {moduleInfo?.title || `Module ${moduleId}`}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-theme-600 dark:text-theme-400"
                          >
                            {formattedModuleDuration}
                          </Badge>
                          <Badge className="bg-theme-100 text-theme-800 dark:bg-theme-900/30 dark:text-theme-400">
                            {moduleSegments.length} lessons
                          </Badge>
                        </div>

                        <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                          Learn essential AI development skills and master
                          cutting-edge tools in this comprehensive module.
                        </p>

                        {/* Lessons grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {moduleSegments.map((segment, segmentIndex) => {
                            const lessonContent = (
                              <>
                                <div className="flex-shrink-0 mt-1">
                                  <Circle className="w-4 h-4 text-theme-500 dark:text-theme-400" />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">
                                      {segment.title}
                                    </span>
                                    {segment.isComingSoon ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 text-xs"
                                      >
                                        COMING SOON
                                      </Badge>
                                    ) : !segment.isPremium ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 text-xs"
                                      >
                                        FREE
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1 text-xs"
                                      >
                                        <Lock className="w-3 h-3" />
                                        PREMIUM
                                      </Badge>
                                    )}
                                  </div>
                                  {segment.length && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {segment.length}
                                    </p>
                                  )}
                                </div>
                              </>
                            );

                            if (isDisabled) {
                              return (
                                <div
                                  key={segment.id}
                                  className="group/lesson flex items-start gap-3 p-4 rounded-lg border border-border bg-white dark:bg-gray-900 opacity-60 cursor-not-allowed"
                                >
                                  {lessonContent}
                                </div>
                              );
                            }

                            return (
                              <Link
                                key={segment.id}
                                to="/learn/$slug"
                                params={{ slug: segment.slug }}
                                className="group/lesson flex items-start gap-3 p-4 rounded-lg border border-border bg-white dark:bg-gray-900 hover:border-theme-300 dark:hover:border-theme-700 transition-all duration-200 hover:bg-accent/50"
                              >
                                {lessonContent}
                              </Link>
                            );
                          })}
                        </div>

                        {/* Start module button */}
                        <div className="flex justify-end">
                          {isDisabled ? (
                            <Button
                              className="bg-gray-400 text-white cursor-not-allowed"
                              disabled
                            >
                              Available Soon <Lock className="w-4 h-4 ml-2" />
                            </Button>
                          ) : (
                            <Link
                              to="/learn/$slug"
                              params={{ slug: moduleSegments[0]?.slug }}
                            >
                              <Button className="bg-theme-600 hover:bg-theme-700 text-white">
                                Start Module <Play className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollAnimation>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade with theme accent - matching hero */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}
