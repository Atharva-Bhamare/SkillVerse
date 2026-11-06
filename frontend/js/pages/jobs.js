
import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { jobApi } from "../api/job.api.js";
import { applicationApi } from "../api/application.api.js";
import { showNotification } from "../utils/notification.js";

const elements = {
  search: document.querySelector("#jobSearch"),
  employmentType: document.querySelector("#employmentTypeFilter"),
  workMode: document.querySelector("#workModeFilter"),
  reset: document.querySelector("#resetJobFilters"),
  refresh: document.querySelector("#refreshJobs"),
  list: document.querySelector("#jobsList"),
  feedback: document.querySelector("#jobsFeedback"),
  loading: document.querySelector("#jobsLoading"),
  empty: document.querySelector("#jobsEmptyState"),
  summary: document.querySelector("#jobsResultsSummary"),
  previous: document.querySelector("#previousJobsPage"),
  next: document.querySelector("#nextJobsPage"),
  pageInfo: document.querySelector("#jobsPageInfo"),
  clearEmpty: document.querySelector("#clearEmptyFilters")
};

const PAGE_SIZE = 10;
const appliedJobIds = new Set();

let currentPage = 1;
let totalPages = 1;
let searchTimer = null;
let requestNumber = 0;

function getUserFromResponse(response) {
  return response?.data?.user ?? response?.data ?? response?.user ?? response;
}

function getJobResponse(response) {
  // Supports both a raw API response and an API-client wrapper.
  const body = response?.data?.data ?? response?.data ?? response;

  return {
    jobs: Array.isArray(body?.jobs) ? body.jobs : [],
    pagination: body?.pagination ?? {}
  };
}

function setFeedback(message = "", state = "info") {
  elements.feedback.textContent = message;
  elements.feedback.hidden = !message;
  elements.feedback.classList.toggle(
    "jobs-feedback--error",
    state === "error"
  );
}

function setLoading(isLoading) {
  elements.loading.hidden = !isLoading;
  elements.refresh.disabled = isLoading;
  elements.previous.disabled = isLoading || currentPage <= 1;
  elements.next.disabled = isLoading || currentPage >= totalPages;
}

function formatLabel(value) {
  if (!value) return "";

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatSalary(salary) {
  if (!salary || salary.isDisclosed === false) {
    return "Salary not disclosed";
  }

  const min = salary.min;
  const max = salary.max;
  const currency = salary.currency || "INR";

  if (min == null && max == null) {
    return "Salary not disclosed";
  }

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  });

  if (min != null && max != null) {
    return `${formatter.format(min)} – ${formatter.format(max)}`;
  }

  if (min != null) return `From ${formatter.format(min)}`;

  return `Up to ${formatter.format(max)}`;
}

function createTag(text) {
  const tag = document.createElement("span");
  tag.className = "job-card__tag";
  tag.textContent = text;
  return tag;
}

async function applyForJob(job, button) {
  const jobId = job._id || job.id;

  if (!jobId) {
    showNotification(
      "This job is missing its ID and cannot be applied to.",
      "error"
    );
    return;
  }

  const confirmed = window.confirm(
    `Apply for "${job.title || "this job"}" at ${
      job.company?.name || job.companyName || "this company"
    }?\n\nYour saved profile resume will be used.`
  );

  if (!confirmed) return;

  button.disabled = true;
  button.textContent = "Submitting…";

  try {
    await applicationApi.apply(jobId);

    appliedJobIds.add(String(jobId));
    
    button.textContent = "Applied";
    button.classList.add("is-applied");
    button.disabled = true;
    
    showNotification(
      "Application submitted successfully!",
      "success"
    );
  } catch (error) {
    console.error("Unable to submit job application.", error);

    button.disabled = false;
    button.textContent = "Apply now";

    showNotification(
      error?.message ||
        "We couldn't submit your application. Please try again.",
      "error"
    );
  }
}

