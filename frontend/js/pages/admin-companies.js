import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { companyApi } from "../api/company.api.js";
import { showNotification } from "../utils/notification.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  formPanel: $("#company-form-panel"),
  form: $("#company-form"),
  formTitle: $("#company-form-title"),
  saveButton: $("#save-company-button"),
  addButton: $("#add-company-button"),
  search: $("#company-search"),
  industry: $("#industry-filter"),
  reset: $("#reset-company-filters"),
  refresh: $("#refresh-companies"),
  list: $("#companies-list"),
  count: $("#companies-count"),
  previous: $("#companies-previous"),
  next: $("#companies-next"),
  pageLabel: $("#companies-page-label"),
  viewTabs: Array.from(document.querySelectorAll("[data-company-view]")),
  officerModal: $("#officer-modal"),
  officerModalTitle: $("#officer-modal-title"),
  officerModalSubtitle: $("#officer-modal-subtitle"),
  officerList: $("#assigned-officers-list"),
  assignSelect: $("#assign-officer-select"),
  assignButton: $("#assign-officer-button"),
  transferOfficerSelect: $("#transfer-officer-select"),
  transferCompanySelect: $("#transfer-company-select"),
  transferButton: $("#transfer-officer-button"),
  officerRefresh: $("#refresh-officers"),
};

const PAGE_SIZE = 9;
const VALID_VIEWS = ["true", "false", "all"];
let companies = [];
let currentPage = 1;
let totalPages = 1;
let editingCompanyId = null;
let searchTimer = null;
let loading = false;
let currentCompanyView = "true";
let placementOfficers = [];
let activeOfficerCompany = null;
let activeCompanyOptions = [];
let officerActionLoading = false;

function unwrap(response) {
  let value = response;
  for (let i = 0; i < 3; i += 1) {
    if (value?.data !== undefined) value = value.data;
    else break;
  }
  return value;
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[character])
  );
}

function companyId(company) {
  return String(company?.id ?? company?._id ?? "");
}

function isCompanyActive(company) {
  return company?.isActive !== false;
}

function getFormPayload() {
  const formData = new FormData(elements.form);
  const payload = {};
  for (const key of [
    "name",
    "industry",
    "location",
    "website",
    "contactEmail",
    "contactPhone",
    "description",
  ]) {
    const value = String(formData.get(key) ?? "").trim();
    if (value) payload[key] = value;
  }
  payload.name = String(formData.get("name") ?? "").trim();
  return payload;
}

function openCreateForm() {
  editingCompanyId = null;
  elements.form.reset();
  elements.formTitle.textContent = "Add a company";
  elements.saveButton.textContent = "Create company";
  elements.formPanel.hidden = false;
  elements.formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  $("#company-name").focus();
}

function openEditForm(company) {
  if (!isCompanyActive(company)) {
    showNotification(
      "Reactivate the company before editing its details.",
      "warning"
    );
    return;
  }
  editingCompanyId = companyId(company);
  elements.form.reset();
  for (const key of [
    "name",
    "industry",
    "location",
    "website",
    "contactEmail",
    "contactPhone",
    "description",
  ]) {
    const input = elements.form.elements.namedItem(key);
    if (input) input.value = company[key] ?? "";
  }
  elements.formTitle.textContent = "Edit company";
  elements.saveButton.textContent = "Save changes";
  elements.formPanel.hidden = false;
  elements.formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  $("#company-name").focus();
}

function closeForm() {
  elements.formPanel.hidden = true;
  elements.form.reset();
  editingCompanyId = null;
  elements.saveButton.textContent = "Save company";
}

function setCompanyView(view) {
  if (!VALID_VIEWS.includes(view) || view === currentCompanyView) return;
  currentCompanyView = view;
  currentPage = 1;
  elements.viewTabs.forEach((tab) => {
    const selected = tab.dataset.companyView === view;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-pressed", String(selected));
  });
  closeForm();
  loadCompanies({ page: 1 });
}

