import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";
import {
  users, sessions, lists, stores, items,
  type User, type Session, type List, type Store, type Item,
  type InsertUser, type InsertList, type InsertStore, type InsertItem
} from "@shared/schema";

const sqlite = new Database("grocery.db");
const db = drizzle(sqlite);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🛒'
  );
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#22c55e'
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES lists(id),
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

export class Storage {
  // === USERS ===
  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  createUser(data: InsertUser): User {
    return db.insert(users).values(data).returning().get();
  }

  // === SESSIONS ===
  createSession(session: Session): Session {
    return db.insert(sessions).values(session).returning().get();
  }

  getSession(id: string): Session | undefined {
    return db.select().from(sessions).where(eq(sessions.id, id)).get();
  }

  deleteSession(id: string): void {
    db.delete(sessions).where(eq(sessions.id, id)).run();
  }

  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  // === LISTS ===
  getLists(userId: number): List[] {
    return db.select().from(lists).where(eq(lists.userId, userId)).all();
  }

  createList(data: InsertList): List {
    return db.insert(lists).values(data).returning().get();
  }

  updateList(id: number, userId: number, data: Partial<InsertList>): List | undefined {
    return db.update(lists).set(data).where(and(eq(lists.id, id), eq(lists.userId, userId))).returning().get();
  }

  deleteList(id: number, userId: number): void {
    db.delete(items).where(eq(items.listId, id)).run();
    db.delete(lists).where(and(eq(lists.id, id), eq(lists.userId, userId))).run();
  }

  // === STORES ===
  getStores(userId: number): Store[] {
    return db.select().from(stores).where(eq(stores.userId, userId)).all();
  }

  createStore(data: InsertStore): Store {
    return db.insert(stores).values(data).returning().get();
  }

  updateStore(id: number, userId: number, data: Partial<InsertStore>): Store | undefined {
    return db.update(stores).set(data).where(and(eq(stores.id, id), eq(stores.userId, userId))).returning().get();
  }

  deleteStore(id: number, userId: number): void {
    db.update(items).set({ storeId: null }).where(eq(items.storeId, id)).run();
    db.delete(stores).where(and(eq(stores.id, id), eq(stores.userId, userId))).run();
  }

  // === ITEMS ===
  getItemsByList(listId: number): Item[] {
    return db.select().from(items).where(eq(items.listId, listId)).all();
  }

  createItem(data: InsertItem): Item {
    return db.insert(items).values(data).returning().get();
  }

  updateItem(id: number, data: Partial<InsertItem>): Item | undefined {
    return db.update(items).set(data).where(eq(items.id, id)).returning().get();
  }

  deleteItem(id: number): void {
    db.delete(items).where(eq(items.id, id)).run();
  }

  clearCheckedItems(listId: number): void {
    db.delete(items).where(and(eq(items.listId, listId), eq(items.checked, true))).run();
  }
}

export const storage = new Storage();
