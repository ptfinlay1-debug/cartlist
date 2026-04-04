import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Store,
  MoreVertical,
  Trash2,
  Pencil,
  ShoppingCart,
  PackageCheck,
  ChevronDown,
  ChevronRight,
  Filter,
  DollarSign,
  X,
} from "lucide-react";
import type { Item, Store as StoreType } from "@shared/schema";

const STORE_COLORS = [
  "#22c55e", "#3b82f6", "#f97316", "#a855f7",
  "#ec4899", "#14b8a6", "#eab308", "#ef4444",
  "#06b6d4", "#84cc16",
];

// ── Logo ──────────────────────────────────────────────────────────────────────
function CartListLogo() {
  return (
    <svg aria-label="CartList" viewBox="0 0 32 32" width="28" height="28" fill="none">
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-primary" />
      <path d="M8 10h2l3 9h8l2-6H11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="13.5" cy="21.5" r="1.5" fill="white"/>
      <circle cx="19.5" cy="21.5" r="1.5" fill="white"/>
    </svg>
  );
}

// ── Store manager dialog ───────────────────────────────────────────────────────
function StoreDialog({
  open,
  onClose,
  store,
}: {
  open: boolean;
  onClose: () => void;
  store?: StoreType | null;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(store?.name ?? "");
  const [color, setColor] = useState(store?.color ?? STORE_COLORS[0]);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      apiRequest("POST", "/api/stores", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ description: "Store added." });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      apiRequest("PATCH", `/api/stores/${store!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ description: "Store updated." });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
    const data = { name: name.trim(), color };
    if (store) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{store ? "Edit Store" : "Add Store"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="store-name">Store name</Label>
            <Input
              id="store-name"
              data-testid="input-store-name"
              placeholder="e.g. Costco, Trader Joe's"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {STORE_COLORS.map((c) => (
                <button
                  key={c}
                  data-testid={`color-swatch-${c}`}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#111" : "transparent",
                    transform: color === c ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            data-testid="button-save-store"
            onClick={handleSubmit}
            disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
          >
            {store ? "Save" : "Add Store"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Item form dialog ──────────────────────────────────────────────────────────
function ItemDialog({
  open,
  onClose,
  item,
  stores,
  defaultStoreId,
}: {
  open: boolean;
  onClose: () => void;
  item?: Item | null;
  stores: StoreType[];
  defaultStoreId?: number | null;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(item?.name ?? "");
  const [storeId, setStoreId] = useState<string>(
    item?.storeId ? String(item.storeId) : defaultStoreId ? String(defaultStoreId) : "none"
  );
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : "");
  const [quantity, setQuantity] = useState(item?.quantity ?? "1");
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [note, setNote] = useState(item?.note ?? "");

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ description: "Item added." });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: object) => apiRequest("PATCH", `/api/items/${item!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ description: "Item updated." });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      storeId: storeId === "none" ? null : parseInt(storeId),
      price: price !== "" ? parseFloat(price) : null,
      quantity: quantity || "1",
      unit: unit.trim(),
      category: category.trim(),
      note: note.trim(),
      checked: item?.checked ?? false,
    };
    if (item) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Item name *</Label>
            <Input
              id="item-name"
              data-testid="input-item-name"
              placeholder="e.g. Almond milk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="item-qty">Quantity</Label>
              <Input
                id="item-qty"
                data-testid="input-item-quantity"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-unit">Unit</Label>
              <Input
                id="item-unit"
                data-testid="input-item-unit"
                placeholder="lbs, oz, pk..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-price">Price ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="item-price"
                data-testid="input-item-price"
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Store</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger data-testid="select-item-store">
                <SelectValue placeholder="No store assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No store assigned</SelectItem>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    <div className="flex items-center gap-2">
                      <span
                        className="store-dot"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-category">Category (optional)</Label>
            <Input
              id="item-category"
              data-testid="input-item-category"
              placeholder="e.g. Produce, Dairy, Snacks"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-note">Note (optional)</Label>
            <Input
              id="item-note"
              data-testid="input-item-note"
              placeholder="Brand, size, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            data-testid="button-save-item"
            onClick={handleSubmit}
            disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
          >
            {item ? "Save" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Single item row ────────────────────────────────────────────────────────────
function ItemRow({
  item,
  stores,
  onEdit,
}: {
  item: Item;
  stores: StoreType[];
  onEdit: (item: Item) => void;
}) {
  const store = stores.find((s) => s.id === item.storeId);

  const toggleMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/items/${item.id}`, { checked: !item.checked }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/items"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/items/${item.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/items"] }),
  });

  return (
    <div
      className={`item-row flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:bg-accent/40 group ${item.checked ? "item-checked" : ""}`}
      data-testid={`item-row-${item.id}`}
    >
      <Checkbox
        checked={item.checked}
        onCheckedChange={() => toggleMutation.mutate()}
        data-testid={`checkbox-item-${item.id}`}
        className="shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="item-name font-medium text-sm" data-testid={`text-item-name-${item.id}`}>
            {item.name}
          </span>
          {item.quantity && item.quantity !== "1" && (
            <span className="text-xs text-muted-foreground">
              {item.quantity}{item.unit ? ` ${item.unit}` : ""}
            </span>
          )}
          {item.quantity === "1" && item.unit && (
            <span className="text-xs text-muted-foreground">{item.unit}</span>
          )}
          {item.category && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
              {item.category}
            </Badge>
          )}
        </div>
        {item.note && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.note}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {item.price != null && (
          <span className="text-sm font-semibold text-primary" data-testid={`text-price-${item.id}`}>
            ${item.price.toFixed(2)}
          </span>
        )}
        {store && (
          <span
            className="store-dot"
            title={store.name}
            style={{ backgroundColor: store.color }}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`button-menu-item-${item.id}`}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)} data-testid={`menu-edit-${item.id}`}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteMutation.mutate()}
              className="text-destructive"
              data-testid={`menu-delete-${item.id}`}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function GroceryApp() {
  const { toast } = useToast();

  // Modals
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [editStore, setEditStore] = useState<StoreType | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [quickAddStoreId, setQuickAddStoreId] = useState<number | null>(null);

  // Filters
  const [filterStoreId, setFilterStoreId] = useState<number | "all" | "unassigned">("all");
  const [showChecked, setShowChecked] = useState(true);

  // Store section collapse state
  const [collapsed, setCollapsed] = useState<Record<string | number, boolean>>({});

  // Data queries
  const { data: stores = [], isLoading: storesLoading } = useQuery<StoreType[]>({
    queryKey: ["/api/stores"],
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const deleteStoreMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/stores/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ description: "Store deleted." });
    },
  });

  const clearCheckedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/items/clear-checked", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ description: "Checked items cleared." });
    },
  });

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!showChecked && item.checked) return false;
      if (filterStoreId === "all") return true;
      if (filterStoreId === "unassigned") return item.storeId == null;
      return item.storeId === filterStoreId;
    });
  }, [items, filterStoreId, showChecked]);

  // Group by store
  const groupedItems = useMemo(() => {
    const groups: Map<string | number, { label: string; color?: string; items: Item[] }> = new Map();

    for (const item of filteredItems) {
      const key = item.storeId ?? "unassigned";
      if (!groups.has(key)) {
        const store = stores.find((s) => s.id === item.storeId);
        groups.set(key, {
          label: store?.name ?? "No Store",
          color: store?.color,
          items: [],
        });
      }
      groups.get(key)!.items.push(item);
    }

    // Sort: stores first (by name), then unassigned
    const entries = Array.from(groups.entries()).sort(([ka], [kb]) => {
      if (ka === "unassigned") return 1;
      if (kb === "unassigned") return -1;
      return 0;
    });

    return entries;
  }, [filteredItems, stores]);

  // Summary stats
  const totalPrice = useMemo(() => {
    return items
      .filter((i) => !i.checked && i.price != null)
      .reduce((sum, i) => sum + (i.price ?? 0), 0);
  }, [items]);

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;

  const toggleCollapse = (key: string | number) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  if (storesLoading || itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <ShoppingCart className="w-8 h-8 animate-bounce" />
          <p className="text-sm">Loading your list…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <CartListLogo />
          <div className="flex-1">
            <h1 className="font-bold text-base leading-tight">CartList</h1>
            <p className="text-xs text-muted-foreground">
              {totalCount === 0
                ? "Your list is empty"
                : `${checkedCount}/${totalCount} done${totalPrice > 0 ? ` · Est. $${totalPrice.toFixed(2)}` : ""}`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditItem(null);
              setQuickAddStoreId(null);
              setItemDialogOpen(true);
            }}
            data-testid="button-add-item"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Stores bar */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              Stores
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => { setEditStore(null); setStoreDialogOpen(true); }}
              data-testid="button-add-store"
            >
              <Plus className="w-3 h-3" />
              Add store
            </Button>
          </div>

          {stores.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No stores yet. Add one to organize your list.
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStoreId("all")}
                data-testid="filter-all"
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filterStoreId === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-accent"
                }`}
              >
                All
              </button>
              {stores.map((store) => (
                <div key={store.id} className="flex items-center gap-1 group/store">
                  <button
                    onClick={() => setFilterStoreId(store.id === filterStoreId ? "all" : store.id)}
                    data-testid={`filter-store-${store.id}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      filterStoreId === store.id
                        ? "text-white border-transparent"
                        : "bg-card border-border hover:bg-accent"
                    }`}
                    style={
                      filterStoreId === store.id
                        ? { backgroundColor: store.color, borderColor: store.color }
                        : {}
                    }
                  >
                    <span
                      className="store-dot"
                      style={{
                        backgroundColor:
                          filterStoreId === store.id ? "rgba(255,255,255,0.7)" : store.color,
                      }}
                    />
                    {store.name}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 opacity-0 group-hover/store:opacity-100 transition-opacity"
                        data-testid={`button-store-menu-${store.id}`}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => { setEditStore(store); setStoreDialogOpen(true); }}
                        data-testid={`menu-edit-store-${store.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteStoreMutation.mutate(store.id)}
                        data-testid={`menu-delete-store-${store.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <button
                onClick={() => setFilterStoreId(filterStoreId === "unassigned" ? "all" : "unassigned")}
                data-testid="filter-unassigned"
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filterStoreId === "unassigned"
                    ? "bg-muted-foreground text-background border-muted-foreground"
                    : "bg-card border-border hover:bg-accent"
                }`}
              >
                No store
              </button>
            </div>
          )}
        </section>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowChecked(!showChecked)}
            data-testid="toggle-show-checked"
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-all ${
              showChecked ? "bg-card border-border" : "bg-muted border-transparent text-muted-foreground"
            }`}
          >
            <Filter className="w-3 h-3" />
            {showChecked ? "Showing all" : "Hiding checked"}
          </button>

          {checkedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 text-destructive hover:text-destructive"
              onClick={() => clearCheckedMutation.mutate()}
              data-testid="button-clear-checked"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              Remove {checkedCount} checked
            </Button>
          )}
        </div>

        {/* Item list grouped by store */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">Your list is empty</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tap <strong>Add Item</strong> to start building your grocery list.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => { setEditItem(null); setQuickAddStoreId(null); setItemDialogOpen(true); }}
              data-testid="button-add-first-item"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add your first item
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map(([key, group]) => {
              const isCollapsed = collapsed[key];
              const groupTotal = group.items
                .filter((i) => !i.checked && i.price != null)
                .reduce((s, i) => s + (i.price ?? 0), 0);

              return (
                <section key={key} data-testid={`group-${key}`}>
                  {/* Group header */}
                  <button
                    className="w-full flex items-center gap-2 mb-2 text-left"
                    onClick={() => toggleCollapse(key)}
                    data-testid={`group-header-${key}`}
                  >
                    {group.color ? (
                      <span
                        className="store-dot"
                        style={{ backgroundColor: group.color }}
                      />
                    ) : (
                      <span className="store-dot bg-muted-foreground/30" />
                    )}
                    <span className="text-sm font-semibold flex-1">{group.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                      {groupTotal > 0 && ` · $${groupTotal.toFixed(2)}`}
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          stores={stores}
                          onEdit={(i) => { setEditItem(i); setItemDialogOpen(true); }}
                        />
                      ))}
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:bg-accent/40 transition-colors"
                        onClick={() => {
                          setEditItem(null);
                          setQuickAddStoreId(key === "unassigned" ? null : (key as number));
                          setItemDialogOpen(true);
                        }}
                        data-testid={`button-add-to-group-${key}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add item to {group.label}
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* Total summary */}
        {items.length > 0 && (
          <div className="border-t border-border pt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {checkedCount} of {totalCount} items checked
            </span>
            {totalPrice > 0 && (
              <span className="text-sm font-semibold">
                Est. total: <span className="text-primary">${totalPrice.toFixed(2)}</span>
              </span>
            )}
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-8" />
      </main>

      {/* Dialogs */}
      {storeDialogOpen && (
        <StoreDialog
          open={storeDialogOpen}
          store={editStore}
          onClose={() => { setStoreDialogOpen(false); setEditStore(null); }}
        />
      )}

      {itemDialogOpen && (
        <ItemDialog
          open={itemDialogOpen}
          item={editItem}
          stores={stores}
          defaultStoreId={quickAddStoreId}
          onClose={() => { setItemDialogOpen(false); setEditItem(null); setQuickAddStoreId(null); }}
        />
      )}
    </div>
  );
}
