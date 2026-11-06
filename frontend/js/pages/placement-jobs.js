
import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { jobApi } from "../api/job.api.js";
import { showNotification } from "../utils/notification.js";

const jobsList = document.querySelector("#jobs-list");
const createJobForm = document.querySelector("#create-job-form");
const createJobButton = document.querySelector("#create-job-button");
const refreshJobsButton = document.querySelector("#refresh-jobs-button");
const resetJobButton = document.querySelector("#reset-job-button");
const cancelEditButton = document.querySelector("#cancel-edit-button");

let currentUser = null;
let currentEditingJobId = null;
let companyAccessSuspended = false;

function setFeedback(message, state = "info") {
    const notificationType =
      state === "error" ? "error" :
      state === "success" ? "success" :
      "info";
  
    showNotification(message, notificationType);
}

function getApiErrorMessage(error) {
  return String(
    error?.message ??
    error?.response?.data?.message ??
    error?.data?.message ??
    ""
  );
}

function isCompanyInactiveError(error) {
  const message = getApiErrorMessage(error).toLowerCase();
  return message.includes("assigned company") &&
    (message.includes("inactive") || message.includes("deactivated"));
}

function setCompanyAccessSuspended(suspended, message = "") {
  companyAccessSuspended = suspended;

  const formPanel = createJobForm.closest(".placement-jobs-panel");
  let notice = document.querySelector("#company-access-notice");

  if (suspended) {
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "company-access-notice";
      notice.className = "placement-company-suspended";
      notice.setAttribute("role", "alert");
      notice.setAttribute("aria-live", "polite");

      const heading = document.createElement("h3");
      heading.textContent = "Company access suspended";

      const description = document.createElement("p");
      description.className = "placement-company-suspended-description";
      description.textContent = message ||
        "Your assigned company has been deactivated by the administrator. You cannot create or manage jobs until the company is reactivated.";

      const instruction = document.createElement("p");
      instruction.className = "placement-company-suspended-help";
      instruction.textContent =
        "Please contact your administrator. Once the company is reactivated, refresh this page to restore access.";

      notice.append(heading, description, instruction);
      formPanel.insertBefore(notice, createJobForm);
    } else if (message) {
      const description = notice.querySelector(
        ".placement-company-suspended-description"
      );
      if (description) description.textContent = message;
    }

    createJobForm.hidden = true;
    resetEditor();

    jobsList.replaceChildren();
    appendTextElement(
      jobsList,
      "p",
      "placement-empty-state placement-company-suspended-list",
      "Your company's jobs are temporarily unavailable because the company is inactive."
    );
    return;
  }

  notice?.remove();
  createJobForm.hidden = false;
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

function getCompanyId(company) {
  if (typeof company === "string") return company;

  if (company && typeof company === "object") {
    return company._id ?? company.id ?? "";
  }

  return "";
}

function getJobsFromResponse(response) {
  const body = getBody(response);

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.jobs)) return body.jobs;
  if (Array.isArray(body?.data?.jobs)) return body.data.jobs;

  return [];
}

function getJobId(job) {
  return job?.id ?? job?._id ?? "";
}

function isJobActive(job) {
  const value = job?.isActive;

  return !(
    value === false ||
    value === 0 ||
    value === "false" ||
    value === "0"
  );
}

function splitLines(value, maximumItems, maximumLength) {
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

// Format a date for an HTML date input using local calendar fields.
function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function appendTextElement(parent, tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) element.className = className;
  element.textContent = text ?? "";

  parent.append(element);
  return element;
}