function createJobCard(job) {
  const card = document.createElement("article");
  card.className = "job-card";

  const top = document.createElement("div");
  top.className = "job-card__top";

  const headingGroup = document.createElement("div");

  const company = document.createElement("p");
  company.className = "job-card__company";
  company.textContent =
    job.company?.name || job.companyName || "Company not specified";

  const title = document.createElement("h3");
  title.className = "job-card__title";
  title.textContent = job.title || "Untitled position";

  headingGroup.append(company, title);

  const status = document.createElement("span");
  status.className = "job-card__status";
  status.textContent = formatLabel(job.status || "Open");

  top.append(headingGroup, status);

  const description = document.createElement("p");
  description.className = "job-card__description";
  description.textContent =
    job.description || "No job description provided.";

  const meta = document.createElement("div");
  meta.className = "job-card__meta";

  if (job.location) meta.append(createTag(job.location));

  if (job.employmentType) {
    meta.append(createTag(formatLabel(job.employmentType)));
  }

  if (job.workMode) {
    meta.append(createTag(formatLabel(job.workMode)));
  }

  if (Array.isArray(job.skills)) {
    job.skills.slice(0, 5).forEach((skill) => {
      if (skill) meta.append(createTag(skill));
    });
  }

  const footer = document.createElement("div");
  footer.className = "job-card__footer";

  const salaryGroup = document.createElement("div");

  const salary = document.createElement("div");
  salary.className = "job-card__salary";
  salary.textContent = formatSalary(job.salary);

  const deadline = document.createElement("div");
  deadline.className = "job-card__deadline";
  deadline.textContent = `Apply by ${formatDate(job.applicationDeadline)}`;

  salaryGroup.append(salary, deadline);

  const viewButton = document.createElement("button");
  viewButton.className = "job-card__view-button";
  viewButton.type = "button";
  viewButton.textContent = "View details";
  viewButton.setAttribute("aria-expanded", "false");

  const applyButton = document.createElement("button");
  applyButton.className = "job-card__apply-button";
  applyButton.type = "button";
  
  const jobId = String(job._id || job.id || "");
  const alreadyApplied = appliedJobIds.has(jobId);
  
  applyButton.textContent = alreadyApplied ? "Applied" : "Apply now";
  applyButton.disabled = alreadyApplied;
  
  if (alreadyApplied) {
    applyButton.classList.add("is-applied");
  }
  
  applyButton.addEventListener("click", () => {
    if (appliedJobIds.has(jobId)) {
      showNotification(
        "You have already applied for this job.",
        "error"
      );
      return;
    }
  
    applyForJob(job, applyButton);
  });
  
  const details = document.createElement("div");
  details.hidden = true;
  details.className = "job-card__extra-details";

  const detailsHeading = document.createElement("h4");
  detailsHeading.textContent = "Job details";

  const experience = document.createElement("p");
  const minYears = job.experience?.minYears;
  const maxYears = job.experience?.maxYears;

  if (minYears != null && maxYears != null) {
    experience.textContent = `Experience: ${minYears}–${maxYears} years`;
  } else if (minYears != null) {
    experience.textContent = `Minimum experience: ${minYears} years`;
  } else {
    experience.textContent = "Experience: Not specified";
  }

  const openings = document.createElement("p");
  openings.textContent = `Openings: ${job.openings ?? "Not specified"}`;

  details.append(detailsHeading, experience, openings);

  if (Array.isArray(job.requirements) && job.requirements.length) {
    const requirementsHeading = document.createElement("h4");
    requirementsHeading.textContent = "Requirements";

    const requirementsList = document.createElement("ul");

    job.requirements.forEach((requirement) => {
      const item = document.createElement("li");
      item.textContent = requirement;
      requirementsList.append(item);
    });

    details.append(requirementsHeading, requirementsList);
  }

  if (Array.isArray(job.responsibilities) && job.responsibilities.length) {
    const responsibilitiesHeading = document.createElement("h4");
    responsibilitiesHeading.textContent = "Responsibilities";

    const responsibilitiesList = document.createElement("ul");

    job.responsibilities.forEach((responsibility) => {
      const item = document.createElement("li");
      item.textContent = responsibility;
      responsibilitiesList.append(item);
    });

    details.append(responsibilitiesHeading, responsibilitiesList);
  }

  viewButton.addEventListener("click", () => {
    const expanded = viewButton.getAttribute("aria-expanded") === "true";

    viewButton.setAttribute("aria-expanded", String(!expanded));
    viewButton.textContent = expanded ? "View details" : "Hide details";
    details.hidden = expanded;
  });

  const cardActions = document.createElement("div");
  cardActions.className = "job-card__actions";
  cardActions.append(viewButton, applyButton);
  
  footer.append(salaryGroup, cardActions);
  card.append(top, description, meta, footer, details);

  return card;
}

