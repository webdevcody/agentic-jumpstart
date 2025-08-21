import { MessageCircle, Users, Heart, ArrowRight } from "lucide-react";
import { ScrollAnimation, ScrollScale } from "~/components/scroll-animation";
import { Button } from "~/components/ui/button";
import { DISCORD_INVITE_LINK } from "~/config";

export function DiscordCommunitySection() {
  return (
    <section className="relative w-full py-24">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-500/5 dark:via-theme-950/10 to-transparent"></div>

      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="circuit-pattern absolute inset-0"></div>
      </div>

      <div className="floating-elements">
        <div className="floating-element-1"></div>
        <div className="floating-element-2"></div>
        <div className="floating-element-3"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <ScrollAnimation direction="down" delay={0.1}>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50/50 dark:bg-green-950/20 backdrop-blur-sm border border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2 animate-pulse"></span>
              100% Free Community
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="up" delay={0.1}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl leading-tight mb-6 md:mb-8">
              Join Our <span className="text-theme-400">Discord Community</span>
              <br />
              While You Wait
            </h2>
          </ScrollAnimation>

          <ScrollAnimation direction="up" delay={0.1}>
            <p className="text-sm md:text-base lg:text-lg text-description mb-8 md:mb-12 max-w-4xl mx-auto">
              Connect with thousands of AI developers, share your projects, get
              instant help, and stay updated on the latest agentic coding
              techniques. Our community is active 24/7 and completely free to
              join.
            </p>
          </ScrollAnimation>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <ScrollScale delay={0.1}>
            <CommunityHighlight
              icon={
                <Users className="w-8 h-8 text-green-500 group-hover:text-green-400 group-hover:scale-110 transition-all duration-300" />
              }
              title="113+ Members"
              description="Join a thriving community of AI enthusiasts, from beginners to experts, all sharing knowledge and growing together."
            />
          </ScrollScale>

          <ScrollScale delay={0.1}>
            <CommunityHighlight
              icon={
                <MessageCircle className="w-8 h-8 text-green-500 group-hover:text-green-400 group-hover:scale-110 transition-all duration-300" />
              }
              title="Daily Discussions"
              description="Engage in active conversations about AI tools, coding challenges, project showcases, and industry insights."
            />
          </ScrollScale>

          <ScrollScale delay={0.1}>
            <CommunityHighlight
              icon={
                <Heart className="w-8 h-8 text-green-500 group-hover:text-green-400 group-hover:scale-110 transition-all duration-300" />
              }
              title="Supportive Environment"
              description="Get help when you're stuck, celebrate wins with fellow developers, and learn from real-world experiences."
            />
          </ScrollScale>
        </div>

        <ScrollAnimation direction="up" delay={0.1}>
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={DISCORD_INVITE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="text-lg px-8 py-4 h-auto group bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Join Discord Community
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Free Forever • No Spam • Instant Access
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}

interface CommunityHighlightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function CommunityHighlight({
  icon,
  title,
  description,
}: CommunityHighlightProps) {
  return (
    <div className="group relative h-full bg-white/10 dark:bg-green-500/10 backdrop-blur-md border-2 border-green-300/50 dark:border-green-600/50 rounded-2xl p-8 hover:border-green-400 dark:hover:border-green-500 transition-all duration-500 hover:bg-white/15 dark:hover:bg-green-500/15 hover:shadow-2xl hover:shadow-green-500/20">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>

      <div className="relative z-10">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6 group-hover:bg-green-500/30 transition-all duration-300">
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-4 group-hover:text-green-400 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
          {description}
        </p>
      </div>
    </div>
  );
}
