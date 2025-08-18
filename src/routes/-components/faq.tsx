import * as React from "react";
import { cn } from "~/lib/utils";
import { ScrollAnimation, ScrollScale } from "~/components/scroll-animation";

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

interface FAQData {
  general: FAQItemProps[];
  earlyAccess: FAQItemProps[];
}

const faqData: FAQData = {
  earlyAccess: [
    {
      question: "When will the course be available?",
      answer: (
        <p className="text-muted-foreground">
          The course is currently in development and will be launching soon. Early access subscribers will be the first to know when it's ready and will receive exclusive preview content leading up to the launch.
        </p>
      ),
    },
    {
      question: "What do I get by signing up for early access?",
      answer: (
        <p className="text-muted-foreground">
          Early access subscribers receive exclusive preview content, first access to the course when it launches, priority support, and special early bird pricing. You'll also get updates on our development progress and sneak peeks at the curriculum.
        </p>
      ),
    },
    {
      question: "How will I be notified when the course launches?",
      answer: (
        <p className="text-muted-foreground">
          You'll receive email notifications with launch details, access instructions, and exclusive early access content. We'll also provide updates throughout the development process to keep you informed of our progress.
        </p>
      ),
    },
    {
      question: "Will early access subscribers get a discount?",
      answer: (
        <p className="text-muted-foreground">
          Yes! Early access subscribers will receive exclusive early bird pricing and special launch discounts. The earlier you join our waiting list, the better the offer you'll receive when the course becomes available.
        </p>
      ),
    },
    {
      question: "What's included in the early access preview?",
      answer: (
        <p className="text-muted-foreground">
          Early access previews include sample lessons, AI development templates, exclusive prompts and configurations, behind-the-scenes development updates, and early access to our community Discord where you can connect with other future agentic developers.
        </p>
      ),
    },
  ],
  general: [
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
  ],
};

interface FAQSectionProps {
  isEarlyAccess?: boolean;
}

export function FAQSection({ isEarlyAccess = false }: FAQSectionProps) {
  const questionsToShow = isEarlyAccess 
    ? [...faqData.earlyAccess, ...faqData.general.slice(0, 6)] 
    : faqData.general;
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
            <ScrollAnimation direction="down" delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                Got Questions? We've Got Answers
              </div>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.1}>
              <h2 className="text-6xl leading-tight mb-8">
                Frequently Asked <span className="text-theme-400">Questions</span>
              </h2>
            </ScrollAnimation>

            <ScrollAnimation direction="up" delay={0.2}>
              <p className="text-description mb-12 max-w-3xl mx-auto">
                Get quick answers to common questions about our agentic coding
                course, AI tools, and development techniques. Still have
                questions? Reach out anytime.
              </p>
            </ScrollAnimation>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {questionsToShow.map((faq, index) => (
              <ScrollScale key={index} delay={0.3 + Math.floor(index / 2) * 0.1} className="h-full flex">
                <FAQItem question={faq.question} answer={faq.answer} />
              </ScrollScale>
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
