export const TEST_CONFIG = {
  MODULES: {
    GETTING_STARTED: "Getting Started",
    ADVANCED_TOPICS: "Advanced Topics"
  },
  SEGMENTS: {
    WELCOME_TO_COURSE: {
      slug: "welcome-to-the-course",
      title: "Welcome to the Course"
    },
    SETTING_UP_ENVIRONMENT: {
      slug: "setting-up-your-environment", 
      title: "Setting Up Your Environment"
    },
    FIRST_PROJECT: {
      slug: "first-project",
      title: "Your First Project"
    },
    ADVANCED_PATTERNS: {
      slug: "advanced-patterns",
      title: "Advanced Patterns"
    },
    PERFORMANCE_OPTIMIZATION: {
      slug: "performance-optimization",
      title: "Performance Optimization"
    }
  },
  USERS: {
    ADMIN: {
      email: "admin@test.com"
    },
    REGULAR: {
      email: "user@test.com"
    }
  },
  LABELS: {
    TOGGLE_MODULE_GETTING_STARTED: "Toggle module Getting Started",
    TOGGLE_MODULE_ADVANCED_TOPICS: "Toggle module Advanced Topics",
    SELECT_SEGMENT_WELCOME: "Select segment Welcome to the Course",
    SELECT_SEGMENT_SETUP: "Select segment Setting up your Environment",
    SELECT_SEGMENT_FIRST_PROJECT: "Select segment Your First Project",
    SELECT_SEGMENT_ADVANCED_PATTERNS: "Select segment Advanced Patterns",
    SELECT_SEGMENT_PERFORMANCE: "Select segment Performance Optimization"
  },
  UI_TEXT: {
    EARLY_ACCESS_INDICATOR: "early",
    WELCOME_TO_COURSE_INDICATOR: "welcome to the course",
    START_LEARNING_LINK: "Start Learning",
    LOGO_ALT_TEXT: "Agentic Jumpstart",
    LOGO_SRC: "/logo.png",
    AGENTIC_JUMPSTART_TEXT: /agentic jumpstart/i,
    PREVIOUS_LESSON_BUTTON: /previous lesson/i,
    NEXT_VIDEO_BUTTON: /next video/i
  },
  CSS_CLASSES: {
    SEGMENT_ITEM: ".segment-item",
    // Active segment uses segment-active class (defined in app.css)
    SEGMENT_ACTIVE: /segment-active/,
    // Inactive segments don't have segment-active class
    SEGMENT_INACTIVE: /^(?!.*segment-active)/
  }
};