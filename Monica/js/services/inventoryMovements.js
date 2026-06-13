// js/services/inventoryMovements.js
import { StorageService } from "./storage.js";

const ENTITY = "inventory_movements";

/**
 * Movimiento de inventario (Kardex).
 * Campos: id, product_id, date, movement_type, qty_in, qty_out, unit_cost, note.
 */
export class InventoryMovementService {
  constructor(companyId) {
    this.storage = new StorageService(companyId);
  }

  setCompany(companyId) {
    this.storage.setCompany(companyId);
  }

  list() {
    return this.storage.list(ENTITY);
  }

  listByProduct(productId) {
    return this.list()
      .filter((m) => m.product_id === productId)
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.created_at || "").localeCompare(b.created_at || ""));
  }

  upsert(movement) {
    const now = new Date().toISOString();
    if (!movement.created_at) movement.created_at = now;
    movement.updated_at = now;
    return this.storage.upsert(ENTITY, movement);
  }

  remove(id) {
    this.storage.remove(ENTITY, id);
  }

  importFromJson(arr) {
    if (!Array.isArray(arr)) throw new Error("Formato inválido");
    const sanitized = arr.map((m) => ({
      id: m.id || null,
      product_id: m.product_id || "",
      date: m.date || new Date().toISOString().slice(0, 10),
      movement_type: m.movement_type || "Ajuste+",
      qty_in: Number(m.qty_in || 0),
      qty_out: Number(m.qty_out || 0),
      unit_cost: Number(m.unit_cost || 0),
      note: m.note || "",
      created_at: m.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    this.storage.replaceAll(ENTITY, sanitized);
  }

  exportToJson() {
    return this.storage.list(ENTITY);
  }
}