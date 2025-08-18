import { createFileRoute } from "@tanstack/react-router";
import { ScrollAnimation, ScrollScale } from "~/components/scroll-animation";
import { Button } from "~/components/ui/button";
import {
  MessageCircle,
  Users,
  Zap,
  Heart,
  Code,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { DISCORD_INVITE_LINK } from "~/config";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative w-full py-24 pt-32">
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
            <ScrollAnimation direction="down" delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                Join the Revolution
              </div>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.1}>
              <h1 className="text-6xl leading-tight mb-8">
                Connect with{" "}
                <span className="text-theme-400">AI Enthusiasts</span>
                <br />
                <span className="text-theme-400">Worldwide</span>
              </h1>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.2}>
              <p className="text-description mb-12 max-w-4xl mx-auto text-lg">
                Join our thriving Discord community of AI developers, agentic
                coding pioneers, and automation enthusiasts. Share knowledge,
                get help, and shape the future of programming together.
              </p>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.3}>
              <a
                href={DISCORD_INVITE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button size="lg" className="text-lg px-8 py-4 h-auto group">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Join Discord Community
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </ScrollAnimation>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        <div className="section-divider-glow-bottom"></div>
      </section>

      {/* Community Features */}
      <section className="relative w-full py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/5 dark:via-theme-950/10 to-transparent"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <ScrollAnimation direction="up" delay={0}>
              <h2 className="text-4xl font-bold mb-6">
                Why Join Our <span className="text-theme-400">Community</span>?
              </h2>
              <p className="text-description text-lg max-w-3xl mx-auto">
                Connect with like-minded developers who are pushing the
                boundaries of what's possible with AI-powered development.
              </p>
            </ScrollAnimation>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <ScrollScale delay={0.1}>
              <CommunityFeatureCard
                icon={
                  <Users className="w-8 h-8 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
                }
                title="Expert Network"
                description="Connect with experienced developers, AI researchers, and industry leaders who are pioneering agentic development practices."
              />
            </ScrollScale>

            <ScrollScale delay={0.2}>
              <CommunityFeatureCard
                icon={
                  <Code className="w-8 h-8 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
                }
                title="Code Reviews"
                description="Get feedback on your agentic coding projects and learn from real-world implementations shared by community members."
              />
            </ScrollScale>

            <ScrollScale delay={0.3}>
              <CommunityFeatureCard
                icon={
                  <Lightbulb className="w-8 h-8 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
                }
                title="Latest Insights"
                description="Stay updated with the newest AI tools, techniques, and breakthrough discoveries in the rapidly evolving field."
              />
            </ScrollScale>

            <ScrollScale delay={0.4}>
              <CommunityFeatureCard
                icon={
                  <Zap className="w-8 h-8 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
                }
                title="Quick Help"
                description="Get instant support when you're stuck. Our community is known for rapid, helpful responses to technical questions."
              />
            </ScrollScale>

            <ScrollScale delay={0.5}>
              <CommunityFeatureCard
                icon={
                  <Heart className="w-8 h-8 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
                }
                title="Supportive Environment"
                description="Whether you're a beginner or expert, our welcoming community celebrates learning and growth at every level."
              />
            </ScrollScale>

            <ScrollScale delay={0.6}>
              <CommunityFeatureCard
                icon={
                  <MessageCircle className="w-8 h-8 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
                }
                title="Active Discussions"
                description="Engage in meaningful conversations about AI ethics, best practices, and the future of software development."
              />
            </ScrollScale>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative w-full py-24">
        <div className="absolute inset-0 hero-background-ai"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/10 dark:via-theme-950/20 to-transparent"></div>

        <div className="floating-elements">
          <div className="floating-element-1"></div>
          <div className="floating-element-2"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <ScrollAnimation direction="up" delay={0}>
            <h2 className="text-5xl font-bold mb-8">
              Ready to Join the <span className="text-theme-400">Future</span>?
            </h2>
            <p className="text-description text-xl mb-12 max-w-3xl mx-auto">
              Don't code alone. Join thousands of developers who are already
              leveraging AI to build the impossible. Your next breakthrough is
              just one conversation away.
            </p>
          </ScrollAnimation>

          <ScrollAnimation direction="up" delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={DISCORD_INVITE_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="text-lg px-8 py-4 h-auto group">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Join Discord Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <p className="text-sm text-muted-foreground">
                100% Free • No Spam • Active Community
              </p>
            </div>
          </ScrollAnimation>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      </section>
    </div>
  );
}

interface CommunityFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function CommunityFeatureCard({
  icon,
  title,
  description,
}: CommunityFeatureCardProps) {
  return (
    <div className="group relative h-full bg-white/10 dark:bg-theme-500/10 backdrop-blur-md border-2 border-gray-300 dark:border-gray-600 rounded-2xl p-8 hover:border-theme-400 dark:hover:border-theme-500 transition-all duration-500 hover:bg-white/15 dark:hover:bg-theme-500/15 hover:shadow-2xl hover:shadow-theme-500/20">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-theme-500/0 via-theme-500/10 to-theme-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>

      <div className="relative z-10">
        <div className="w-16 h-16 rounded-full bg-theme-500/20 flex items-center justify-center mb-6 group-hover:bg-theme-500/30 transition-all duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-4 group-hover:text-theme-400 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
          {description}
        </p>
      </div>
    </div>
  );
}
