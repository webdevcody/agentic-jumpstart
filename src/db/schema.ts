import { relations } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  index,
  integer,
  pgEnum,
  pgTableCreator,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const PREFIX = "app";

const tableCreator = pgTableCreator((name) => `${PREFIX}_${name}`);

export const users = tableCreator("user", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  isPremium: boolean("isPremium").notNull().default(false),
  isAdmin: boolean("isAdmin").notNull().default(false),
  isEarlyAccess: boolean("isEarlyAccess").notNull().default(false),
});

export const accounts = tableCreator(
  "accounts",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleId: text("googleId").unique(),
  },
  (table) => [index("user_id_google_id_idx").on(table.userId, table.googleId)]
);

export const profiles = tableCreator("profile", {
  id: serial("id").primaryKey(),
  userId: serial("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  displayName: text("displayName"),
  realName: text("realName"), // Original name from OAuth (can be cleared for privacy)
  useDisplayName: boolean("useDisplayName").notNull().default(true), // Show alias instead of real name
  imageId: text("imageId"),
  image: text("image"),
  bio: text("bio").notNull().default(""),
  twitterHandle: text("twitterHandle"),
  githubHandle: text("githubHandle"),
  websiteUrl: text("websiteUrl"),
  isPublicProfile: boolean("isPublicProfile").notNull().default(false),
  flair: text("flair"), // Format: "Label:#hexcolor" e.g. "Automaker Core:#ff0000"
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projects = tableCreator(
  "project",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    imageUrl: text("imageUrl"),
    projectUrl: text("projectUrl"),
    repositoryUrl: text("repositoryUrl"),
    technologies: text("technologies"), // JSON string of tech stack
    order: integer("order").notNull().default(0),
    isVisible: boolean("isVisible").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("projects_user_order_idx").on(table.userId, table.order),
    index("projects_user_visible_idx").on(table.userId, table.isVisible),
  ]
);

export const sessions = tableCreator(
  "session",
  {
    id: text("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);

export const modules = tableCreator(
  "module",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    icon: text("icon"), // Lucide icon name, e.g., "BookOpen", "Code", "Rocket"
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("modules_order_idx").on(table.order)]
);

export const segments = tableCreator(
  "segment",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    transcripts: text("transcripts"),
    order: integer("order").notNull(),
    length: text("length"),
    icon: text("icon"), // Lucide icon name, e.g., "PlayCircle", "Code", "FileText"
    isPremium: boolean("isPremium").notNull().default(false),
    isComingSoon: boolean("isComingSoon").notNull().default(false),
    moduleId: serial("moduleId")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    videoKey: text("videoKey"),
    thumbnailKey: text("thumbnailKey"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("segments_slug_idx").on(table.slug),
    index("segments_module_order_idx").on(table.moduleId, table.order),
  ]
);

export const videoProcessingJobs = tableCreator(
  "video_processing_job",
  {
    id: serial("id").primaryKey(),
    segmentId: serial("segmentId")
      .notNull()
      .references(() => segments.id, { onDelete: "cascade" }),
    jobType: text("jobType").notNull(), // "transcript" | "transcode" | "thumbnail"
    status: text("status").notNull().default("pending"), // pending | processing | completed | failed
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("video_processing_jobs_segment_idx").on(table.segmentId),
    index("video_processing_jobs_status_idx").on(table.status),
    index("video_processing_jobs_created_idx").on(table.createdAt),
  ]
);

export const comments = tableCreator(
  "comment",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    segmentId: serial("segmentId")
      .notNull()
      .references(() => segments.id, {
        onDelete: "cascade",
      }),
    parentId: integer("parentId").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    repliedToId: integer("repliedToId").references(
      (): AnyPgColumn => users.id,
      {
        onDelete: "cascade",
      }
    ),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("comments_segment_created_idx").on(table.segmentId, table.createdAt),
    index("comments_user_created_idx").on(table.userId, table.createdAt),
    index("comments_parent_idx").on(table.parentId),
    index("comments_replied_to_idx").on(table.repliedToId),
  ]
);

export const progress = tableCreator(
  "progress",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    segmentId: serial("segmentId").references(() => segments.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("progress_user_segment_unique_idx").on(
      table.userId,
      table.segmentId
    ),
  ]
);

export const testimonials = tableCreator(
  "testimonial",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    emojis: text("emojis").notNull(),
    displayName: text("displayName").notNull(),
    permissionGranted: boolean("permissionGranted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("testimonials_created_idx").on(table.createdAt)]
);

export const attachments = tableCreator(
  "attachment",
  {
    id: serial("id").primaryKey(),
    segmentId: serial("segmentId")
      .notNull()
      .references(() => segments.id, { onDelete: "cascade" }),
    fileName: text("fileName").notNull(),
    fileKey: text("fileKey").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("attachments_segment_created_idx").on(
      table.segmentId,
      table.createdAt
    ),
  ]
);

export const affiliates = tableCreator(
  "affiliate",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    affiliateCode: text("affiliateCode").notNull().unique(),
    paymentLink: text("paymentLink").notNull(),
    commissionRate: integer("commissionRate").notNull().default(30),
    totalEarnings: integer("totalEarnings").notNull().default(0),
    paidAmount: integer("paidAmount").notNull().default(0),
    unpaidBalance: integer("unpaidBalance").notNull().default(0),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("affiliates_user_id_idx").on(table.userId),
    index("affiliates_code_idx").on(table.affiliateCode),
  ]
);

export const affiliateReferrals = tableCreator(
  "affiliate_referral",
  {
    id: serial("id").primaryKey(),
    affiliateId: serial("affiliateId")
      .notNull()
      .references(() => affiliates.id, { onDelete: "cascade" }),
    purchaserId: serial("purchaserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeSessionId: text("stripeSessionId").notNull(),
    amount: integer("amount").notNull(),
    commission: integer("commission").notNull(),
    isPaid: boolean("isPaid").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("referrals_affiliate_created_idx").on(
      table.affiliateId,
      table.createdAt
    ),
    index("referrals_purchaser_idx").on(table.purchaserId),
    uniqueIndex("referrals_stripe_session_unique").on(table.stripeSessionId),
  ]
);

export const affiliatePayouts = tableCreator(
  "affiliate_payout",
  {
    id: serial("id").primaryKey(),
    affiliateId: serial("affiliateId")
      .notNull()
      .references(() => affiliates.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    paymentMethod: text("paymentMethod").notNull(),
    transactionId: text("transactionId"),
    notes: text("notes"),
    paidAt: timestamp("paid_at").notNull().defaultNow(),
    paidBy: serial("paidBy")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("payouts_affiliate_paid_idx").on(table.affiliateId, table.paidAt),
  ]
);

export const emailBatches = tableCreator(
  "email_batch",
  {
    id: serial("id").primaryKey(),
    subject: text("subject").notNull(),
    htmlContent: text("htmlContent").notNull(),
    recipientCount: integer("recipientCount").notNull().default(0),
    sentCount: integer("sentCount").notNull().default(0),
    failedCount: integer("failedCount").notNull().default(0),
    status: text("status").notNull().default("pending"), // pending, processing, completed, failed
    adminId: serial("adminId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("email_batches_admin_created_idx").on(table.adminId, table.createdAt),
    index("email_batches_status_idx").on(table.status),
  ]
);

export const userEmailPreferences = tableCreator(
  "user_email_preference",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    allowCourseUpdates: boolean("allowCourseUpdates").notNull().default(true),
    allowPromotional: boolean("allowPromotional").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("email_preferences_user_idx").on(table.userId)]
);

export const unsubscribeTokens = tableCreator(
  "unsubscribe_token",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: integer("userId").references(() => users.id, {
      onDelete: "cascade",
    }), // Nullable for newsletter-only subscribers
    emailAddress: text("emailAddress").notNull(),
    isUsed: boolean("isUsed").notNull().default(false),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("unsubscribe_tokens_token_idx").on(table.token),
    index("unsubscribe_tokens_user_idx").on(table.userId),
    index("unsubscribe_tokens_expires_idx").on(table.expiresAt),
  ]
);

export const newsletterSignups = tableCreator(
  "newsletter_signup",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    source: text("source").notNull().default("early_access"), // 'early_access', 'newsletter', 'waitlist'
    isVerified: boolean("isVerified").notNull().default(false),
    isUnsubscribed: boolean("isUnsubscribed").notNull().default(false),
    subscriptionType: text("subscriptionType").notNull().default("newsletter"), // 'newsletter', 'waitlist'
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("newsletter_signups_email_idx").on(table.email),
    index("newsletter_signups_source_idx").on(table.source),
    index("newsletter_signups_type_idx").on(table.subscriptionType),
    index("newsletter_signups_created_idx").on(table.createdAt),
  ]
);

export const emailTemplates = tableCreator(
  "email_template",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(), // 'waitlist_welcome', 'newsletter_welcome', etc.
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    content: text("content").notNull(), // Markdown content
    isActive: boolean("isActive").notNull().default(true),
    updatedBy: serial("updatedBy")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("email_templates_key_idx").on(table.key),
    index("email_templates_active_idx").on(table.isActive),
  ]
);

export const appSettings = tableCreator(
  "app_setting",
  {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("app_settings_key_idx").on(table.key)]
);

export const targetModeEnum = pgEnum("target_mode_enum", ["all", "premium", "non_premium", "custom"]);

export const featureFlagTargets = tableCreator(
  "feature_flag_target",
  {
    id: serial("id").primaryKey(),
    flagKey: text("flag_key").notNull().unique(),
    targetMode: targetModeEnum("target_mode").notNull().default("all"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);

export const featureFlagUsers = tableCreator(
  "feature_flag_user",
  {
    id: serial("id").primaryKey(),
    flagKey: text("flag_key")
      .notNull()
      .references(() => featureFlagTargets.flagKey, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("feature_flag_user_unique_idx").on(table.flagKey, table.userId),
    index("feature_flag_user_key_idx").on(table.flagKey),
  ]
);

export const agents = tableCreator(
  "agent",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    content: text("content").notNull(),
    authorId: serial("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isPublic: boolean("is_public").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("agents_author_idx").on(table.authorId),
    index("agents_type_idx").on(table.type),
    index("agents_public_idx").on(table.isPublic),
    index("agents_slug_idx").on(table.slug),
  ]
);

export const newsEntries = tableCreator(
  "news_entry",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    url: text("url").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // video, blog, changelog
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at").notNull(),
    authorId: serial("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isPublished: boolean("is_published").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("news_entries_author_idx").on(table.authorId),
    index("news_entries_type_idx").on(table.type),
    index("news_entries_published_idx").on(table.isPublished),
    index("news_entries_published_at_idx").on(table.publishedAt),
  ]
);

export const launchKits = tableCreator(
  "launch_kit",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description").notNull(),
    longDescription: text("long_description"),
    repositoryUrl: text("repository_url").notNull(),
    demoUrl: text("demo_url"),
    imageUrl: text("image_url"),
    cloneCount: integer("clone_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("launch_kits_active_idx").on(table.isActive),
    index("launch_kits_slug_idx").on(table.slug),
    index("launch_kits_created_idx").on(table.createdAt),
  ]
);

export const launchKitCategories = tableCreator(
  "launch_kit_category",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("launch_kit_categories_slug_idx").on(table.slug)]
);

export const newsTags = tableCreator(
  "news_tag",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    color: varchar("color", { length: 7 }).notNull().default("#3B82F6"), // hex color
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("news_tags_slug_idx").on(table.slug),
    index("news_tags_name_idx").on(table.name),
  ]
);

export const launchKitTags = tableCreator(
  "launch_kit_tag",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    color: varchar("color", { length: 7 }).notNull().default("#3B82F6"), // hex color
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    categoryId: serial("category_id").references(() => launchKitCategories.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    index("launch_kit_tags_category_idx").on(table.categoryId),
    index("launch_kit_tags_slug_idx").on(table.slug),
  ]
);

export const newsEntryTags = tableCreator(
  "news_entry_tag",
  {
    id: serial("id").primaryKey(),
    newsEntryId: serial("news_entry_id")
      .notNull()
      .references(() => newsEntries.id, { onDelete: "cascade" }),
    newsTagId: serial("news_tag_id")
      .notNull()
      .references(() => newsTags.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("news_entry_tags_entry_idx").on(table.newsEntryId),
    index("news_entry_tags_tag_idx").on(table.newsTagId),
    uniqueIndex("news_entry_tags_unique").on(
      table.newsEntryId,
      table.newsTagId
    ),
  ]
);

export const launchKitTagRelations = tableCreator(
  "launch_kit_tag_relation",
  {
    id: serial("id").primaryKey(),
    launchKitId: serial("launch_kit_id")
      .notNull()
      .references(() => launchKits.id, { onDelete: "cascade" }),
    tagId: serial("tag_id")
      .notNull()
      .references(() => launchKitTags.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("launch_kit_tag_relations_kit_idx").on(table.launchKitId),
    index("launch_kit_tag_relations_tag_idx").on(table.tagId),
    uniqueIndex("launch_kit_tag_relations_unique").on(
      table.launchKitId,
      table.tagId
    ),
  ]
);

export const launchKitComments = tableCreator(
  "launch_kit_comment",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    launchKitId: serial("launch_kit_id")
      .notNull()
      .references(() => launchKits.id, { onDelete: "cascade" }),
    parentId: integer("parent_id").references(
      (): AnyPgColumn => launchKitComments.id,
      {
        onDelete: "cascade",
      }
    ),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("launch_kit_comments_kit_created_idx").on(
      table.launchKitId,
      table.createdAt
    ),
    index("launch_kit_comments_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
    index("launch_kit_comments_parent_idx").on(table.parentId),
  ]
);

export const launchKitAnalytics = tableCreator(
  "launch_kit_analytics",
  {
    id: serial("id").primaryKey(),
    launchKitId: integer("launch_kit_id")
      .notNull()
      .references(() => launchKits.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
    }), // null for anonymous users
    eventType: varchar("event_type", { length: 50 }).notNull(), // view, clone, demo_visit
    ipAddress: text("ip_address"), // hashed for privacy
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("launch_kit_analytics_kit_idx").on(table.launchKitId),
    index("launch_kit_analytics_event_idx").on(table.eventType),
    index("launch_kit_analytics_created_idx").on(table.createdAt),
    index("launch_kit_analytics_user_idx").on(table.userId),
  ]
);

export const agentsRelations = relations(agents, ({ one }) => ({
  author: one(users, {
    fields: [agents.authorId],
    references: [users.id],
  }),
}));

export const newsEntriesRelations = relations(newsEntries, ({ one, many }) => ({
  author: one(users, {
    fields: [newsEntries.authorId],
    references: [users.id],
  }),
  newsEntryTags: many(newsEntryTags),
}));

export const newsTagsRelations = relations(newsTags, ({ many }) => ({
  newsEntryTags: many(newsEntryTags),
}));

export const newsEntryTagsRelations = relations(newsEntryTags, ({ one }) => ({
  newsEntry: one(newsEntries, {
    fields: [newsEntryTags.newsEntryId],
    references: [newsEntries.id],
  }),
  newsTag: one(newsTags, {
    fields: [newsEntryTags.newsTagId],
    references: [newsTags.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  profile: one(profiles, {
    fields: [projects.userId],
    references: [profiles.userId],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  accounts: many(accounts),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  segments: many(segments),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  profile: one(profiles, {
    fields: [testimonials.userId],
    references: [profiles.userId],
  }),
}));

export const segmentsRelations = relations(segments, ({ one, many }) => ({
  attachments: many(attachments),
  module: one(modules, {
    fields: [segments.moduleId],
    references: [modules.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [comments.userId],
    references: [profiles.userId],
  }),
  segment: one(segments, {
    fields: [comments.segmentId],
    references: [segments.id],
  }),
  parent: one(comments, {
    relationName: "parent",
    fields: [comments.parentId],
    references: [comments.id],
  }),
  children: many(comments, {
    relationName: "parent",
  }),
  repliedToProfile: one(profiles, {
    fields: [comments.repliedToId],
    references: [profiles.userId],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  segment: one(segments, {
    fields: [attachments.segmentId],
    references: [segments.id],
  }),
}));

export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  user: one(users, {
    fields: [affiliates.userId],
    references: [users.id],
  }),
  referrals: many(affiliateReferrals),
  payouts: many(affiliatePayouts),
}));

export const affiliateReferralsRelations = relations(
  affiliateReferrals,
  ({ one }) => ({
    affiliate: one(affiliates, {
      fields: [affiliateReferrals.affiliateId],
      references: [affiliates.id],
    }),
    purchaser: one(users, {
      fields: [affiliateReferrals.purchaserId],
      references: [users.id],
    }),
  })
);

export const affiliatePayoutsRelations = relations(
  affiliatePayouts,
  ({ one }) => ({
    affiliate: one(affiliates, {
      fields: [affiliatePayouts.affiliateId],
      references: [affiliates.id],
    }),
    paidByUser: one(users, {
      fields: [affiliatePayouts.paidBy],
      references: [users.id],
    }),
  })
);

export const emailBatchesRelations = relations(emailBatches, ({ one }) => ({
  admin: one(users, {
    fields: [emailBatches.adminId],
    references: [users.id],
  }),
}));

export const userEmailPreferencesRelations = relations(
  userEmailPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userEmailPreferences.userId],
      references: [users.id],
    }),
  })
);

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [emailTemplates.updatedBy],
    references: [users.id],
  }),
}));

