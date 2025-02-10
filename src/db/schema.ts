import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).unique().notNull(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export const userSchema = createInsertSchema(users, {
  email: () => z.string().email(),
  password: () => z.string().min(60, "Invalid hashed password"),
});
export const userSignupSchema = userSchema.extend({
  password: z.string().min(8, "Passwords must be atleast 8 characters long"),
});

export const tasks = pgTable("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  task: text().notNull(),
  status: varchar({ length: 20, enum: ["Completed", "Pending"] }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const tasksSchema = createInsertSchema(tasks);