function renderJobs(jobs) {
  elements.list.replaceChildren();

  const leftColumn = document.createElement("div");
  leftColumn.className = "jobs-list-column";

  const rightColumn = document.createElement("div");
  rightColumn.className = "jobs-list-column";

  jobs.forEach((job, index) => {
    const card = createJobCard(job);

    if (index % 2 === 0) {
      leftColumn.append(card);
    } else {
      rightColumn.append(card);
    }
  });

  elements.list.append(leftColumn, rightColumn);

  elements.empty.hidden = jobs.length !== 0;
  elements.list.hidden = jobs.length === 0;

  if (jobs.length === 0) {
    elements.summary.textContent =
      "No opportunities match your current filters.";
  }
}

function getFilters() {
  return {
    page: currentPage,
    limit: PAGE_SIZE,
    ...(elements.search.value.trim()
      ? { search: elements.search.value.trim() }
      : {}),
    ...(elements.employmentType.value
      ? { employmentType: elements.employmentType.value }
      : {}),
    ...(elements.workMode.value
      ? { workMode: elements.workMode.value }
      : {})
  };
}

async function loadJobs() {
  const thisRequest = ++requestNumber;

  setLoading(true);
  setFeedback();
  elements.empty.hidden = true;
  elements.list.hidden = true;

  try {
    const response = await jobApi.listJobs(getFilters());

    // Ignore an older response if the user changed filters meanwhile.
    if (thisRequest !== requestNumber) return;

    const { jobs, pagination } = getJobResponse(response);

    currentPage = Number(pagination.page) || currentPage;
    totalPages = Math.max(1, Number(pagination.totalPages) || 1);

    renderJobs(jobs);

    const total = Number(pagination.total);
    elements.summary.textContent = Number.isFinite(total)
      ? `${total} ${total === 1 ? "opportunity" : "opportunities"} found`
      : `${jobs.length} ${jobs.length === 1 ? "opportunity" : "opportunities"} loaded`;

    elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    elements.previous.disabled =
      currentPage <= 1 || pagination.hasPreviousPage === false;
    elements.next.disabled =
      currentPage >= totalPages || pagination.hasNextPage === false;
  } catch (error) {
    if (thisRequest !== requestNumber) return;

    console.error("Unable to load jobs.", error);

    elements.list.replaceChildren();
    elements.list.hidden = true;
    elements.empty.hidden = true;

    setFeedback(
      error?.message ||
        "We couldn't load jobs. Please check your connection and try again.",
      "error"
    );

    elements.pageInfo.textContent = `Page ${currentPage}`;
    elements.previous.disabled = currentPage <= 1;
    elements.next.disabled = true;
  } finally {
    if (thisRequest === requestNumber) {
      setLoading(false);
    }
  }
}

function resetFilters() {
  elements.search.value = "";
  elements.employmentType.value = "";
  elements.workMode.value = "";
  currentPage = 1;
  loadJobs();
}

function bindEvents() {
  elements.search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);

    searchTimer = window.setTimeout(() => {
      currentPage = 1;
      loadJobs();
    }, 350);
  });

  elements.employmentType.addEventListener("change", () => {
    currentPage = 1;
    loadJobs();
  });

  elements.workMode.addEventListener("change", () => {
    currentPage = 1;
    loadJobs();
  });

  elements.reset.addEventListener("click", resetFilters);
  elements.clearEmpty.addEventListener("click", resetFilters);

  elements.refresh.addEventListener("click", loadJobs);

  elements.previous.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      loadJobs();
    }
  });

  elements.next.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      loadJobs();
    }
  });
}

async function initializeJobsPage() {
  initializeTheme();

  const authorized = await requireRole(["student"]);
  if (!authorized) return;

  try {
    const response = await authService.getCurrentUser();
    const user = getUserFromResponse(response);

    if (!user || user.role !== "student") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    renderNavbar({
      user,
      mount: document.getElementById("site-header")
    });

    const applicationsResponse = await applicationApi.list();

    const applications =
      applicationsResponse?.data?.applications ?? [];
    
    appliedJobIds.clear();
    
    applications.forEach((application) => {
      const jobId = application.job?._id || application.job?.id;
    
      if (jobId) {
        appliedJobIds.add(String(jobId));
      }
    });

    bindEvents();
    await loadJobs();
  } catch (error) {
    console.error("Unable to initialize the Jobs page.", error);
    setFeedback(
      "We couldn't initialize the Jobs page. Please reload and try again.",
      "error"
    );
  }
}

initializeJobsPage().catch((error) => {
  console.error("Jobs page initialization failed.", error);
});
