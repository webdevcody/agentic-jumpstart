import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import { useEffect, useRef } from "react";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { GlassPanel } from "~/components/ui/glass-panel";
import { CircuitBoardPattern } from "~/components/ui/background-patterns";
import { useAuth } from "~/hooks/use-auth";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { PRICING_CONFIG } from "~/config";

export function PricingSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const user = useAuth();
  const continueSlug = useContinueSlug();

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
    <section className="relative w-full py-24 bg-gradient-to-b from-slate-50/0 via-slate-50/80 to-slate-50/0 dark:from-transparent dark:via-slate-900/40 dark:to-transparent overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.4]">
        <CircuitBoardPattern className="text-cyan-500/20 dark:text-cyan-500/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-4xl">
              {/* Badge - matching hero style */}
              <GlassPanel variant="cyan" padding="sm" className="inline-block mb-8">
                <div className="inline-flex items-center text-sm font-medium text-slate-700 dark:text-cyan-400">
                  <span className="w-2 h-2 bg-cyan-600 dark:bg-cyan-400 rounded-full mr-2"></span>
                  Limited Time Offer
                </div>
              </GlassPanel>

              <h2 className="text-3xl md:text-4xl lg:text-6xl leading-tight mb-6 md:mb-8 text-slate-900 dark:text-white">
                Master AI-First Development{" "}
                <span className="text-cyan-600 dark:text-cyan-400">With AI Agents</span>
              </h2>

              <p className="text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-400 mb-8 md:mb-12 max-w-2xl mx-auto">
                Transform your coding workflow with advanced AI tools and
                techniques. Learn to build applications 10x faster using Cursor
                IDE, Claude Code CLI, and cutting-edge agentic programming
                methods.
              </p>

              <div ref={cardRef} className="relative max-w-lg mx-auto">
                <GlassPanel variant="cyan" padding="lg" className="relative">
                  <div className="relative z-10">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-cyan-600 dark:text-cyan-400">
                      Agentic Coding Mastery
                    </h3>
                    <div className="mb-6 md:mb-8">
                      <div className="text-slate-600 dark:text-slate-400 mb-2">
                        <span className="line-through text-xl">
                          {PRICING_CONFIG.FORMATTED_ORIGINAL_PRICE}
                        </span>
                        <span className="ml-2 text-sm text-cyan-600 dark:text-cyan-400 font-medium">
                          Save {PRICING_CONFIG.DISCOUNT_PERCENTAGE}%
                        </span>
                      </div>
                      <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white">
                        {PRICING_CONFIG.FORMATTED_CURRENT_PRICE}
                        <span className="text-lg text-slate-600 dark:text-slate-400 font-normal">
                          /lifetime access
                        </span>
                      </div>
                    </div>
                    <ul className="text-left space-y-6 mb-10">
                      <li className="flex items-center text-slate-600 dark:text-slate-400 group">
                        <Check className="w-6 h-6 mr-3 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          Master Cursor IDE with AI pair programming and code
                          generation
                        </span>
                      </li>
                      <li className="flex items-center text-slate-600 dark:text-slate-400 group">
                        <Check className="w-6 h-6 mr-3 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          Learn Claude Code CLI for seamless AI-assisted
                          development
                        </span>
                      </li>
                      <li className="flex items-center text-slate-600 dark:text-slate-400 group">
                        <Check className="w-6 h-6 mr-3 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          Advanced prompting techniques for Claude Sonnet and
                          Opus
                        </span>
                      </li>
                      <li className="flex items-center text-slate-600 dark:text-slate-400 group">
                        <Check className="w-6 h-6 mr-3 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          Build real-world projects using AI agents and
                          automation
                        </span>
                      </li>
                    </ul>
                    {user?.isPremium || user?.isAdmin ? (
                      <Link
                        to="/learn/$slug"
                        params={{ slug: continueSlug }}
                        className={buttonVariants({
                          variant: "glass",
                          size: "lg",
                          className: "w-full rounded-xl px-6 py-2.5 text-sm font-bold",
                        })}
                      >
                        Continue with Course
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    ) : (
                      <Link to="/purchase" className="block">
                        <Button variant="cyan" size="lg" className="w-full rounded-xl px-6 py-2.5 text-sm font-bold">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Buy Now
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Decorative elements - matching hero */}
                  <div className="video-decorative-1"></div>
                  <div className="video-decorative-2"></div>
                </GlassPanel>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade with theme accent - matching hero */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-[#0b101a] dark:via-[#0b101a]/80"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}
