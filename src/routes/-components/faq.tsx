import * as React from "react";
import { cn } from "~/lib/utils";

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
}

const FAQItem = ({ question, answer }: FAQItemProps) => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div
        className={cn(
          "w-full flex items-center justify-between p-6 rounded-lg",
          "bg-card/90 dark:bg-card/70 border border-theme-200 dark:border-theme-500/20 backdrop-blur-sm",
          "shadow-[0_0_15px_rgb(var(--color-theme-500-rgb)/0.15)] dark:shadow-[0_0_15px_rgb(var(--color-theme-500-rgb)/0.1)]"
        )}
      >
        <h3 className="text-xl font-semibold text-left text-theme-600 dark:text-theme-400">
          {question}
        </h3>
      </div>
      <div className="p-6 rounded-b-lg bg-card/50 dark:bg-card/30 border-x border-b border-theme-200 dark:border-theme-500/20 flex-1">
        {answer}
      </div>
    </div>
  );
};

const faqData: FAQItemProps[] = [
  {
    question: "What AI tools will I learn to use?",
    answer: (
      <p className="text-muted-foreground">
        You'll master Cursor IDE, Cursor CLI, Claude Code CLI, ChatGPT, and
        other cutting-edge AI development tools. The course showing you how to
        maximize your productivity with each one.
      </p>
    ),
  },
  {
    question: "How is Cursor IDE different from VS Code for AI development?",
    answer: (
      <p className="text-muted-foreground">
        Cursor IDE is built specifically for AI-first development with advanced
        context understanding, multi-file editing capabilities, and native AI
        integration. Unlike VS Code which requires extensions, Cursor has AI
        features built into its core, providing superior code generation and
        intelligent refactoring capabilities.
      </p>
    ),
  },
  {
    question:
      "What is Claude Code CLI and how does it compare to GitHub Copilot?",
    answer: (
      <p className="text-muted-foreground">
        Claude Code CLI is Anthropic's command-line interface that brings
        Claude's advanced reasoning directly to your terminal. It offers
        superior codebase analysis and context understanding compared to GitHub
        Copilot, with better multi-file reasoning and more sophisticated code
        generation capabilities for complex projects.
      </p>
    ),
  },
  {
    question: "Do I need prior experience with AI tools?",
    answer: (
      <p className="text-muted-foreground">
        No prior AI tool experience is required! The course is designed for
        developers who are new to AI-assisted development. We start with the
        basics and progressively cover advanced techniques for leveraging AI in
        your development workflow.
      </p>
    ),
  },
  {
    question:
      "What is agentic coding and how does it differ from traditional programming?",
    answer: (
      <p className="text-muted-foreground">
        Agentic coding is an AI-first development approach where you work
        collaboratively with AI agents to build software. Instead of writing
        every line manually, you describe your intent and let AI generate,
        refactor, and optimize code. This results in 10x faster development
        compared to traditional programming methods.
      </p>
    ),
  },
  {
    question: "How do I get support if I need help?",
    answer: (
      <p className="text-muted-foreground">
        You can reach out in our Discord community or email me directly at{" "}
        <a
          href="mailto:webdevcody@gmail.com"
          className="text-theme-400 hover:text-theme-300 underline transition-colors"
        >
          webdevcody@gmail.com
        </a>
        . I typically respond within 24 hours with personalized help.
      </p>
    ),
  },
  {
    question: "Will I get access to prompts and configurations?",
    answer: (
      <p className="text-muted-foreground">
        Yes! You'll get access to my personal collection of AI prompts, Cursor
        configurations, Claude Code settings, and workflow templates that I use
        in production development. These are battle-tested configurations that
        will accelerate your AI-assisted development.
      </p>
    ),
  },
  {
    question: "Can I apply these skills to any programming language?",
    answer: (
      <p className="text-muted-foreground">
        Absolutely! While some examples use JavaScript/TypeScript, the AI
        development principles and techniques work across all programming
        languages. You'll learn universal prompting strategies and workflow
        patterns that apply to any tech stack.
      </p>
    ),
  },
  {
    question: "How much time will I save after completing the course?",
    answer: (
      <p className="text-muted-foreground">
        Most students report 3-10x faster development speed after implementing
        the techniques taught in this course. You'll reduce debugging time,
        accelerate feature development, and spend more time on creative
        problem-solving rather than repetitive coding tasks.
      </p>
    ),
  },
  {
    question: "What's the best way to learn AI-first development in 2025?",
    answer: (
      <p className="text-muted-foreground">
        The most effective approach is hands-on practice with industry-leading
        AI tools like Cursor and Claude Code CLI, combined with systematic
        learning of prompting techniques and AI development workflows. This
        course provides exactly that - practical experience with real projects
        rather than just theoretical knowledge.
      </p>
    ),
  },
  {
    question:
      "How does this course prepare me for the future of software development?",
    answer: (
      <p className="text-muted-foreground">
        AI-first development is rapidly becoming the industry standard. By
        mastering agentic coding techniques now, you'll be ahead of the curve as
        more companies adopt AI-assisted workflows. These skills will be
        essential for competitive developers in the next 5-10 years.
      </p>
    ),
  },
  {
    question:
      "Can beginners learn agentic coding without advanced programming skills?",
    answer: (
      <p className="text-muted-foreground">
        Yes! AI tools like Cursor and Claude Code actually make programming more
        accessible to beginners by providing intelligent suggestions and
        explanations. However, basic programming concepts are recommended. The
        course starts with fundamentals and gradually builds to advanced AI
        development techniques.
      </p>
    ),
  },
];

export function FAQSection() {
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
          <div className="flex flex-col items-center mb-16 text-center">
            {/* Badge - matching hero style */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
              Got Questions? We've Got Answers
            </div>

            <h2 className="text-6xl leading-tight mb-8">
              Frequently Asked <span className="text-theme-400">Questions</span>
            </h2>

            <p className="text-description mb-12 max-w-3xl mx-auto">
              Get quick answers to common questions about our agentic coding
              course, AI tools, and development techniques. Still have
              questions? Reach out anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqData.map((faq, index) => (
              <div key={index} className="h-full flex">
                <FAQItem question={faq.question} answer={faq.answer} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade with theme accent - matching hero */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="section-divider-glow-bottom"></div>
    </section>
  );
}
