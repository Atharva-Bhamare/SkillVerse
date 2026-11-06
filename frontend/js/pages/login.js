
import { authService } from "../auth/auth.service.js";
import { redirectAfterLogin } from "../auth/route-guard.js";
import { showNotification } from "../utils/notification.js";

const form = document.querySelector("#login-form");
const submitButton = document.querySelector("#login-submit");
const message = document.querySelector("#auth-message");

const fields = {
  email: document.querySelector("#email"),
  password: document.querySelector("#password")
};

const errors = {
  email: document.querySelector("#email-error"),
  password: document.querySelector("#password-error")
};

const workspaceRole = document.querySelector("#workspaceRole");
const workspaceRoleIcon = document.querySelector("#workspaceRoleIcon");

const roleIcons = {
  student: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="m2 10 10-5 10 5-10 5-10-5Z"/>
      <path d="M6 12v5c3.5 3 8.5 3 12 0v-5"/>
      <path d="M22 10v6"/>
    </svg>
  `,
  placement_officer: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2"/>
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <path d="M3 12h18M10 12v2h4v-2"/>
    </svg>
  `,
  admin: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  `
};

function updateWorkspaceRoleIcon() {
  if (!workspaceRole || !workspaceRoleIcon) return;

  workspaceRoleIcon.innerHTML =
    roleIcons[workspaceRole.value] || roleIcons.student;
}

workspaceRole?.addEventListener("change", updateWorkspaceRoleIcon);
updateWorkspaceRoleIcon();

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `auth-message auth-message--${type}`;
  message.hidden = false;
}

function clearMessage() {
  message.textContent = "";
  message.className = "auth-message";
  message.hidden = true;
}

function setFieldError(name, text) {
  fields[name].setAttribute("aria-invalid", "true");
  errors[name].textContent = text;
}

function clearFieldError(name) {
  fields[name].removeAttribute("aria-invalid");
  errors[name].textContent = "";
}

function validateField(name) {
  const value = fields[name].value;
  const trimmed = value.trim();

  clearFieldError(name);

  if (name === "email") {
    if (!trimmed) {
      setFieldError(name, "Please enter your email address.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError(name, "Please enter a valid email address.");
      return false;
    }
  }

  if (name === "password" && !value) {
    setFieldError(name, "Please enter your password.");
    return false;
  }

  return true;
}

function validateForm() {
  const results = Object.keys(fields).map(validateField);
  const valid = results.every(Boolean);

  if (!valid) {
    form.querySelector('[aria-invalid="true"]')?.focus();
  }

  return valid;
}

// Validate fields as the user types.
for (const [name, input] of Object.entries(fields)) {
  input.addEventListener("input", () => {
    clearMessage();
    validateField(name);
  });

  input.addEventListener("blur", () => {
    if (input.value.length > 0) {
      validateField(name);
    }
  });
}

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(
      button.dataset.passwordToggle
    );

    if (!input) return;

    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    button.textContent = showPassword ? "Hide" : "Show";
    button.setAttribute("aria-pressed", String(showPassword));
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!validateForm()) return;

  submitButton.disabled = true;
  submitButton.textContent = "Signing in…";

  try {
    const selectedRole = workspaceRole?.value || "student";

    await authService.login(
      fields.email.value.trim(),
      fields.password.value
    );

    // Handles authenticated-user verification,
    // role validation, and role-based navigation.
    await redirectAfterLogin(selectedRole);

  } catch (error) {
    showMessage(
      error.message || "Unable to sign in. Please try again.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign in";
  }
});