
import { officerApplicationApi } from "../api/officer-application.api.js";

const form = document.querySelector("#officer-application-form");
const submitButton = document.querySelector("#application-submit");
const message = document.querySelector("#application-message");

const fieldNames = [
  "fullName",
  "email",
  "organizationName",
  "designation",
  "contactNumber",
  "reason",
  "password",
  "confirmPassword",
];

const fields = Object.fromEntries(
  fieldNames.map((name) => [
    name,
    document.getElementById(name),
  ])
);

const errors = Object.fromEntries(
  fieldNames.map((name) => [
    name,
    document.getElementById(`${name}-error`),
  ])
);

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

  switch (name) {
    case "fullName":
      if (!trimmed) {
        setFieldError(name, "Please enter your full name.");
        return false;
      }

      if (trimmed.length < 3 || trimmed.length > 50) {
        setFieldError(name, "Full name must be between 3 and 50 characters.");
        return false;
      }
      break;

    case "email":
      if (!trimmed) {
        setFieldError(name, "Please enter your email address.");
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setFieldError(name, "Please enter a valid email address.");
        return false;
      }
      break;

    case "organizationName":
      if (trimmed.length < 2 || trimmed.length > 100) {
        setFieldError(
          name,
          "Organization name must be between 2 and 100 characters."
        );
        return false;
      }
      break;

    case "designation":
      if (trimmed.length < 2 || trimmed.length > 100) {
        setFieldError(
          name,
          "Designation must be between 2 and 100 characters."
        );
        return false;
      }
      break;

    case "contactNumber":
      if (!/^\+?[0-9\s()-]{7,20}$/.test(trimmed)) {
        setFieldError(name, "Please enter a valid contact number.");
        return false;
      }
      break;

    case "reason":
      if (trimmed.length < 20 || trimmed.length > 1000) {
        setFieldError(
          name,
          "Your reason must be between 20 and 1000 characters."
        );
        return false;
      }
      break;

    case "password":
      if (value.length < 8) {
        setFieldError(
          name,
          "Password must contain at least 8 characters."
        );
        return false;
      }
      break;

    case "confirmPassword":
      if (!value) {
        setFieldError(name, "Please confirm your password.");
        return false;
      }

      if (value !== fields.password.value) {
        setFieldError(name, "Passwords do not match.");
        return false;
      }
      break;
  }

  // Keep password confirmation synchronized.
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
  const results = fieldNames.map(validateField);
  const valid = results.every(Boolean);

  if (!valid) {
    form.querySelector('[aria-invalid="true"]')?.focus();
  }

  return valid;
}

function showServerErrors(serverErrors) {
  if (!serverErrors || typeof serverErrors !== "object") {
    return;
  }

  for (const [name, text] of Object.entries(serverErrors)) {
    if (fields[name] && typeof text === "string") {
      setFieldError(name, text);
    }
  }
}

// Live validation.
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

// Password visibility controls.
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

const resendButton = document.querySelector("#resend-verification");

resendButton.addEventListener("click", async () => {
  resendButton.disabled = true;
  resendButton.textContent = "Sending…";

  try {
    await officerApplicationApi.resendVerification(
      fields.email.value.trim().toLowerCase()
    );

    showMessage(
      "If your application is eligible, a new verification email will be sent. Please check your inbox.",
      "success"
    );
  } catch (error) {
    showMessage(error.message || "Unable to resend the verification email.");
  } finally {
    resendButton.disabled = false;
    resendButton.textContent = "Resend verification email";
  }
});

// Submit application.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!validateForm()) return;

  const payload = {
    fullName: fields.fullName.value.trim(),
    email: fields.email.value.trim().toLowerCase(),
    password: fields.password.value,
    confirmPassword: fields.confirmPassword.value,
    organizationName: fields.organizationName.value.trim(),
    designation: fields.designation.value.trim(),
    contactNumber: fields.contactNumber.value.trim(),
    reason: fields.reason.value.trim(),
  };

  submitButton.disabled = true;
  submitButton.textContent = "Submitting application…";

  try {
    const response = await officerApplicationApi.submit(payload);
    const result = response?.data;

    if (!result) {
      throw new Error("The server returned an unexpected response.");
    }

    form.hidden = true;
    resendButton.hidden = result.emailSent;

    if (result.emailSent) {
      showMessage(
        "Your application has been submitted successfully! " +
        "Please check your inbox and verify your email address. " +
        "Your account will be reviewed by an administrator after verification.",
        "success"
      );
    } else {
      showMessage(
        "Your application has been saved, but we couldn't send the verification email. " +
        "Please contact the SkillVerse team for assistance.",
        "error"
      );
    }

    message.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  } catch (error) {
    showMessage(
      error.message || "Unable to submit your application. Please try again."
    );

    showServerErrors(error.details);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit application";
  }
});