export const featureFlagTargetsRelations = relations(
  featureFlagTargets,
  ({ many }) => ({
    users: many(featureFlagUsers),
  })
);

export const featureFlagUsersRelations = relations(
  featureFlagUsers,
  ({ one }) => ({
    user: one(users, {
      fields: [featureFlagUsers.userId],
      references: [users.id],
    }),
    target: one(featureFlagTargets, {
      fields: [featureFlagUsers.flagKey],
      references: [featureFlagTargets.flagKey],
    }),
  })
);

export const analyticsEvents = tableCreator(
  "analytics_event",
  {
    id: serial("id").primaryKey(),
    sessionId: text("sessionId").notNull(),
    eventType: text("eventType").notNull(), // page_view, purchase_intent, purchase_completed, course_access
    pagePath: text("pagePath").notNull(), // Includes UTM params in query string (e.g., /purchase?utm_source=google)
    referrer: text("referrer"),
    userAgent: text("userAgent"),
    ipAddressHash: text("ipAddressHash"),
    metadata: text("metadata"), // JSON string for flexible data
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("analytics_events_session_idx").on(table.sessionId),
    index("analytics_events_type_idx").on(table.eventType),
    index("analytics_events_created_idx").on(table.createdAt),
  ]
);

export const analyticsSessions = tableCreator(
  "analytics_session",
  {
    id: text("id").primaryKey(),
    firstSeen: timestamp("first_seen").notNull().defaultNow(),
    lastSeen: timestamp("last_seen").notNull().defaultNow(),
    referrerSource: text("referrerSource"),
    pageViews: integer("pageViews").notNull().default(0),
    hasPurchaseIntent: boolean("hasPurchaseIntent").notNull().default(false),
    hasConversion: boolean("hasConversion").notNull().default(false),
  },
  (table) => [index("analytics_sessions_first_seen_idx").on(table.firstSeen)]
);

