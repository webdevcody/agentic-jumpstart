import "dotenv/config";
import { database } from "./index";
import { modules, segments, appSettings, launchKits, launchKitTags, launchKitTagRelations, users } from "./schema";
import { FLAGS } from "~/config";

async function main() {
  // Seed app settings
  const earlyAccessMode = "false";
  await database
    .insert(appSettings)
    .values({
      key: FLAGS.EARLY_ACCESS_MODE,
      value: earlyAccessMode,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  console.log(`Seeded EARLY_ACCESS_MODE with value: ${earlyAccessMode}`);

  // Seed agents feature flag
  const agentsFeature = "true";
  await database
    .insert(appSettings)
    .values({
      key: FLAGS.AGENTS_FEATURE,
      value: agentsFeature,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  console.log(`Seeded AGENTS_FEATURE with value: ${agentsFeature}`);

  // Seed launch kits feature flag
  const launchKitsFeature = "true";
  await database
    .insert(appSettings)
    .values({
      key: FLAGS.LAUNCH_KITS_FEATURE,
      value: launchKitsFeature,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  console.log(`Seeded LAUNCH_KITS_FEATURE with value: ${launchKitsFeature}`);

  // Seed affiliates feature flag
  const affiliatesFeature = "true";
  await database
    .insert(appSettings)
    .values({
      key: FLAGS.AFFILIATES_FEATURE,
      value: affiliatesFeature,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  console.log(`Seeded AFFILIATES_FEATURE with value: ${affiliatesFeature}`);

  const moduleData = [
    {
      title: "Getting Started",
      order: 1,
      segments: [
        { title: "Welcome to the Course", length: "5:30", isPremium: false },
        {
          title: "Setting Up Your Environment",
          length: "10:45",
          isPremium: false,
        },
        { title: "Course Overview", length: "7:20", isPremium: false },
      ],
    },
    {
      title: "React Fundamentals",
      order: 2,
      segments: [
        {
          title: "Introduction to React and Component Basics",
          length: "8:30",
          isPremium: true,
        },
        {
          title: "Understanding JSX and Props",
          length: "12:45",
          isPremium: true,
        },
        {
          title: "State Management with useState",
          length: "15:20",
          isPremium: true,
        },
      ],
    },
    {
      title: "React Hooks Deep Dive",
      order: 3,
      segments: [
        {
          title: "useEffect for Side Effects",
          length: "14:30",
          isPremium: true,
        },
        { title: "Custom Hooks Development", length: "18:15", isPremium: true },
        {
          title: "useContext for State Management",
          length: "16:40",
          isPremium: true,
        },
      ],
    },
    {
      title: "Advanced React Patterns",
      order: 4,
      segments: [
        {
          title: "Component Composition Patterns",
          length: "13:20",
          isPremium: true,
        },
        {
          title: "Performance Optimization with useMemo",
          length: "15:45",
          isPremium: true,
        },
        {
          title: "Building a Custom Hook Library",
          length: "20:10",
          isPremium: true,
        },
      ],
    },
  ];

  // First, create the modules and store their IDs
  const createdModules = [];
  for (const module of moduleData) {
    const [createdModule] = await database
      .insert(modules)
      .values(module)
      .returning();
    createdModules.push(createdModule);
  }

  // Then create all segments with proper references to their modules
  for (let i = 0; i < createdModules.length; i++) {
    const module = createdModules[i];
    const segments_data = moduleData[i].segments;

    for (const [segmentIndex, segment] of segments_data.entries()) {
      await database.insert(segments).values({
        slug: segment.title.toLowerCase().replace(/\s+/g, "-"),
        title: segment.title,
        content: `Learn about ${segment.title.toLowerCase()} in this comprehensive lesson.`,
        order: segmentIndex + 1,
        length: segment.length,
        isPremium: segment.isPremium,
        moduleId: module.id,
        videoKey: `${module.title.toLowerCase().replace(/\s+/g, "-")}-video-${segmentIndex + 1}`,
      });
    }
  }

  // Seed Launch Kit Tags
  const tagData = [
    { name: "React", slug: "react", color: "#61DAFB", category: "framework" },
    { name: "Next.js", slug: "nextjs", color: "#000000", category: "framework" },
    { name: "TypeScript", slug: "typescript", color: "#3178C6", category: "language" },
    { name: "Tailwind CSS", slug: "tailwindcss", color: "#06B6D4", category: "framework" },
    { name: "Node.js", slug: "nodejs", color: "#339933", category: "language" },
    { name: "Express", slug: "express", color: "#000000", category: "framework" },
    { name: "PostgreSQL", slug: "postgresql", color: "#336791", category: "database" },
    { name: "MongoDB", slug: "mongodb", color: "#47A248", category: "database" },
    { name: "Prisma", slug: "prisma", color: "#2D3748", category: "tool" },
    { name: "Drizzle", slug: "drizzle", color: "#C5F74F", category: "tool" },
    { name: "Vercel", slug: "vercel", color: "#000000", category: "deployment" },
    { name: "Docker", slug: "docker", color: "#2496ED", category: "deployment" },
  ];

  const createdTags = [];
  for (const tag of tagData) {
    const [createdTag] = await database
      .insert(launchKitTags)
      .values(tag)
      .onConflictDoNothing()
      .returning();
    if (createdTag) {
      createdTags.push(createdTag);
    }
  }

  // Create admin user if not exists for launch kits
  const [adminUser] = await database
    .insert(users)
    .values({
      email: "admin@example.com",
      isAdmin: true,
      isPremium: true,
    })
    .onConflictDoNothing()
    .returning();

  if (adminUser && createdTags.length > 0) {
    // Seed Launch Kits
    const launchKitData = [
      {
        name: "React Todo App",
        description: "A complete todo application built with React and TypeScript",
        longDescription: "This starter kit includes a fully functional todo application with features like adding, editing, deleting, and marking todos as complete. Built with React 18, TypeScript, and Tailwind CSS for styling. Perfect for learning React fundamentals and state management.",
        repositoryUrl: "https://github.com/example/react-todo-app",
        demoUrl: "https://react-todo-demo.vercel.app",
        difficulty: "beginner",
        authorId: adminUser.id,
        tags: ["react", "typescript", "tailwindcss"],
      },
      {
        name: "Next.js E-commerce Store",
        description: "Full-stack e-commerce solution with Next.js, Stripe, and PostgreSQL",
        longDescription: "A production-ready e-commerce platform featuring product catalog, shopping cart, user authentication, payment processing with Stripe, and admin dashboard. Uses Next.js 14, TypeScript, Prisma ORM, and PostgreSQL. Includes Docker setup for easy deployment.",
        repositoryUrl: "https://github.com/example/nextjs-ecommerce",
        demoUrl: "https://nextjs-ecommerce-demo.vercel.app",
        difficulty: "advanced",
        authorId: adminUser.id,
        tags: ["nextjs", "typescript", "postgresql", "prisma", "vercel"],
      },
      {
        name: "Express API Starter",
        description: "RESTful API boilerplate with Express, TypeScript, and MongoDB",
        longDescription: "A robust API foundation with user authentication, CRUD operations, input validation, error handling, and comprehensive testing setup. Built with Express.js, TypeScript, MongoDB, and JWT authentication. Includes Docker configuration and GitHub Actions CI/CD.",
        repositoryUrl: "https://github.com/example/express-api-starter",
        difficulty: "intermediate",
        authorId: adminUser.id,
        tags: ["nodejs", "express", "typescript", "mongodb", "docker"],
      },
    ];

    for (const kitData of launchKitData) {
      const { tags: kitTags, ...kitInfo } = kitData;
      
      const [createdKit] = await database
        .insert(launchKits)
        .values({
          ...kitInfo,
          slug: kitInfo.name.toLowerCase().replace(/\s+/g, "-"),
        })
        .onConflictDoNothing()
        .returning();

      if (createdKit) {
        // Add tags to the kit
        for (const tagSlug of kitTags) {
          const tag = createdTags.find(t => t.slug === tagSlug);
          if (tag) {
            await database
              .insert(launchKitTagRelations)
              .values({
                launchKitId: createdKit.id,
                tagId: tag.id,
              })
              .onConflictDoNothing();
          }
        }
      }
    }

    console.log("Seeded launch kits with sample data!");
  }
}

async function seed() {
  console.log("Database seeded!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
