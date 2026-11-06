
import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { jobApi } from "../api/job.api.js";
import { companyApi } from "../api/company.api.js";
import { showNotification } from "../utils/notification.js";

/* =========================================================
   1. DOM ELEMENTS
========================================================= */

const elements = {
  jobsList: document.querySelector("#admin-jobs-list"),
  jobForm: document.querySelector("#admin-job-form"),
  formPanel: document.querySelector("#job-form-panel"),
  formTitle: document.querySelector("#job-form-title"),
  formDescription: document.querySelector("#job-form-description"),
  jobViewTabs: document.querySelectorAll("[data-job-view]"),

  createButton: document.querySelector("#create-job-button"),
  saveButton: document.querySelector("#save-job-button"),
  refreshButton: document.querySelector("#refresh-jobs-button"),
  resetButton: document.querySelector("#reset-job-button"),
  cancelButton: document.querySelector("#cancel-job-button"),
  cancelFormButton: document.querySelector("#cancel-job-form-button"),

  companySelect: document.querySelector("#job-company"),
  companyFilter: document.querySelector("#job-company-filter"),
  statusFilter: document.querySelector("#job-status-filter"),
  typeFilter: document.querySelector("#job-type-filter"),
  searchInput: document.querySelector("#job-search"),
  clearFiltersButton: document.querySelector("#reset-job-filters"),

  feedback: document.querySelector("#admin-jobs-feedback"),
  jobsCount: document.querySelector("#jobs-count"),

  totalJobs: document.querySelector("#total-jobs-count"),
  openJobs: document.querySelector("#open-jobs-count"),
  closedJobs: document.querySelector("#closed-jobs-count"),

  pagination: document.querySelector("#jobs-pagination"),
  previousPage: document.querySelector("#previous-jobs-page"),
  nextPage: document.querySelector("#next-jobs-page"),
  pageLabel: document.querySelector("#jobs-page-label"),

  currentYear: document.querySelector("#current-year"),
  siteHeader: document.querySelector("#site-header"),
};

const PAGE_SIZE = 9;

const JOB_STATUSES = [
    "draft",
    "open",
    "closed",
    "cancelled",
];

let currentUser = null;
let currentEditingJobId = null;
let currentEditingJob = null;

let companies = [];
let currentJobs = [];
let currentPage = 1;
let totalPages = 1;
let currentJobView = "true";

let isLoading = false;
let isSaving = false;
let searchTimer = null;
let requestNumber = 0;

/* =========================================================
   2. GENERAL HELPERS
========================================================= */

function setFeedback(message, type = "info") {
  if (elements.feedback) {
    elements.feedback.textContent = message;
    elements.feedback.hidden = false;
  }

  showNotification(message, type);
}

function clearFeedback() {
  if (!elements.feedback) return;

  elements.feedback.textContent = "";
  elements.feedback.hidden = true;
}

function getUserFromResponse(response) {
  return (
    response?.data?.user ??
    response?.data ??
    response?.user ??
    response
  );
}

function getBody(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getJobsFromResponse(response) {
  const body = getBody(response);

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.jobs)) return body.jobs;
  if (Array.isArray(body?.data?.jobs)) return body.data.jobs;

  return [];
}

function getCompaniesFromResponse(response) {
  const body = getBody(response);

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.companies)) return body.companies;
  if (Array.isArray(body?.data?.companies)) {
    return body.data.companies;
  }

  return [];
}