function renderCompanies() {
  if (!companies.length) {
    const message =
      currentCompanyView === "true"
        ? "No active companies found."
        : currentCompanyView === "false"
        ? "No inactive companies found."
        : "No companies found.";
    elements.list.innerHTML = `
      <div class="companies-empty">
        <div class="companies-empty-icon">⌕</div>
        <h3>${escapeHtml(message)}</h3>
        <p>Try changing your search or industry filter.</p>
        ${
          currentCompanyView !== "false"
            ? '<button class="button button--primary" data-action="create" type="button">+ Add company</button>'
            : ""
        }
      </div>`;
    return;
  }

  elements.list.innerHTML = companies
    .map((company) => {
      const id = escapeHtml(companyId(company));
      const active = isCompanyActive(company);
      const name = escapeHtml(company.name || "Unnamed company");
      const industry = escapeHtml(company.industry || "Industry not provided");
      const location = escapeHtml(company.location || "Location not provided");
      const description = escapeHtml(
        company.description || "No company description has been added yet."
      );
      const email = escapeHtml(company.contactEmail || "");
      const website = escapeHtml(company.website || "");
      const statusClass = active ? "" : " company-status--inactive";
      const cardClass = active ? "" : " company-card--inactive";
      const assignedCount = placementOfficers.filter(
        (officer) => String(officer.company?.id ?? "") === companyId(company)
      ).length;
      const actions = `
      <button class="button button--secondary" data-action="manage-officers" data-id="${id}" type="button">Manage officers (${assignedCount})</button>
      ${
        active
          ? `
        <button class="button button--secondary" data-action="edit" data-id="${id}" type="button">Edit details</button>
        <button class="button button--danger-outline" data-action="deactivate" data-id="${id}" type="button">Deactivate</button>`
          : `
        <button class="button button--success-outline" data-action="reactivate" data-id="${id}" type="button">Reactivate</button>
        <button class="button button--danger-outline" data-action="permanent-delete" data-id="${id}" type="button">Permanently delete</button>`
      }`;
      return `
      <article class="company-card${cardClass}">
        <div class="company-card-top">
          <div class="company-logo" aria-hidden="true">${escapeHtml(
            String(company.name || "C")
              .trim()
              .charAt(0)
              .toUpperCase()
          )}</div>
          <span class="company-status${statusClass}"><span></span>${
        active ? "Active" : "Inactive"
      }</span>
        </div>
        <h3>${name}</h3>
        <p class="company-industry">${industry}</p>
        <p class="company-description">${description}</p>
        <div class="company-meta">
          <span>⌖ ${location}</span>
          ${email ? `<a href="mailto:${email}">${email}</a>` : ""}
          ${
            website
              ? `<a href="${website}" target="_blank" rel="noopener noreferrer">Visit website ↗</a>`
              : ""
          }
        </div>
        <div class="company-card-actions">${actions}</div>
      </article>`;
    })
    .join("");
}

function renderPagination(pagination = {}) {
  currentPage = Number(pagination.page) || currentPage;
  totalPages = Math.max(1, Number(pagination.totalPages) || 1);
  const total = Number(pagination.total) || 0;
  const kind =
    currentCompanyView === "true"
      ? "active"
      : currentCompanyView === "false"
      ? "inactive"
      : "total";
  elements.count.textContent = `${total.toLocaleString("en-IN")} ${kind} ${
    total === 1 ? "company" : "companies"
  }`;
  elements.pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;
  elements.previous.disabled = loading || currentPage <= 1;
  elements.next.disabled = loading || currentPage >= totalPages;
}

