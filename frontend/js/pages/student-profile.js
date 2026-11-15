import { studentApi } from "../api/student.api.js";
import { authService } from "../auth/auth.service.js";
import { showToast } from "../components/toast.js";
import { requireRole } from "../auth/route-guard.js";
import { renderNavbar } from "../components/navbar.js";

const $ = (selector) => document.querySelector(selector);

const form = $("#studentProfileForm");
const fieldset = $("#profileFieldset");
const saveButton = $("#saveProfileButton");
const saveFeedback = $("#saveFeedback");
const skillsInput = $("#skillsInput");
const skillsList = $("#skillsList");
const changePasswordForm = $("#changePasswordForm");
const changePasswordButton = $("#changePasswordButton");
const passwordFeedback = $("#passwordFeedback");

let currentUser = null;
let currentProfile = null;
let profileExists = false;
let skills = [];
let busy = false;

function payloadOf(response) {
  return response?.data?.data ?? response?.data ?? response?.result ?? response;
}

function errorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function notify(message, type = "info", title) {
  showToast({ title, message, type });
}

function setFeedback(message = "") {
    const feedback = document.getElementById("saveFeedback");
  
    if (feedback) {
      feedback.textContent = message;
    }
  }

  function setBusy(value) {
    busy = value;
  
    if (fieldset) {
      fieldset.disabled = value;
    }
  
    if (saveButton) {
      saveButton.disabled = value;
      saveButton.textContent = value
        ? "Please wait..."
        : profileExists
          ? "Save changes"
          : "Create profile";
    }
  
    const uploadAvatarButton = document.getElementById("uploadAvatarButton");
    const removeAvatarButton = document.getElementById("removeAvatarButton");
    const replaceResumeButton = document.getElementById("replaceResumeButton");
    const viewResumeButton = document.getElementById("viewResumeButton");
    const removeResumeButton = document.getElementById("removeResumeButton");
  
    if (uploadAvatarButton) {
      uploadAvatarButton.disabled = value || !profileExists;
    }
  
    if (removeAvatarButton) {
      removeAvatarButton.disabled =
        value || !profileExists || !currentProfile?.avatar?.url;
    }
  
    if (replaceResumeButton) {
      replaceResumeButton.disabled = value || !profileExists;
    }
  
    if (viewResumeButton) {
      viewResumeButton.disabled =
        value || !profileExists || !currentProfile?.resume?.url;
    }
  
    if (removeResumeButton) {
      removeResumeButton.disabled =
        value || !profileExists || !currentProfile?.resume?.url;
    }
  }  

function getUser(response) {
  const payload = payloadOf(response);
  const user = payload?.user ?? payload;

  if (!user || typeof user !== "object") {
    throw new Error("Unable to load your account information.");
  }

  return user;
}

function updateSidebar() {
  const name = currentUser?.fullName || currentUser?.name || "Student";
  const email = currentUser?.email || "";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "S";

  $("#sidebarName").textContent = name;
  $("#sidebarEmail").textContent = email;
  $("#avatarInitials").textContent = initials;
}

function updateStatus() {
  const status = $("#profileStatus");
  status.classList.remove("is-complete", "is-incomplete");

  if (!profileExists) {
    status.classList.add("is-incomplete");
    $("#profileStatusText").textContent = "Profile not created";
  } else if (currentProfile?.isProfileComplete) {
    status.classList.add("is-complete");
    $("#profileStatusText").textContent = "Profile complete";
  } else {
    status.classList.add("is-incomplete");
    $("#profileStatusText").textContent = "Profile in progress";
  }
}

function updateCompletion(value) {
  const completion = Math.max(0, Math.min(100, Math.round(value)));

  $("#completionValue").textContent = `${completion}%`;
  $("#completionBar").style.width = `${completion}%`;
  $("#completionProgress").setAttribute(
    "aria-valuenow",
    String(completion)
  );

  $("#completionMessage").textContent =
    completion >= 100
      ? "Your profile is complete. Keep it up to date."
      : completion >= 70
        ? "You're nearly there. Add any missing information."
        : "Keep adding information to strengthen your profile.";
}

/*
 * This is a live editing estimate only.
 * The backend's profileCompletion remains authoritative after saving.
 */
