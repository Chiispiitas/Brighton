// js/services/products.js
import { StorageService } from "./storage.js";

const ENTITY = "products";

export class ProductService {
  constructor(companyId) {
    this.storage = new StorageService(companyId);
  }

  setCompany(companyId) {
    this.storage.setCompany(companyId);
  }

  list() {
    return this.storage.list(ENTITY);
  }

  upsert(product) {
    const now = new Date().toISOString();
    if (!product.created_at) product.created_at = now;
    product.updated_at = now;
    return this.storage.upsert(ENTITY, product);
  }

  remove(id) {
    this.storage.remove(ENTITY, id);
  }

  importFromJson(jsonArray) {
    if (!Array.isArray(jsonArray)) throw new Error("Formato inválido");
    const sanitized = jsonArray.map((p) => ({
      id: p.id || null,
      code: p.code || "",
      name: p.name || "",
      description: p.description || "",
      item_type: p.item_type || "Producto",
      unit_of_measure: p.unit_of_measure || "UND",
      tax_code: p.tax_code || "IVA12",
      cost_price: Number(p.cost_price || 0),
      price_1: Number(p.price_1 || 0),
      current_stock: Number(p.current_stock || 0),
      is_active: p.is_active !== false,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    this.storage.replaceAll(ENTITY, sanitized);
  }

  exportToJson() {
    return this.storage.list(ENTITY);
  }
}