export const blogPosts = tableCreator(
  "blog_post",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    isPublished: boolean("isPublished").notNull().default(false),
    authorId: serial("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    featuredImage: text("featuredImage"),
    tags: text("tags"), // JSON array of tags as string
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    publishedAt: timestamp("published_at"),
  },
  (table) => [
    index("blog_posts_slug_idx").on(table.slug),
    index("blog_posts_author_idx").on(table.authorId),
    index("blog_posts_published_idx").on(table.isPublished, table.publishedAt),
    index("blog_posts_created_idx").on(table.createdAt),
  ]
);

export const blogPostViews = tableCreator(
  "blog_post_view",
  {
    id: serial("id").primaryKey(),
    blogPostId: serial("blogPostId")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    sessionId: text("sessionId").notNull(),
    ipAddressHash: text("ipAddressHash"),
    userAgent: text("userAgent"),
    referrer: text("referrer"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("blog_post_views_post_idx").on(table.blogPostId),
    index("blog_post_views_session_idx").on(table.sessionId),
    index("blog_post_views_created_idx").on(table.createdAt),
    uniqueIndex("blog_post_views_session_post_unique").on(
      table.sessionId,
      table.blogPostId
    ),
  ]
);

export const unsubscribeTokensRelations = relations(
  unsubscribeTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [unsubscribeTokens.userId],
      references: [users.id],
    }),
  })
);

