
import { authService } from "../auth/auth.service.js";
import { requireRole } from "../auth/route-guard.js";
import { initializeTheme } from "../utils/theme.js";
import { renderNavbar } from "../components/navbar.js";
import { companyApi } from "../api/company.api.js";
import { initializeAccountSecurity } from "../components/account-security.js";

const welcomeTitle = document.querySelector("#welcome-title");
const officerAvatar = document.querySelector("#officer-avatar");
const officerName = document.querySelector("#officer-name");
const officerEmail = document.querySelector("#officer-email");
const officerRole = document.querySelector("#officer-role");
const companyAssignment = document.querySelector("#company-assignment");
const feedback = document.querySelector("#dashboard-feedback");
const viewCompanyButton = document.querySelector("#view-company-button");
const companyModal = document.querySelector("#company-modal");
const companyModalDialog = document.querySelector(".company-modal-dialog");
const closeCompanyModalButton = document.querySelector("#close-company-modal");
const companyModalName = document.querySelector("#company-modal-name");
const companyModalIndustry = document.querySelector("#company-modal-industry");
const companyModalLogo = document.querySelector("#company-modal-logo");
const companyModalDescription = document.querySelector("#company-modal-description");
const companyModalDetails = document.querySelector("#company-modal-details");

let assignedCompanyId = null;
let previousFocusedElement = null;

function setFeedback(message, state = "info") {
  feedback.textContent = message;
  feedback.dataset.state = state;
}

function getUserFromResponse(response) {
  return (
    response?.data?.user ??
    response?.data ??
    response?.user ??
    response
  );
}

function getInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "P";

  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function getCompanyDisplay(company) {
  // The company may be populated as an object or returned as an ID.
  if (company && typeof company === "object") {
    return company.name || company.companyName || "Company assigned";
  }

  if (typeof company === "string" && company.trim()) {
    // Don't display a raw database ID as if it were a company name.
    return "Company assigned";
  }

  return "No company assignment found";
}

function getCompanyId(company) {
  if (typeof company === "string") {
    return company.trim() || null;
  }

  if (company && typeof company === "object") {
    return company._id || company.id || null;
  }

  return null;
}

function extractCompanyResponse(response) {
  return (
    response?.data?.data?.company ??
    response?.data?.company ??
    response?.data?.data ??
    response?.data ??
    response?.company ??
    response
  );
}

function createCompanyDetail(label, value, linkType = null) {
  if (!value) return null;

  const item = document.createElement("div");
  item.className = "company-detail-item";

  const labelElement = document.createElement("span");
  labelElement.className = "company-detail-label";
  labelElement.textContent = label;

  const valueElement = document.createElement("div");
  valueElement.className = "company-detail-value";

  if (linkType === "website") {
    try {
      const url = new URL(value);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Unsupported website protocol.");
      }

      const link = document.createElement("a");
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = value;
      valueElement.appendChild(link);
    } catch {
      valueElement.textContent = value;
    }
  } else if (linkType === "email") {
    const link = document.createElement("a");
    link.href = `mailto:${value}`;
    link.textContent = value;
    valueElement.appendChild(link);
  } else if (linkType === "phone") {
    const link = document.createElement("a");
    link.href = `tel:${value.replace(/[^\d+]/g, "")}`;
    link.textContent = value;
    valueElement.appendChild(link);
  } else {
    valueElement.textContent = value;
  }

  item.append(labelElement, valueElement);

  return item;
}

function renderCompanyDetails(company) {
  companyModalName.textContent = company.name || "Company details unavailable";
  companyModalIndustry.textContent = company.industry || "Industry not specified";

  companyModalDescription.textContent =
    company.description || "No company description is available.";

  companyModalLogo.replaceChildren();

  if (company.logo) {
    try {
      const logoUrl = new URL(company.logo, window.location.origin);

      if (["http:", "https:"].includes(logoUrl.protocol)) {
        const image = document.createElement("img");
        image.src = logoUrl.href;
        image.alt = `${company.name || "Company"} logo`;

        image.addEventListener("error", () => {
          companyModalLogo.textContent =
            (company.name || "S").trim().charAt(0).toUpperCase();
        }, { once: true });

        companyModalLogo.appendChild(image);
      } else {
        throw new Error("Unsupported logo URL.");
      }
    } catch {
      companyModalLogo.textContent =
        (company.name || "S").trim().charAt(0).toUpperCase();
    }
  } else {
    companyModalLogo.textContent =
      (company.name || "S").trim().charAt(0).toUpperCase();
  }

  const details = [
    createCompanyDetail("Location", company.location),
    createCompanyDetail("Website", company.website, "website"),
    createCompanyDetail("Contact email", company.contactEmail, "email"),
    createCompanyDetail("Contact phone", company.contactPhone, "phone"),
    createCompanyDetail(
      "Company status",
      company.isActive === undefined
        ? null
        : company.isActive
          ? "Active"
          : "Inactive"
    ),
  ].filter(Boolean);

  companyModalDetails.replaceChildren(...details);
}

