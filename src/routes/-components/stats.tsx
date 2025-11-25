import { BookOpen, Play, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import type { CourseStats } from "~/use-cases/stats";
import { ScrollAnimation, ScrollScale } from "~/components/scroll-animation";

// Custom hook for random glowing effect
function useRandomGlow() {
  // 2 for decorative dots + 18 for keyword badges = 20 total elements
  const [glowStates, setGlowStates] = useState(new Array(20).fill(false));

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    // Create random intervals for each element
    glowStates.forEach((_, index) => {
      const interval = setInterval(
        () => {
          setGlowStates((prev) => {
            const newStates = [...prev];
            newStates[index] = !newStates[index];
            return newStates;
          });
        },
        Math.random() * 4000 + 3000
      ); // Random interval between 3-7 seconds for badges

      intervals.push(interval);
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, []);

  return glowStates;
}

interface StatsProps {
  stats: CourseStats;
}

export function StatsSection({ stats }: StatsProps) {
  const glowStates = useRandomGlow();

  const statsData = [
    {
      icon: BookOpen,
      value: stats.totalModules,
      label: "Modules",
      description: "Comprehensive learning modules",
    },
    {
      icon: Play,
      value: stats.totalSegments,
      label: "Video Segments",
      description: "Bite-sized video lessons",
    },
    {
      icon: Clock,
      value: stats.totalVideoLength,
      label: "Total Content",
      description: "Hours of premium content",
    },
  ];

  return (
    <section className="relative w-full py-16 overflow-hidden">
      {/* Background with theme colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-theme-50/10 to-theme-100/20 dark:from-background dark:via-theme-950/10 dark:to-theme-900/20"></div>

      {/* Circuit pattern overlay */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="circuit-pattern absolute inset-0"></div>
      </div>

      {/* Floating elements */}
      <div className="floating-elements">
        <div className="floating-element-small top-20 left-10"></div>
        <div className="floating-element-small bottom-20 right-10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section header */}
          <div className="text-center mb-12">
            <ScrollAnimation direction="up" delay={0}>
              <h2 className="text-4xl font-bold mb-4">
                Course <span className="text-theme-400">Overview</span>
              </h2>
            </ScrollAnimation>
            <ScrollAnimation direction="up" delay={0}>
              <p className="text-description max-w-2xl mx-auto">
                Comprehensive agentic coding curriculum designed to transform
                your development workflow
              </p>
            </ScrollAnimation>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <ScrollScale
                  key={index}
                  delay={0.1 + index * 0.2}
                  className="group relative"
                >
                  {/* Card with glass morphism and glow effect */}
                  <div className="relative overflow-hidden rounded-2xl bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-theme-200/60 dark:border-theme-500/30 shadow-elevation-2 transition-all duration-300 hover:shadow-glow-cyan hover:border-theme-400/80 hover:-translate-y-1 p-8">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-theme-500/5 to-theme-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>

                    {/* Icon */}
                    <div className="relative mb-6">
                      <div className="w-16 h-16 mx-auto rounded-full bg-theme-500/10 dark:bg-theme-400/20 flex items-center justify-center group-hover:bg-theme-500/20 dark:group-hover:bg-theme-400/30 transition-colors duration-300">
                        <Icon className="w-8 h-8 text-theme-500 dark:text-theme-400 group-hover:text-theme-600 dark:group-hover:text-theme-300 transition-colors duration-300" />
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-center mb-2">
                      <div className="text-4xl font-bold text-foreground group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors duration-300">
                        {stat.value}
                      </div>
                    </div>

                    {/* Label */}
                    <div className="text-center mb-3">
                      <div className="text-xl font-semibold text-theme-600 dark:text-theme-400">
                        {stat.label}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">
                        {stat.description}
                      </div>
                    </div>

                    {/* Decorative elements with random glow */}
                    <div
                      className={`absolute top-4 right-4 w-2 h-2 bg-theme-400/30 rounded-full transition-all duration-1000 ${
                        glowStates[0]
                          ? "opacity-100 scale-125 shadow-lg shadow-theme-400/50"
                          : "opacity-0 scale-100"
                      }`}
                    ></div>
                    <div
                      className={`absolute bottom-4 left-4 w-1.5 h-1.5 bg-theme-500/30 rounded-full transition-all duration-1000 ${
                        glowStates[1]
                          ? "opacity-100 scale-125 shadow-lg shadow-theme-500/50"
                          : "opacity-0 scale-100"
                      }`}
                    ></div>
                  </div>
                </ScrollScale>
              );
            })}
          </div>

          {/* Marketing Keywords Section - SEO Optimized */}
          <div className="mt-16 text-center">
            <ScrollAnimation direction="up" delay={0.5}>
              <h3 className="text-2xl font-semibold mb-8 text-foreground">
                Master the Latest{" "}
                <span className="text-theme-400">AI Coding Tools</span> &
                Technologies
              </h3>
            </ScrollAnimation>

            {/* Keywords Grid */}
            <ScrollAnimation
              direction="up"
              delay={0.6}
              className="max-w-6xl mx-auto"
            >
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { text: "Cursor IDE", highlight: true },
                  { text: "Claude Code CLI", highlight: true },
                  { text: "Cursor Agent", highlight: false },
                  { text: "Opus 4.5", highlight: true },
                  { text: "Composer1", highlight: true },
                  { text: "GPT-5.1 Codex", highlight: true },
                  { text: "AI Pair Programming", highlight: false },
                  { text: "Agentic Development", highlight: false },
                  { text: "LLM Coding", highlight: false },
                  { text: "AI Code Generation", highlight: false },
                  { text: "Prompt Engineering", highlight: false },
                  { text: "AI Workflow Automation", highlight: false },
                  { text: "Claude API", highlight: false },
                  { text: "AI-First Development", highlight: true },
                  { text: "Code Assistant AI", highlight: false },
                  { text: "Windsurf IDE", highlight: false },
                  { text: "AI Coding Patterns", highlight: false },
                  { text: "MCP Servers", highlight: false },
                  { text: "Multi-Agent Systems", highlight: false },
                ].map((keyword, index) => (
                  <div
                    key={index}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium
                      transition-all duration-1000 cursor-default relative
                      ${
                        keyword.highlight
                          ? `bg-theme-500/10 dark:bg-theme-400/20 text-theme-600 dark:text-theme-400 border border-theme-400/30 hover:bg-theme-500/20 dark:hover:bg-theme-400/30 hover:border-theme-400/50 hover:shadow-glow-sm ${
                              glowStates[index + 2]
                                ? "scale-105 shadow-lg shadow-theme-400/40 border-theme-400/60"
                                : ""
                            }`
                          : `bg-card/60 dark:bg-card/40 text-foreground/80 border border-border/50 hover:bg-card/80 dark:hover:bg-card/60 hover:text-foreground hover:border-border ${
                              glowStates[index + 2]
                                ? "scale-105 shadow-lg shadow-border/30 border-border/70"
                                : ""
                            }`
                      }
                    `}
                  >
                    {keyword.text}
                  </div>
                ))}
              </div>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.7}>
              {/* Call to Action Text */}
              <p className="mt-10 text-lg text-muted-foreground max-w-3xl mx-auto">
                Join the{" "}
                <span className="font-semibold text-theme-500 dark:text-theme-400">
                  best agentic coding course
                </span>{" "}
                available and learn how to leverage cutting-edge AI models to
                build applications
                <span className="font-semibold"> 10x faster</span> than
                traditional programming. Perfect for developers ready to master{" "}
                <span className="font-semibold">AI-augmented development</span>{" "}
                and stay ahead in the rapidly evolving world of{" "}
                <span className="font-semibold">AI coding assistants</span>.
              </p>
            </ScrollAnimation>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}
