// js/services/journalEntries.js
import { StorageService } from "./storage.js";

const ENTITY = "journal_entries";

/**
 * Asiento contable:
 * id, date, description, lines: [{account_code, account_name, debit, credit}], posted(bool)
 */
export class JournalEntryService {
  constructor(companyId) {
    this.storage = new StorageService(companyId);
  }

  setCompany(companyId) {
    this.storage.setCompany(companyId);
  }

  list() {
    return this.storage
      .list(ENTITY)
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }

  upsert(entry) {
    const now = new Date().toISOString();
    if (!entry.created_at) entry.created_at = now;
    entry.updated_at = now;
    return this.storage.upsert(ENTITY, entry);
  }

  remove(id) {
    this.storage.remove(ENTITY, id);
  }

  importFromJson(arr) {
    if (!Array.isArray(arr)) throw new Error("Formato inválido");
    const sanitized = arr.map((e) => ({
      id: e.id || null,
      date: e.date || new Date().toISOString().slice(0, 10),
      description: e.description || "",
      posted: !!e.posted,
      lines: Array.isArray(e.lines)
        ? e.lines.map((l) => ({
            account_code: l.account_code || "",
            account_name: l.account_name || "",
            debit: Number(l.debit || 0),
            credit: Number(l.credit || 0),
          }))
        : [],
      created_at: e.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    this.storage.replaceAll(ENTITY, sanitized);
  }

  exportToJson() {
    return this.storage.list(ENTITY);
  }
}