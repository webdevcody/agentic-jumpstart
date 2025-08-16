import { useNewsletterSubscription } from "~/hooks/use-newsletter-subscription";
import { Button } from "~/components/ui/button";
import { ModulesSection } from "./modules";
import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getSegments } from "~/data-access/segments";
import { Play, Users, Award, Zap, Brain, Rocket } from "lucide-react";

const getSegmentsFn = createServerFn().handler(async () => {
  const segments = await getSegments();
  return segments;
});

const productivityData = [
  { category: "Traditional", hours: 40, output: 10, quality: 60 },
  { category: "Agentic", hours: 40, output: 80, quality: 95 },
];

const timeComparisonData = [
  { task: "Building REST API", traditional: 16, agentic: 2 },
  { task: "Creating UI Components", traditional: 12, agentic: 1.5 },
  { task: "Writing Unit Tests", traditional: 8, agentic: 1 },
  { task: "Refactoring Code", traditional: 10, agentic: 1.5 },
  { task: "Documentation", traditional: 6, agentic: 0.5 },
  { task: "Debugging Complex Issues", traditional: 14, agentic: 2 },
];

const skillRadarData = [
  { skill: "Speed", traditional: 20, agentic: 95 },
  { skill: "Quality", traditional: 60, agentic: 90 },
  { skill: "Innovation", traditional: 40, agentic: 85 },
  { skill: "Scalability", traditional: 30, agentic: 92 },
  { skill: "Maintainability", traditional: 50, agentic: 88 },
  { skill: "Testing", traditional: 35, agentic: 90 },
];

const growthData = [
  { month: "Month 1", traditional: 100, agentic: 100 },
  { month: "Month 2", traditional: 110, agentic: 180 },
  { month: "Month 3", traditional: 115, agentic: 350 },
  { month: "Month 4", traditional: 120, agentic: 600 },
  { month: "Month 5", traditional: 125, agentic: 900 },
  { month: "Month 6", traditional: 130, agentic: 1400 },
];