function openCompanyModal() {
  previousFocusedElement = document.activeElement;

  companyModal.hidden = false;
  document.body.style.overflow = "hidden";

  closeCompanyModalButton.focus();
}

function closeCompanyModal() {
  companyModal.hidden = true;
  document.body.style.overflow = "";

  previousFocusedElement?.focus();
}

async function handleViewCompany() {
  if (!assignedCompanyId) {
    setFeedback("No company is currently assigned to your account.", "error");
    return;
  }

  viewCompanyButton.disabled = true;
  viewCompanyButton.textContent = "Loading company...";

  companyModalName.textContent = "Loading company details...";
  companyModalIndustry.textContent = "";
  companyModalDescription.textContent = "";
  companyModalDetails.replaceChildren();
  companyModalLogo.textContent = "S";

  openCompanyModal();

  try {
    const response = await companyApi.getCompanyById(assignedCompanyId);
    const company = extractCompanyResponse(response);

    if (!company || typeof company !== "object" || !company.name) {
      throw new Error("Company details could not be retrieved.");
    }

    renderCompanyDetails(company);
  } catch (error) {
    console.error("Unable to retrieve assigned company details.", error);

    companyModalName.textContent = "Unable to load company";
    companyModalIndustry.textContent = "";
    companyModalDescription.textContent =
      error?.message || "Please close this window and try again.";
    companyModalDetails.replaceChildren();
  } finally {
    viewCompanyButton.disabled = false;
    viewCompanyButton.textContent = "View assigned company";
  }
}

function displayOfficer(user) {
  const name = user.fullName || "Placement Officer";
  const email = user.email || "Email unavailable";

  welcomeTitle.textContent = `Welcome back, ${name.trim().split(/\s+/)[0]}`;
  officerAvatar.textContent = getInitials(name);
  officerName.textContent = name;
  officerEmail.textContent = email;
  officerRole.textContent = "Placement Officer";

  assignedCompanyId = getCompanyId(user.company);

  companyAssignment.textContent = getCompanyDisplay(user.company);
  viewCompanyButton.disabled = !assignedCompanyId;
}

async function loadDashboard() {
  const authorized = await requireRole(["placement_officer"]);

  if (!authorized) return;

  try {
    const response = await authService.getCurrentUser();
    const user = getUserFromResponse(response);

    if (!user || user.role !== "placement_officer") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    renderNavbar({
      user,
      mount: document.getElementById("site-header")
    });

    displayOfficer(user);

    initializeAccountSecurity("../login.html");

    setFeedback(
      "You're signed in. Your placement workspace is ready.",
      "success"
    );
  } catch (error) {
    console.error("Unable to load the placement officer account.", error);

    setFeedback(
      "We couldn't load your account details. Please sign in again and retry.",
      "error"
    );
  }
}

viewCompanyButton.addEventListener("click", handleViewCompany);

closeCompanyModalButton.addEventListener("click", closeCompanyModal);

companyModal.querySelectorAll("[data-close-company-modal]").forEach((element) => {
  element.addEventListener("click", closeCompanyModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !companyModal.hidden) {
    closeCompanyModal();
  }
});

function initializeAccountDetails() {
  const toggle = document.querySelector("#account-details-toggle");
  const content = document.querySelector("#account-details-content");

  if (!toggle || !content) return;

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute("aria-expanded", String(!isExpanded));
    content.hidden = isExpanded;
  });
}

initializeTheme();
initializeAccountDetails();

loadDashboard().catch((error) => {
  console.error("Placement dashboard initialization failed.", error);

  setFeedback(
    "The dashboard could not be initialized. Please reload the page.",
    "error"
  );
});