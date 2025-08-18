import { Play, Users, Award } from "lucide-react";

export function InstructorSection() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0 hero-background-ai opacity-50"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-theme-50/50 dark:bg-background/20 backdrop-blur-sm border border-theme-200 dark:border-border/50 text-theme-600 dark:text-theme-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-theme-500 dark:bg-theme-400 rounded-full mr-2 animate-pulse"></span>
            Your Instructor
          </div>

          {/* Profile Picture with Gradient Background */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-theme-400 via-theme-500 to-theme-600 rounded-2xl blur-xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-theme-400 via-theme-500 to-theme-600 rounded-2xl p-1">
                <img
                  src="/cody.png"
                  alt="Cody - Your Instructor"
                  className="size-64 rounded-xl object-cover"
                />
              </div>
            </div>
          </div>

          <h2 className="text-5xl font-bold mb-6">
            Learn from{" "}
            <span className="text-theme-400">
              <br />
              WebDevCody
            </span>
          </h2>
        </div>

        <div className="bg-white/10 dark:bg-theme-500/10 backdrop-blur-md border border-theme-200/50 dark:border-theme-500/30 rounded-3xl p-12 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">WebDevCody</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Cody is the creator behind{" "}
                <a
                  href="https://youtube.com/@WebDevCody"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-theme-500 hover:text-theme-400 underline"
                >
                  WebDevCody
                </a>
                , one of the most prominent programming education channels on
                YouTube with over{" "}
                <span className="font-bold text-theme-500">
                  260,000 subscribers
                </span>{" "}
                and more than{" "}
                <span className="font-bold text-theme-500">1,100 videos</span>{" "}
                teaching coding concepts.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                With over <span className="font-bold">12 years</span> of
                professional web development experience, Cody has witnessed
                firsthand the transformation from traditional coding to
                AI-assisted development. He's been at the forefront of the
                agentic coding revolution, using tools like Cursor IDE and
                Claude to dramatically accelerate development workflows.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Through his extensive teaching experience and real-world
                application of agentic coding techniques, Cody has developed a
                unique approach to help developers transition from traditional
                programming to becoming 10x more productive with AI-powered
                tools.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://youtube.com/@WebDevCody"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Play className="w-5 h-5" />
                  YouTube Channel
                </a>
                <a
                  href="https://webdevcody.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-theme-600 hover:bg-theme-700 text-white rounded-lg transition-colors"
                >
                  Personal Website
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <InstructorStatCard
                icon={
                  <Users className="w-6 h-6 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
                }
                value="260,000+"
                label="YouTube Subscribers"
                glyphColor="red"
                glyphPath="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
              />

              <InstructorStatCard
                icon={
                  <Play className="w-6 h-6 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
                }
                value="1,100+"
                label="Educational Videos"
                glyphColor="theme"
                glyphPath="M8 5v14l11-7z"
                extraGlyph={
                  <circle cx="12" cy="12" r="2" className="animate-ping" />
                }
              />

              <InstructorStatCard
                icon={
                  <Award className="w-6 h-6 text-theme-500 group-hover:text-theme-400 group-hover:scale-110 transition-all duration-300" />
                }
                value="12+ Years"
                label="Industry Experience"
                glyphColor="amber"
                glyphPath="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />

              <div className="group relative text-center p-6 bg-gradient-to-r from-theme-500/10 to-theme-600/10 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-theme-400 dark:hover:border-theme-500 transition-all duration-500 hover:from-theme-500/15 hover:to-theme-600/15 hover:shadow-2xl hover:shadow-theme-500/20">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-theme-500/0 via-theme-500/10 to-theme-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg"></div>

                {/* Animated background glyph */}
                <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-15 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                  <svg
                    className="w-6 h-6 text-theme-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="animate-pulse"
                    />
                  </svg>
                </div>

                <div className="relative z-10">
                  <p className="text-lg italic text-muted-foreground group-hover:text-foreground/90 group-hover:scale-105 transition-all duration-300">
                    "Agentic coding isn't hype or a bubble, this is a paradigm
                    shift and it's here to stay."
                  </p>
                  <p className="text-sm text-theme-500 mt-2 group-hover:text-theme-400 transition-colors duration-300">
                    - WebDevCody
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface InstructorStatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  glyphColor: string;
  glyphPath: string;
  extraGlyph?: React.ReactNode;
}

function InstructorStatCard({
  icon,
  value,
  label,
  glyphColor,
  glyphPath,
  extraGlyph,
}: InstructorStatCardProps) {
  return (
    <div className="group relative bg-white/10 dark:bg-background/20 rounded-xl p-6 border-2 border-gray-300 dark:border-gray-600 hover:border-theme-400 dark:hover:border-theme-500 transition-all duration-500 hover:bg-white/15 dark:hover:bg-background/30 hover:shadow-2xl hover:shadow-theme-500/20">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-theme-500/0 via-theme-500/8 to-theme-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg"></div>

      {/* Animated background glyph */}
      <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-15 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
        <svg
          className={`w-8 h-8 text-${glyphColor}-500`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d={glyphPath} className="animate-pulse" />
          {extraGlyph}
        </svg>
      </div>

      <div className="relative z-10 flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-theme-500/20 flex items-center justify-center group-hover:bg-theme-500/30 transition-all duration-300">
          {icon}
        </div>
        <div className="group-hover:scale-105 transition-transform duration-300">
          <div className="text-2xl font-bold group-hover:text-theme-500 transition-colors duration-300">
            {value}
          </div>
          <div className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