function calculatePreviewCompletion() {
  const values = [
    form.elements.headline.value.trim(),
    form.elements.bio.value.trim(),
    form.elements.college.value.trim(),
    form.elements.degree.value.trim(),
    form.elements.specialization.value.trim(),
    form.elements.graduationYear.value.trim(),
    form.elements.cgpa.value.trim(),
    skills.length ? "yes" : "",
    form.elements.github.value.trim(),
    form.elements.linkedin.value.trim(),
    form.elements.portfolio.value.trim(),
  ];

  const filled = values.filter(Boolean).length;
  const avatarPresent = Boolean(currentProfile?.avatar?.url);
  const resumePresent = Boolean(currentProfile?.resume?.url);

  return Math.round(
    ((filled + Number(avatarPresent) + Number(resumePresent)) / 13) * 100
  );
}

function refreshCompletionPreview() {
  updateCompletion(calculatePreviewCompletion());
}

function renderAvatar(url) {
    const preview = document.getElementById("avatarPreview");
    const initialsElement = document.getElementById("avatarInitials");
  
    if (!preview) {
      console.error(
        "[SkillVerse] Missing #avatarPreview in student-profile.html"
      );
      return;
    }
  
    const initials = initialsElement?.textContent?.trim() || "S";
    preview.replaceChildren();
  
    if (url) {
      const image = document.createElement("img");
      image.src = url;
      image.alt = "Student profile picture";
  
      image.onerror = () => {
        preview.replaceChildren();
  
        const fallback = document.createElement("span");
        fallback.textContent = initials;
        preview.append(fallback);
      };
  
      preview.append(image);
      return;
    }
  
    const fallback = document.createElement("span");
    fallback.textContent = initials;
    preview.append(fallback);
  }  

  function renderResume(resume) {
    const url = typeof resume?.url === "string" ? resume.url : "";
    const originalName = resume?.originalName || "";
    const size = Number(resume?.size) || 0;
    const hasResume = Boolean(url);
  
    const title = document.getElementById("resumeTitle");
    const metadata = document.getElementById("resumeMetadata");
    const status = document.getElementById("resumeStatus");
    const statusText = document.getElementById("resumeStatusText");
    const viewButton = document.getElementById("viewResumeButton");
    const replaceLabel = document.getElementById("replaceResumeLabel");
    const removeButton = document.getElementById("removeResumeButton");
  
    if (title) {
      title.textContent = "My Resume";
    }
  
    if (metadata) {
      const filename = originalName || "Resume PDF";
      const sizeText = size > 0
        ? ` · ${(size / (1024 * 1024)).toFixed(2)} MB`
        : "";
  
      metadata.textContent = hasResume
        ? `${filename}${sizeText} · PDF document`
        : "No resume uploaded yet";
    }
  
    if (statusText) {
      statusText.textContent = hasResume
        ? "Uploaded successfully"
        : "Awaiting upload";
    }
  
    if (status) {
      status.classList.toggle("is-pending", !hasResume);
      status.classList.remove("is-error");
    }
  
    if (viewButton) {
      viewButton.disabled = !hasResume;
    }
  
    if (replaceLabel) {
      replaceLabel.textContent = hasResume
        ? "Replace resume"
        : "Upload resume";
    }
  
    if (removeButton) {
      removeButton.disabled = !hasResume;
    }
  }  

