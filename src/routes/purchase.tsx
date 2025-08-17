import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { stripe } from "~/lib/stripe";
import { authenticatedMiddleware } from "~/lib/auth";
import { env } from "~/utils/env";
import { loadStripe } from "@stripe/stripe-js";
import { publicEnv } from "~/utils/env-public";
import { Button, buttonVariants } from "~/components/ui/button";
import { useEffect } from "react";
import { z } from "zod";
import {
  Lock,
  Star,
  Users,
  Sparkles,
  Trophy,
  Code,
  RefreshCcw,
  ArrowRight,
  User,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "~/hooks/use-auth";
import { useContinueSlug } from "~/hooks/use-continue-slug";
import { Link } from "@tanstack/react-router";

const searchSchema = z.object({
  ref: z.string().optional(),
});

export const Route = createFileRoute("/purchase")({
  validateSearch: searchSchema,
  component: RouteComponent,
});

const checkoutSchema = z.object({
  affiliateCode: z.string().optional(),
});

const checkoutFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .validator(checkoutSchema)
  .handler(async ({ context, data }) => {
    if (!context.email) {
      throw new Error("Email is required");
    }
    
    const metadata: Record<string, string> = {
      userId: context.userId.toString(),
    };
    
    if (data.affiliateCode) {
      metadata.affiliateCode = data.affiliateCode;
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${env.HOST_NAME}/success`,
      customer_email: context.email,
      cancel_url: `${env.HOST_NAME}/purchase`,
      metadata,
    });

    return { sessionId: session.id };
  });

const features = [
  {
    title: "Master Cursor IDE",
    description:
      "Learn AI pair programming and code generation with Cursor's advanced features",
    icon: Code,
  },
  {
    title: "Claude Code CLI Mastery",
    description:
      "Seamless AI-assisted development with Claude's command-line interface",
    icon: Sparkles,
  },
  {
    title: "Advanced Prompting Techniques",
    description:
      "Optimize Claude Sonnet and Opus for maximum coding efficiency",
    icon: Star,
  },
  {
    title: "Agentic Development",
    description: "Build real-world projects by practing agentic coding",
    icon: Users,
  },
  {
    title: "10x Development Speed",
    description:
      "Transform your workflow with cutting-edge AI programming methods",
    icon: Trophy,
  },
  {
    title: "Lifetime Access",
    description: "Access all training modules and future AI tool updates",
    icon: RefreshCcw,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Frontend Developer",
    company: "Tech Corp",
    text: "The problem-solving approach really helped me understand React better. Breaking down each challenge step by step made everything click.",
  },
  {
    name: "Michael Rodriguez",
    role: "React Developer",
    company: "StartupX",
    text: "These challenges helped me build a solid foundation in React. The whiteboarding sessions were especially helpful for understanding complex problems.",
  },
];

function RouteComponent() {
  const user = useAuth();
  const continueSlug = useContinueSlug();
  const { ref } = Route.useSearch();

  // Store affiliate code in localStorage when present in URL
  useEffect(() => {
    if (ref) {
      localStorage.setItem("affiliateCode", ref);
      // Set cookie as well for 30 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `affiliateCode=${encodeURIComponent(ref)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  }, [ref]);

  const handlePurchase = async () => {
    const stripePromise = loadStripe(publicEnv.VITE_STRIPE_PUBLISHABLE_KEY);
    const stripeResolved = await stripePromise;
    if (!stripeResolved) throw new Error("Stripe failed to initialize");

    try {
      // Get affiliate code from localStorage or cookie with proper parsing
      let affiliateCode = localStorage.getItem("affiliateCode");
      
      // Fallback to cookie if localStorage is empty
      if (!affiliateCode) {
        const cookieValue = document.cookie
          .split("; ")
          .find(row => row.startsWith("affiliateCode="))
          ?.split("=")[1];
        
        if (cookieValue) {
          try {
            affiliateCode = decodeURIComponent(cookieValue);
          } catch (decodeError) {
            console.warn("Failed to decode affiliate code from cookie:", decodeError);
            affiliateCode = null;
          }
        }
      }
      
      const { sessionId } = await checkoutFn({ 
        data: { affiliateCode: affiliateCode || undefined } 
      });
      const { error } = await stripeResolved.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
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
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-5xl">
              {/* Badge - matching hero style */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
                <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
                Limited Time Offer - 33% OFF
              </div>

              <h1 className="text-6xl leading-tight mb-8">
                Agentic Coding{" "}
                <span className="text-theme-400">Mastery Course</span>
              </h1>

              <p className="text-description mb-12 max-w-3xl mx-auto">
                Transform your development workflow with AI-first programming.
                Master Cursor IDE, Claude Code CLI, and advanced AI models to
                build applications 10x faster than traditional methods. Get
                lifetime access to cutting-edge techniques.
              </p>

              <div className="video-container max-w-4xl mx-auto mb-16">
                <div className="video-wrapper p-8">
                  <div className="relative z-10">
                    <div className="text-center mb-8">
                      <h2 className="text-4xl font-bold text-theme-600 dark:text-theme-400 mb-2">
                        Complete Learning Package
                      </h2>
                      <p className="text-muted-foreground">
                        Everything you need to master AI-first development
                      </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                      {features.map((feature) => (
                        <div
                          key={feature.title}
                          className="flex items-start gap-3 p-4 rounded-lg hover:bg-theme-50/20 dark:hover:bg-background/20 transition-colors group"
                        >
                          <div className="flex-shrink-0">
                            <feature.icon className="h-6 w-6 text-theme-500 dark:text-theme-400 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="text-left">
                            <p className="text-foreground font-medium group-hover:text-theme-600 dark:group-hover:text-theme-400 transition-colors">
                              {feature.title}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pricing */}
                    <div className="text-center space-y-6">
                      <div>
                        <div className="text-muted-foreground/70 mb-2">
                          Regular price{" "}
                          <span className="line-through">$299.99</span>
                        </div>
                        <div className="text-6xl font-bold text-foreground mb-2">
                          $199.00
                        </div>
                        <div className="text-theme-500 dark:text-theme-400 font-medium">
                          Limited Time Offer
                        </div>
                        <div className="text-muted-foreground text-sm mt-1">
                          One-time payment, lifetime access
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-4">
                        {user ? (
                          !user.isPremium ? (
                            <Button size="lg" onClick={handlePurchase}>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Get Instant Access
                            </Button>
                          ) : (
                            <Link
                              to="/learn/$slug"
                              params={{ slug: continueSlug }}
                              className={buttonVariants({
                                variant: "secondary",
                                size: "lg",
                              })}
                            >
                              Continue with Course
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          )
                        ) : (
                          <a
                            href={`/api/login/google?redirect_uri=${encodeURIComponent("/purchase")}`}
                          >
                            <Button size="lg">
                              <User className="mr-2 h-4 w-4" />
                              Login to Purchase
                            </Button>
                          </a>
                        )}

                        <div className="flex items-center gap-2 text-muted-foreground/70">
                          <Lock className="h-4 w-4" />
                          <span className="text-sm">
                            Secure payment with Stripe
                          </span>
                        </div>
                      </div>
                    </div>
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

      {/* Bottom gradient fade with theme accent - matching hero */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="section-divider-glow-bottom"></div>
    </div>
  );
}
