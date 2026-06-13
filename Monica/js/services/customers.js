// js/services/customers.js
import { StorageService } from "./storage.js";

const ENTITY = "customers";

export class CustomerService {
  constructor(companyId) {
    this.storage = new StorageService(companyId);
  }

  setCompany(companyId) {
    this.storage.setCompany(companyId);
  }

  list() {
    return this.storage.list(ENTITY);
  }

  upsert(customer) {
    const now = new Date().toISOString();
    if (!customer.created_at) customer.created_at = now;
    customer.updated_at = now;
    return this.storage.upsert(ENTITY, customer);
  }

  remove(id) {
    this.storage.remove(ENTITY, id);
  }

  importFromJson(arr) {
    if (!Array.isArray(arr)) throw new Error("Formato inválido");
    const sanitized = arr.map((c) => ({
      id: c.id || null,
      code: c.code || "",
      name: c.name || "",
      contact_name: c.contact_name || "",
      tax_id: c.tax_id || "",
      phone: c.phone || "",
      email: c.email || "",
      billing_address: c.billing_address || "",
      credit_limit: Number(c.credit_limit || 0),
      payment_terms: c.payment_terms || "30 días",
      is_active: c.is_active !== false,
      created_at: c.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    this.storage.replaceAll(ENTITY, sanitized);
  }

  exportToJson() {
    return this.storage.list(ENTITY);
  }
}