async function loadCompanies({ page = currentPage } = {}) {
  if (loading) return;
  loading = true;
  elements.refresh.disabled = true;
  elements.list.setAttribute("aria-busy", "true");
  elements.list.innerHTML =
    '<div class="companies-loading">Loading companies...</div>';
  try {
    const filters = { page, limit: PAGE_SIZE, isActive: currentCompanyView };
    const search = elements.search.value.trim();
    const industry = elements.industry.value.trim();
    if (search) filters.search = search;
    if (industry) filters.industry = industry;
    const response = await companyApi.listCompanies(filters);
    const body = unwrap(response);
    companies = Array.isArray(body?.companies) ? body.companies : [];
    renderCompanies();
    renderPagination(body?.pagination ?? {});
  } catch (error) {
    console.error("Unable to load companies.", error);
    elements.list.innerHTML = `
      <div class="companies-empty"><h3>Couldn't load companies</h3>
      <p>Check your connection and try refreshing the list.</p>
      <button class="button button--secondary" data-action="retry" type="button">Try again</button></div>`;
    showNotification(
      error?.message || "Unable to load company records.",
      "error"
    );
  } finally {
    loading = false;
    elements.refresh.disabled = false;
    elements.list.removeAttribute("aria-busy");
    elements.previous.disabled = currentPage <= 1;
    elements.next.disabled = currentPage >= totalPages;
  }
}

async function saveCompany(event) {
  event.preventDefault();
  if (!elements.form.reportValidity()) return;
  const payload = getFormPayload();
  if (!payload.name) {
    showNotification("Company name is required.", "error");
    $("#company-name").focus();
    return;
  }
  const wasEditing = Boolean(editingCompanyId);
  elements.saveButton.disabled = true;
  elements.saveButton.textContent = "Saving...";
  try {
    if (wasEditing) {
      await companyApi.updateCompany(editingCompanyId, payload);
      showNotification("Company updated successfully.", "success");
    } else {
      await companyApi.createCompany(payload);
      showNotification("Company created successfully.", "success");
      currentCompanyView = "true";
      currentPage = 1;
      elements.viewTabs.forEach((tab) => {
        const selected = tab.dataset.companyView === "true";
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-pressed", String(selected));
      });
    }
    closeForm();
    await loadCompanies({ page: currentPage });
  } catch (error) {
    console.error("Unable to save company.", error);
    showNotification(
      error?.message || "Unable to save company details.",
      "error"
    );
  } finally {
    elements.saveButton.disabled = false;
    elements.saveButton.textContent = editingCompanyId
      ? "Save changes"
      : "Create company";
  }
}

function adjustPageAfterRemoval() {
  if (companies.length === 1 && currentPage > 1) currentPage -= 1;
}

async function deactivateCompany(id) {
  const company = companies.find((item) => companyId(item) === id);
  if (!company) return;
  if (
    !window.confirm(
      `Deactivate "${company.name}"? Existing jobs and applications will be preserved.`
    )
  )
    return;
  try {
    await companyApi.deactivateCompany(id);
    showNotification("Company deactivated successfully.", "success");
    adjustPageAfterRemoval();
    await loadCompanies({ page: currentPage });
  } catch (error) {
    console.error("Unable to deactivate company.", error);
    showNotification(
      error?.message || "Unable to deactivate company.",
      "error"
    );
  }
}

async function reactivateCompany(id) {
  const company = companies.find((item) => companyId(item) === id);
  if (!company) return;
  if (
    !window.confirm(
      `Reactivate "${company.name}"? Its previously deactivated jobs will remain unchanged.`
    )
  )
    return;
  try {
    await companyApi.reactivateCompany(id);
    showNotification("Company reactivated successfully.", "success");
    adjustPageAfterRemoval();
    await loadCompanies({ page: currentPage });
  } catch (error) {
    console.error("Unable to reactivate company.", error);
    showNotification(
      error?.message || "Unable to reactivate company.",
      "error"
    );
  }
}

async function permanentlyDeleteCompany(id) {
  const company = companies.find((item) => companyId(item) === id);
  if (!company) return;
  const warning = `PERMANENTLY DELETE "${company.name}"?\\n\\nThis cannot be undone. The company, its jobs, applications, and notifications related to those jobs/applications will be deleted. Placement officer accounts will remain, but their company assignment will be cleared.`;
  if (!window.confirm(warning)) return;
  if (
    !window.confirm(
      `Final confirmation: permanently delete "${company.name}" and its associated records?`
    )
  )
    return;
  try {
    const response = await companyApi.permanentlyDeleteCompany(id);
    const result = unwrap(response);
    showNotification(
      "Company and associated records permanently deleted.",
      "success"
    );
    if (result && typeof result === "object") {
      showNotification(
        `Deleted — Jobs: ${Number(result.deletedJobs) || 0}, Applications: ${
          Number(result.deletedApplications) || 0
        }, Notifications: ${Number(result.deletedNotifications) || 0}.`,
        "info"
      );
    }
    adjustPageAfterRemoval();
    await loadCompanies({ page: currentPage });
  } catch (error) {
    console.error("Unable to permanently delete company.", error);
    showNotification(
      error?.message || "Unable to permanently delete company.",
      "error"
    );
  }
}

