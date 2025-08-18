/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // System colors using CSS variables
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        // Sidebar colors
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          primary: "hsl(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
        },
        // Theme colors (cyan theme)
        theme: {
          50: "#e0f7fa",
          100: "#b2ebf2",
          200: "#80deea",
          300: "#4dd0e1",
          400: "#26c6da",
          500: "#00acc1",
          600: "#00838f",
          700: "#006064",
          800: "#004d40",
          900: "#00363a",
          950: "#001f22",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "hsl(var(--foreground))",
            a: {
              color: "hsl(var(--primary))",
              "&:hover": { color: "hsl(var(--primary))" },
            },
            '[class~="lead"]': { color: "hsl(var(--foreground))" },
            strong: { color: "hsl(var(--foreground))" },
            "ol > li::marker": { color: "hsl(var(--foreground))" },
            "ul > li::marker": { color: "hsl(var(--foreground))" },
            hr: { borderColor: "hsl(var(--border))" },
            blockquote: {
              borderLeftColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))",
            },
            h1: { color: "hsl(var(--foreground))" },
            h2: { color: "hsl(var(--foreground))" },
            h3: { color: "hsl(var(--foreground))" },
            h4: { color: "hsl(var(--foreground))" },
            "figure figcaption": { color: "hsl(var(--muted-foreground))" },
            code: {
              color: "hsl(var(--foreground))",
              backgroundColor: "hsl(var(--muted))",
              padding: "0.25rem",
              borderRadius: "0.25rem",
              fontWeight: "400",
            },
            "a code": { color: "hsl(var(--primary))" },
            pre: {
              backgroundColor: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
            },
            thead: {
              color: "hsl(var(--foreground))",
              borderBottomColor: "hsl(var(--border))",
            },
            "tbody tr": { borderBottomColor: "hsl(var(--border))" },
          },
        },
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        tilt: "tilt 10s infinite linear",
        float: "float 3s ease-in-out infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slow": "pulse 2s ease-in-out infinite",
        shimmer: "shimmer 6s infinite",
        glow: "glow 2s ease-in-out infinite",
        gradient: "gradient 8s linear infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-top-right": "slide-in-top-right 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "border-flow": "border-flow 3s ease infinite",
      },
      keyframes: {
        tilt: {
          "0%, 50%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(0.5deg)" },
          "75%": { transform: "rotate(-0.5deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 172, 193, 0.35)" },
          "50%": { boxShadow: "0 0 30px rgba(0, 172, 193, 0.65)" },
        },
        gradient: {
          "0%, 100%": {
            backgroundSize: "200% 200%",
            backgroundPosition: "left center",
          },
          "50%": {
            backgroundSize: "200% 200%",
            backgroundPosition: "right center",
          },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "slide-in-top-right": {
          from: { transform: "translate(100%, -100%)", opacity: "0" },
          to: { transform: "translate(0, 0)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-theme": "linear-gradient(135deg, #00acc1 0%, #00838f 100%)",
        "gradient-theme-subtle": "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
        "gradient-glass":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))",
        "gradient-ai":
          "linear-gradient(135deg, #00acc1 0%, #2196f3 50%, #4a5cc5 100%)",
        "gradient-ai-subtle":
          "linear-gradient(135deg, rgba(0, 172, 193, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)",
        "gradient-red": "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        "gradient-red-hover":
          "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
        "gradient-red-transparent":
          "linear-gradient(135deg, #ef4444 0%, transparent 100%)",
        "gradient-red-transparent-hover":
          "linear-gradient(135deg, #dc2626 0%, transparent 100%)",
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(0, 172, 193, 0.3)",
        glow: "0 0 20px rgba(0, 172, 193, 0.4)",
        "glow-lg": "0 0 30px rgba(0, 172, 193, 0.5)",
        "glow-cyan": "0 0 25px rgba(0, 172, 193, 0.5)",
        "glow-blue": "0 0 25px rgba(33, 150, 243, 0.5)",
        "glow-red": "0 0 25px rgba(239, 68, 68, 0.5)",
        "inner-glow": "inset 0 0 20px rgba(0, 172, 193, 0.2)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "elevation-1":
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "elevation-2":
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "elevation-3":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};