function getPagination(response, itemCount = 0) {
  const body = getBody(response);
  const pagination = body?.pagination ?? body?.data?.pagination;

  if (pagination) {
    return {
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || PAGE_SIZE,
      total: Number(pagination.total) || 0,
      totalPages: Number(pagination.totalPages) || 1,
      hasNextPage: Boolean(pagination.hasNextPage),
      hasPreviousPage: Boolean(pagination.hasPreviousPage),
    };
  }

  return {
    page: currentPage,
    limit: PAGE_SIZE,
    total: itemCount,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

function getId(value) {
  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    return value._id ?? value.id ?? "";
  }

  return "";
}

function getJobId(job) {
  return getId(job?._id ?? job?.id);
}

function getCompanyId(company) {
  return getId(company);
}

function getCompanyName(company) {
  if (typeof company === "string") {
    const matchedCompany = companies.find(
      (item) => getCompanyId(item) === company
    );

    return matchedCompany?.name || "Company unavailable";
  }

  return company?.name || "Company unavailable";
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLabel(value) {
  if (!value) return "Not specified";

  return String(value)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function appendText(parent, tag, className, value) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  element.textContent = value ?? "";
  parent.append(element);

  return element;
}

function createButton(text, className, handler) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = className;
  button.textContent = text;

  button.addEventListener("click", handler);

  return button;
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

/* =========================================================
   3. JOB STATUS FIELD
========================================================= */

// The initial HTML form does not contain a status field.
// Add one dynamically so all backend job statuses can be managed.

function initializeStatusField() {
  if (!elements.jobForm) return;

  let statusSelect = elements.jobForm.elements.namedItem("status");

  if (statusSelect) return;

  const field = document.createElement("div");
  field.className = "admin-jobs-field";

  const label = document.createElement("label");
  label.htmlFor = "job-status";
  label.textContent = "Job status";

  statusSelect = document.createElement("select");
  statusSelect.id = "job-status";
  statusSelect.name = "status";

  const options = [
    ["draft", "Draft"],
    ["open", "Open"],
    ["closed", "Closed"],
    ["cancelled", "Cancelled"],
  ];

  for (const [value, labelText] of options) {
    const option = document.createElement("option");

    option.value = value;
    option.textContent = labelText;

    statusSelect.append(option);
  }

  const help = document.createElement("small");
  help.textContent =
    "Open jobs require a future application deadline.";

  field.append(label, statusSelect, help);

  const responsibilitiesField =
    elements.jobForm.querySelector("#job-responsibilities")
      ?.closest(".admin-jobs-field");

  if (responsibilitiesField) {
    responsibilitiesField.before(field);
  } else {
    elements.jobForm.querySelector(".admin-jobs-form-grid")
      ?.append(field);
  }
}

function initializeStatusFilter() {
  if (!elements.statusFilter) return;

  const statusLabels = {
    draft: "Draft",
    open: "Open",
    closed: "Closed",
    cancelled: "Cancelled",
  };

  const existingValues = new Set(
    Array.from(elements.statusFilter.options, (option) => option.value)
  );

  for (const status of JOB_STATUSES) {
    if (existingValues.has(status)) continue;

    const option = document.createElement("option");
    option.value = status;
    option.textContent = statusLabels[status] || formatLabel(status);
    elements.statusFilter.append(option);
  }
}

/* =========================================================
   4. COMPANY MANAGEMENT
========================================================= */

function populateCompanyDropdowns() {
  const selects = [
    elements.companySelect,
    elements.companyFilter,
  ];

  for (const select of selects) {
    if (!select) continue;

    const previousValue = select.value;

    const isFilter = select === elements.companyFilter;

    select.replaceChildren();

    const defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = isFilter
      ? "All companies"
      : "Select a company";

    select.append(defaultOption);

    for (const company of companies) {
      const option = document.createElement("option");

      option.value = getCompanyId(company);
      option.textContent = company.name || "Unnamed company";

      select.append(option);
    }

    if (
      previousValue &&
      Array.from(select.options).some(
        (option) => option.value === previousValue
      )
    ) {
      select.value = previousValue;
    }
  }
}

async function loadCompanies() {
  try {
    const response = await companyApi.listCompanies({
      page: 1,
      limit: 100,
    });

    companies = getCompaniesFromResponse(response);

    populateCompanyDropdowns();
  } catch (error) {
    console.error("Unable to load companies.", error);

    companies = [];
    populateCompanyDropdowns();

    setFeedback(
      "Unable to load companies. Job creation may be unavailable until companies can be loaded.",
      "error"
    );
  }
}

/* =========================================================
   5. JOB FILTERS AND PAGINATION
========================================================= */

function setJobView(view) {
  if (!["true", "false", "all"].includes(view)) return;
  if (currentJobView === view) return;

  currentJobView = view;
  currentPage = 1;

  elements.jobViewTabs.forEach((tab) => {
    const isSelected = tab.dataset.jobView === view;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-pressed", String(isSelected));
  });

  closeForm();
  clearFeedback();
  loadJobs();
}

function getCurrentFilters() {
    return {
      page: currentPage,
      limit: PAGE_SIZE,
      isActive: currentJobView,
  
      search: elements.searchInput?.value.trim() || "",
      status: elements.statusFilter?.value || "",
      company: elements.companyFilter?.value || "",
      employmentType: elements.typeFilter?.value || "",
    };
  }

function updatePagination(pagination) {
  currentPage = pagination.page;
  totalPages = Math.max(pagination.totalPages, 1);

  if (elements.pageLabel) {
    elements.pageLabel.textContent =
      `Page ${currentPage} of ${totalPages}`;
  }

  if (elements.previousPage) {
    elements.previousPage.disabled =
      !pagination.hasPreviousPage || isLoading;
  }

  if (elements.nextPage) {
    elements.nextPage.disabled =
      !pagination.hasNextPage || isLoading;
  }

  if (elements.jobsCount) {
    elements.jobsCount.textContent =
      `${pagination.total} job${pagination.total === 1 ? "" : "s"} found`;
  }
}

function setLoadingState() {
  if (!elements.jobsList) return;

  elements.jobsList.setAttribute("aria-busy", "true");
  elements.jobsList.replaceChildren();

  appendText(
    elements.jobsList,
    "p",
    "admin-jobs-loading",
    "Loading job listings..."
  );
}

function setEmptyState(message) {
  if (!elements.jobsList) return;

  elements.jobsList.replaceChildren();

  const container = document.createElement("div");
  container.className = "admin-jobs-empty";

  appendText(container, "h3", "", "No jobs found");
  appendText(container, "p", "", message);

  const button = createButton(
    "Create a job",
    "button button--primary",
    openCreateForm
  );

  container.append(button);
  elements.jobsList.append(container);
}

function setErrorState(message) {
  if (!elements.jobsList) return;

  elements.jobsList.replaceChildren();

  const container = document.createElement("div");
  container.className = "admin-jobs-empty";

  appendText(container, "h3", "", "Unable to load jobs");
  appendText(container, "p", "", message);

  const button = createButton(
    "Try again",
    "button button--primary",
    loadJobs
  );

  container.append(button);
  elements.jobsList.append(container);
}
/* =========================================================
   6. JOB RENDERING
========================================================= */

function renderJobCard(job) {
    const card = document.createElement("article");
    card.className = "admin-job-card";
  
    const header = document.createElement("div");
    header.className = "admin-job-card-header";
  
    const titleContainer = document.createElement("div");
    titleContainer.className = "admin-job-card-title";
  
    appendText(
      titleContainer,
      "h3",
      "",
      job.title || "Untitled job"
    );
  
    appendText(
      titleContainer,
      "span",
      "admin-job-company",
      getCompanyName(job.company)
    );
  
    const status = String(job.status || "unknown").toLowerCase();
    const isActive = job.isActive === true;
  
    // Job activation status
    appendText(
      header,
      "span",
      `admin-job-status ${
        isActive
          ? "admin-job-status--active"
          : "admin-job-status--inactive"
      }`,
      isActive ? "Active" : "Inactive"
    );
  
    // Job application status
    appendText(
      header,
      "span",
      `admin-job-status ${
        status === "open"
          ? "admin-job-status--open"
          : status === "closed"
            ? "admin-job-status--closed"
            : ""
      }`,
      formatLabel(status)
    );

  header.prepend(titleContainer);

  card.append(header);

  if (job.description) {
    appendText(
      card,
      "p",
      "admin-job-card-description",
      job.description
    );
  }

  const meta = document.createElement("div");
  meta.className = "admin-job-card-meta";

  appendText(
    meta,
    "span",
    "admin-job-meta-item",
    `Type: ${formatLabel(job.employmentType)}`
  );

  appendText(
    meta,
    "span",
    "admin-job-meta-item",
    `Work mode: ${formatLabel(job.workMode)}`
  );

  appendText(
    meta,
    "span",
    "admin-job-meta-item",
    `Openings: ${job.openings ?? "—"}`
  );

  appendText(
    meta,
    "span",
    "admin-job-meta-item",
    `Deadline: ${formatDate(job.applicationDeadline)}`
  );

  if (job.location) {
    appendText(
      meta,
      "span",
      "admin-job-meta-item",
      `Location: ${job.location}`
    );
  }

  card.append(meta);

  const actions = document.createElement("div");
  actions.className = "admin-job-card-actions";
  
  const editButton = createButton(
    "Edit",
    "button button--secondary",
    () => startEditingJob(job)
  );
  
  actions.append(editButton);
  
  if (isActive) {
    const deactivateButton = createButton(
      "Deactivate",
      "button button--secondary",
      () => handleDeactivateJob(job)
    );
  
    actions.append(deactivateButton);
  } else {
    const reactivateButton = createButton(
      "Reactivate",
      "button button--primary",
      () => handleReactivateJob(job)
    );
  
    const deleteButton = createButton(
      "Permanently Delete",
      "button button--danger",
      () => handlePermanentlyDeleteJob(job)
    );
  
    actions.append(reactivateButton, deleteButton);
  }
  
  card.append(actions);

  return card;
}

function renderJobs(jobs) {
  if (!elements.jobsList) return;

  elements.jobsList.replaceChildren();

  if (!jobs.length) {
    const messages = {
      true: "There are no active jobs matching your current search or filters.",
      false: "There are no inactive jobs matching your current search or filters.",
      all: "There are no jobs matching your current search or filters.",
    };
  
    setEmptyState(messages[currentJobView]);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const job of jobs) {
    fragment.append(renderJobCard(job));
  }

  elements.jobsList.append(fragment);
}

/* =========================================================
   7. JOB STATISTICS
========================================================= */

function getTotalFromResponse(response, fallback = 0) {
  const body = getBody(response);
  const pagination = body?.pagination ?? body?.data?.pagination;

  if (Number.isFinite(Number(pagination?.total))) {
    return Number(pagination.total);
  }

  return fallback;
}

async function loadJobStatistics() {
  try {
    const [allResponse, openResponse, closedResponse] =
      await Promise.all([
        jobApi.listJobs({ page: 1, limit: 1, isActive: "all" }),
        jobApi.listJobs({
          page: 1,
          limit: 1,
          isActive: "all",
          status: "open",
        }),
        jobApi.listJobs({
          page: 1,
          limit: 1,
          isActive: "all",
          status: "closed",
        }),
      ]);

    const total = getTotalFromResponse(allResponse);
    const open = getTotalFromResponse(openResponse);
    const closed = getTotalFromResponse(closedResponse);

    if (elements.totalJobs) {
      elements.totalJobs.textContent = String(total);
    }

    if (elements.openJobs) {
      elements.openJobs.textContent = String(open);
    }

    if (elements.closedJobs) {
      elements.closedJobs.textContent = String(closed);
    }
  } catch (error) {
    console.error("Unable to load job statistics.", error);

    for (const element of [
      elements.totalJobs,
      elements.openJobs,
      elements.closedJobs,
    ]) {
      if (element) element.textContent = "—";
    }
  }
}

/* =========================================================
   8. LOAD JOBS
========================================================= */

async function loadJobs() {
  if (isLoading) {
    requestNumber += 1;
  }

  const currentRequest = ++requestNumber;

  isLoading = true;
  setLoadingState();

  if (elements.previousPage) {
    elements.previousPage.disabled = true;
  }

  if (elements.nextPage) {
    elements.nextPage.disabled = true;
  }

  if (elements.jobsList) {
    elements.jobsList.setAttribute("aria-busy", "true");
  }

  try {
    const response = await jobApi.listJobs(getCurrentFilters());

    // Ignore an older response if a newer request has started.
    if (currentRequest !== requestNumber) return;

    currentJobs = getJobsFromResponse(response);

    const pagination = getPagination(
      response,
      currentJobs.length
    );

    updatePagination(pagination);
    renderJobs(currentJobs);
  } catch (error) {
    if (currentRequest !== requestNumber) return;

    console.error("Unable to load admin jobs.", error);

    setErrorState(
      "Please check your connection and try again."
    );

    setFeedback(
      getErrorMessage(error, "Unable to load job listings."),
      "error"
    );
  } finally {
    if (currentRequest === requestNumber) {
      isLoading = false;

      if (elements.jobsList) {
        elements.jobsList.setAttribute("aria-busy", "false");
      }

      if (elements.previousPage) {
        elements.previousPage.disabled = currentPage <= 1;
      }
      
      if (elements.nextPage) {
        elements.nextPage.disabled = currentPage >= totalPages;
      }
    }
  }
}

/* =========================================================
   9. FORM MANAGEMENT
========================================================= */

function openCreateForm() {
  resetEditor();

  if (elements.formPanel) {
    elements.formPanel.hidden = false;
  }

  if (elements.formTitle) {
    elements.formTitle.textContent = "Create a new job";
  }

  if (elements.formDescription) {
    elements.formDescription.textContent =
      "Enter the job information and assign it to a company.";
  }

  if (elements.saveButton) {
    elements.saveButton.textContent = "Create job";
  }

  elements.formPanel?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  elements.companySelect?.focus({ preventScroll: true });
}

function closeForm() {
  resetEditor();

  if (elements.formPanel) {
    elements.formPanel.hidden = true;
  }

  clearFeedback();
}

function resetEditor() {
  currentEditingJobId = null;
  currentEditingJob = null;

  elements.jobForm?.reset();

  if (elements.companySelect) {
    elements.companySelect.value = "";
  }

  if (elements.saveButton) {
    elements.saveButton.textContent = "Create job";
    elements.saveButton.disabled = false;
  }

  if (elements.formTitle) {
    elements.formTitle.textContent = "Create a new job";
  }

  if (elements.formDescription) {
    elements.formDescription.textContent =
      "Enter the job information and assign it to a company.";
  }

  const statusSelect = elements.jobForm?.elements.namedItem("status");

  if (statusSelect) {
    statusSelect.value = "draft";
  }

  const openings = elements.jobForm?.elements.namedItem("openings");

  if (openings) {
    openings.value = "1";
  }
}

function setFormValues(job) {
  const form = elements.jobForm;

  if (!form) return;

  form.elements.title.value = job.title ?? "";
  form.elements.description.value = job.description ?? "";
  form.elements.employmentType.value = job.employmentType ?? "";
  form.elements.workMode.value = job.workMode ?? "";
  form.elements.location.value = job.location ?? "";
  form.elements.openings.value = job.openings ?? 1;

  form.elements.deadline.value =
  toDateInputValue(job.applicationDeadline);

  form.elements.responsibilities.value =
    Array.isArray(job.responsibilities)
      ? job.responsibilities.join("\n")
      : "";

  form.elements.requirements.value =
    Array.isArray(job.requirements)
      ? job.requirements.join("\n")
      : "";

  form.elements.skills.value =
    Array.isArray(job.skills)
      ? job.skills.join(", ")
      : "";

  const companyId = getCompanyId(job.company);

  if (
    companyId &&
    !Array.from(elements.companySelect.options).some(
      (option) => option.value === companyId
    )
  ) {
    const option = document.createElement("option");

    option.value = companyId;
    option.textContent =
      `${getCompanyName(job.company)} (unavailable)`;

    elements.companySelect.append(option);
  }

  elements.companySelect.value = companyId;

  const statusSelect = form.elements.namedItem("status");

  if (statusSelect) {
    statusSelect.value = job.status ?? "draft";
  }
}

function startEditingJob(job) {
  const jobId = getJobId(job);

  if (!jobId) {
    setFeedback(
      "This job does not contain a valid ID and cannot be edited.",
      "error"
    );
    return;
  }

  currentEditingJobId = jobId;
  currentEditingJob = job;

  if (elements.formPanel) {
    elements.formPanel.hidden = false;
  }

  if (elements.formTitle) {
    elements.formTitle.textContent = "Edit job";
  }

  if (elements.formDescription) {
    elements.formDescription.textContent =
      "Update the job details and company assignment.";
  }

  setFormValues(job);

  if (elements.saveButton) {
    elements.saveButton.textContent = "Save changes";
  }

  elements.formPanel?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  elements.jobForm?.elements.title.focus({
    preventScroll: true,
  });
}

/* =========================================================
   10. BUILD JOB PAYLOAD
========================================================= */

function splitLines(value, maximumItems = 30, maximumLength = 500) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maximumItems)
    .map((item) => item.slice(0, maximumLength));
}