function getOfficerId(officer) {
  return String(officer?.id ?? officer?._id ?? "");
}

function getOfficerCompanyId(officer) {
  return String(
    officer?.company?.id ?? officer?.company?._id ?? officer?.company ?? ""
  );
}

function getCompanyNameById(id) {
  const match = [...companies, ...activeCompanyOptions].find(
    (company) => companyId(company) === String(id)
  );
  return match?.name || "Another company";
}

function renderOfficerManagement() {
  if (!activeOfficerCompany) return;

  const currentCompanyId = companyId(activeOfficerCompany);
  const assigned = placementOfficers.filter(
    (officer) => getOfficerCompanyId(officer) === currentCompanyId
  );
  const eligible = placementOfficers.filter(
    (officer) => officer.isActive !== false && !getOfficerCompanyId(officer)
  );
  const transferable = assigned.filter((officer) => officer.isActive !== false);
  const destinations = activeCompanyOptions.filter(
    (company) =>
      companyId(company) !== currentCompanyId && isCompanyActive(company)
  );

  elements.officerModalTitle.textContent = `Manage officers — ${activeOfficerCompany.name}`;
  elements.officerModalSubtitle.textContent = `${assigned.length} officer${
    assigned.length === 1 ? "" : "s"
  } currently assigned`;

  if (!assigned.length) {
    elements.officerList.innerHTML =
      '<div class="officer-empty">No placement officers are assigned to this company yet.</div>';
  } else {
    elements.officerList.innerHTML = assigned
      .map((officer) => {
        const id = escapeHtml(getOfficerId(officer));
        const status =
          officer.isActive === false
            ? '<span class="officer-account-status is-inactive">Inactive account</span>'
            : '<span class="officer-account-status">Active account</span>';
        return `
        <article class="assigned-officer">
          <div class="assigned-officer-avatar" aria-hidden="true">${escapeHtml(
            String(officer.fullName || "O")
              .trim()
              .charAt(0)
              .toUpperCase()
          )}</div>
          <div class="assigned-officer-info">
            <strong>${escapeHtml(
              officer.fullName || "Unnamed officer"
            )}</strong>
            <span>${escapeHtml(officer.email || "Email not available")}</span>
            ${status}
          </div>
          <button class="button button--danger-outline officer-unassign-button" data-officer-action="unassign" data-officer-id="${id}" type="button">Unassign</button>
        </article>`;
      })
      .join("");
  }

  elements.assignSelect.innerHTML = eligible.length
    ? '<option value="">Select an unassigned officer</option>' +
      eligible
        .map(
          (officer) =>
            `<option value="${escapeHtml(getOfficerId(officer))}">${escapeHtml(
              officer.fullName
            )} — ${escapeHtml(officer.email)}</option>`
        )
        .join("")
    : '<option value="">No eligible unassigned officers</option>';
  elements.assignSelect.disabled =
    !isCompanyActive(activeOfficerCompany) || !eligible.length;
  elements.assignButton.disabled =
    !isCompanyActive(activeOfficerCompany) || !eligible.length;

  elements.transferOfficerSelect.innerHTML = transferable.length
    ? '<option value="">Select an assigned officer</option>' +
      transferable
        .map(
          (officer) =>
            `<option value="${escapeHtml(getOfficerId(officer))}">${escapeHtml(
              officer.fullName
            )} — ${escapeHtml(officer.email)}</option>`
        )
        .join("")
    : '<option value="">No active assigned officers</option>';
  elements.transferCompanySelect.innerHTML = destinations.length
    ? '<option value="">Select destination company</option>' +
      destinations
        .map(
          (company) =>
            `<option value="${escapeHtml(companyId(company))}">${escapeHtml(
              company.name
            )}</option>`
        )
        .join("")
    : '<option value="">No other active companies available</option>';
  elements.transferOfficerSelect.disabled = !transferable.length;
  elements.transferCompanySelect.disabled =
    !transferable.length || !destinations.length;
  elements.transferButton.disabled =
    !transferable.length || !destinations.length;

  const inactiveNotice = $("#officer-company-inactive-notice");
  inactiveNotice.hidden = isCompanyActive(activeOfficerCompany);
}

