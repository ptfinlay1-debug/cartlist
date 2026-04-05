import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import {
  users, sessions, lists, stores, items,
  type User, type Session, type List, type Store, type Item,
  type InsertUser, type InsertList, type InsertStore, type InsertItem
} from "@shared/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { ssl: { rejectUnauthorized: false } });
const db = drizzle(client);

// Run migrations (create tables if not exist)
export async function runMigrations() {
  await client`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT ''
    )
  `;
  await client`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at BIGINT NOT NULL
    )
  `;
  await client`
    CREATE TABLE IF NOT EXISTS lists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🛒'
    )
  `;
  await client`
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#22c55e'
    )
  `;
  await client`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      list_id INTEGER NOT NULL REFERENCES lists(id),
      name TEXT NOT NULL,
      store_id INTEGER REFERENCES stores(id),
      price REAL,
      quantity TEXT NOT NULL DEFAULT '1',
      unit TEXT NOT NULL DEFAULT '',
      checked BOOLEAN NOT NULL DEFAULT FALSE,
      note TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT ''
    )
  `;
}

export class Storage {
  // === USERS ===
  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).then(r => r[0]);
  }

  async createUser(data: InsertUser): Promise<User> {
    return db.insert(users).values(data).returning().then(r => r[0]);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).then(r => r[0]);
  }

  // === SESSIONS ===
  async createSession(session: Session): Promise<Session> {
    return db.insert(sessions).values(session).returning().then(r => r[0]);
  }

  async getSession(id: string): Promise<Session | undefined> {
    return db.select().from(sessions).where(eq(sessions.id, id)).then(r => r[0]);
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  // === LISTS ===
  async getLists(userId: number): Promise<List[]> {
    return db.select().from(lists).where(eq(lists.userId, userId));
  }

  async createList(data: InsertList): Promise<List> {
    return db.insert(lists).values(data).returning().then(r => r[0]);
  }

  async updateList(id: number, userId: number, data: Partial<InsertList>): Promise<List | undefined> {
    return db.update(lists).set(data).where(and(eq(lists.id, id), eq(lists.userId, userId))).returning().then(r => r[0]);
  }

  async deleteList(id: number, userId: number): Promise<void> {
    await db.delete(items).where(eq(items.listId, id));
    await db.delete(lists).where(and(eq(lists.id, id), eq(lists.userId, userId)));
  }

  // === STORES ===
  async getStores(userId: number): Promise<Store[]> {
    return db.select().from(stores).where(eq(stores.userId, userId));
  }

  async createStore(data: InsertStore): Promise<Store> {
    return db.insert(stores).values(data).returning().then(r => r[0]);
  }

  async updateStore(id: number, userId: number, data: Partial<InsertStore>): Promise<Store | undefined> {
    return db.update(stores).set(data).where(and(eq(stores.id, id), eq(stores.userId, userId))).returning().then(r => r[0]);
  }

  async deleteStore(id: number, userId: number): Promise<void> {
    await db.update(items).set({ storeId: null }).where(eq(items.storeId, id));
    await db.delete(stores).where(and(eq(stores.id, id), eq(stores.userId, userId)));
  }

  // === ITEMS ===
  async getItemsByList(listId: number): Promise<Item[]> {
    return db.select().from(items).where(eq(items.listId, listId));
  }

  async createItem(data: InsertItem): Promise<Item> {
    return db.insert(items).values(data).returning().then(r => r[0]);
  }

  async updateItem(id: number, data: Partial<InsertItem>): Promise<Item | undefined> {
    return db.update(items).set(data).where(eq(items.id, id)).returning().then(r => r[0]);
  }

  async deleteItem(id: number): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  async clearCheckedItems(listId: number): Promise<void> {
    await db.delete(items).where(and(eq(items.listId, listId), eq(items.checked, true)));
  }
}

export const storage = new Storage();