export const analyticsEventsRelations = relations(
  analyticsEvents,
  ({ one }) => ({
    session: one(analyticsSessions, {
      fields: [analyticsEvents.sessionId],
      references: [analyticsSessions.id],
    }),
  })
);

export const analyticsSessionsRelations = relations(
  analyticsSessions,
  ({ many }) => ({
    events: many(analyticsEvents),
  })
);

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  views: many(blogPostViews),
}));

export const blogPostViewsRelations = relations(blogPostViews, ({ one }) => ({
  blogPost: one(blogPosts, {
    fields: [blogPostViews.blogPostId],
    references: [blogPosts.id],
  }),
}));

export const launchKitsRelations = relations(launchKits, ({ many }) => ({
  tags: many(launchKitTagRelations),
  comments: many(launchKitComments),
  analytics: many(launchKitAnalytics),
}));

export const launchKitCategoriesRelations = relations(
  launchKitCategories,
  ({ many }) => ({
    tags: many(launchKitTags),
  })
);

export const launchKitTagsRelations = relations(
  launchKitTags,
  ({ one, many }) => ({
    category: one(launchKitCategories, {
      fields: [launchKitTags.categoryId],
      references: [launchKitCategories.id],
    }),
    launchKits: many(launchKitTagRelations),
  })
);