function renderJobs(jobs) {
  jobsList.replaceChildren();

  if (jobs.length === 0) {
    appendTextElement(
      jobsList,
      "p",
      "placement-empty-state",
      "No jobs were returned for your company. Create a job above to get started."
    );
    return;
  }

  for (const job of jobs) {
    const card = document.createElement("article");
    card.className = "placement-job-item";

    appendTextElement(
      card,
      "h3",
      "",
      job.title || "Untitled job"
    );

    appendTextElement(
      card,
      "span",
      "placement-job-status",
      job.status || "Status unavailable"
    );

    const meta = document.createElement("div");
    meta.className = "placement-job-meta";

    appendTextElement(
      meta,
      "span",
      "",
      String(job.employmentType || "Employment type unavailable")
        .replaceAll("-", " ")
    );

    appendTextElement(
      meta,
      "span",
      "",
      String(job.workMode || "Work mode unavailable")
        .replaceAll("-", " ")
    );

    appendTextElement(
      meta,
      "span",
      "",
      `Openings: ${job.openings ?? "—"}`
    );

    appendTextElement(
      meta,
      "span",
      "",
      `Deadline: ${formatDate(job.applicationDeadline)}`
    );

    card.append(meta);

    if (job.location) {
      appendTextElement(
        card,
        "p",
        "placement-muted",
        `Location: ${job.location}`
      );
    }

    if (job.description) {
      appendTextElement(
        card,
        "p",
        "placement-job-description",
        job.description
      );
    }

    const actions = document.createElement("div");
    actions.className = "placement-form-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "placement-secondary-button placement-edit-button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
      startEditingJob(job);
    });

    actions.append(editButton);

    // Placement officers can deactivate and reactivate jobs belonging
    // to their assigned company. Permanent deletion remains admin-only.
    const isActive = isJobActive(job);
    const statusLabel = card.querySelector(".placement-job-status");

    if (statusLabel && !isActive) {
      statusLabel.textContent = `${job.status || "Status unavailable"} · Inactive`;
    }

    if (isActive) {
      const deactivateButton = document.createElement("button");
      deactivateButton.type = "button";
      deactivateButton.className = "placement-secondary-button placement-deactivate-button";
      deactivateButton.textContent = "Deactivate";
      deactivateButton.addEventListener("click", () => {
        handleDeactivateJob(job, deactivateButton);
      });
      actions.append(deactivateButton);
    } else {
      const reactivateButton = document.createElement("button");
      reactivateButton.type = "button";
      reactivateButton.className = "placement-secondary-button placement-reactivate-button";
      reactivateButton.textContent = "Reactivate";
      reactivateButton.addEventListener("click", () => {
        handleReactivateJob(job, reactivateButton);
      });
      actions.append(reactivateButton);
    }

    card.append(actions);
    jobsList.append(card);
  }
}

async function handleDeactivateJob(job, button) {
  if (companyAccessSuspended) return;
  const jobId = getJobId(job);

  if (!jobId) {
    setFeedback("This job does not contain a valid ID.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to deactivate "${job.title || "this job"}"?\n\n` +
    "It will no longer be available in active job listings."
  );

  if (!confirmed) return;

  if (button) {
    button.disabled = true;
    button.textContent = "Deactivating...";
  }

  try {
    await jobApi.deactivateJob(jobId);
    setFeedback("Job deactivated successfully.", "success");
    await loadJobs();
  } catch (error) {
    console.error("Unable to deactivate placement job.", error);
    if (isCompanyInactiveError(error)) {
      setCompanyAccessSuspended(true, getApiErrorMessage(error));
      setFeedback("Company access is suspended because your assigned company is inactive.", "error");
      return;
    }
    setFeedback(
      error?.message || "The job could not be deactivated. Please try again.",
      "error"
    );
    if (button) {
      button.disabled = false;
      button.textContent = "Deactivate";
    }
  }
}

async function handleReactivateJob(job, button) {
  if (companyAccessSuspended) return;
  const jobId = getJobId(job);

  if (!jobId) {
    setFeedback("This job does not contain a valid ID.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to reactivate "${job.title || "this job"}"?\n\n` +
    "The job will become active again."
  );

  if (!confirmed) return;

  if (button) {
    button.disabled = true;
    button.textContent = "Reactivating...";
  }

  try {
    await jobApi.reactivateJob(jobId);
    setFeedback("Job reactivated successfully.", "success");
    await loadJobs();
  } catch (error) {
    console.error("Unable to reactivate placement job.", error);
    if (isCompanyInactiveError(error)) {
      setCompanyAccessSuspended(true, getApiErrorMessage(error));
      setFeedback("Company access is suspended because your assigned company is inactive.", "error");
      return;
    }
    setFeedback(
      error?.message ||
        "The job could not be reactivated. Check that its company is active and its deadline is valid.",
      "error"
    );
    if (button) {
      button.disabled = false;
      button.textContent = "Reactivate";
    }
  }
}

function isTimeoutError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("timed out") || message.includes("timeout");
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function loadJobs() {
  jobsList.replaceChildren();

  appendTextElement(
    jobsList,
    "p",
    "placement-muted",
    "Loading jobs..."
  );

  // Retry once only when the API client reports a timeout. This helps with
  // a slow first response without repeatedly sending requests for real errors.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await jobApi.listJobs({
        limit: 100,
        isActive: "all",
      });
      const jobs = getJobsFromResponse(response);

      setCompanyAccessSuspended(false);
      renderJobs(jobs);
      return;
    } catch (error) {
      if (attempt === 1 && isTimeoutError(error)) {
        console.warn("Placement jobs request timed out. Retrying once...");
        appendTextElement(
          jobsList,
          "p",
          "placement-muted placement-retry-message",
          "The server is taking longer than expected. Retrying..."
        );
        await wait(700);
        continue;
      }

      console.error("Unable to load placement jobs.", error);

      if (isCompanyInactiveError(error)) {
        const message = getApiErrorMessage(error) ||
          "Your assigned company is currently inactive. Please contact the administrator to reactivate it.";
        setCompanyAccessSuspended(true, message);
        setFeedback(
          "Company access is suspended because your assigned company is inactive.",
          "error"
        );
        return;
      }

      jobsList.replaceChildren();
      appendTextElement(
        jobsList,
        "p",
        "placement-empty-state",
        "We couldn't load jobs. Please try refreshing the list."
      );

      setFeedback(
        getApiErrorMessage(error) ||
          "Unable to load jobs. Please refresh and try again.",
        "error"
      );
      return;
    }
  }
}

