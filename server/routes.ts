import type { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { storage, runMigrations } from "./storage";
import { insertListSchema, insertStoreSchema, insertItemSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// Session middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.session;
  if (!sessionId) return res.status(401).json({ error: "Not authenticated" });

  const session = await storage.getSession(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    if (session) await storage.deleteSession(sessionId);
    return res.status(401).json({ error: "Session expired" });
  }

  const user = await storage.getUserById(session.userId);
  if (!user) return res.status(401).json({ error: "User not found" });

  (req as any).user = user;
  next();
}

export async function registerRoutes(httpServer: Server, app: Express) {
  // Run DB migrations on startup
  await runMigrations();

  // Parse cookies
  app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie ?? "";
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((part) => {
      const [k, ...v] = part.trim().split("=");
      if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
    });
    (req as any).cookies = cookies;
    next();
  });

  // === AUTH ===
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });
      if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) return res.status(400).json({ error: "An account with that email already exists" });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email: email.toLowerCase(), passwordHash, name: name ?? "" });

      const sessionId = randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await storage.createSession({ id: sessionId, userId: user.id, expiresAt });

      res.setHeader("Set-Cookie", `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
      res.json({ id: user.id, email: user.email, name: user.name });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) return res.status(401).json({ error: "Invalid email or password" });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password" });

      const sessionId = randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await storage.createSession({ id: sessionId, userId: user.id, expiresAt });

      res.setHeader("Set-Cookie", `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
      res.json({ id: user.id, email: user.email, name: user.name });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const sessionId = (req as any).cookies?.session;
    if (sessionId) await storage.deleteSession(sessionId);
    res.setHeader("Set-Cookie", "session=; Path=/; HttpOnly; Max-Age=0");
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = (req as any).user;
    res.json({ id: user.id, email: user.email, name: user.name });
  });

  // === LISTS ===
  app.get("/api/lists", requireAuth, async (req, res) => {
    const user = (req as any).user;
    res.json(await storage.getLists(user.id));
  });

  app.post("/api/lists", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const result = insertListSchema.safeParse({ ...req.body, userId: user.id });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(await storage.createList(result.data));
  });

  app.patch("/api/lists/:id", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const list = await storage.updateList(parseInt(req.params.id), user.id, req.body);
    if (!list) return res.status(404).json({ error: "List not found" });
    res.json(list);
  });

  app.delete("/api/lists/:id", requireAuth, async (req, res) => {
    const user = (req as any).user;
    await storage.deleteList(parseInt(req.params.id), user.id);
    res.json({ success: true });
  });

  // === STORES ===
  app.get("/api/stores", requireAuth, async (req, res) => {
    const user = (req as any).user;
    res.json(await storage.getStores(user.id));
  });

  app.post("/api/stores", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const result = insertStoreSchema.safeParse({ ...req.body, userId: user.id });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(await storage.createStore(result.data));
  });

  app.patch("/api/stores/:id", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const store = await storage.updateStore(parseInt(req.params.id), user.id, req.body);
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  });

  app.delete("/api/stores/:id", requireAuth, async (req, res) => {
    const user = (req as any).user;
    await storage.deleteStore(parseInt(req.params.id), user.id);
    res.json({ success: true });
  });

  // === ITEMS ===
  app.get("/api/items", requireAuth, async (req, res) => {
    const listId = parseInt(req.query.listId as string);
    if (isNaN(listId)) return res.status(400).json({ error: "listId required" });
    res.json(await storage.getItemsByList(listId));
  });

  app.post("/api/items", requireAuth, async (req, res) => {
    const result = insertItemSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(await storage.createItem(result.data));
  });

  app.patch("/api/items/:id", requireAuth, async (req, res) => {
    const item = await storage.updateItem(parseInt(req.params.id), req.body);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  });

  app.delete("/api/items/:id", requireAuth, async (req, res) => {
    await storage.deleteItem(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/items/clear-checked", requireAuth, async (req, res) => {
    const { listId } = req.body;
    if (!listId) return res.status(400).json({ error: "listId required" });
    await storage.clearCheckedItems(parseInt(listId));
    res.json({ success: true });
  });
}