export const launchKitTagRelationsRelations = relations(
  launchKitTagRelations,
  ({ one }) => ({
    launchKit: one(launchKits, {
      fields: [launchKitTagRelations.launchKitId],
      references: [launchKits.id],
    }),
    tag: one(launchKitTags, {
      fields: [launchKitTagRelations.tagId],
      references: [launchKitTags.id],
    }),
  })
);

export const launchKitCommentsRelations = relations(
  launchKitComments,
  ({ one, many }) => ({
    user: one(users, {
      fields: [launchKitComments.userId],
      references: [users.id],
    }),
    launchKit: one(launchKits, {
      fields: [launchKitComments.launchKitId],
      references: [launchKits.id],
    }),
    parent: one(launchKitComments, {
      relationName: "parent",
      fields: [launchKitComments.parentId],
      references: [launchKitComments.id],
    }),
    children: many(launchKitComments, {
      relationName: "parent",
    }),
  })
);

export const launchKitAnalyticsRelations = relations(
  launchKitAnalytics,
  ({ one }) => ({
    launchKit: one(launchKits, {
      fields: [launchKitAnalytics.launchKitId],
      references: [launchKits.id],
    }),
    user: one(users, {
      fields: [launchKitAnalytics.userId],
      references: [users.id],
    }),
  })
);