function renderSkills() {
  skillsList.replaceChildren();

  for (const skill of skills) {
    const chip = document.createElement("span");
    chip.className = "profile-skill-chip";

    const label = document.createElement("span");
    label.textContent = skill;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove ${skill}`);

    remove.addEventListener("click", () => {
      if (busy) return;

      skills = skills.filter((item) => item !== skill);
      renderSkills();
      refreshCompletionPreview();
    });

    chip.append(label, remove);
    skillsList.append(chip);
  }

  $("#skillsCount").textContent =
    `${skills.length} skill${skills.length === 1 ? "" : "s"} added`;
}

function addSkill(value) {
  const skill = value.trim();
  if (!skill || busy) return;

  if (skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
    notify("That skill has already been added.", "info");
  } else {
    skills.push(skill);
    renderSkills();
    refreshCompletionPreview();
  }

  skillsInput.value = "";
  skillsInput.focus();
}

function fillForm(profile = {}) {
  form.elements.headline.value = profile.headline || "";
  form.elements.bio.value = profile.bio || "";
  form.elements.college.value = profile.college || "";
  form.elements.degree.value = profile.degree || "";
  form.elements.specialization.value = profile.specialization || "";
  form.elements.graduationYear.value = profile.graduationYear ?? "";
  form.elements.cgpa.value = profile.cgpa ?? "";

  form.elements.github.value = profile.socialLinks?.github || "";
  form.elements.linkedin.value = profile.socialLinks?.linkedin || "";
  form.elements.portfolio.value = profile.socialLinks?.portfolio || "";

  skills = Array.isArray(profile.skills) ? [...profile.skills] : [];
  renderSkills();

  $("#bioCount").textContent = `${form.elements.bio.value.length} / 1000`;
  $("#sidebarHeadline").textContent =
    profile.headline || "Add a professional headline";

  renderAvatar(profile.avatar?.url || "");
  renderResume(profile.resume);

  updateStatus();
  updateCompletion(Number(profile.profileCompletion) || 0);
}

function applyProfileResponse(response) {
  const profile = payloadOf(response)?.student ?? payloadOf(response);

  if (!profile || typeof profile !== "object") {
    throw new Error("The server returned an unexpected profile response.");
  }

  currentProfile = profile;
  profileExists = true;
  fillForm(profile);
  setBusy(busy);
}

async function loadProfile() {
  try {
    applyProfileResponse(await studentApi.getProfile());
    setFeedback("Your profile is loaded.");
  } catch (error) {
    if (error?.status !== 404) throw error;

    currentProfile = null;
    profileExists = false;
    fillForm({});
    refreshCompletionPreview();
    setFeedback("Complete the form and select Create profile.");
    setBusy(false);
  }
}

function validateProfile() {
  const data = {
    headline: form.elements.headline.value.trim(),
    bio: form.elements.bio.value.trim(),
    college: form.elements.college.value.trim(),
    degree: form.elements.degree.value.trim(),
    specialization: form.elements.specialization.value.trim(),
    graduationYear: form.elements.graduationYear.value,
    cgpa: form.elements.cgpa.value,
    skills: [...skills],
    socialLinks: {
      github: form.elements.github.value.trim(),
      linkedin: form.elements.linkedin.value.trim(),
      portfolio: form.elements.portfolio.value.trim(),
    },
  };

  const requiredFields = [
    ["Professional headline", data.headline],
    ["About me", data.bio],
    ["College / University", data.college],
    ["Degree", data.degree],
    ["Specialization", data.specialization],
    ["Graduation year", data.graduationYear],
    ["CGPA", data.cgpa],
  ];

  const missing = requiredFields
    .filter(([, value]) => !value)
    .map(([label]) => label);

  if (missing.length) {
    throw new Error(
      `Please complete all required fields: ${missing.join(", ")}.`
    );
  }

  if (data.headline.length > 120) {
    throw new Error("Your headline cannot exceed 120 characters.");
  }

  if (data.bio.length > 1000) {
    throw new Error("Your bio cannot exceed 1000 characters.");
  }

  const year = Number(data.graduationYear);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Graduation year must be between 2000 and 2100.");
  }

  const cgpa = Number(data.cgpa);
  if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
    throw new Error("CGPA must be between 0 and 10.");
  }

  if (!data.skills.length) {
    throw new Error("Please add at least one skill.");
  }

  for (const [label, value] of Object.entries(data.socialLinks)) {
    if (!value) continue;

    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Enter a valid ${label} URL.`);
    }

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error(`${label} must use HTTP or HTTPS.`);
    }
  }

  data.graduationYear = year;
  data.cgpa = cgpa;

  return data;
}

async function saveProfile(event) {
  event.preventDefault();
  if (busy) return;

  setFeedback("");

  let data;
  try {
    data = validateProfile();
  } catch (error) {
    notify(errorMessage(error), "warning", "Check your profile");
    return;
  }

  try {
    setBusy(true);
    setFeedback(profileExists ? "Saving changes..." : "Creating profile...");

    const wasExistingProfile = profileExists;

const response = wasExistingProfile
  ? await studentApi.updateProfile(data)
  : await studentApi.createProfile(data);

profileExists = true;
currentProfile = payloadOf(response);
fillForm(currentProfile);

setBusy(true);
refreshCompletionPreview();
setFeedback("Saved successfully.");

notify(
  wasExistingProfile
    ? "Your profile changes have been saved."
    : "Your student profile has been created.",
  "success"
);
} catch (error) {
    console.error("[SkillVerse] Profile save handler failed:", error);
    console.error("Error stack:", error?.stack);
  
    notify(
      errorMessage(error),
      "error",
      "Unable to save profile"
    );
  
    setFeedback("Please check the browser console for details.");
  } finally {
    setBusy(false);
  }
}

