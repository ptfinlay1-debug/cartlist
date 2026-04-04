import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stores = sqliteTable("stores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#01696f"),
});

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true });

// Types
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