function splitSkills(value) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 50)
    .map((skill) => skill.slice(0, 50));
}

function buildJobPayload(formData) {
  const deadlineValue = String(
    formData.get("deadline") || ""
  );

  const deadline = new Date(`${deadlineValue}T23:59:59`);

  if (Number.isNaN(deadline.getTime())) {
    throw new Error("Please enter a valid application deadline.");
  }

  const status = String(formData.get("status") || "draft");

  if (!JOB_STATUSES.includes(status)) {
    throw new Error("Please select a valid job status.");
  }

  if (status === "open" && deadline.getTime() <= Date.now()) {
    throw new Error(
      "An open job must have a future application deadline."
    );
  }

  const company = String(formData.get("company") || "");

  if (!company) {
    throw new Error("Please select a company for this job.");
  }

  const openings = Number(formData.get("openings"));

  if (!Number.isInteger(openings) || openings < 1) {
    throw new Error("The number of openings must be at least 1.");
  }

  return {
    company,

    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),

    employmentType: String(
      formData.get("employmentType") || ""
    ),

    workMode: String(formData.get("workMode") || ""),

    location: String(formData.get("location") || "").trim(),

    openings,

    applicationDeadline: deadline.toISOString(),

    responsibilities: splitLines(
      String(formData.get("responsibilities") || "")
    ),

    requirements: splitLines(
      String(formData.get("requirements") || "")
    ),

    skills: splitSkills(
      String(formData.get("skills") || "")
    ),

    status,
  };
}

