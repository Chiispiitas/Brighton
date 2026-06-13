// js/services/chartOfAccounts.js
import { StorageService } from "./storage.js";

const ENTITY = "chart_of_accounts";

/**
 * Plan de cuentas muy sencillo.
 * Campos: id, code, name, type (Activo, Pasivo, Patrimonio, Ingreso, Gasto).
 */
export class ChartOfAccountsService {
  constructor(companyId) {
    this.storage = new StorageService(companyId);
  }

  setCompany(companyId) {
    this.storage.setCompany(companyId);
  }

  list() {
    return this.storage
      .list(ENTITY)
      .sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }

  upsert(account) {
    const now = new Date().toISOString();
    if (!account.created_at) account.created_at = now;
    account.updated_at = now;
    return this.storage.upsert(ENTITY, account);
  }

  remove(id) {
    this.storage.remove(ENTITY, id);
  }

  importFromJson(arr) {
    if (!Array.isArray(arr)) throw new Error("Formato inválido");
    const sanitized = arr.map((a) => ({
      id: a.id || null,
      code: a.code || "",
      name: a.name || "",
      type: a.type || "Activo",
      is_active: a.is_active !== false,
      created_at: a.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    this.storage.replaceAll(ENTITY, sanitized);
  }

  exportToJson() {
    return this.storage.list(ENTITY);
  }
}