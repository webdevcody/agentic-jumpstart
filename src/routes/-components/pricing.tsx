import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { useEffect, useRef } from "react";
import { ShoppingCart, Check } from "lucide-react";

export function PricingSection() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    };

    card.addEventListener("mousemove", handleMouseMove);
    return () => card.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-4xl">
              {/* Badge - matching hero style */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                Limited Time Offer
              </div>

              <h2 className="text-6xl leading-tight mb-8">
                Master AI-First Development{" "}
                <span className="text-theme-400">With AI Agents</span>
              </h2>

              <p className="text-description mb-12 max-w-2xl mx-auto">
                Transform your coding workflow with advanced AI tools and
                techniques. Learn to build applications 10x faster using Cursor
                IDE, Claude Code CLI, and cutting-edge agentic programming
                methods.
              </p>

              <div ref={cardRef} className="relative max-w-lg mx-auto">
                <div className="video-container">
                  <div className="video-wrapper p-10">
                    <div className="relative z-10">
                      <h3 className="text-4xl font-bold mb-2 text-theme-600 dark:text-theme-400">
                        Agentic Coding Mastery
                      </h3>
                      <div className="text-6xl font-bold mb-8 text-foreground">
                        $199
                        <span className="text-lg text-muted-foreground/70 font-normal">
                          /lifetime access
                        </span>
                      </div>
                      <ul className="text-left space-y-6 mb-10">
                        <li className="flex items-center text-muted-foreground group">
                          <Check className="w-6 h-6 mr-3 text-theme-500 dark:text-theme-400 group-hover:scale-110 transition-transform" />
                          <span className="group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors">
                            Master Cursor IDE with AI pair programming and code
                            generation
                          </span>
                        </li>
                        <li className="flex items-center text-muted-foreground group">
                          <Check className="w-6 h-6 mr-3 text-theme-500 dark:text-theme-400 group-hover:scale-110 transition-transform" />
                          <span className="group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors">
                            Learn Claude Code CLI for seamless AI-assisted
                            development
                          </span>
                        </li>
                        <li className="flex items-center text-muted-foreground group">
                          <Check className="w-6 h-6 mr-3 text-theme-500 dark:text-theme-400 group-hover:scale-110 transition-transform" />
                          <span className="group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors">
                            Advanced prompting techniques for Claude Sonnet and
                            Opus
                          </span>
                        </li>
                        <li className="flex items-center text-muted-foreground group">
                          <Check className="w-6 h-6 mr-3 text-theme-500 dark:text-theme-400 group-hover:scale-110 transition-transform" />
                          <span className="group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors">
                            Build real-world projects using AI agents and
                            automation
                          </span>
                        </li>
                      </ul>
                      <Link to="/purchase" className="block">
                        <Button size="lg" className="w-full">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Buy Now
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Decorative elements - matching hero */}
                  <div className="video-decorative-1"></div>
                  <div className="video-decorative-2"></div>
                </div>
              </div>
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
