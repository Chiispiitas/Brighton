// js/app.js
import { renderTable, renderFiltersBar, openModal, closeModal, showToast } from "./ui/components.js";
import { ensureDemoCompany, loadCompanies, saveCompanies, getCurrentCompanyId, setCurrentCompanyId } from "./services/companies.js";
import { ProductService } from "./services/products.js";
import { CustomerService } from "./services/customers.js";
import { InvoiceService } from "./services/invoices.js";
import { InventoryMovementService } from "./services/inventoryMovements.js";
import { ChartOfAccountsService } from "./services/chartOfAccounts.js";
import { JournalEntryService } from "./services/journalEntries.js";
import { FiscalService } from "./services/fiscal.js";


// Estado global sencillo
const state = {
  user: {
    id: "u-demo",
    name: "Docente DEMO",
    role: "Admin",
  },
  periodLabel: "",
  companies: [],
  currentCompanyId: null,
  services: {
    products: null,
    customers: null,
    invoices: null,
  },
};

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initCompanies();
  initUserInfo();
  initTopbar();
  initSidebarLinks();
  initModalGlobal();
  initServices();
  updateTopbarPeriod();
  navigate();

  window.addEventListener("hashchange", navigate);
});

// --- Tema claro/oscuro ---

function initTheme() {
  const saved = localStorage.getItem("monica_web_theme");
  if (saved === "light") {
    document.body.dataset.theme = "light";
  }
  const btn = document.getElementById("themeToggleBtn");
  btn.addEventListener("click", () => {
    const isLight = document.body.dataset.theme === "light";
    document.body.dataset.theme = isLight ? "" : "light";
    localStorage.setItem("monica_web_theme", isLight ? "dark" : "light");
  });
}

// --- Empresas ---

function initCompanies() {
  state.companies = ensureDemoCompany();
  state.currentCompanyId = getCurrentCompanyId();

  const select = document.getElementById("companySelect");
  select.innerHTML = state.companies
    .map((c) => `<option value="${c.id}" ${c.id === state.currentCompanyId ? "selected" : ""}>${c.name}</option>`)
    .join("");

  select.addEventListener("change", (e) => {
    const id = e.target.value;
    state.currentCompanyId = id;
    setCurrentCompanyId(id);
    initServices(); // recargar servicios
    showToast("Empresa cambiada", "info");
    navigate(); // refrescar vista con nueva empresa
  });
}

function initUserInfo() {
  document.getElementById("userNameLabel").textContent = state.user.name;
  document.getElementById("userRoleLabel").textContent = state.user.role;
}

function initTopbar() {
  document.getElementById("periodLabel").textContent = state.periodLabel;
}

function updateTopbarPeriod() {
  const periodEl = document.getElementById("periodLabel");
  const yearEl = document.getElementById("fiscalYearLabel");

  if (!periodEl || !yearEl) return;

  if (!state || !state.services || !state.services.fiscal) {
    yearEl.textContent = "—";
    periodEl.textContent = "No definido";
    return;
  }

  const fiscal = state.services.fiscal;
  const { year, period } = fiscal.getCurrentYearAndPeriod();

  if (!year) {
    yearEl.textContent = "—";
  } else {
    yearEl.textContent = year.name || year.year || "Sin ejercicio";
  }

  if (!period) {
    periodEl.textContent = "No definido";
  } else {
    periodEl.textContent = period.name || "Sin período";
  }
}

// --- Servicios por empresa ---

function initServices() {
  const companyId = state.currentCompanyId;
  state.services.products = new ProductService(companyId);
  state.services.customers = new CustomerService(companyId);
  state.services.invoices = new InvoiceService(companyId);
  state.services.inventoryMovements = new InventoryMovementService(companyId);
  state.services.chartOfAccounts = new ChartOfAccountsService(companyId);
  state.services.journalEntries = new JournalEntryService(companyId);
  state.services.fiscal = new FiscalService(state.currentCompanyId);
  state.services.fiscal.seedDefaultsIfEmpty();


  seedIfEmpty();
}


function seedIfEmpty() {
  const ps = state.services.products;
  const cs = state.services.customers;
  const is = state.services.invoices;
  const coa = state.services.chartOfAccounts;

  if (ps.list().length === 0) {
    ps.upsert({
      code: "P-001",
      name: "Servicio de asesoría contable",
      description: "Servicio por hora",
      item_type: "Servicio",
      unit_of_measure: "HORA",
      tax_code: "IVA15",
      cost_price: 0,
      price_1: 25,
      current_stock: 0,
      is_active: true,
    });
    ps.upsert({
      code: "P-002",
      name: "Producto de prueba",
      description: "Artículo para ejercicios",
      item_type: "Producto",
      unit_of_measure: "UND",
      tax_code: "IVA15",
      cost_price: 5,
      price_1: 10,
      current_stock: 100,
      is_active: true,
    });
  }

  if (cs.list().length === 0) {
    cs.upsert({
      code: "C-001",
      name: "Cliente Demo",
      contact_name: "Juan Pérez",
      tax_id: "0912345678",
      phone: "0999999999",
      email: "cliente@demo.com",
      billing_address: "Manta",
      credit_limit: 500,
      payment_terms: "30 días",
      is_active: true,
    });
  }

  if (is.list().length === 0) {
    is.upsert({
      number: "001-001-000000001",
      date: new Date().toISOString().slice(0, 10),
      customer_id: cs.list()[0]?.id,
      status: "Publicado",
      subtotal: 100,
      tax_total: 15,
      grand_total: 115,
      currency: "USD",
    });
  }

  if (coa.list().length === 0) {
    coa.upsert({ code: "1.1.01", name: "Caja", type: "Activo", is_active: true });
    coa.upsert({ code: "1.1.02", name: "Banco", type: "Activo", is_active: true });
    coa.upsert({ code: "1.1.03", name: "Clientes", type: "Activo", is_active: true });
    coa.upsert({ code: "4.1.01", name: "Ventas", type: "Ingreso", is_active: true });
    coa.upsert({ code: "5.1.01", name: "Costo de ventas", type: "Gasto", is_active: true });
  }
}

// --- Sidebar activo ---

