import { pgTable, text, serial, integer, boolean, timestamp, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// This table is mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// This table is mandatory for Replit Auth
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  inviteCode: text("invite_code").notNull().unique(),
  ownerId: text("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const spaceMembers = pgTable("space_members", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").references(() => spaces.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("participant"), // "admin" | "participant"
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  spaceId: integer("space_id").references(() => spaces.id).notNull(),
  createdBy: text("created_by").references(() => users.id).notNull(),
  questions: json("questions").notNull(), // Array of question objects
  frequency: text("frequency").notNull(), // "weekly" | "biweekly" | "monthly"
  sendTime: text("send_time").notNull(), // "HH:MM" format
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").references(() => forms.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  answers: json("answers").notNull(), // Object with question IDs as keys
  isDraft: boolean("is_draft").default(false).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSpaceSchema = createInsertSchema(spaces).omit({
  id: true,
  inviteCode: true,
  createdAt: true,
});

export const insertSpaceMemberSchema = createInsertSchema(spaceMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  createdAt: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  submittedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Space = typeof spaces.$inferSelect;
export type InsertSpace = z.infer<typeof insertSpaceSchema>;

export type SpaceMember = typeof spaceMembers.$inferSelect;
export type InsertSpaceMember = z.infer<typeof insertSpaceMemberSchema>;

export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;

export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;

// Question types
export type QuestionType = "text" | "textarea" | "multiple-choice" | "rating" | "image";

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: string[]; // For multiple choice
  maxRating?: number; // For rating questions
}

export interface Answer {
  questionId: string;
  value: string | number | string[];
}
