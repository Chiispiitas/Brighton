// js/services/storage.js

const STORAGE_KEY_PREFIX = "monica_web_edu_";

function buildKey(companyId, entityName) {
  return `${STORAGE_KEY_PREFIX}${companyId}_${entityName}`;
}

export class StorageService {
  constructor(companyId) {
    this.companyId = companyId;
  }

  setCompany(companyId) {
    this.companyId = companyId;
  }

  _read(entityName) {
    const key = buildKey(this.companyId, entityName);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  _write(entityName, data) {
    const key = buildKey(this.companyId, entityName);
    localStorage.setItem(key, JSON.stringify(data));
  }

  list(entityName) {
    return this._read(entityName);
  }

  getById(entityName, id) {
    return this._read(entityName).find((r) => r.id === id) || null;
  }

  upsert(entityName, record) {
    const list = this._read(entityName);
    if (!record.id) {
      record.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      list.push(record);
    } else {
      const index = list.findIndex((r) => r.id === record.id);
      if (index === -1) list.push(record);
      else list[index] = record;
    }
    this._write(entityName, list);
    return record;
  }

  remove(entityName, id) {
    const list = this._read(entityName).filter((r) => r.id !== id);
    this._write(entityName, list);
  }

  replaceAll(entityName, newData) {
    this._write(entityName, newData);
  }
}