function initSidebarLinks() {
  const links = document.querySelectorAll("[data-route]");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

// --- Modal ---

function initModalGlobal() {
  const overlay = document.getElementById("modalOverlay");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
}

// --- Router ---

function navigate() {
  const hash = window.location.hash || "#/dashboard";
  const route = hash.replace("#", "");
  const main = document.getElementById("appMain");
  main.innerHTML = ""; // limpiar
  main.classList.add("view-enter");

  if (route === "/dashboard") {
    renderDashboard(main);
  } else if (route === "/inventario/productos") {
    renderProductos(main);
  } else if (route === "/inventario/kardex") {
    renderKardex(main);            
  } else if (route === "/ventas/clientes") {
    renderClientes(main);
  } else if (route === "/ventas/facturas") {
    renderFacturas(main);
  } else if (route === "/contabilidad/plan-cuentas") {
    renderPlanCuentas(main);         
  } else if (route === "/contabilidad/asientos") {
    renderAsientos(main);            
  } else if (route === "/contabilidad/parametros-contables") {
    renderParametrosContables(main);
  } else if (route === "/configuracion/empresas") {
    renderEmpresas(main);
  } else {
    main.innerHTML = `<div class="card"><div class="card-header"><div><div class="card-title">Módulo en construcción</div><div class="card-subtitle">Esta ruta todavía no está lista. Pídela a tus estudiantes como práctica de extensión.</div></div></div></div>`;
  }

  setTimeout(() => main.classList.remove("view-enter"), 250);
}

// --- Vistas ---

function renderDashboard(container) {
  const products = state.services.products.list();
  const customers = state.services.customers.list();
  const invoices = state.services.invoices.list();

  const today = new Date().toISOString().slice(0, 10);
  const todaySales = invoices
    .filter((i) => i.date === today)
    .reduce((sum, i) => sum + (i.grand_total || 0), 0);

  const overdueCount = invoices.filter((i) => i.status === "Vencida").length;

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Dashboard general</div>
          <div class="card-subtitle">Resumen rápido para entrenamiento contable</div>
        </div>
      </div>
      <div class="dashboard-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.8rem;">
        <div class="card" style="padding:0.8rem;">
          <div class="card-subtitle">Ventas del día</div>
          <div style="font-size:1.2rem;margin-top:0.2rem;">$ ${todaySales.toFixed(2)}</div>
        </div>
        <div class="card" style="padding:0.8rem;">
          <div class="card-subtitle">Clientes registrados</div>
          <div style="font-size:1.2rem;margin-top:0.2rem;">${customers.length}</div>
        </div>
        <div class="card" style="padding:0.8rem;">
          <div class="card-subtitle">Productos en catálogo</div>
          <div style="font-size:1.2rem;margin-top:0.2rem;">${products.length}</div>
        </div>
        <div class="card" style="padding:0.8rem;">
          <div class="card-subtitle">Facturas vencidas</div>
          <div style="font-size:1.2rem;margin-top:0.2rem;">
            <span class="badge badge-danger">${overdueCount}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- Productos ---

function renderProductos(container) {
  const ps = state.services.products;
  const all = ps.list();

  let filtered = all;
  const searchQuery = ""; // se ajusta con el input

  const render = (q = "") => {
    const qLower = q.toLowerCase();
    filtered = all.filter(
      (p) =>
        p.name.toLowerCase().includes(qLower) ||
        p.code.toLowerCase().includes(qLower) ||
        (p.description || "").toLowerCase().includes(qLower)
    );

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Productos / Inventario</div>
            <div class="card-subtitle">Catálogo de ítems para ventas y compras</div>
          </div>
          <div style="display:flex;gap:0.4rem;">
            <button class="secondary-button" id="btnImportProducts">Importar JSON</button>
            <button class="secondary-button" id="btnExportProducts">Exportar JSON</button>
            <button class="primary-button" id="btnNewProduct">Nuevo producto</button>
          </div>
        </div>
        ${renderFiltersBar(`
          <input id="searchProducts" type="text" placeholder="Buscar por código o nombre" />
        `)}
        ${renderTable({
          columns: [
            { field: "code", label: "Código" },
            { field: "name", label: "Nombre" },
            { field: "item_type", label: "Tipo" },
            {
              field: "price_1",
              label: "Precio 1",
              render: (row) => `$ ${Number(row.price_1 || 0).toFixed(2)}`,
            },
            {
              field: "current_stock",
              label: "Stock",
            },
            {
              field: "is_active",
              label: "Estado",
              render: (row) =>
                row.is_active
                  ? '<span class="badge badge-success">Activo</span>'
                  : '<span class="badge badge-danger">Inactivo</span>',
            },
            {
              field: "actions",
              label: "",
              render: (row) => `
                <button class="icon-button" data-edit-product="${row.id}" title="Editar">✏️</button>
                <button class="icon-button" data-delete-product="${row.id}" title="Eliminar">🗑️</button>
              `,
            },
          ],
          rows: filtered,
          emptyMessage: "Todavía no hay productos. Crea uno nuevo para empezar.",
        })}
      </div>
    `;

    // Eventos
    document.getElementById("searchProducts").value = q;
    document.getElementById("searchProducts").addEventListener("input", (e) => {
      render(e.target.value);
    });

    document.getElementById("btnNewProduct").addEventListener("click", () =>
      openProductModal()
    );
    document.getElementById("btnExportProducts").addEventListener("click", () =>
      exportProductsJson()
    );
    document.getElementById("btnImportProducts").addEventListener("click", () =>
      importProductsJson()
    );

    container.querySelectorAll("[data-edit-product]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-product");
        const prod = ps.list().find((p) => p.id === id);
        openProductModal(prod);
      });
    });

    container.querySelectorAll("[data-delete-product]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-delete-product");
        if (confirm("¿Eliminar este producto?")) {
          ps.remove(id);
          showToast("Producto eliminado", "success");
          render(q);
        }
      });
    });
  };

  render(searchQuery);
}

function openProductModal(product = null) {
  const isEdit = !!product;
  const title = isEdit ? "Editar producto" : "Nuevo producto";
  const p = product || {
    code: "",
    name: "",
    description: "",
    item_type: "Producto",
    unit_of_measure: "UND",
    tax_code: "IVA15",
    cost_price: 0,
    price_1: 0,
    current_stock: 0,
    is_active: true,
  };

  const bodyHtml = `
    <form id="productForm">
      <div class="form-grid">
        <div class="form-field">
          <label>Código</label>
          <input name="code" value="${p.code}" required />
        </div>
        <div class="form-field">
          <label>Nombre</label>
          <input name="name" value="${p.name}" required />
        </div>
        <div class="form-field">
          <label>Tipo</label>
          <select name="item_type">
            <option ${p.item_type === "Producto" ? "selected" : ""}>Producto</option>
            <option ${p.item_type === "Servicio" ? "selected" : ""}>Servicio</option>
            <option ${p.item_type === "Gasto" ? "selected" : ""}>Gasto</option>
          </select>
        </div>
        <div class="form-field">
          <label>Unidad</label>
          <input name="unit_of_measure" value="${p.unit_of_measure}" />
        </div>
        <div class="form-field">
          <label>Código de impuesto</label>
          <input name="tax_code" value="${p.tax_code}" />
        </div>
        <div class="form-field">
          <label>Costo</label>
          <input name="cost_price" type="number" step="0.01" value="${p.cost_price}" />
        </div>
        <div class="form-field">
          <label>Precio 1</label>
          <input name="price_1" type="number" step="0.01" value="${p.price_1}" />
        </div>
        <div class="form-field">
          <label>Stock actual</label>
          <input name="current_stock" type="number" step="0.01" value="${p.current_stock}" />
        </div>
        <div class="form-field">
          <label>Descripción</label>
          <textarea name="description">${p.description || ""}</textarea>
        </div>
        <div class="form-field">
          <label>Activo</label>
          <select name="is_active">
            <option value="true" ${p.is_active ? "selected" : ""}>Sí</option>
            <option value="false" ${!p.is_active ? "selected" : ""}>No</option>
          </select>
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="secondary-button" id="btnCancelProduct">Cancelar</button>
    <button class="primary-button" id="btnSaveProduct">Guardar</button>
  `;

  openModal({ title, bodyHtml, footerHtml });

  document.getElementById("btnCancelProduct").onclick = () => closeModal();
  document.getElementById("btnSaveProduct").onclick = () => {
    const form = document.getElementById("productForm");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const ps = state.services.products;

    const record = {
      ...(product || {}),
      code: data.code.trim(),
      name: data.name.trim(),
      description: data.description.trim(),
      item_type: data.item_type,
      unit_of_measure: data.unit_of_measure,
      tax_code: data.tax_code,
      cost_price: Number(data.cost_price || 0),
      price_1: Number(data.price_1 || 0),
      current_stock: Number(data.current_stock || 0),
      is_active: data.is_active === "true",
    };

    ps.upsert(record);
    closeModal();
    showToast("Producto guardado", "success");
    navigate(); // recargar vista actual
  };
}

function exportProductsJson() {
  const data = state.services.products.exportToJson();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "productos_monica_demo.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importProductsJson() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        state.services.products.importFromJson(json);
        showToast("Productos importados", "success");
        navigate();
      } catch {
        showToast("Error al importar JSON", "error");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// --- Clientes ---

function renderClientes(container) {
  const cs = state.services.customers;
  const all = cs.list();

  const render = (q = "") => {
    const qLower = q.toLowerCase();
    const filtered = all.filter(
      (c) =>
        c.name.toLowerCase().includes(qLower) ||
        c.code.toLowerCase().includes(qLower) ||
        (c.tax_id || "").includes(qLower)
    );

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Clientes</div>
            <div class="card-subtitle">Catálogo de clientes para facturación</div>
          </div>
          <div style="display:flex;gap:0.4rem;">
            <button class="secondary-button" id="btnImportCustomers">Importar JSON</button>
            <button class="secondary-button" id="btnExportCustomers">Exportar JSON</button>
            <button class="primary-button" id="btnNewCustomer">Nuevo cliente</button>
          </div>
        </div>
        ${renderFiltersBar(`
          <input id="searchCustomers" type="text" placeholder="Buscar por nombre, código o RUC/CI" />
        `)}
        ${renderTable({
          columns: [
            { field: "code", label: "Código" },
            { field: "name", label: "Nombre" },
            { field: "tax_id", label: "RUC / CI" },
            { field: "phone", label: "Teléfono" },
            { field: "email", label: "Email" },
            {
              field: "credit_limit",
              label: "Límite de crédito",
              render: (row) => `$ ${Number(row.credit_limit || 0).toFixed(2)}`,
            },
            {
              field: "is_active",
              label: "Estado",
              render: (row) =>
                row.is_active
                  ? '<span class="badge badge-success">Activo</span>'
                  : '<span class="badge badge-danger">Inactivo</span>',
            },
            {
              field: "actions",
              label: "",
              render: (row) => `
                <button class="icon-button" data-edit-customer="${row.id}" title="Editar">✏️</button>
                <button class="icon-button" data-delete-customer="${row.id}" title="Eliminar">🗑️</button>
              `,
            },
          ],
          rows: filtered,
          emptyMessage: "Todavía no hay clientes registrados.",
        })}
      </div>
    `;

    document.getElementById("searchCustomers").value = q;
    document.getElementById("searchCustomers").addEventListener("input", (e) =>
      render(e.target.value)
    );

    document.getElementById("btnNewCustomer").onclick = () => openCustomerModal();
    document.getElementById("btnExportCustomers").onclick = () => exportCustomersJson();
    document.getElementById("btnImportCustomers").onclick = () => importCustomersJson();

    container.querySelectorAll("[data-edit-customer]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-edit-customer");
        const c = cs.list().find((x) => x.id === id);
        openCustomerModal(c);
      };
    });

    container.querySelectorAll("[data-delete-customer]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-delete-customer");
        if (confirm("¿Eliminar este cliente?")) {
          cs.remove(id);
          showToast("Cliente eliminado", "success");
          navigate();
        }
      };
    });
  };

  render();
}