async function uploadFile(kind, file) {
  if (!file || busy) return;

  if (!profileExists) {
    notify(
      "Please create your student profile before uploading files.",
      "warning"
    );
    return;
  }

  const allowedType =
    kind === "avatar"
      ? ["image/jpeg", "image/png", "image/jpg", "image/webp"]
      : ["application/pdf"];

  if (!allowedType.includes(file.type)) {
    notify(
      kind === "avatar"
        ? "Choose a JPG, PNG, or WebP image."
        : "Choose a PDF resume.",
      "warning",
      "Unsupported file"
    );
    return;
  }

  try {
    setBusy(true);
    setFeedback(kind === "avatar" ? "Uploading photo..." : "Uploading resume...");

    const response =
      kind === "avatar"
        ? await studentApi.uploadAvatar(file)
        : await studentApi.uploadResume(file);

    applyProfileResponse(response);
    refreshCompletionPreview();

    notify(
      kind === "avatar"
        ? "Your profile photo has been updated."
        : "Your resume has been uploaded.",
      "success"
    );
    setFeedback("Upload complete.");
  } catch (error) {
    notify(errorMessage(error), "error", "Upload failed");
    setFeedback("Upload failed.");
  } finally {
    setBusy(false);
  }
}

async function removeFile(kind) {
  if (busy || !profileExists) return;

  const isAvatar = kind === "avatar";
  const exists = isAvatar
    ? Boolean(currentProfile?.avatar?.url)
    : Boolean(currentProfile?.resume?.url);

  if (!exists) {
    notify(isAvatar ? "There is no photo to remove." : "There is no resume to remove.");
    return;
  }

  const confirmed = window.confirm(
    isAvatar
      ? "Remove your profile photo?"
      : "Remove your uploaded resume?"
  );

  if (!confirmed) return;

  try {
    setBusy(true);

    if (isAvatar) {
      await studentApi.removeAvatar();
    } else {
      await studentApi.removeResume();
    }

    applyProfileResponse(await studentApi.getProfile());
    refreshCompletionPreview();

    notify(
      isAvatar ? "Profile photo removed." : "Resume removed.",
      "success"
    );
  } catch (error) {
    notify(errorMessage(error), "error", "Unable to remove file");
  } finally {
    setBusy(false);
  }
}

function initializeThemeControls() {
  const toggle = $("#themeToggle");

  // The shared navbar provides the theme toggle on this page.
  // The old page-specific toggle may not exist anymore.
  if (!toggle) return;

  function refreshButton() {
    const dark = document.documentElement.dataset.theme === "dark";

    toggle.textContent = dark ? "☀" : "◐";
    toggle.setAttribute(
      "aria-label",
      dark ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  refreshButton();

  toggle.addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";

    root.dataset.theme = next;
    localStorage.setItem("skillverse-theme", next);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = next === "dark" ? "#0f172a" : "#f5f7fb";

    refreshButton();
  });
}

async function logout() {
  if (busy) return;

  const button = $("#logoutButton");
  button.disabled = true;
  button.textContent = "Signing out...";

  try {
    await authService.logout();
  } catch {
    authService.clearLocalSession();
  }

  window.location.replace("../login.html");
}

async function handleChangePassword(event) {
  event.preventDefault();

  if (changePasswordButton.disabled) return;

  const currentPassword = $("#currentPassword").value;
  const newPassword = $("#newPassword").value;
  const confirmPassword = $("#confirmPassword").value;

  passwordFeedback.textContent = "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    passwordFeedback.textContent = "Please complete all password fields.";
    return;
  }

  if (newPassword.length < 8) {
    passwordFeedback.textContent =
      "Your new password must contain at least 8 characters.";
    return;
  }

  if (newPassword !== confirmPassword) {
    passwordFeedback.textContent = "New passwords do not match.";
    return;
  }

  if (currentPassword === newPassword) {
    passwordFeedback.textContent =
      "Your new password must be different from your current password.";
    return;
  }

  changePasswordButton.disabled = true;
  changePasswordButton.textContent = "Updating password...";

  changePasswordForm.querySelectorAll("input, button").forEach((element) => {
    element.disabled = true;
  });

  try {
    const response = await authService.changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    passwordFeedback.textContent =
      response?.message || "Password changed successfully. Please login again.";

    passwordFeedback.style.color = "#16a34a";

    changePasswordForm.reset();

    notify(
      "Your password has been changed. Please sign in again.",
      "success",
      "Password updated"
    );

    // The backend invalidates the stored refresh token.
    // Clear the local session and require a fresh login.
    authService.clearLocalSession();

    window.setTimeout(() => {
      window.location.replace("../login.html");
    }, 1500);

  } catch (error) {
    passwordFeedback.textContent =
      errorMessage(error);

    passwordFeedback.style.color = "#dc2626";

    changePasswordForm.querySelectorAll("input, button").forEach((element) => {
      element.disabled = false;
    });

    changePasswordButton.textContent = "Update password";
  }
}

function initializePasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(
        button.dataset.passwordToggle
      );

      if (!input) return;

      const showPassword = input.type === "password";

      input.type = showPassword ? "text" : "password";
      button.textContent = showPassword ? "Hide" : "Show";
      button.setAttribute(
        "aria-label",
        `${showPassword ? "Hide" : "Show"} ${input.labels?.[0]?.textContent || "password"}`
      );
    });
  });
}

async function initializePage() {
  const authorized = await requireRole(["student"]);
  if (!authorized) return;

  // Keep the existing profile page theme control.
  initializeThemeControls();

// Change Password functionality.
changePasswordForm.addEventListener("submit", handleChangePassword);

initializePasswordToggles();

  // Profile form: save only when the user submits it.
  form.addEventListener("submit", saveProfile);

  // Skills input.
  skillsInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(skillsInput.value.replace(/,$/, ""));
    }
  });

  // Live character count and profile-strength preview.
  form.addEventListener("input", (event) => {
    if (event.target.name === "bio") {
      $("#bioCount").textContent =
        `${event.target.value.length} / 1000`;
    }

    if (event.target.matches("input, textarea")) {
      if (event.target.name === "headline") {
        $("#sidebarHeadline").textContent =
          event.target.value.trim() || "Add a professional headline";
      }

      refreshCompletionPreview();
    }
  });

  // Avatar upload and removal.
  $("#uploadAvatarButton").addEventListener("click", () => {
    $("#avatarInput").click();
  });

  $("#avatarInput").addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (file) {
      uploadFile("avatar", file);
    }

    event.target.value = "";
  });

  $("#removeAvatarButton").addEventListener("click", () => {
    removeFile("avatar");
  });

  // Resume Manager elements.
  const resumeInput = $("#resumeInput");
  const viewResumeButton = $("#viewResumeButton");
  const replaceResumeButton = $("#replaceResumeButton");
  const removeResumeButton = $("#removeResumeButton");

  // View resume in a new browser tab.
  viewResumeButton.addEventListener("click", () => {
    const url = currentProfile?.resume?.url;

    if (!url) {
      notify("Upload a resume before trying to view it.", "warning");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  });

  // Upload or replace resume.
  replaceResumeButton.addEventListener("click", () => {
    if (!profileExists) {
      notify(
        "Create your student profile before uploading a resume.",
        "warning"
      );
      return;
    }

    resumeInput.click();
  });

  resumeInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      notify("Please select a PDF file.", "warning", "Invalid file");
    } else if (file.size > 10 * 1024 * 1024) {
      notify(
        "Your resume must be 10 MB or smaller.",
        "warning",
        "File too large"
      );
    } else {
      uploadFile("resume", file);
    }

    event.target.value = "";
  });

  // Remove resume.
  removeResumeButton.addEventListener("click", () => {
    removeFile("resume");
  });

// Register the old page-specific logout button only if it exists.
// The shared navbar has its own Sign out handler.
const logoutButton = $("#logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", logout);
}

  // Load authenticated student and render the shared navbar.
  try {
    const response = await authService.getCurrentUser();
    currentUser = getUser(response);

    if (currentUser.role !== "student") {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    renderNavbar({
      user: currentUser,
      mount: document.getElementById("site-header")
    });

    updateSidebar();
    await loadProfile();
    setBusy(false);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      authService.clearLocalSession();
      window.location.replace("../login.html");
      return;
    }

    console.error("[SkillVerse] Profile initialization failed:", error);
    notify(errorMessage(error), "error", "Unable to load profile");
  }
}

initializePage();
