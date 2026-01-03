import { Link } from "@tanstack/react-router";
import { buttonVariants } from "~/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { GlassPanel } from "~/components/ui/glass-panel";

export function ShowcasesCTA() {
  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-4">
        <GlassPanel variant="cyan" className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  See What's Possible
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Real projects built with AI coding agents
                </p>
              </div>
            </div>

            <Link
              to="/showcases"
              className={buttonVariants({
                variant: "glass",
                size: "lg",
                className: "group",
              })}
            >
              View Showcases
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