function openCustomerModal(customer = null) {
  const isEdit = !!customer;
  const title = isEdit ? "Editar cliente" : "Nuevo cliente";
  const c = customer || {
    code: "",
    name: "",
    contact_name: "",
    tax_id: "",
    phone: "",
    email: "",
    billing_address: "",
    credit_limit: 0,
    payment_terms: "30 días",
    is_active: true,
  };

  const bodyHtml = `
    <form id="customerForm">
      <div class="form-grid">
        <div class="form-field">
          <label>Código</label>
          <input name="code" value="${c.code}" required />
        </div>
        <div class="form-field">
          <label>Nombre</label>
          <input name="name" value="${c.name}" required />
        </div>
        <div class="form-field">
          <label>Nombre de contacto</label>
          <input name="contact_name" value="${c.contact_name}" />
        </div>
        <div class="form-field">
          <label>RUC / CI</label>
          <input name="tax_id" value="${c.tax_id}" />
        </div>
        <div class="form-field">
          <label>Teléfono</label>
          <input name="phone" value="${c.phone}" />
        </div>
        <div class="form-field">
          <label>Email</label>
          <input name="email" value="${c.email}" />
        </div>
        <div class="form-field">
          <label>Dirección de facturación</label>
          <textarea name="billing_address">${c.billing_address}</textarea>
        </div>
        <div class="form-field">
          <label>Límite de crédito</label>
          <input name="credit_limit" type="number" step="0.01" value="${c.credit_limit}" />
        </div>
        <div class="form-field">
          <label>Términos de pago</label>
          <input name="payment_terms" value="${c.payment_terms}" />
        </div>
        <div class="form-field">
          <label>Activo</label>
          <select name="is_active">
            <option value="true" ${c.is_active ? "selected" : ""}>Sí</option>
            <option value="false" ${!c.is_active ? "selected" : ""}>No</option>
          </select>
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="secondary-button" id="btnCancelCustomer">Cancelar</button>
    <button class="primary-button" id="btnSaveCustomer">Guardar</button>
  `;

  openModal({ title, bodyHtml, footerHtml });

  document.getElementById("btnCancelCustomer").onclick = () => closeModal();
  document.getElementById("btnSaveCustomer").onclick = () => {
    const form = document.getElementById("customerForm");
    const data = Object.fromEntries(new FormData(form).entries());
    const cs = state.services.customers;

    const record = {
      ...(customer || {}),
      code: data.code.trim(),
      name: data.name.trim(),
      contact_name: data.contact_name.trim(),
      tax_id: data.tax_id.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      billing_address: data.billing_address.trim(),
      credit_limit: Number(data.credit_limit || 0),
      payment_terms: data.payment_terms.trim(),
      is_active: data.is_active === "true",
    };

    cs.upsert(record);
    closeModal();
    showToast("Cliente guardado", "success");
    navigate();
  };
}

