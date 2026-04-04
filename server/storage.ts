import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { stores, items, type Store, type Item, type InsertStore, type InsertItem } from "@shared/schema";

const sqlite = new Database("grocery.db");
const db = drizzle(sqlite);

// Migrations
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#01696f'
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    store_id INTEGER REFERENCES stores(id),
    price REAL,
    quantity TEXT NOT NULL DEFAULT '1',
    unit TEXT NOT NULL DEFAULT '',
    checked INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT ''
  );
`);

export interface IStorage {
  // Stores
  getStores(): Store[];
  createStore(store: InsertStore): Store;
  updateStore(id: number, store: Partial<InsertStore>): Store | undefined;
  deleteStore(id: number): void;

  // Items
  getItems(): Item[];
  createItem(item: InsertItem): Item;
  updateItem(id: number, item: Partial<InsertItem>): Item | undefined;
  deleteItem(id: number): void;
  clearCheckedItems(): void;
}

export class Storage implements IStorage {
  getStores(): Store[] {
    return db.select().from(stores).all();
  }

  createStore(store: InsertStore): Store {
    return db.insert(stores).values(store).returning().get();
  }

  updateStore(id: number, data: Partial<InsertStore>): Store | undefined {
    return db.update(stores).set(data).where(eq(stores.id, id)).returning().get();
  }

  deleteStore(id: number): void {
    // Set store_id to null for items using this store
    db.update(items).set({ storeId: null }).where(eq(items.storeId, id)).run();
    db.delete(stores).where(eq(stores.id, id)).run();
  }

  getItems(): Item[] {
    return db.select().from(items).all();
  }

  createItem(item: InsertItem): Item {
    return db.insert(items).values(item).returning().get();
  }

  updateItem(id: number, data: Partial<InsertItem>): Item | undefined {
    return db.update(items).set(data).where(eq(items.id, id)).returning().get();
  }

  deleteItem(id: number): void {
    db.delete(items).where(eq(items.id, id)).run();
  }

  clearCheckedItems(): void {
    db.delete(items).where(eq(items.checked, true)).run();
  }
}

export const storage = new Storage();
