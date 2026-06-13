// js/services/fiscal.js
import { StorageService } from "./storage.js";

const ENTITY_YEARS = "fiscal_years";
const ENTITY_PERIODS = "fiscal_periods";
const ENTITY_META = "fiscal_meta"; // aquí guardamos el contexto actual

export class FiscalService {
  constructor(companyId) {
    this.storage = new StorageService(companyId);
  }

  setCompany(companyId) {
    this.storage.setCompany(companyId);
  }

  // --- Ejercicios contables ---

  listYears() {
    return this.storage.list(ENTITY_YEARS).sort((a, b) => a.year - b.year);
  }

  upsertYear(yearObj) {
    const now = new Date().toISOString();
    if (!yearObj.created_at) yearObj.created_at = now;
    yearObj.updated_at = now;
    return this.storage.upsert(ENTITY_YEARS, yearObj);
  }

  removeYear(id) {
    // eliminar ejercicio
    this.storage.remove(ENTITY_YEARS, id);
    // eliminar períodos asociados
    const allPeriods = this.storage.list(ENTITY_PERIODS);
    const filtered = allPeriods.filter((p) => p.fiscal_year_id !== id);
    this.storage.replaceAll(ENTITY_PERIODS, filtered);

    // si el contexto apuntaba a este ejercicio, lo limpiamos
    const ctx = this.getContext();
    if (ctx && ctx.year_id === id) {
      this.setContext(null);
    }
  }

  // --- Períodos contables ---

  listPeriodsByYear(fiscalYearId) {
    return this.storage
      .list(ENTITY_PERIODS)
      .filter((p) => p.fiscal_year_id === fiscalYearId)
      .sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
  }

  listAllPeriods() {
    return this.storage.list(ENTITY_PERIODS);
  }

  upsertPeriod(periodObj) {
    const now = new Date().toISOString();
    if (!periodObj.created_at) periodObj.created_at = now;
    periodObj.updated_at = now;
    return this.storage.upsert(ENTITY_PERIODS, periodObj);
  }

  removePeriod(id) {
    this.storage.remove(ENTITY_PERIODS, id);

    // si el contexto apuntaba a este período, lo limpiamos
    const ctx = this.getContext();
    if (ctx && ctx.period_id === id) {
      this.setContext(null);
    }
  }

  // --- Contexto fiscal actual (ejercicio + período) ---

  getContext() {
    const meta = this.storage.list(ENTITY_META);
    return meta[0] || null;
  }

  /**
   * setContext(null) limpia el contexto.
   * setContext({ year_id, period_id }) lo fija explícitamente.
   */
  setContext(ctx) {
    if (!ctx) {
      this.storage.replaceAll(ENTITY_META, []);
      return;
    }
    const record = {
      id: "context",
      year_id: ctx.year_id || null,
      period_id: ctx.period_id || null,
    };
    this.storage.replaceAll(ENTITY_META, [record]);
  }

  /**
   * Devuelve { year, period } resolviendo:
   * 1) Lo que está guardado en contexto (si existe y sigue válido).
   * 2) Si no, ejercicio activo + primer período abierto.
   * 3) Si tampoco, primer ejercicio y primer período.
   */
  getCurrentYearAndPeriod() {
    const years = this.listYears();
    if (years.length === 0) {
      return { year: null, period: null };
    }

    const ctx = this.getContext();

    // 1) Intentar con lo que hay en contexto
    let year = null;
    if (ctx && ctx.year_id) {
      year = years.find((y) => y.id === ctx.year_id) || null;
    }

    // 2) Si no hay year válido en contexto, usar activo o primero
    if (!year) {
      year =
        years.find((y) => y.is_active) ||
        years[years.length - 1] || // último creado
        years[0];
    }

    const periods = this.listPeriodsByYear(year.id);
    let period = null;

    // Intentar con el período del contexto
    if (ctx && ctx.period_id) {
      period = periods.find((p) => p.id === ctx.period_id) || null;
    }

    // Si no sirve, buscar uno abierto
    if (!period) {
      period =
        periods.find((p) => p.status === "Abierto") ||
        periods[0] ||
        null;
    }

    return { year, period };
  }

  /**
   * Fija el período actual (y su ejercicio) para el topbar.
   * Se llama desde la pantalla de Parámetros contables.
   */
  setCurrentPeriod(periodId) {
    const all = this.listAllPeriods();
    const period = all.find((p) => p.id === periodId);
    if (!period) {
      this.setContext(null);
      return;
    }
    this.setContext({
      year_id: period.fiscal_year_id,
      period_id: period.id,
    });
  }

  // --- Semilla inicial para entrenamiento ---

  seedDefaultsIfEmpty() {
    const years = this.listYears();
    if (years.length > 0) return;

    const today = new Date();
    const y = today.getFullYear();
    const yearId = String(y);

    // Ejercicio
    this.upsertYear({
      id: yearId,
      year: y,
      name: `Ejercicio ${y}`,
      start_date: `${y}-01-01`,
      end_date: `${y}-12-31`,
      is_active: true,
    });

    // 12 períodos mensuales abiertos
    const months = [
      "01 - Enero",
      "02 - Febrero",
      "03 - Marzo",
      "04 - Abril",
      "05 - Mayo",
      "06 - Junio",
      "07 - Julio",
      "08 - Agosto",
      "09 - Septiembre",
      "10 - Octubre",
      "11 - Noviembre",
      "12 - Diciembre",
    ];

    const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

    months.forEach((label, idx) => {
      const monthNumber = idx + 1;
      const mm = String(monthNumber).padStart(2, "0");
      const start = `${y}-${mm}-01`;
      const end = `${y}-${mm}-${daysInMonth(y, monthNumber)}`;

      this.upsertPeriod({
        id: `${yearId}-${mm}`,
        fiscal_year_id: yearId,
        name: label,
        start_date: start,
        end_date: end,
        status: "Abierto",
      });
    });

    // Contexto inicial: ejercicio y primer período
    this.setContext({
      year_id: yearId,
      period_id: `${yearId}-01`,
    });
  }
}