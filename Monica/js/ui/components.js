// js/ui/components.js

export function renderTable({ columns, rows, emptyMessage = "Sin registros" }) {
  const thead = `
    <thead>
      <tr>
        ${columns.map((c) => `<th>${c.label}</th>`).join("")}
      </tr>
    </thead>
  `;

  const tbody =
    rows.length === 0
      ? `<tbody><tr><td colspan="${columns.length}">${emptyMessage}</td></tr></tbody>`
      : `<tbody>
          ${rows
            .map(
              (row) => `
              <tr>
                ${columns
                  .map((c) => `<td>${c.render ? c.render(row) : row[c.field] ?? ""}</td>`)
                  .join("")}
              </tr>`
            )
            .join("")}
        </tbody>`;

  return `<div class="table-wrapper"><table>${thead}${tbody}</table></div>`;
}

export function renderFiltersBar(controlsHtml = "") {
  return `<div class="filters-bar">${controlsHtml}</div>`;
}

export function openModal({ title, bodyHtml, footerHtml }) {
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  const footerEl = document.getElementById("modalFooter");

  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  footerEl.innerHTML = footerHtml || "";

  overlay.classList.remove("hidden");

  const closeBtn = document.getElementById("modalCloseBtn");
  closeBtn.onclick = () => closeModal();
}

export function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  overlay.classList.add("hidden");
}

export function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const div = document.createElement("div");
  div.className = "toast view-enter";
  let icon = "ℹ️";

  if (type === "success") icon = "✅";
  if (type === "error") icon = "⚠️";

  div.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(div);

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 300);
  }, 3000);
}
