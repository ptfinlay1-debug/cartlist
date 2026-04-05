import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

export const lists = sqliteTable("lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🛒"),
});

export const stores = sqliteTable("stores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  color: text("color").notNull().default("#22c55e"),
});

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listId: integer("list_id").references(() => lists.id).notNull(),
  name: text("name").notNull(),
  storeId: integer("store_id").references(() => stores.id),
  price: real("price"),
  quantity: text("quantity").notNull().default("1"),
  unit: text("unit").notNull().default(""),
  checked: integer("checked", { mode: "boolean" }).notNull().default(false),
  note: text("note").notNull().default(""),
  category: text("category").notNull().default(""),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertListSchema = createInsertSchema(lists).omit({ id: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertList = z.infer<typeof insertListSchema>;
export type List = typeof lists.$inferSelect;

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type Session = typeof sessions.$inferSelect;