function buildJobPayload(formData) {
  const deadlineValue = String(
    formData.get("applicationDeadline") || ""
  );

  // Use the selected calendar date's end of day in local time.
  const deadline = new Date(`${deadlineValue}T23:59:59`);

  if (Number.isNaN(deadline.getTime())) {
    throw new Error("Please enter a valid application deadline.");
  }

  return {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    company: getCompanyId(currentUser?.company),
    employmentType: String(formData.get("employmentType") || ""),
    workMode: String(formData.get("workMode") || ""),
    location: String(formData.get("location") || "").trim(),
    openings: Number(formData.get("openings")),
    applicationDeadline: deadline.toISOString(),

    responsibilities: splitLines(
      String(formData.get("responsibilities") || ""),
      30,
      500
    ),

    requirements: splitLines(
      String(formData.get("requirements") || ""),
      30,
      500
    ),

    skills: splitSkills(
      String(formData.get("skills") || "")
    ),

    status: String(formData.get("status") || "draft")
  };
}

function startEditingJob(job) {
  if (companyAccessSuspended) return;
  const jobId = getJobId(job);

  if (!jobId) {
    setFeedback(
      "This job doesn't contain an ID, so it cannot be edited.",
      "error"
    );
    return;
  }

  currentEditingJobId = jobId;

  createJobForm.elements.title.value = job.title ?? "";
  createJobForm.elements.description.value = job.description ?? "";
  createJobForm.elements.employmentType.value = job.employmentType ?? "";
  createJobForm.elements.workMode.value = job.workMode ?? "";
  createJobForm.elements.location.value = job.location ?? "";
  createJobForm.elements.openings.value = job.openings ?? 1;

  createJobForm.elements.applicationDeadline.value =
    toDateInputValue(job.applicationDeadline);

  createJobForm.elements.responsibilities.value =
    Array.isArray(job.responsibilities)
      ? job.responsibilities.join("\n")
      : "";

  createJobForm.elements.requirements.value =
    Array.isArray(job.requirements)
      ? job.requirements.join("\n")
      : "";

  createJobForm.elements.skills.value =
    Array.isArray(job.skills)
      ? job.skills.join(", ")
      : "";

  createJobForm.elements.status.value = job.status ?? "draft";

  createJobButton.textContent = "Save changes";
  cancelEditButton.hidden = false;

  setFeedback(
    `Editing "${job.title || "Untitled job"}". Update the fields and save your changes.`,
    "info"
  );

  document.querySelector("#create-job-heading").textContent = "Edit job";

  createJobForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  createJobForm.elements.title.focus({ preventScroll: true });
}

function resetEditor({ clearForm = true } = {}) {
  currentEditingJobId = null;

  if (clearForm) {
    createJobForm.reset();
    createJobForm.elements.openings.value = "1";
  }

  createJobButton.textContent = "Create job";
  cancelEditButton.hidden = true;

  document.querySelector("#create-job-heading").textContent = "Create a job";
}

function cancelEditing() {
  resetEditor();

  setFeedback(
    "Editing cancelled. You can create a new job.",
    "info"
  );
}

