// js/services/invoices.js
import { StorageService } from "./storage.js";

const ENTITY = "sales_invoices";

export class InvoiceService {
  constructor(companyId) {
    this.storage = new StorageService(companyId);
  }

  setCompany(companyId) {
    this.storage.setCompany(companyId);
  }

  list() {
    return this.storage.list(ENTITY);
  }

  upsert(invoice) {
    const now = new Date().toISOString();
    if (!invoice.created_at) invoice.created_at = now;
    invoice.updated_at = now;
    return this.storage.upsert(ENTITY, invoice);
  }

  remove(id) {
    this.storage.remove(ENTITY, id);
  }

  importFromJson(arr) {
    if (!Array.isArray(arr)) throw new Error("Formato inválido");
    const sanitized = arr.map((i) => ({
      id: i.id || null,
      number: i.number || "",
      date: i.date || new Date().toISOString().slice(0, 10),
      customer_id: i.customer_id || "",
      status: i.status || "Publicado",
      subtotal: Number(i.subtotal || 0),
      tax_total: Number(i.tax_total || 0),
      grand_total: Number(i.grand_total || 0),
      currency: i.currency || "USD",
      // líneas de productos
      lines: Array.isArray(i.lines)
        ? i.lines.map((l) => ({
            product_id: l.product_id || "",
            product_code: l.product_code || "",
            product_name: l.product_name || "",
            quantity: Number(l.quantity || 0),
            unit_price: Number(l.unit_price || 0),
            tax_rate: Number(l.tax_rate || 0),
            line_subtotal: Number(l.line_subtotal || 0),
            line_tax: Number(l.line_tax || 0),
            line_total: Number(l.line_total || 0),
          }))
        : [],
      created_at: i.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    this.storage.replaceAll(ENTITY, sanitized);
  }

  exportToJson() {
    return this.storage.list(ENTITY);
  }
}
