import { Zap, Brain, Rocket } from "lucide-react";
import { ScrollAnimation, ScrollScale } from "~/components/scroll-animation";

export function FutureOfCodingSection() {
  return (
    <section className="relative w-full py-12 md:py-24">
      <div className="absolute inset-0 hero-background-ai"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/5 dark:via-theme-950/20 to-transparent"></div>

      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="circuit-pattern absolute inset-0"></div>
      </div>

      <div className="floating-elements">
        <div className="floating-element-1"></div>
        <div className="floating-element-2"></div>
        <div className="floating-element-3"></div>
        <div className="floating-element-small top-10 right-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-8 md:mb-16">
          <ScrollAnimation direction="down" delay={0.1}>
            <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-xs md:text-sm font-medium mb-6 md:mb-8">
              <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
              The Revolution is Here
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="up" delay={0.1}>
            <h2 className="text-3xl md:text-4xl lg:text-6xl leading-tight mb-6 md:mb-8">
              Coding is <span className="text-theme-400">Evolving</span>,
              Embrace{" "}
              <span className="text-theme-400">Agentic Programming</span>{" "}
            </h2>
          </ScrollAnimation>

          <ScrollAnimation direction="up" delay={0.1}>
            <p className="text-description mb-8 md:mb-12 max-w-4xl mx-auto text-sm md:text-base lg:text-lg">
              The era of manual coding is transforming. AI-powered development
              isn't just a trend—it's the future. While traditional developers
              spend hours debugging and writing boilerplate, agentic coders
              leverage AI models like Opus 4.5, Composer1, and GPT-5.1 Codex to build
              complex applications in minutes, not days.
            </p>
          </ScrollAnimation>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-16 items-stretch">
          <ScrollScale delay={0.1}>
            <FeatureCard
              icon={
                <Zap className="w-8 h-8 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
              }
              title="10x Speed"
              description="Build entire applications in the time it takes to write a single component manually. AI agents handle the implementation while you focus on architecture and business logic."
              glyphPath="M13 2.05v2.02c4.39.54 7.5 4.53 6.96 8.92-.39 3.18-2.34 5.13-5.52 5.52-4.39.54-8.38-2.57-8.92-6.96S7.1 3.05 11.49 2.51c.17-.02.34-.03.51-.03V2.05c-5.04.5-9 4.76-8.5 9.8.5 5.04 4.76 9 9.8 8.5s9-4.76 8.5-9.8c-.39-3.93-3.57-7.11-7.5-7.5z"
              glyphExtra={
                <circle cx="12" cy="12" r="3" className="animate-pulse" />
              }
            />
          </ScrollScale>

          <ScrollScale delay={0.2}>
            <FeatureCard
              icon={
                <Brain className="w-8 h-8 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
              }
              title="AI-First Mindset"
              description="Learn to think in terms of agents and systems. Direct AI to solve complex problems while maintaining full control over the architecture and quality of your code."
              glyphPath="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              glyphExtra={
                <circle cx="12" cy="8" r="2" className="animate-bounce" />
              }
            />
          </ScrollScale>

          <ScrollScale delay={0.3}>
            <FeatureCard
              icon={
                <Rocket className="w-8 h-8 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
              }
              title="Ship Faster"
              description="Deploy production-ready applications in days, not months. Let AI handle the tedious parts while you innovate and create value for your users."
              glyphPath="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              glyphExtra={
                <path
                  d="M12 6l1.5 3L17 9.5l-2.5 2.5L15 16l-3-1.5L9 16l.5-4L7 9.5l3.5-.5L12 6z"
                  className="animate-ping"
                />
              }
            />
          </ScrollScale>
        </div>

        <ScrollAnimation direction="up" delay={0.1}>
          <div className="text-center">
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Companies are already adopting agentic coding practices.
              Developers who master these tools today will lead the teams of
              tomorrow. Don't get left behind in the AI revolution.
            </p>
          </div>
        </ScrollAnimation>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  glyphPath: string;
  glyphExtra?: React.ReactNode;
}

function FeatureCard({
  icon,
  title,
  description,
  glyphPath,
  glyphExtra,
}: FeatureCardProps) {
  return (
    <div className="group relative h-full bg-white/10 dark:bg-theme-500/10 backdrop-blur-md border-2 border-gray-300 dark:border-gray-600 rounded-2xl p-8 hover:border-theme-400 dark:hover:border-theme-500 transition-all duration-500 hover:bg-white/15 dark:hover:bg-theme-500/15 hover:shadow-2xl hover:shadow-theme-500/20">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-theme-500/0 via-theme-500/10 to-theme-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>

      {/* Animated background glyph */}
      <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
        <svg
          className="w-16 h-16 text-theme-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d={glyphPath} />
          {glyphExtra}
        </svg>
      </div>

      <div className="relative z-10">
        <div className="w-16 h-16 rounded-full bg-theme-500/20 flex items-center justify-center mb-6 group-hover:bg-theme-500/30 transition-all duration-300">
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-4 group-hover:text-theme-400 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
          {description}
        </p>
      </div>
    </div>
  );
}
