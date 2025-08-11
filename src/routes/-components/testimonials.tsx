import { createServerFn } from "@tanstack/react-start";
import { getTestimonialsUseCase } from "~/use-cases/testimonials";
import { useQuery } from "@tanstack/react-query";

export const getTestimonialsFn = createServerFn().handler(async () => {
  return await getTestimonialsUseCase();
});

export function TestimonialsSection() {
  const { data: testimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: getTestimonialsFn,
  });

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="relative py-24 px-6" id="testimonials">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted dark:to-background"></div>

      {/* Top border glow */}
      <div className="section-divider-glow-top"></div>
      <div className="absolute top-0 left-0 right-0 h-[2px] blur-sm bg-gradient-to-r from-transparent via-theme-500/30 dark:via-theme-400/50 to-transparent"></div>

      {/* Bottom border glow */}
      <div className="section-divider-glow-bottom"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] blur-sm bg-gradient-to-r from-transparent via-theme-500/30 dark:via-theme-400/50 to-transparent"></div>

      <div className="relative max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-theme-500 to-theme-600 dark:from-theme-400 dark:to-theme-500">
          Loved by AI-First Developers
        </h2>
        <p className="text-muted-foreground/70 text-center mb-16 max-w-2xl mx-auto">
          Join thousands of developers who have accelerated their workflow
          and transformed their development process with AI-powered tools
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials?.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white/80 dark:bg-card/50 p-8 rounded-xl border border-theme-200 dark:border-theme-500/20 hover:border-theme-300 dark:hover:border-theme-500/40 hover:transform hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-card/60 transition-all duration-300 ease-in-out backdrop-blur-sm"
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-theme-300 dark:border-theme-500/30">
                  {testimonial?.profile?.image ? (
                    <img
                      src={testimonial.profile.image}
                      alt={testimonial.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-theme-100 dark:bg-theme-500/20 flex items-center justify-center">
                      <span className="text-2xl">
                        {testimonial.displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-foreground">
                    {testimonial.displayName}
                  </p>
                  <p className="text-sm text-theme-600 dark:text-theme-400">
                    {new Date(testimonial.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 italic">{testimonial.content}</p>
              <div className="flex text-2xl">
                {Array.from(testimonial.emojis).map((emoji, i) => (
                  <span key={i} className="mr-2">
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
