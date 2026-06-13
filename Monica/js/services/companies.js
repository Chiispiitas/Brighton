// js/services/companies.js

const COMPANIES_KEY = "monica_web_edu_companies";
const CURRENT_COMPANY_KEY = "monica_web_edu_current_company";

export function loadCompanies() {
  const raw = localStorage.getItem(COMPANIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCompanies(companies) {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
}

export function getCurrentCompanyId() {
  return localStorage.getItem(CURRENT_COMPANY_KEY);
}

export function setCurrentCompanyId(id) {
  localStorage.setItem(CURRENT_COMPANY_KEY, id);
  state.services.fiscal.setCompany(companyId);
  state.services.fiscal.seedDefaultsIfEmpty();
  updateTopbarPeriod();
}

export function ensureDemoCompany() {
  let companies = loadCompanies();
  if (companies.length === 0) {
    const demo = {
      id: "demo",
      name: "UEP Lev Vigotsky – Taller Contable",
      tax_id: "0999999999001",
      fiscal_currency: "USD",
      fiscal_year_start: "2025-01-01",
    };
    companies = [demo];
    saveCompanies(companies);
    setCurrentCompanyId(demo.id);
  } else if (!getCurrentCompanyId()) {
    setCurrentCompanyId(companies[0].id);
  }
  return companies;
}