async function handleJobSubmit(event) {
  event.preventDefault();

  if (companyAccessSuspended) {
    setFeedback("Your company is inactive. Job management is temporarily unavailable.", "error");
    return;
  }

  if (!createJobForm.reportValidity()) return;

  const companyId = getCompanyId(currentUser?.company);

  if (!companyId) {
    setFeedback(
      "Your assigned company ID is missing from your account response.",
      "error"
    );
    return;
  }

  const formData = new FormData(createJobForm);
  const deadlineValue = String(
    formData.get("applicationDeadline") || ""
  );

  if (!deadlineValue) {
    setFeedback(
      "Please select an application deadline.",
      "error"
    );
    return;
  }

  const deadline = new Date(`${deadlineValue}T23:59:59`);

  if (Number.isNaN(deadline.getTime())) {
    setFeedback(
      "Please enter a valid application deadline.",
      "error"
    );
    return;
  }

  if (
    formData.get("status") === "open" &&
    deadline.getTime() <= Date.now()
  ) {
    setFeedback(
      "An open job must have a future application deadline. Please choose a later date.",
      "error"
    );
    return;
  }

  let payload;

  try {
    payload = buildJobPayload(formData);
  } catch (error) {
    setFeedback(error.message, "error");
    return;
  }

  createJobButton.disabled = true;

  const editing = Boolean(currentEditingJobId);
  createJobButton.textContent = editing
    ? "Saving changes..."
    : "Creating job";

  setFeedback(
    editing
      ? "Saving your job changes..."
      : "Submitting your job to SkillVerse...",
    "info"
  );

  try {

    if (editing) {
        // A placement officer must not change the job's company assignment.
        // Send only editable job fields in the update request.
        const { company, ...updatePayload } = payload;
      
        await jobApi.updateJob(currentEditingJobId, updatePayload);
      
        resetEditor();
      
        setFeedback(
          "Job updated successfully. Refreshing your company's job list...",
          "success"
        );
      } else {
        // Company is required when creating a new job.
        await jobApi.createJob(payload);
      
        resetEditor();
      
        setFeedback(
          "Job created successfully. Refreshing your company's job list...",
          "success"
        );
      }      

    await loadJobs();
  } catch (error) {
    console.error(
      editing ? "Unable to update job." : "Unable to create job.",
      error
    );

    if (isCompanyInactiveError(error)) {
      setCompanyAccessSuspended(true, getApiErrorMessage(error));
      setFeedback("Company access is suspended because your assigned company is inactive.", "error");
      return;
    }

    setFeedback(
      error?.message ||
        (editing
          ? "The job could not be updated. Please try again."
          : "The job could not be created. Please try again."),
      "error"
    );
  } finally {
    createJobButton.disabled = false;

    createJobButton.textContent = currentEditingJobId
      ? "Save changes"
      : "Create job";
  }
}

async function initializePage() {
  initializeTheme();

  const authorized = await requireRole(["placement_officer"]);

  if (!authorized) return;

  try {
    const response = await authService.getCurrentUser();
    currentUser = getUserFromResponse(response);

    if (!currentUser || currentUser.role !== "placement_officer") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    renderNavbar({
      user: currentUser,
      mount: document.getElementById("site-header")
    });

    document.querySelector("#current-year").textContent =
      String(new Date().getFullYear());

    createJobForm.addEventListener("submit", handleJobSubmit);

    refreshJobsButton.addEventListener("click", loadJobs);

    cancelEditButton.addEventListener("click", cancelEditing);

    resetJobButton.addEventListener("click", () => {
      resetEditor({ clearForm: false });

      setFeedback(
        "The form has been cleared.",
        "info"
      );
    });

    createJobForm.addEventListener("reset", () => {
      // Native form reset runs after this event; restore create mode.
      window.setTimeout(() => {
        resetEditor({ clearForm: false });
      }, 0);
    });

    await loadJobs();

    if (!companyAccessSuspended) {
      setFeedback(
        "You're signed in. You can manage jobs for your assigned company.",
        "success"
      );
    }
  } catch (error) {
    console.error(
      "Unable to initialize placement job management.",
      error
    );

    setFeedback(
      "We couldn't initialize job management. Please reload the page or sign in again.",
      "error"
    );
  }
}

initializePage().catch((error) => {
  console.error(
    "Placement job page initialization failed.",
    error
  );

  setFeedback(
    "The page could not be initialized. Please reload it.",
    "error"
  );
});
