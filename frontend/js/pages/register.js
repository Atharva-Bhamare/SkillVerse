
import { authService } from "../auth/auth.service.js";
import { showNotification } from "../utils/notification.js";

const form = document.querySelector("#register-form");
const submitButton = document.querySelector("#register-submit");
const message = document.querySelector("#auth-message");

const fields = {
  fullName: document.querySelector("#fullName"),
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  confirmPassword: document.querySelector("#confirmPassword")
};

const errors = {
  fullName: document.querySelector("#fullName-error"),
  email: document.querySelector("#email-error"),
  password: document.querySelector("#password-error"),
  confirmPassword: document.querySelector("#confirmPassword-error")
};

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
  const input = fields[name];
  const value = input.value;
  const trimmed = value.trim();

  clearFieldError(name);

  if (name === "fullName") {
    if (!trimmed) {
      setFieldError(name, "Please enter your full name.");
      return false;
    }

    if (trimmed.length > 100) {
      setFieldError(name, "Your name must be 100 characters or fewer.");
      return false;
    }
  }

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
    setFieldError(name, "Please create a password.");
    return false;
  }

  if (name === "confirmPassword") {
    if (!value) {
      setFieldError(name, "Please confirm your password.");
      return false;
    }

    if (value !== fields.password.value) {
      setFieldError(name, "Passwords do not match.");
      return false;
    }
  }

  // Keep password confirmation synchronized when the
  // original password changes.
  if (name === "password" && fields.confirmPassword.value) {
    if (fields.confirmPassword.value !== value) {
      setFieldError("confirmPassword", "Passwords do not match.");
    } else {
      clearFieldError("confirmPassword");
    }
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
  submitButton.textContent = "Creating account…";

  try {
    await authService.register({
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      password: fields.password.value
    });

    showNotification("Account created successfully! Welcome to SkillVerse.");

    // Keep the success state visible until we implement
    // the final role-aware navigation flow.
  } catch (error) {
    showMessage(
      error.message || "Unable to create your account. Please try again."
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create student account";
  }
});