async function loadOfficerManagementData() {
  const [officersResponse, companiesResponse] = await Promise.all([
    companyApi.listPlacementOfficers(),
    companyApi.listCompanies({ page: 1, limit: 100, isActive: "true" }),
  ]);
  const officerBody = unwrap(officersResponse);
  const companyBody = unwrap(companiesResponse);
  placementOfficers = Array.isArray(officerBody?.officers)
    ? officerBody.officers
    : [];
  activeCompanyOptions = Array.isArray(companyBody?.companies)
    ? companyBody.companies
    : [];
  renderOfficerManagement();
}

async function openOfficerManagement(id) {
  const company = companies.find((item) => companyId(item) === id);
  if (!company) return;
  activeOfficerCompany = company;
  elements.officerModal.hidden = false;
  document.body.classList.add("officer-modal-open");
  elements.officerList.innerHTML =
    '<div class="officer-loading">Loading placement officers...</div>';
  elements.officerModalTitle.textContent = `Manage officers — ${company.name}`;
  try {
    await loadOfficerManagementData();
  } catch (error) {
    console.error("Unable to load placement officers.", error);
    elements.officerList.innerHTML =
      '<div class="officer-error">Unable to load placement officers. Please try again.</div>';
    showNotification(
      error?.message || "Unable to load placement officers.",
      "error"
    );
  }
}

function closeOfficerManagement() {
  elements.officerModal.hidden = true;
  document.body.classList.remove("officer-modal-open");
  activeOfficerCompany = null;
  elements.assignSelect.innerHTML =
    '<option value="">Select an unassigned officer</option>';
  elements.transferOfficerSelect.innerHTML =
    '<option value="">Select an assigned officer</option>';
  elements.transferCompanySelect.innerHTML =
    '<option value="">Select destination company</option>';
}

async function performOfficerAction(
  officerId,
  action,
  destinationCompanyId = null
) {
  if (!activeOfficerCompany || officerActionLoading) return;
  const targetCompanyId =
    destinationCompanyId || companyId(activeOfficerCompany);
  officerActionLoading = true;
  elements.assignButton.disabled = true;
  elements.transferButton.disabled = true;
  try {
    await companyApi.assignOfficer(targetCompanyId, officerId, action);
    const successMessage =
      action === "assign"
        ? "Placement officer assigned successfully."
        : action === "transfer"
        ? "Placement officer transferred successfully."
        : "Placement officer unassigned successfully.";
    showNotification(successMessage, "success");
    await loadOfficerManagementData();
    // Keep the officer count on the company cards in sync.
    renderCompanies();
  } catch (error) {
    console.error(`Unable to ${action} placement officer.`, error);
    showNotification(
      error?.message || `Unable to ${action} placement officer.`,
      "error"
    );
  } finally {
    officerActionLoading = false;
    renderOfficerManagement();
  }
}

async function assignSelectedOfficer() {
  const officerId = elements.assignSelect.value;
  if (!officerId) {
    showNotification("Please select a placement officer.", "warning");
    return;
  }
  await performOfficerAction(officerId, "assign");
}

