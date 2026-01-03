import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button, buttonVariants } from "~/components/ui/button";
import { ExternalLink, Play } from "lucide-react";
import { GridPattern } from "~/components/ui/background-patterns";

export const Route = createFileRoute("/showcases")({
  component: ShowcasesPage,
});

interface ShowcaseItem {
  title: string;
  description: string;
  longDescription: string;
  liveUrl: string;
  videoPlaceholder: string;
  tags: string[];
  gradient: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    title: "Agentic Jumpstart",
    description: "Online Learning Platform",
    longDescription:
      "A full-featured course platform built with TanStack Start, React 19, and Stripe integration. Features include video lessons, user authentication, progress tracking, and a beautiful modern UI. This is the very platform you're viewing right now!",
    liveUrl: "https://agenticjumpstart.com",
    videoPlaceholder: "/api/placeholder/1920/1080",
    tags: ["TanStack Start", "React 19", "Stripe", "PostgreSQL", "Tailwind"],
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    title: "Automaker",
    description: "AI-Powered Car Marketplace",
    longDescription:
      "A modern car marketplace platform that leverages AI to help users find their perfect vehicle. Features include intelligent search, vehicle comparisons, dealer connections, and a sleek user interface designed for the automotive industry.",
    liveUrl: "https://automaker.dev",
    videoPlaceholder: "/api/placeholder/1920/1080",
    tags: ["Next.js", "AI Integration", "Marketplace", "TypeScript"],
    gradient: "from-purple-500 to-pink-600",
  },
  {
    title: "Survive the Night",
    description: "Multiplayer Survival Game",
    longDescription:
      "An intense multiplayer survival game where players must work together to survive waves of enemies through the night. Features real-time multiplayer, strategic gameplay, and immersive graphics. Built entirely with AI assistance.",
    liveUrl: "https://survive.webdevcody.com",
    videoPlaceholder: "/api/placeholder/1920/1080",
    tags: ["Game Dev", "Multiplayer", "Real-time", "WebSockets"],
    gradient: "from-red-500 to-orange-600",
  },
  {
    title: "Icon Generator AI",
    description: "AI Icon Creation Tool",
    longDescription:
      "Generate beautiful, custom icons using AI. Simply describe what you need and get professional-quality icons in seconds. Perfect for developers, designers, and businesses looking for unique iconography without the design overhead.",
    liveUrl: "https://icongeneratorai.com",
    videoPlaceholder: "/api/placeholder/1920/1080",
    tags: ["AI Generation", "Design Tools", "SaaS", "Image Processing"],
    gradient: "from-green-500 to-emerald-600",
  },
];

function ShowcaseCard({ item, index }: { item: ShowcaseItem; index: number }) {
  const isEven = index % 2 === 0;

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 shadow-xl">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${isEven ? "" : "lg:flex-row-reverse"}`}
      >
        {/* Video Section */}
        <div
          className={`relative aspect-video lg:aspect-auto lg:min-h-[400px] ${isEven ? "" : "lg:order-2"}`}
        >
          {/* Gradient overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10`}
          />

          {/* Video placeholder with play button */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-center">
              <div
                className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg`}
              >
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
              <p className="text-slate-400 text-sm">Demo video coming soon</p>
            </div>
          </div>

          {/* Decorative corner accent */}
          <div
            className={`absolute top-0 ${isEven ? "right-0" : "left-0"} w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-20 blur-2xl`}
          />
        </div>

        {/* Content Section */}
        <div
          className={`flex flex-col justify-center p-8 lg:p-12 ${isEven ? "" : "lg:order-1"}`}
        >
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-3 h-3 rounded-full bg-gradient-to-br ${item.gradient}`}
              />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {item.description}
              </span>
            </div>
            <CardTitle className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
              {item.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <CardDescription className="text-base lg:text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {item.longDescription}
            </CardDescription>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA Button */}
            <a
              href={item.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "default",
                size: "lg",
                className: `bg-gradient-to-r ${item.gradient} hover:opacity-90 text-white border-0 shadow-lg`,
              })}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live App
            </a>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function ShowcasesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b101a]">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0">
          <GridPattern
            width={40}
            height={40}
            x={-1}
            y={-1}
            className="opacity-[0.3] dark:opacity-[0.2] stroke-cyan-500/20 fill-cyan-500/20"
            squares={[
              [4, 4],
              [5, 1],
              [8, 2],
              [6, 6],
              [10, 5],
              [13, 3],
            ]}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2 animate-pulse" />
            Built with AI Coding Agents
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Project{" "}
            <span className="text-cyan-600 dark:text-cyan-400">Showcases</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Real-world applications built using agentic workflows with Cursor
            and Claude. See what's possible when you let AI agents handle the
            code.
          </p>
        </div>
      </section>

      {/* Showcases Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="space-y-12">
            {SHOWCASE_ITEMS.map((item, index) => (
              <ShowcaseCard key={item.title} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 dark:from-cyan-500/10 dark:to-blue-500/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to build your own?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Learn how to leverage AI coding agents to build production-ready
            applications 10x faster.
          </p>
          <a
            href="/purchase"
            className={buttonVariants({
              variant: "cyan",
              size: "lg",
            })}
          >
            Get Started with the Course
          </a>
        </div>
      </section>
    </div>
  );
}