export const appLaunchKitCategories = relations(
  launchKitCategories,
  ({ many }) => ({
    tags: many(launchKitTags),
  })
);

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Segment = typeof segments.$inferSelect;
export type SegmentCreate = typeof segments.$inferInsert;
export type VideoProcessingJob = typeof videoProcessingJobs.$inferSelect;
export type VideoProcessingJobCreate = typeof videoProcessingJobs.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type AttachmentCreate = typeof attachments.$inferInsert;
export type Progress = typeof progress.$inferSelect;
export type ProgressCreate = typeof progress.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type ModuleCreate = typeof modules.$inferInsert;
export type Testimonial = typeof testimonials.$inferSelect;
export type TestimonialCreate = typeof testimonials.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type CommentCreate = typeof comments.$inferInsert;
export type Affiliate = typeof affiliates.$inferSelect;
export type AffiliateCreate = typeof affiliates.$inferInsert;
export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type AffiliateReferralCreate = typeof affiliateReferrals.$inferInsert;
export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type AffiliatePayoutCreate = typeof affiliatePayouts.$inferInsert;
export type EmailBatch = typeof emailBatches.$inferSelect;
export type EmailBatchCreate = typeof emailBatches.$inferInsert;
export type UserEmailPreference = typeof userEmailPreferences.$inferSelect;
export type UserEmailPreferenceCreate =
  typeof userEmailPreferences.$inferInsert;