async function transferSelectedOfficer() {
  const officerId = elements.transferOfficerSelect.value;
  const destinationId = elements.transferCompanySelect.value;
  if (!officerId || !destinationId) {
    showNotification("Select an officer and destination company.", "warning");
    return;
  }
  const officer = placementOfficers.find(
    (item) => getOfficerId(item) === officerId
  );
  const destination = activeCompanyOptions.find(
    (item) => companyId(item) === destinationId
  );
  if (
    !window.confirm(
      `Transfer ${officer?.fullName || "this officer"} to ${
        destination?.name || "the selected company"
      }?`
    )
  )
    return;
  await performOfficerAction(officerId, "transfer", destinationId);
}

async function initializePage() {
  const authorized = await requireRole(["admin"]);
  if (!authorized) return;
  try {
    const response = await authService.getCurrentUser();
    let user =
      response?.data?.user ?? response?.data ?? response?.user ?? response;
    if (user?.data?.user) user = user.data.user;
    else if (user?.data && !user.role) user = user.data;
    if (!user || user.role !== "admin") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }
    renderNavbar({ user, mount: document.getElementById("site-header") });
    try {
      await loadOfficerManagementData();
    } catch (officerError) {
      console.warn(
        "Placement officer counts could not be loaded.",
        officerError
      );
      placementOfficers = [];
    }
    await loadCompanies({ page: 1 });
  } catch (error) {
    console.error("Company management initialization failed.", error);
    showNotification(
      error?.message || "Unable to initialize company management.",
      "error"
    );
  }
}

elements.addButton.addEventListener("click", openCreateForm);
$("#close-company-form").addEventListener("click", closeForm);
$("#cancel-company-form").addEventListener("click", closeForm);
elements.form.addEventListener("submit", saveCompany);
elements.viewTabs.forEach((tab) =>
  tab.addEventListener("click", () => setCompanyView(tab.dataset.companyView))
);
elements.refresh.addEventListener("click", () =>
  loadCompanies({ page: currentPage })
);
elements.previous.addEventListener("click", () => {
  if (currentPage > 1) loadCompanies({ page: currentPage - 1 });
});
elements.next.addEventListener("click", () => {
  if (currentPage < totalPages) loadCompanies({ page: currentPage + 1 });
});
elements.reset.addEventListener("click", () => {
  elements.search.value = "";
  elements.industry.value = "";
  currentPage = 1;
  loadCompanies({ page: 1 });
});

for (const input of [elements.search, elements.industry]) {
  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentPage = 1;
      loadCompanies({ page: 1 });
    }, 300);
  });
}

elements.list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "create") openCreateForm();
  if (action === "retry") loadCompanies({ page: currentPage });
  if (action === "edit") {
    const company = companies.find((item) => companyId(item) === id);
    if (company) openEditForm(company);
  }
  if (action === "deactivate") deactivateCompany(id);
  if (action === "reactivate") reactivateCompany(id);
  if (action === "permanent-delete") permanentlyDeleteCompany(id);
  if (action === "manage-officers") openOfficerManagement(id);
});

$("#close-officer-modal").addEventListener("click", closeOfficerManagement);
$("#officer-modal-backdrop").addEventListener("click", closeOfficerManagement);
$("#refresh-officers").addEventListener("click", async () => {
  try {
    await loadOfficerManagementData();
    showNotification("Placement officer list refreshed.", "success");
  } catch (error) {
    showNotification(
      error?.message || "Unable to refresh placement officers.",
      "error"
    );
  }
});
elements.assignButton.addEventListener("click", assignSelectedOfficer);
elements.transferButton.addEventListener("click", transferSelectedOfficer);
elements.officerList.addEventListener("click", (event) => {
  const button = event.target.closest('[data-officer-action="unassign"]');
  if (!button || !activeOfficerCompany) return;
  const officerId = button.dataset.officerId;
  const officer = placementOfficers.find(
    (item) => getOfficerId(item) === officerId
  );
  if (
    !window.confirm(
      `Unassign ${officer?.fullName || "this officer"} from ${
        activeOfficerCompany.name
      }?`
    )
  )
    return;
  performOfficerAction(officerId, "unassign");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.officerModal.hidden)
    closeOfficerManagement();
});

$("#current-year").textContent = new Date().getFullYear();
initializeTheme();
initializePage();