/* =========================================================
   11. CREATE / UPDATE JOB
========================================================= */

async function handleJobSubmit(event) {
  event.preventDefault();

  if (isSaving) return;

  if (!elements.jobForm.reportValidity()) return;

  if (!companies.length) {
    setFeedback(
      "No active companies are available. Please create or reactivate a company first.",
      "error"
    );
    return;
  }

  const formData = new FormData(elements.jobForm);

  let payload;

  try {
    payload = buildJobPayload(formData);
  } catch (error) {
    setFeedback(error.message, "error");
    return;
  }

  const editing = Boolean(currentEditingJobId);

  // Do not send a company change if the selected company is unchanged.
  if (
    editing &&
    payload.company === getCompanyId(currentEditingJob?.company)
  ) {
    delete payload.company;
  }

  isSaving = true;

  if (elements.saveButton) {
    elements.saveButton.disabled = true;
    elements.saveButton.textContent = editing
      ? "Saving changes..."
      : "Creating job...";
  }

  try {
    if (editing) {
      await jobApi.updateJob(currentEditingJobId, payload);

      setFeedback(
        "Job updated successfully.",
        "success"
      );
    } else {
      await jobApi.createJob(payload);

      setFeedback(
        "Job created successfully.",
        "success"
      );
    }

    closeForm();

    currentPage = 1;

    await Promise.all([
      loadJobs(),
      loadJobStatistics(),
    ]);
  } catch (error) {
    console.error(
      editing ? "Unable to update job." : "Unable to create job.",
      error
    );

    setFeedback(
      getErrorMessage(
        error,
        editing
          ? "The job could not be updated."
          : "The job could not be created."
      ),
      "error"
    );
  } finally {
    isSaving = false;

    if (elements.saveButton) {
      elements.saveButton.disabled = false;
      elements.saveButton.textContent = currentEditingJobId
        ? "Save changes"
        : "Create job";
    }
  }
}