export type UnsubscribeToken = typeof unsubscribeTokens.$inferSelect;
export type UnsubscribeTokenCreate = typeof unsubscribeTokens.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type AnalyticsEventCreate = typeof analyticsEvents.$inferInsert;
export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type AnalyticsSessionCreate = typeof analyticsSessions.$inferInsert;
export type NewsletterSignup = typeof newsletterSignups.$inferSelect;
export type NewsletterSignupCreate = typeof newsletterSignups.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type EmailTemplateCreate = typeof emailTemplates.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type AppSettingCreate = typeof appSettings.$inferInsert;
export type FeatureFlagTarget = typeof featureFlagTargets.$inferSelect;
export type FeatureFlagTargetCreate = typeof featureFlagTargets.$inferInsert;
export type FeatureFlagUser = typeof featureFlagUsers.$inferSelect;
export type FeatureFlagUserCreate = typeof featureFlagUsers.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type AgentCreate = typeof agents.$inferInsert;

export type NewsEntry = typeof newsEntries.$inferSelect;
export type NewsEntryCreate = typeof newsEntries.$inferInsert;
export type NewsTag = typeof newsTags.$inferSelect;
export type NewsTagCreate = typeof newsTags.$inferInsert;
export type NewsEntryTag = typeof newsEntryTags.$inferSelect;
export type NewsEntryTagCreate = typeof newsEntryTags.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type ProjectCreate = typeof projects.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type BlogPostCreate = typeof blogPosts.$inferInsert;
export type BlogPostView = typeof blogPostViews.$inferSelect;
export type BlogPostViewCreate = typeof blogPostViews.$inferInsert;
export type LaunchKit = typeof launchKits.$inferSelect;
export type LaunchKitCreate = typeof launchKits.$inferInsert;
export type LaunchKitCategory = typeof launchKitCategories.$inferSelect;
export type LaunchKitCategoryCreate = typeof launchKitCategories.$inferInsert;
export type LaunchKitTag = typeof launchKitTags.$inferSelect;
export type LaunchKitTagCreate = typeof launchKitTags.$inferInsert;
export type LaunchKitTagRelation = typeof launchKitTagRelations.$inferSelect;
export type LaunchKitTagRelationCreate =
  typeof launchKitTagRelations.$inferInsert;
export type LaunchKitComment = typeof launchKitComments.$inferSelect;
export type LaunchKitCommentCreate = typeof launchKitComments.$inferInsert;
export type LaunchKitAnalytics = typeof launchKitAnalytics.$inferSelect;
export type LaunchKitAnalyticsCreate = typeof launchKitAnalytics.$inferInsert;