export function EarlyAccessSection() {
  const { email, setEmail, isSubmitted, isLoading, handleSubmit } =
    useNewsletterSubscription();

  const { data: segments = [] } = useQuery({
    queryKey: ["segments"],
    queryFn: getSegmentsFn,
  });

  return (
    <>
      {/* Original Early Access Hero Section */}
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
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Logo with glow effect */}
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

            <div className="mb-12">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                Early Access Registration
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent animate-gradient leading-normal pb-1">
                Coming Soon
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-4">
                Master the future of coding with AI—learn to build agentic
                systems that work for you.
              </p>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Join our exclusive waiting list to be the first to access our
                groundbreaking course, designed to teach you agentic coding and
                empower you to create intelligent, autonomous software using the
                latest in AI-powered development.
              </p>
            </div>

            {isSubmitted ? (
              <div className="relative">
                {/* Success card with glass morphism */}
                <div className="relative bg-white/10 dark:bg-theme-500/10 backdrop-blur-md border border-theme-200/50 dark:border-theme-500/30 rounded-2xl p-8 max-w-md mx-auto shadow-2xl">
                  {/* Glow effect behind card */}
                  <div className="absolute inset-0 bg-theme-500/10 blur-3xl rounded-full"></div>

                  <div className="relative">
                    <div className="mb-4">
                      <div className="relative inline-block">
                        <svg
                          className="w-16 h-16 mx-auto text-theme-500 dark:text-theme-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {/* Icon glow */}
                        <div className="absolute inset-0 bg-theme-500/20 blur-xl"></div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-theme-600 dark:text-theme-400 mb-2">
                      You're on the list!
                    </h3>
                    <p className="text-muted-foreground">
                      We'll notify you as soon as we're ready to launch.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="max-w-md mx-auto relative"
              >
                {/* Form glow effect */}
                <div className="absolute inset-0 bg-theme-500/5 blur-3xl"></div>

                <div className="relative flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-3 h-14 text-lg rounded-lg bg-white/80 dark:bg-background/80 backdrop-blur-sm text-foreground border border-theme-200/50 dark:border-border/50 focus:outline-none focus:border-theme-500 focus:ring-2 focus:ring-theme-500/30 transition-all duration-300 hover:border-theme-400/50"
                    required
                    autoFocus
                  />
                  <Button
                    type="submit"
                    className="px-8 h-14 text-lg font-medium bg-gradient-to-r from-theme-500 to-theme-600 hover:from-theme-600 hover:to-theme-700 transition-all duration-300 shadow-lg hover:shadow-theme-500/25"
                    disabled={isLoading}
                  >
                    {isLoading ? "Joining..." : "Join Waitlist"}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-16 relative">
              {/* Stats container with glass morphism */}
              <div className="relative bg-white/5 dark:bg-theme-500/5 backdrop-blur-sm border border-theme-200/20 dark:border-theme-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-center gap-8 text-muted-foreground">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent">
                      500+
                    </div>
                    <div className="text-sm">People waiting</div>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent">
                      Q3 2025
                    </div>
                    <div className="text-sm">Expected launch</div>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500 bg-clip-text text-transparent">
                      100%
                    </div>
                    <div className="text-sm">Worth the wait</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient divider */}
        <div className="section-divider-glow-bottom"></div>
      </div>

      {/* Future of Coding Section */}
      <section className="relative w-full py-24">
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

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
              The Revolution is Here
            </div>

            <h2 className="text-6xl leading-tight mb-8">
              Coding is <span className="text-theme-400">Evolving</span>,
              Embrace{" "}
              <span className="text-theme-400">Agentic Programming</span>{" "}
            </h2>

            <p className="text-description mb-12 max-w-4xl mx-auto text-lg">
              The era of manual coding is transforming. AI-powered development
              isn't just a trend—it's the future. While traditional developers
              spend hours debugging and writing boilerplate, agentic coders
              leverage AI models like Claude Sonnet 3.5 and Claude Opus to build
              complex applications in minutes, not days.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/10 dark:bg-theme-500/10 backdrop-blur-md border border-theme-200/50 dark:border-theme-500/30 rounded-2xl p-8">
              <div className="w-16 h-16 rounded-full bg-theme-500/20 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-theme-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">10x Speed</h3>
              <p className="text-muted-foreground">
                Build entire applications in the time it takes to write a single
                component manually. AI agents handle the implementation while
                you focus on architecture and business logic.
              </p>
            </div>

            <div className="bg-white/10 dark:bg-theme-500/10 backdrop-blur-md border border-theme-200/50 dark:border-theme-500/30 rounded-2xl p-8">
              <div className="w-16 h-16 rounded-full bg-theme-500/20 flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-theme-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI-First Mindset</h3>
              <p className="text-muted-foreground">
                Learn to think in terms of agents and systems. Direct AI to
                solve complex problems while maintaining full control over the
                architecture and quality of your code.
              </p>
            </div>

            <div className="bg-white/10 dark:bg-theme-500/10 backdrop-blur-md border border-theme-200/50 dark:border-theme-500/30 rounded-2xl p-8">
              <div className="w-16 h-16 rounded-full bg-theme-500/20 flex items-center justify-center mb-6">
                <Rocket className="w-8 h-8 text-theme-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ship Faster</h3>
              <p className="text-muted-foreground">
                Deploy production-ready applications in days, not months. Let AI
                handle the tedious parts while you innovate and create value for
                your users.
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Companies are already adopting agentic coding practices.
              Developers who master these tools today will lead the teams of
              tomorrow. Don't get left behind in the AI revolution.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        <div className="section-divider-glow-bottom"></div>
      </section>

      {/* Research Sources Section */}
      <section className="relative py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              The <span className="text-theme-400">Evidence</span> is Clear
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Agentic coding isn't just hype—it's the proven future of software
              development. Here's the research that shows why every developer
              needs to adapt now.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-3 text-green-600 dark:text-green-400">
                GitHub's Game-Changing Study
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>26% productivity boost</strong> in a rigorous trial with
                4,000+ developers. This isn't speculation—it's the new reality
                of coding with AI.
              </p>
              <a
                href="https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-theme-500 hover:underline break-all"
              >
                See the Research That Changed Everything →
              </a>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">
                McKinsey's Future Forecast
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>2x faster development</strong> while maintaining code
                quality. The consulting giant confirms: AI-powered coding is the
                competitive advantage.
              </p>
              <a
                href="https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/unleashing-developer-productivity-with-generative-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-theme-500 hover:underline break-all"
              >
                McKinsey's AI Productivity Report →
              </a>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">
                Developer Consensus 2024
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>76% of developers</strong> already use AI tools, with
                81% reporting measurable productivity gains. The industry has
                spoken.
              </p>
              <a
                href="https://survey.stackoverflow.co/2024/ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-theme-500 hover:underline break-all"
              >
                2024 Developer Survey Results →
              </a>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-3 text-amber-600 dark:text-amber-400">
                Amazon's Productivity Proof
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>57% faster task completion</strong> in controlled
                studies. When Amazon validates AI coding tools, you know they're
                here to stay.
              </p>
              <a
                href="https://aws.amazon.com/awstv/watch/f4551b7cb8c/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-theme-500 hover:underline break-all"
              >
                AWS Research Validation →
              </a>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">
                Enterprise Success Stories
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>40% productivity gain</strong> at Palo Alto Networks
                with 2,000 developers. Real companies, real results, real
                competitive advantage.
              </p>
              <a
                href="https://aws.amazon.com/partners/success/palo-alto-networks-anthropic-sourcegraph/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-theme-500 hover:underline break-all"
              >
                Enterprise AI Success Cases →
              </a>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-3 text-teal-600 dark:text-teal-400">
                Claude's Massive Scale
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>115,000 developers</strong> processing 195 million lines
                weekly. This is the largest AI coding experiment in history—and
                it's working.
              </p>
              <a
                href="https://www.anthropic.com/research/impact-software-development"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-theme-500 hover:underline break-all"
              >
                Anthropic's Economic Impact Study →
              </a>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>The future is here.</strong> These aren't
              predictions—they're proven results from 2024. Developers who adapt
              to agentic coding now will lead the industry tomorrow.
            </p>
          </div>
        </div>
      </section>

      {/* Course Preview Section */}
      {segments.length > 0 && (
        <div className="opacity-80">
          <ModulesSection segments={segments} isDisabled={true} />
        </div>
      )}

      {/* Instructor Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 hero-background-ai opacity-50"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
              Your Instructor
            </div>

            {/* Profile Picture with Gradient Background */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-theme-400 via-theme-500 to-theme-600 rounded-2xl blur-xl opacity-30"></div>
                <div className="relative bg-gradient-to-br from-theme-400 via-theme-500 to-theme-600 rounded-2xl p-1">
                  <img
                    src="/cody.png"
                    alt="Cody - Your Instructor"
                    className="w-32 h-32 rounded-xl object-cover"
                  />
                </div>
              </div>
            </div>

            <h2 className="text-5xl font-bold mb-6">
              Learn from a{" "}
              <span className="text-theme-400">
                <br />
                Experienced Web Developer
              </span>
            </h2>
          </div>

          <div className="bg-white/10 dark:bg-theme-500/10 backdrop-blur-md border border-theme-200/50 dark:border-theme-500/30 rounded-3xl p-12 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6">Cody</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Cody is the creator behind{" "}
                  <a
                    href="https://youtube.com/@WebDevCody"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-theme-500 hover:text-theme-400 underline"
                  >
                    WebDevCody
                  </a>
                  , one of the most prominent programming education channels on
                  YouTube with over{" "}
                  <span className="font-bold text-theme-500">
                    260,000 subscribers
                  </span>{" "}
                  and more than{" "}
                  <span className="font-bold text-theme-500">1,100 videos</span>{" "}
                  teaching coding concepts.
                </p>
                <p className="text-lg text-muted-foreground mb-6">
                  With over <span className="font-bold">12 years</span> of
                  professional web development experience, Cody has witnessed
                  firsthand the transformation from traditional coding to
                  AI-assisted development. He's been at the forefront of the
                  agentic coding revolution, using tools like Cursor IDE and
                  Claude to dramatically accelerate development workflows.
                </p>
                <p className="text-lg text-muted-foreground mb-8">
                  Through his extensive teaching experience and real-world
                  application of agentic coding techniques, Cody has developed a
                  unique approach to help developers transition from traditional
                  programming to becoming 10x more productive with AI-powered
                  tools.
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://youtube.com/@WebDevCody"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    YouTube Channel
                  </a>
                  <a
                    href="https://webdevcody.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-theme-600 hover:bg-theme-700 text-white rounded-lg transition-colors"
                  >
                    Personal Website
                  </a>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/10 dark:bg-background/20 rounded-xl p-6 border border-theme-200/20 dark:border-theme-500/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-theme-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-theme-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">260,000+</div>
                      <div className="text-sm text-muted-foreground">
                        YouTube Subscribers
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 dark:bg-background/20 rounded-xl p-6 border border-theme-200/20 dark:border-theme-500/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-theme-500/20 flex items-center justify-center">
                      <Play className="w-6 h-6 text-theme-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">1,100+</div>
                      <div className="text-sm text-muted-foreground">
                        Educational Videos
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 dark:bg-background/20 rounded-xl p-6 border border-theme-200/20 dark:border-theme-500/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-theme-500/20 flex items-center justify-center">
                      <Award className="w-6 h-6 text-theme-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">12+ Years</div>
                      <div className="text-sm text-muted-foreground">
                        Industry Experience
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center p-6 bg-gradient-to-r from-theme-500/10 to-theme-600/10 rounded-xl border border-theme-500/20">
                  <p className="text-lg italic text-muted-foreground">
                    "AI coding isn't replacing developers—it's amplifying them.
                    Master these tools now and become unstoppable."
                  </p>
                  <p className="text-sm text-theme-500 mt-2">- Cody</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
