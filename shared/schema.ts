import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Articles (from Semantic Scholar or Wikipedia)
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  abstract: text("abstract"),
  authors: text("authors").array(),
  source: text("source").notNull(), // 'semantic_scholar' | 'wikipedia'
  sourceUrl: text("source_url"),
  category: text("category"),
  images: json("images").$type<{ url: string; caption?: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Downloaded Articles (stored locally)
export const downloads = pgTable("downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  abstract: text("abstract"),
  authors: text("authors").array(),
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  category: text("category"),
  thumbnail: text("thumbnail"), // First image or generated placeholder
  images: json("images").$type<{ url: string; caption?: string }[]>().default([]),
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
});

// Highlights (yellow or green)
export const highlights = pgTable("highlights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  downloadId: varchar("download_id").notNull().references(() => downloads.id, { onDelete: 'cascade' }),
  text: text("text").notNull(),
  color: text("color").notNull(), // 'yellow' | 'green'
  startOffset: integer("start_offset").notNull(),
  endOffset: integer("end_offset").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bookmarks
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  downloadId: varchar("download_id").notNull().references(() => downloads.id, { onDelete: 'cascade' }),
  position: integer("position").notNull(), // Scroll position or paragraph index
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Thought Clouds
export const thoughts = pgTable("thoughts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  downloadId: varchar("download_id").notNull().references(() => downloads.id, { onDelete: 'cascade' }),
  highlightId: varchar("highlight_id").references(() => highlights.id, { onDelete: 'cascade' }),
  text: text("text").notNull(),
  highlightedText: text("highlighted_text").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Annotations (underlines and sticky notes)
export const annotations = pgTable("annotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  downloadId: varchar("download_id").notNull().references(() => downloads.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'underline' | 'sticky_note'
  text: text("text").notNull(), // The annotated text
  content: text("content"), // For sticky notes
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Preferences (theme, font)
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  theme: text("theme").notNull().default('default'), // 'default' | 'glass'
  fontFamily: text("font_family").notNull().default('sans'), // 'sans' | 'serif' | 'display' | 'script' | 'body' | 'elegant' | 'reading'
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  downloadedAt: true,
});

export const insertHighlightSchema = createInsertSchema(highlights).omit({
  id: true,
  createdAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertThoughtSchema = createInsertSchema(thoughts).omit({
  id: true,
  createdAt: true,
});

export const insertAnnotationSchema = createInsertSchema(annotations).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

// Types
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type Download = typeof downloads.$inferSelect;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;

export type Highlight = typeof highlights.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type Thought = typeof thoughts.$inferSelect;
export type InsertThought = z.infer<typeof insertThoughtSchema>;

export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// API Response Types
export type SearchSuggestion = {
  id: string;
  title: string;
  source: string;
  isDownloaded?: boolean;
};

export type ArticleImage = {
  url: string;
  caption?: string;
};