/* =========================================================
   12. DEACTIVATE JOB
========================================================= */

async function handleDeactivateJob(job) {
  const jobId = getJobId(job);

  if (!jobId) {
    setFeedback("This job does not have a valid ID.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to deactivate "${job.title || "this job"}"?\n\n` +
    "It will no longer appear in the active job listings."
  );

  if (!confirmed) return;

  try {
    await jobApi.deactivateJob(jobId);

    setFeedback(
      "Job deactivated successfully.",
      "success"
    );

    await Promise.all([
      loadJobs(),
      loadJobStatistics(),
    ]);
  } catch (error) {
    console.error("Unable to deactivate job.", error);

    setFeedback(
      getErrorMessage(error, "The job could not be deactivated."),
      "error"
    );
  }
}

async function handleReactivateJob(job) {
    const jobId = getJobId(job);
  
    if (!jobId) {
      setFeedback("This job does not have a valid ID.", "error");
      return;
    }
  
    const confirmed = window.confirm(
      `Are you sure you want to reactivate "${job.title || "this job"}"?\n\n` +
      "The job will become active again. Its existing business status will be preserved."
    );
  
    if (!confirmed) return;
  
    try {
      await jobApi.reactivateJob(jobId);
  
      setFeedback(
        "Job reactivated successfully.",
        "success"
      );
  
      await Promise.all([
        loadJobs(),
        loadJobStatistics(),
      ]);
    } catch (error) {
      console.error("Unable to reactivate job.", error);
  
      setFeedback(
        getErrorMessage(error, "The job could not be reactivated."),
        "error"
      );
    }
  }

  async function handlePermanentlyDeleteJob(job) {
    const jobId = getJobId(job);
  
    if (!jobId) {
      setFeedback("This job does not have a valid ID.", "error");
      return;
    }
  
    if (job.isActive !== false) {
      setFeedback(
        "Only inactive jobs can be permanently deleted.",
        "error"
      );
      return;
    }
  
    const confirmed = window.confirm(
      `WARNING: Permanently delete "${job.title || "this job"}"?\n\n` +
      "This will permanently remove the job, all associated applications, " +
      "and related notifications.\n\n" +
      "This action cannot be undone."
    );
  
    if (!confirmed) return;
  
    try {
      await jobApi.permanentlyDeleteJob(jobId);
  
      setFeedback(
        "Job and its associated records permanently deleted.",
        "success"
      );
  
      await Promise.all([
        loadJobs(),
        loadJobStatistics(),
      ]);
    } catch (error) {
      console.error("Unable to permanently delete job.", error);
  
      setFeedback(
        getErrorMessage(
          error,
          "The job could not be permanently deleted."
        ),
        "error"
      );
    }
  }

/* =========================================================
   13. EVENT LISTENERS
========================================================= */

function initializeEventListeners() {
  elements.jobViewTabs.forEach((tab) => {
    const isSelected = tab.dataset.jobView === currentJobView;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-pressed", String(isSelected));

    tab.addEventListener("click", () => {
      setJobView(tab.dataset.jobView);
    });
  });

  elements.createButton?.addEventListener(
    "click",
    openCreateForm
  );

  elements.refreshButton?.addEventListener("click", async () => {
    window.clearTimeout(searchTimer); // Clear any pending search
  
    currentPage = 1;
  
    await Promise.all([
      loadJobs(),
      loadJobStatistics(),
    ]);
  });

  elements.resetButton?.addEventListener("click", () => {
    resetEditor();

    setFeedback(
      "The form has been reset.",
      "info"
    );
  });

  elements.cancelButton?.addEventListener(
    "click",
    closeForm
  );

  elements.cancelFormButton?.addEventListener(
    "click",
    closeForm
  );

  elements.jobForm?.addEventListener(
    "submit",
    handleJobSubmit
  );

  elements.searchInput?.addEventListener("input", () => {
    window.clearTimeout(searchTimer);

    searchTimer = window.setTimeout(() => {
      currentPage = 1;
      loadJobs();
    }, 350);
  });

  for (const filter of [
    elements.statusFilter,
    elements.companyFilter,
    elements.typeFilter,
  ]) {
    filter?.addEventListener("change", () => {
      currentPage = 1;
      loadJobs();
    });
  }

  elements.clearFiltersButton?.addEventListener("click", () => {
    if (elements.searchInput) elements.searchInput.value = "";
    if (elements.statusFilter) elements.statusFilter.value = "";
    if (elements.companyFilter) elements.companyFilter.value = "";
    if (elements.typeFilter) elements.typeFilter.value = "";

    window.clearTimeout(searchTimer);
    currentPage = 1;
    clearFeedback();
    loadJobs();
  });

  elements.previousPage?.addEventListener("click", () => {
    if (currentPage <= 1 || isLoading) return;

    currentPage -= 1;
    loadJobs();
  });

  elements.nextPage?.addEventListener("click", () => {
    if (currentPage >= totalPages || isLoading) return;

    currentPage += 1;
    loadJobs();
  });
}

/* =========================================================
   14. PAGE INITIALIZATION
========================================================= */

async function initializePage() {
  initializeTheme();

  const authorized = await requireRole(["admin"]);

  if (!authorized) return;

  try {
    const response = await authService.getCurrentUser();

    currentUser = getUserFromResponse(response);

    if (!currentUser || currentUser.role !== "admin") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    renderNavbar({
      user: currentUser,
      mount: elements.siteHeader,
    });

    if (elements.currentYear) {
      elements.currentYear.textContent =
        String(new Date().getFullYear());
    }

    initializeStatusField();
    initializeStatusFilter();
    initializeEventListeners();

    await loadCompanies();

    await Promise.all([
      loadJobs(),
      loadJobStatistics(),
    ]);
  } catch (error) {
    console.error(
      "Unable to initialize admin job management.",
      error
    );

    setFeedback(
      "Unable to initialize job management. Please reload the page or sign in again.",
      "error"
    );
  }
}

initializePage().catch((error) => {
  console.error(
    "Admin job management initialization failed.",
    error
  );

  setFeedback(
    "The page could not be initialized. Please reload it.",
    "error"
  );
});
