import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { insertStoreSchema, insertItemSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(httpServer: Server, app: Express) {
  // === STORES ===
  app.get("/api/stores", (req, res) => {
    res.json(storage.getStores());
  });

  app.post("/api/stores", (req, res) => {
    const result = insertStoreSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(storage.createStore(result.data));
  });

  app.patch("/api/stores/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const store = storage.updateStore(id, req.body);
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  });

  app.delete("/api/stores/:id", (req, res) => {
    storage.deleteStore(parseInt(req.params.id));
    res.json({ success: true });
  });

  // === ITEMS ===
  app.get("/api/items", (req, res) => {
    res.json(storage.getItems());
  });

  app.post("/api/items", (req, res) => {
    const result = insertItemSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(storage.createItem(result.data));
  });

  app.patch("/api/items/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const item = storage.updateItem(id, req.body);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  });

  app.delete("/api/items/:id", (req, res) => {
    storage.deleteItem(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/items/clear-checked", (req, res) => {
    storage.clearCheckedItems();
    res.json({ success: true });
  });
}