function exportCustomersJson() {
  const data = state.services.customers.exportToJson();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clientes_monica_demo.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importCustomersJson() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        state.services.customers.importFromJson(json);
        showToast("Clientes importados", "success");
        navigate();
      } catch {
        showToast("Error al importar JSON", "error");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// --- Facturas de venta (lista con editar / borrar) ---

function renderFacturas(container) {
  const is = state.services.invoices;
  const cs = state.services.customers;

  const getCustomerName = (id) =>
    cs.list().find((c) => c.id === id)?.name || "Sin cliente";

  const render = (filter = "") => {
    const invoices = is.list();
    const q = filter.toLowerCase();

    const filtered = invoices.filter(
      (i) =>
        i.number.toLowerCase().includes(q) ||
        getCustomerName(i.customer_id).toLowerCase().includes(q)
    );

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Facturas de venta</div>
            <div class="card-subtitle">Registro básico de facturas para entrenamiento</div>
          </div>
          <div style="display:flex;gap:0.4rem;">
            <button class="secondary-button" id="btnExportInvoices">Exportar JSON</button>
            <button class="secondary-button" id="btnImportInvoices">Importar JSON</button>
            <button class="primary-button" id="btnNewInvoice">Nueva factura</button>
          </div>
        </div>
        ${renderFiltersBar(`
          <input id="searchInvoices" type="text" placeholder="Buscar por número o cliente" />
        `)}
        ${renderTable({
          columns: [
            { field: "number", label: "Número" },
            { field: "date", label: "Fecha" },
            {
              field: "customer",
              label: "Cliente",
              render: (row) => getCustomerName(row.customer_id),
            },
            {
              field: "items",
              label: "Ítems",
              render: (row) => (row.lines ? row.lines.length : 0),
            },
            {
              field: "grand_total",
              label: "Total",
              render: (row) => `$ ${Number(row.grand_total || 0).toFixed(2)}`,
            },
            {
              field: "status",
              label: "Estado",
              render: (row) =>
                row.status === "Publicado"
                  ? '<span class="badge badge-success">Publicado</span>'
                  : '<span class="badge badge-status">' + row.status + "</span>",
            },
            {
              field: "actions",
              label: "",
              render: (row) => `
                <button class="icon-button" data-edit-invoice="${row.id}" title="Editar">✏️</button>
                <button class="icon-button" data-delete-invoice="${row.id}" title="Eliminar">🗑️</button>
              `,
            },
          ],
          rows: filtered,
          emptyMessage: "Todavía no hay facturas registradas.",
        })}
      </div>
    `;

    // búsqueda
    const search = document.getElementById("searchInvoices");
    search.value = filter;
    search.oninput = (e) => render(e.target.value);

    // botones de cabecera
    document.getElementById("btnNewInvoice").onclick = () => openInvoiceModal();
    document.getElementById("btnExportInvoices").onclick = () => exportInvoicesJson();
    document.getElementById("btnImportInvoices").onclick = () => importInvoicesJson();

    // acciones por fila
    container.querySelectorAll("[data-edit-invoice]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-edit-invoice");
        const invoice = invoices.find((i) => i.id === id);
        if (invoice) openInvoiceModal(invoice);
      };
    });

    container.querySelectorAll("[data-delete-invoice]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-delete-invoice");
        if (confirm("¿Eliminar esta factura?")) {
          is.remove(id);
          showToast("Factura eliminada", "success");
          render(filter);
        }
      };
    });
  };

  render(); // primera vez
}

function openInvoiceModal() {
  const cs = state.services.customers;
  const ps = state.services.products;
  const is = state.services.invoices;

  const customers = cs.list();
  const products = ps.list();
  const today = new Date().toISOString().slice(0, 10);

  // opciones de productos para reutilizar
  const productOptions =
    '<option value="">(vacío)</option>' +
    products
      .map((p) => `<option value="${p.id}">${p.code} - ${p.name}</option>`)
      .join("");

  const bodyHtml = `
    <form id="invoiceForm">
      <div class="form-grid">
        <div class="form-field">
          <label>Número</label>
          <input name="number" value="001-001-000000002" required />
        </div>
        <div class="form-field">
          <label>Fecha</label>
          <input type="date" name="date" value="${today}" required />
        </div>
        <div class="form-field">
          <label>Cliente</label>
          <select name="customer_id" required>
            <option value="">Seleccione...</option>
            ${customers
              .map((c) => `<option value="${c.id}">${c.name}</option>`)
              .join("")}
          </select>
        </div>
      </div>

      <h4 style="margin-top:0.8rem;font-size:0.8rem;">Detalle de productos</h4>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio unit.</th>
              <th>IVA %</th>
              <th>Total línea</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="invoiceLinesBody"></tbody>
        </table>
      </div>
      <div style="margin-top:0.4rem;">
        <button type="button" class="secondary-button" id="btnAddLine">Añadir línea</button>
      </div>

      <div class="form-grid" style="margin-top:0.6rem;">
        <div class="form-field">
          <label>Subtotal</label>
          <input type="number" step="0.01" name="subtotal" id="invSubtotal" value="0" readonly />
        </div>
        <div class="form-field">
          <label>IVA</label>
          <input type="number" step="0.01" name="tax_total" id="invTaxTotal" value="0" readonly />
        </div>
        <div class="form-field">
          <label>Total</label>
          <input type="number" step="0.01" name="grand_total" id="invGrandTotal" value="0" readonly />
        </div>
        <div class="form-field">
          <label>Estado</label>
          <select name="status">
            <option value="Publicado">Publicado</option>
            <option value="Borrador">Borrador</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.6rem;">
        Las filas del detalle son dinámicas. El estudiante puede añadir o eliminar líneas según necesite.
      </p>
    </form>
  `;

  const footerHtml = `
    <button class="secondary-button" id="btnCancelInvoice">Cancelar</button>
    <button class="primary-button" id="btnSaveInvoice">Guardar</button>
  `;

  openModal({ title: "Nueva factura", bodyHtml, footerHtml });

  const form = document.getElementById("invoiceForm");
  const linesBody = document.getElementById("invoiceLinesBody");
  let lineCounter = 0;

  function addLineRow() {
    const tr = document.createElement("tr");
    tr.className = "invoice-line";
    tr.innerHTML = `
      <td>
        <select data-field="product">
          ${productOptions}
        </select>
      </td>
      <td>
        <input type="number" step="0.01" data-field="qty" value="1" />
      </td>
      <td>
        <input type="number" step="0.01" data-field="price" value="0" />
      </td>
      <td>
        <input type="number" step="0.01" data-field="tax" value="15" />
      </td>
      <td>
        <input type="number" step="0.01" data-field="line_total" value="0" readonly />
      </td>
      <td>
        <button type="button" class="icon-button" data-field="remove" title="Eliminar línea">🗑️</button>
      </td>
    `;
    linesBody.appendChild(tr);

    // escuchar cambios para recalcular
    ["qty", "price", "tax"].forEach((field) => {
      tr.querySelector(`[data-field="${field}"]`).addEventListener("input", recalcTotals);
    });
    tr.querySelector('[data-field="remove"]').addEventListener("click", () => {
      tr.remove();
      recalcTotals();
    });

    lineCounter++;
    recalcTotals();
  }

  function recalcTotals() {
    let subtotal = 0;
    let taxTotal = 0;

    linesBody.querySelectorAll("tr.invoice-line").forEach((tr) => {
      const qty = Number(tr.querySelector('[data-field="qty"]').value || 0);
      const price = Number(tr.querySelector('[data-field="price"]').value || 0);
      const taxRatePercent = Number(tr.querySelector('[data-field="tax"]').value || 0);

      const lineNet = qty * price;
      const lineTax = lineNet * (taxRatePercent / 100);
      const lineTotal = lineNet + lineTax;

      tr.querySelector('[data-field="line_total"]').value = lineTotal.toFixed(2);

      subtotal += lineNet;
      taxTotal += lineTax;
    });

    const grandTotal = subtotal + taxTotal;
    form["subtotal"].value = subtotal.toFixed(2);
    form["tax_total"].value = taxTotal.toFixed(2);
    form["grand_total"].value = grandTotal.toFixed(2);
  }

  // al menos dos filas para empezar
  addLineRow();
  addLineRow();

  document.getElementById("btnAddLine").addEventListener("click", () => addLineRow());

  document.getElementById("btnCancelInvoice").onclick = () => closeModal();

  document.getElementById("btnSaveInvoice").onclick = () => {
    const headerData = Object.fromEntries(new FormData(form).entries());

    // construir líneas desde el DOM
    const lines = [];
    linesBody.querySelectorAll("tr.invoice-line").forEach((tr) => {
      const product_id = tr.querySelector('[data-field="product"]').value;
      const qty = Number(tr.querySelector('[data-field="qty"]').value || 0);
      const price = Number(tr.querySelector('[data-field="price"]').value || 0);
      const taxRatePercent = Number(tr.querySelector('[data-field="tax"]').value || 0);

      if (!product_id || qty === 0) return;

      const product = products.find((p) => p.id === product_id);
      const line_subtotal = qty * price;
      const taxRate = taxRatePercent / 100;
      const line_tax = line_subtotal * taxRate;
      const line_total = line_subtotal + line_tax;

      lines.push({
        product_id,
        product_code: product?.code || "",
        product_name: product?.name || "",
        quantity: qty,
        unit_price: price,
        tax_rate: taxRate,
        line_subtotal,
        line_tax,
        line_total,
      });
    });

    if (lines.length === 0) {
      showToast("Ingrese al menos un producto con cantidad distinta de cero", "error");
      return;
    }

    // asegurar que los totales estén sincronizados
    recalcTotals();
    const subtotal = Number(form["subtotal"].value || 0);
    const tax_total = Number(form["tax_total"].value || 0);
    const grand_total = Number(form["grand_total"].value || 0);

    const record = {
      number: headerData.number.trim(),
      date: headerData.date,
      customer_id: headerData.customer_id,
      subtotal,
      tax_total,
      grand_total,
      status: headerData.status,
      currency: "USD",
      lines,
    };

    is.upsert(record);
    closeModal();
    showToast("Factura registrada", "success");
    navigate();
  };
}

function exportInvoicesJson() {
  const data = state.services.invoices.exportToJson();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "facturas_monica_demo.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importInvoicesJson() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        state.services.invoices.importFromJson(json);
        showToast("Facturas importadas", "success");
        navigate();
      } catch {
        showToast("Error al importar JSON", "error");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// --- Empresas (gestión simple para que los estudiantes jueguen con multi-empresa) ---

function renderEmpresas(container) {
  const companies = loadCompanies();

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Empresas</div>
          <div class="card-subtitle">Multiempresa básica para simulaciones contables</div>
        </div>
        <button class="primary-button" id="btnNewCompany">Nueva empresa</button>
      </div>
      ${renderTable({
        columns: [
          { field: "name", label: "Nombre" },
          { field: "tax_id", label: "RUC" },
          { field: "fiscal_currency", label: "Moneda" },
        ],
        rows: companies,
        emptyMessage: "Solo existe la empresa demo. Crea más para simular varios clientes.",
      })}
    </div>
  `;

  document.getElementById("btnNewCompany").onclick = () => {
    const bodyHtml = `
      <form id="companyForm">
        <div class="form-grid">
          <div class="form-field">
            <label>Nombre</label>
            <input name="name" required />
          </div>
          <div class="form-field">
            <label>RUC</label>
            <input name="tax_id" />
          </div>
          <div class="form-field">
            <label>Moneda</label>
            <input name="fiscal_currency" value="USD" />
          </div>
        </div>
      </form>
    `;
    const footerHtml = `
      <button class="secondary-button" id="btnCancelCompany">Cancelar</button>
      <button class="primary-button" id="btnSaveCompany">Guardar</button>
    `;
    openModal({ title: "Nueva empresa", bodyHtml, footerHtml });

    document.getElementById("btnCancelCompany").onclick = () => closeModal();
    document.getElementById("btnSaveCompany").onclick = () => {
      const form = document.getElementById("companyForm");
      const data = Object.fromEntries(new FormData(form).entries());
      const list = loadCompanies();
      list.push({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        name: data.name.trim(),
        tax_id: data.tax_id.trim(),
        fiscal_currency: data.fiscal_currency.trim() || "USD",
      });
      saveCompanies(list);
      closeModal();
      showToast("Empresa creada", "success");
      initCompanies();
      navigate();
    };
  };
}

// --- Kardex ---

function renderKardex(container) {
  const ps = state.services.products;
  const ims = state.services.inventoryMovements;
  const products = ps.list();

  // producto seleccionado por defecto
  const defaultProductId = products[0]?.id || "";

  const renderForProduct = (productId) => {
    const movements = productId ? ims.listByProduct(productId) : [];
    let running = 0;

    const rowsWithBalance = movements.map((m) => {
      running += (m.qty_in || 0) - (m.qty_out || 0);
      return { ...m, running_balance: running };
    });

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Kardex</div>
            <div class="card-subtitle">Movimientos de inventario por producto</div>
          </div>
          <div style="display:flex;gap:0.4rem;">
            <button class="secondary-button" id="btnExportKardex">Exportar JSON</button>
            <button class="secondary-button" id="btnImportKardex">Importar JSON</button>
            <button class="primary-button" id="btnNewMovement">Nuevo movimiento</button>
          </div>
        </div>
        ${renderFiltersBar(`
          <select id="kardexProductSelect">
            <option value="">Seleccione producto...</option>
            ${products
              .map(
                (p) =>
                  `<option value="${p.id}" ${
                    p.id === productId ? "selected" : ""
                  }>${p.code} - ${p.name}</option>`
              )
              .join("")}
          </select>
        `)}
        ${
          productId
            ? renderTable({
                columns: [
                  { field: "date", label: "Fecha" },
                  { field: "movement_type", label: "Tipo" },
                  {
                    field: "qty_in",
                    label: "Entrada",
                    render: (r) => (r.qty_in || 0) || "",
                  },
                  {
                    field: "qty_out",
                    label: "Salida",
                    render: (r) => (r.qty_out || 0) || "",
                  },
                  {
                    field: "unit_cost",
                    label: "Costo unit.",
                    render: (r) => `$ ${Number(r.unit_cost || 0).toFixed(2)}`,
                  },
                  {
                    field: "running_balance",
                    label: "Saldo",
                    render: (r) => r.running_balance,
                  },
                  { field: "note", label: "Detalle" },
                ],
                rows: rowsWithBalance,
                emptyMessage:
                  "No hay movimientos para este producto. Registre compras, ventas o ajustes.",
              })
            : `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem;">Seleccione un producto para ver su Kardex.</p>`
        }
      </div>
    `;

    document.getElementById("kardexProductSelect").addEventListener("change", (e) =>
      renderForProduct(e.target.value)
    );

    document.getElementById("btnNewMovement").onclick = () =>
      openMovementModal(productId || products[0]?.id || null);
    document.getElementById("btnExportKardex").onclick = () => exportKardexJson();
    document.getElementById("btnImportKardex").onclick = () => importKardexJson();
  };

  renderForProduct(defaultProductId);
}

function openMovementModal(productId) {
  const ps = state.services.products;
  const ims = state.services.inventoryMovements;
  const products = ps.list();
  const today = new Date().toISOString().slice(0, 10);

  const bodyHtml = `
    <form id="movementForm">
      <div class="form-grid">
        <div class="form-field">
          <label>Producto</label>
          <select name="product_id" required>
            <option value="">Seleccione...</option>
            ${products
              .map(
                (p) =>
                  `<option value="${p.id}" ${
                    p.id === productId ? "selected" : ""
                  }>${p.code} - ${p.name}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Fecha</label>
          <input type="date" name="date" value="${today}" required />
        </div>
        <div class="form-field">
          <label>Tipo de movimiento</label>
          <select name="movement_type">
            <option value="Compra">Compra</option>
            <option value="Venta">Venta</option>
            <option value="Ajuste+">Ajuste (+)</option>
            <option value="Ajuste-">Ajuste (-)</option>
          </select>
        </div>
        <div class="form-field">
          <label>Cantidad</label>
          <input type="number" step="0.01" name="quantity" value="1" required />
        </div>
        <div class="form-field">
          <label>Costo unitario</label>
          <input type="number" step="0.01" name="unit_cost" value="0" />
        </div>
        <div class="form-field">
          <label>Detalle / nota</label>
          <textarea name="note"></textarea>
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="secondary-button" id="btnCancelMovement">Cancelar</button>
    <button class="primary-button" id="btnSaveMovement">Guardar</button>
  `;

  openModal({ title: "Nuevo movimiento de inventario", bodyHtml, footerHtml });

  document.getElementById("btnCancelMovement").onclick = () => closeModal();
  document.getElementById("btnSaveMovement").onclick = () => {
    const form = document.getElementById("movementForm");
    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.product_id) {
      showToast("Seleccione un producto", "error");
      return;
    }

    const qty = Number(data.quantity || 0);
    const unitCost = Number(data.unit_cost || 0);
    let qty_in = 0;
    let qty_out = 0;

    if (data.movement_type === "Compra" || data.movement_type === "Ajuste+") {
      qty_in = qty;
    } else {
      qty_out = qty;
    }

    ims.upsert({
      product_id: data.product_id,
      date: data.date,
      movement_type: data.movement_type,
      qty_in,
      qty_out,
      unit_cost: unitCost,
      note: data.note || "",
    });

    // opcional: actualizar stock actual del producto
    const product = ps.list().find((p) => p.id === data.product_id);
    if (product) {
      product.current_stock =
        Number(product.current_stock || 0) + qty_in - qty_out;
      ps.upsert(product);
    }

    closeModal();
    showToast("Movimiento registrado", "success");
    navigate(); // recarga la vista
  };
}

function exportKardexJson() {
  const ims = state.services.inventoryMovements;
  const data = ims.exportToJson();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kardex_monica_demo.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importKardexJson() {
  const ims = state.services.inventoryMovements;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        ims.importFromJson(json);
        showToast("Kardex importado", "success");
        navigate();
      } catch {
        showToast("Error al importar JSON", "error");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// --- Plan de cuentas ---

function renderPlanCuentas(container) {
  const coa = state.services.chartOfAccounts;
  const accounts = coa.list();

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Plan de cuentas</div>
          <div class="card-subtitle">Catálogo básico de cuentas contables</div>
        </div>
        <div style="display:flex;gap:0.4rem;">
          <button class="secondary-button" id="btnImportCoa">Importar JSON</button>
          <button class="secondary-button" id="btnExportCoa">Exportar JSON</button>
          <button class="primary-button" id="btnNewAccount">Nueva cuenta</button>
        </div>
      </div>
      ${renderTable({
        columns: [
          { field: "code", label: "Código" },
          { field: "name", label: "Nombre" },
          { field: "type", label: "Tipo" },
          {
            field: "is_active",
            label: "Estado",
            render: (row) =>
              row.is_active
                ? '<span class="badge badge-success">Activa</span>'
                : '<span class="badge badge-danger">Inactiva</span>',
          },
          {
            field: "actions",
            label: "",
            render: (row) => `
              <button class="icon-button" data-edit-account="${row.id}" title="Editar">✏️</button>
              <button class="icon-button" data-delete-account="${row.id}" title="Eliminar">🗑️</button>
            `,
          },
        ],
        rows: accounts,
        emptyMessage: "No hay cuentas definidas. Usa el botón Nueva cuenta.",
      })}
    </div>
  `;

  document.getElementById("btnNewAccount").onclick = () => openAccountModal();
  document.getElementById("btnExportCoa").onclick = () => exportCoaJson();
  document.getElementById("btnImportCoa").onclick = () => importCoaJson();

  container.querySelectorAll("[data-edit-account]").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-edit-account");
      const a = coa.list().find((x) => x.id === id);
      openAccountModal(a);
    };
  });

  container.querySelectorAll("[data-delete-account]").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-delete-account");
      if (confirm("¿Eliminar esta cuenta?")) {
        coa.remove(id);
        showToast("Cuenta eliminada", "success");
        navigate();
      }
    };
  });
}

function openAccountModal(account = null) {
  const isEdit = !!account;
  const a = account || {
    code: "",
    name: "",
    type: "Activo",
    is_active: true,
  };

  const bodyHtml = `
    <form id="accountForm">
      <div class="form-grid">
        <div class="form-field">
          <label>Código</label>
          <input name="code" value="${a.code}" required />
        </div>
        <div class="form-field">
          <label>Nombre</label>
          <input name="name" value="${a.name}" required />
        </div>
        <div class="form-field">
          <label>Tipo</label>
          <select name="type">
            ${["Activo","Pasivo","Patrimonio","Ingreso","Gasto"]
              .map((t) => `<option value="${t}" ${a.type === t ? "selected" : ""}>${t}</option>`)
              .join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Activa</label>
          <select name="is_active">
            <option value="true" ${a.is_active ? "selected" : ""}>Sí</option>
            <option value="false" ${!a.is_active ? "selected" : ""}>No</option>
          </select>
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="secondary-button" id="btnCancelAccount">Cancelar</button>
    <button class="primary-button" id="btnSaveAccount">Guardar</button>
  `;

  openModal({ title: isEdit ? "Editar cuenta" : "Nueva cuenta", bodyHtml, footerHtml });

  document.getElementById("btnCancelAccount").onclick = () => closeModal();
  document.getElementById("btnSaveAccount").onclick = () => {
    const form = document.getElementById("accountForm");
    const data = Object.fromEntries(new FormData(form).entries());
    const coa = state.services.chartOfAccounts;

    const record = {
      ...(account || {}),
      code: data.code.trim(),
      name: data.name.trim(),
      type: data.type,
      is_active: data.is_active === "true",
    };

    coa.upsert(record);
    closeModal();
    showToast("Cuenta guardada", "success");
    navigate();
  };
}

function exportCoaJson() {
  const coa = state.services.chartOfAccounts;
  const data = coa.exportToJson();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plan_cuentas_monica_demo.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importCoaJson() {
  const coa = state.services.chartOfAccounts;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        coa.importFromJson(json);
        showToast("Plan de cuentas importado", "success");
        navigate();
      } catch {
        showToast("Error al importar JSON", "error");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// --- Asientos contables / Diario general ---

function renderAsientos(container) {
  const je = state.services.journalEntries;
  const entries = je.list();

  const totalDebits = entries.reduce(
    (sum, e) => sum + e.lines.reduce((s, l) => s + (l.debit || 0), 0),
    0
  );
  const totalCredits = entries.reduce(
    (sum, e) => sum + e.lines.reduce((s, l) => s + (l.credit || 0), 0),
    0
  );

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Asientos contables</div>
          <div class="card-subtitle">
            Diario general. Los débitos y créditos deben coincidir en cada asiento.
          </div>
        </div>
        <div style="display:flex;gap:0.4rem;">
          <button class="secondary-button" id="btnImportJournal">Importar JSON</button>
          <button class="secondary-button" id="btnExportJournal">Exportar JSON</button>
          <button class="primary-button" id="btnNewEntry">Nuevo asiento</button>
        </div>
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.4rem;">
        Total débitos registrados: <strong>$ ${totalDebits.toFixed(
          2
        )}</strong> – Total créditos: <strong>$ ${totalCredits.toFixed(2)}</strong>
      </p>
      ${renderTable({
        columns: [
          { field: "date", label: "Fecha" },
          { field: "description", label: "Descripción" },
          {
            field: "total_debit",
            label: "Débito",
            render: (row) =>
              `$ ${row.lines
                .reduce((s, l) => s + (l.debit || 0), 0)
                .toFixed(2)}`,
          },
          {
            field: "total_credit",
            label: "Crédito",
            render: (row) =>
              `$ ${row.lines
                .reduce((s, l) => s + (l.credit || 0), 0)
                .toFixed(2)}`,
          },
          {
            field: "status",
            label: "Estado",
            render: (row) => {
              const debit = row.lines.reduce((s, l) => s + (l.debit || 0), 0);
              const credit = row.lines.reduce((s, l) => s + (l.credit || 0), 0);
              const ok = Math.abs(debit - credit) < 0.01;
              return ok
                ? '<span class="badge badge-success">Cuadrado</span>'
                : '<span class="badge badge-danger">Desc.</span>';
            },
          },
        ],
        rows: entries,
        emptyMessage: "No hay asientos contables registrados.",
      })}
    </div>
  `;

  document.getElementById("btnNewEntry").onclick = () => openJournalEntryModal();
  document.getElementById("btnExportJournal").onclick = () => exportJournalJson();
  document.getElementById("btnImportJournal").onclick = () => importJournalJson();
}

function openJournalEntryModal() {
  const coa = state.services.chartOfAccounts;
  const accounts = coa.list();
  const today = new Date().toISOString().slice(0, 10);

  // empezamos con 3 líneas editables
  const linesInitial = [0, 1, 2];

  const buildLinesRows = () =>
    linesInitial
      .map(
        (idx) => `
      <tr>
        <td>
          <select name="account_code_${idx}">
            <option value="">Seleccione...</option>
            ${accounts
              .map(
                (a) =>
                  `<option value="${a.code}">${a.code} - ${a.name}</option>`
              )
              .join("")}
          </select>
        </td>
        <td>
          <input type="text" name="line_desc_${idx}" />
        </td>
        <td>
          <input type="number" step="0.01" name="debit_${idx}" value="0" />
        </td>
        <td>
          <input type="number" step="0.01" name="credit_${idx}" value="0" />
        </td>
      </tr>
    `
      )
      .join("");

  const bodyHtml = `
    <form id="journalForm">
      <div class="form-grid">
        <div class="form-field">
          <label>Fecha</label>
          <input type="date" name="date" value="${today}" required />
        </div>
        <div class="form-field">
          <label>Descripción del asiento</label>
          <input name="description" required />
        </div>
      </div>
      <h4 style="margin-top:0.8rem;font-size:0.8rem;">Líneas</h4>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Detalle línea</th>
              <th>Débito</th>
              <th>Crédito</th>
            </tr>
          </thead>
          <tbody>
            ${buildLinesRows()}
          </tbody>
        </table>
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.4rem;">
        Para simplificar, este formulario usa 3 líneas. Los estudiantes pueden ampliarlo a más filas dinámicas.
      </p>
    </form>
  `;

  const footerHtml = `
    <button class="secondary-button" id="btnCancelJournal">Cancelar</button>
    <button class="primary-button" id="btnSaveJournal">Guardar</button>
  `;

  openModal({ title: "Nuevo asiento contable", bodyHtml, footerHtml });

  document.getElementById("btnCancelJournal").onclick = () => closeModal();
  document.getElementById("btnSaveJournal").onclick = () => {
    const form = document.getElementById("journalForm");
    const data = Object.fromEntries(new FormData(form).entries());

    const lines = linesInitial
      .map((idx) => {
        const code = data[`account_code_${idx}`];
        const desc = data[`line_desc_${idx}`];
        const debit = Number(data[`debit_${idx}`] || 0);
        const credit = Number(data[`credit_${idx}`] || 0);
        if (!code && !debit && !credit) return null; // fila vacía
        const account = accounts.find((a) => a.code === code);
        return {
          account_code: code || "",
          account_name: account?.name || "",
          description: desc || "",
          debit,
          credit,
        };
      })
      .filter(Boolean);

    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);

    if (lines.length === 0) {
      showToast("Añada al menos una línea", "error");
      return;
    }

    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
      showToast("El asiento no cuadra. Débito y crédito deben ser iguales.", "error");
      return;
    }

    const je = state.services.journalEntries;
    je.upsert({
      date: data.date,
      description: data.description.trim(),
      posted: true,
      lines,
    });

    closeModal();
    showToast("Asiento guardado", "success");
    navigate();
  };
}

function exportJournalJson() {
  const je = state.services.journalEntries;
  const data = je.exportToJson();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "asientos_monica_demo.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importJournalJson() {
  const je = state.services.journalEntries;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        je.importFromJson(json);
        showToast("Asientos importados", "success");
        navigate();
      } catch {
        showToast("Error al importar JSON", "error");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Configuración de ejemplo para entrenamiento
const fiscalConfig = {
  currentFiscalYear: 2025,
  periods: [
    { id: '2025-01', year: 2025, name: '01 - Enero',   status: 'Abierto' },
    { id: '2025-02', year: 2025, name: '02 - Febrero', status: 'Abierto' },
    { id: '2025-03', year: 2025, name: '03 - Marzo',   status: 'Cerrado' } // ejemplo
    // ...
  ]
};

const appState = {
  currentPeriodId: '2025-02' // por ejemplo
};

function initFiscalControls() {
  const yearSelect   = document.getElementById('fiscalYearSelect');
  const periodSelect = document.getElementById('periodSelect');
  const statusBadge  = document.getElementById('periodStatusBadge');

  if (!yearSelect || !periodSelect || !statusBadge) return;

  // Años disponibles a partir de periods
  const years = Array.from(new Set(fiscalConfig.periods.map(p => p.year))).sort();
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });

  yearSelect.value = fiscalConfig.currentFiscalYear;

  function refreshPeriods() {
    const selectedYear = Number(yearSelect.value);
    periodSelect.innerHTML = '';

    const periodsForYear = fiscalConfig.periods.filter(p => p.year === selectedYear);
    periodsForYear.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      periodSelect.appendChild(opt);
    });

    // Si el período actual no corresponde al año elegido, toma el primero del año
    const current = periodsForYear.find(p => p.id === appState.currentPeriodId) || periodsForYear[0];
    if (current) {
      appState.currentPeriodId = current.id;
      periodSelect.value = current.id;
      updatePeriodStatusBadge(current);
    }
  }

  function updatePeriodStatusBadge(period) {
    statusBadge.textContent = period.status === 'Cerrado'
      ? 'Cerrado'
      : 'Abierto';
    statusBadge.className = 'badge ' + (period.status === 'Cerrado'
      ? 'badge-danger'
      : 'badge-success');
  }

  yearSelect.addEventListener('change', refreshPeriods);

  periodSelect.addEventListener('change', () => {
    const p = fiscalConfig.periods.find(x => x.id === periodSelect.value);
    if (!p) return;
    appState.currentPeriodId = p.id;
    updatePeriodStatusBadge(p);

    // Aquí luego puedes usar appState.currentPeriodId
    // para filtrar reportes, mayores, etc.
  });

  // Inicializar
  refreshPeriods();
}

// --- Parámetros contables: ejercicios y períodos ---

function renderParametrosContables(container) {
  const fiscal = state.services.fiscal;

  // Aseguramos que haya al menos un ejercicio/períodos por defecto
  fiscal.seedDefaultsIfEmpty();

  let selectedYearId = null;

  const render = () => {
    const years = fiscal.listYears();
    if (!selectedYearId && years.length > 0) {
      selectedYearId = years[years.length - 1].id; // último año creado
    }

    const periods = selectedYearId ? fiscal.listPeriodsByYear(selectedYearId) : [];

    container.innerHTML = `
      <div class="card view-enter">
        <div class="card-header">
          <div>
            <div class="card-title">Parámetros contables</div>
            <div class="card-subtitle">
              Gestión de ejercicios y períodos contables para la empresa actual.
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="secondary-button" id="btnNewYear">Nuevo ejercicio</button>
            <button class="secondary-button" id="btnNewPeriod" ${
              selectedYearId ? "" : "disabled"
            }>Nuevo período</button>
          </div>
        </div>

        <div class="form-grid" style="margin-bottom:0.8rem;">
          <div class="form-field">
            <label>Ejercicio contable activo</label>
            <select id="fiscalYearSelect">
              ${years
                .map(
                  (y) => `
                <option value="${y.id}" ${y.id === selectedYearId ? "selected" : ""}>
                  ${y.name || y.year}
                </option>`
                )
                .join("")}
            </select>
          </div>
        </div>

        <h4 style="font-size:0.8rem;margin:0.5rem 0;">Ejercicios contables</h4>
        <div class="table-wrapper" style="margin-bottom:1rem;">
          <table>
            <thead>
              <tr>
                <th>Año</th>
                <th>Nombre</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                years.length === 0
                  ? `<tr><td colspan="6">No hay ejercicios contables definidos.</td></tr>`
                  : years
                      .map(
                        (y) => `
                <tr>
                  <td>${y.year}</td>
                  <td>${y.name || ""}</td>
                  <td>${y.start_date || ""}</td>
                  <td>${y.end_date || ""}</td>
                  <td>${y.is_active ? "Sí" : "No"}</td>
                  <td>
                    <button class="icon-button" data-edit-year="${y.id}" title="Editar">✏️</button>
                    <button class="icon-button" data-delete-year="${y.id}" title="Eliminar">🗑️</button>
                  </td>
                </tr>`
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>

        <h4 style="font-size:0.8rem;margin:0.5rem 0;">Períodos del ejercicio seleccionado</h4>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                !selectedYearId || periods.length === 0
                  ? `<tr><td colspan="5">No hay períodos definidos para este ejercicio.</td></tr>`
                  : periods
                      .map(
                        (p) => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.start_date || ""}</td>
                  <td>${p.end_date || ""}</td>
                  <td>
                    <span class="badge ${
                      p.status === "Cerrado" ? "badge-danger" : "badge-success"
                    }">
                      ${p.status || "Abierto"}
                    </span>
                  </td>
                    <td>
                      <button class="icon-button" data-use-period="${p.id}" title="Usar como período actual">📌</button>
                      <button class="icon-button" data-edit-period="${p.id}" title="Editar">✏️</button>
                      <button class="icon-button" data-delete-period="${p.id}" title="Eliminar">🗑️</button>
                    </td>
                </tr>`
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    // --- Eventos ---

    const yearSelect = document.getElementById("fiscalYearSelect");
    if (yearSelect) {
      yearSelect.onchange = () => {
        selectedYearId = yearSelect.value || null;

        // Actualizar el contexto fiscal: ejercicio elegido
        // y dejar que FiscalService escoja el período por defecto de ese año
        if (selectedYearId) {
          fiscal.setContext({ year_id: selectedYearId, period_id: null });
        } else {
          fiscal.setContext(null);
        }

        // Volver a dibujar la vista (tabla de períodos) y actualizar el topbar
        render();
        updateTopbarPeriod();
      };
    }

    const btnNewYear = document.getElementById("btnNewYear");
    if (btnNewYear) {
      btnNewYear.onclick = () => openFiscalYearModal();
    }

    const btnNewPeriod = document.getElementById("btnNewPeriod");
    if (btnNewPeriod && selectedYearId) {
      btnNewPeriod.onclick = () => openPeriodModal(selectedYearId);
    }

    // editar / eliminar ejercicios
    container.querySelectorAll("[data-edit-year]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-edit-year");
        const year = fiscal.listYears().find((y) => y.id === id);
        if (year) openFiscalYearModal(year);
      };
    });

    container.querySelectorAll("[data-delete-year]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-delete-year");
        if (
          confirm(
            "¿Eliminar este ejercicio y todos sus períodos asociados? Esta acción no se puede deshacer."
          )
        ) {
          fiscal.removeYear(id);
          if (selectedYearId === id) selectedYearId = null;
          render();
        }
      };
    });

    // editar / eliminar períodos
    container.querySelectorAll("[data-edit-period]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-edit-period");
        const period = fiscal.listAllPeriods().find((p) => p.id === id);
        if (period) openPeriodModal(period.fiscal_year_id, period);
      };
    });

    container.querySelectorAll("[data-delete-period]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-delete-period");
        if (confirm("¿Eliminar este período contable?")) {
          fiscal.removePeriod(id);
          render();
        }
      };
    });

    // usar período como actual (topbar)
    container.querySelectorAll("[data-use-period]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-use-period");
        fiscal.setCurrentPeriod(id);
        showToast("Período establecido como actual", "success");
        updateTopbarPeriod();
      };
    });
  };

  // --- Modales para crear/editar ejercicios y períodos ---

  function openFiscalYearModal(existingYear = null) {
    const isEdit = !!existingYear;
    const y = existingYear?.year || new Date().getFullYear();
    const bodyHtml = `
      <form id="fiscalYearForm">
        <div class="form-grid">
          <div class="form-field">
            <label>Año</label>
            <input type="number" name="year" value="${y}" required />
          </div>
          <div class="form-field">
            <label>Nombre del ejercicio</label>
            <input type="text" name="name" value="${existingYear?.name || `Ejercicio ${y}`}" />
          </div>
          <div class="form-field">
            <label>Fecha inicio</label>
            <input type="date" name="start_date" value="${existingYear?.start_date || `${y}-01-01`}" />
          </div>
          <div class="form-field">
            <label>Fecha fin</label>
            <input type="date" name="end_date" value="${existingYear?.end_date || `${y}-12-31`}" />
          </div>
          <div class="form-field">
            <label>Activo</label>
            <select name="is_active">
              <option value="true" ${existingYear?.is_active !== false ? "selected" : ""}>Sí</option>
              <option value="false" ${existingYear?.is_active === false ? "selected" : ""}>No</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="secondary-button" id="btnCancelFY">Cancelar</button>
      <button class="primary-button" id="btnSaveFY">Guardar</button>
    `;

    openModal({
      title: isEdit ? "Editar ejercicio contable" : "Nuevo ejercicio contable",
      bodyHtml,
      footerHtml,
    });

    const form = document.getElementById("fiscalYearForm");
    document.getElementById("btnCancelFY").onclick = () => closeModal();
    document.getElementById("btnSaveFY").onclick = () => {
      const data = Object.fromEntries(new FormData(form).entries());
      const yearNumber = Number(data.year);

      const record = {
        ...(existingYear || {}),
        id: existingYear?.id || String(yearNumber),
        year: yearNumber,
        name: data.name || `Ejercicio ${yearNumber}`,
        start_date: data.start_date,
        end_date: data.end_date,
        is_active: data.is_active === "true",
      };

      fiscal.upsertYear(record);
      closeModal();
      render();
      updateTopbarPeriod();
    };
  }

  function openPeriodModal(fiscalYearId, existingPeriod = null) {
    const isEdit = !!existingPeriod;

    const defaultName = "Nuevo período";
    const bodyHtml = `
      <form id="fiscalPeriodForm">
        <div class="form-grid">
          <div class="form-field">
            <label>Nombre del período</label>
            <input type="text" name="name" value="${existingPeriod?.name || defaultName}" required />
          </div>
          <div class="form-field">
            <label>Fecha inicio</label>
            <input type="date" name="start_date" value="${existingPeriod?.start_date || ""}" required />
          </div>
          <div class="form-field">
            <label>Fecha fin</label>
            <input type="date" name="end_date" value="${existingPeriod?.end_date || ""}" required />
          </div>
          <div class="form-field">
            <label>Estado</label>
            <select name="status">
              <option value="Abierto" ${
                !existingPeriod || existingPeriod.status === "Abierto" ? "selected" : ""
              }>Abierto</option>
              <option value="Cerrado" ${
                existingPeriod?.status === "Cerrado" ? "selected" : ""
              }>Cerrado</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="secondary-button" id="btnCancelFP">Cancelar</button>
      <button class="primary-button" id="btnSaveFP">Guardar</button>
    `;

    openModal({
      title: isEdit ? "Editar período contable" : "Nuevo período contable",
      bodyHtml,
      footerHtml,
    });

    const form = document.getElementById("fiscalPeriodForm");
    document.getElementById("btnCancelFP").onclick = () => closeModal();
    document.getElementById("btnSaveFP").onclick = () => {
      const data = Object.fromEntries(new FormData(form).entries());
      const name = data.name.trim();

      if (!name) {
        showToast("El nombre del período es obligatorio", "error");
        return;
      }

      const record = {
        ...(existingPeriod || {}),
        id: existingPeriod?.id || `${fiscalYearId}-${Date.now()}`,
        fiscal_year_id: fiscalYearId,
        name,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status || "Abierto",
      };

      fiscal.upsertPeriod(record);
      closeModal();
      render();
    };
  }

  // primera carga
  render();
}

// Llamar después de cargar el DOM o al inicializar la app
document.addEventListener('DOMContentLoaded', initFiscalControls);