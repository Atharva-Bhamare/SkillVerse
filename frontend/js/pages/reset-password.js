
import { authService } from "../auth/auth.service.js";

const form = document.getElementById("reset-password-form");
const newPasswordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
const submitButton = document.getElementById("submit-button");
const messageElement = document.getElementById("form-message");

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

function showMessage(message, type) {
  messageElement.textContent = message;
  messageElement.className = `auth-message is-${type}`;
  messageElement.hidden = false;
}

function clearMessage() {
  messageElement.textContent = "";
  messageElement.hidden = true;
  messageElement.className = "auth-message";
}

function setFormDisabled(disabled) {
  newPasswordInput.disabled = disabled;
  confirmPasswordInput.disabled = disabled;
  submitButton.disabled = disabled;

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.disabled = disabled;
  });
}

// A valid reset token is a 64-character hexadecimal string.
const hasValidToken = token && /^[a-f0-9]{64}$/i.test(token);

if (!hasValidToken) {
  showMessage(
    "This password reset link is invalid. Please request a new reset link.",
    "error"
  );

  setFormDisabled(true);
}

document.querySelectorAll("[data-toggle-password]").forEach((button) => {
  button.addEventListener("click", () => {
    const inputId = button.dataset.togglePassword;
    const input = document.getElementById(inputId);

    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    button.textContent = isPassword ? "Hide" : "Show";
    button.setAttribute(
      "aria-label",
      `${isPassword ? "Hide" : "Show"} ${
        inputId === "new-password" ? "new password" : "confirm password"
      }`
    );
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!hasValidToken) {
    showMessage(
      "This password reset link is invalid. Please request a new one.",
      "error"
    );
    return;
  }

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword.length < 8) {
    showMessage(
      "Your password must contain at least 8 characters.",
      "error"
    );
    newPasswordInput.focus();
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    confirmPasswordInput.focus();
    return;
  }

  setFormDisabled(true);
  submitButton.textContent = "Resetting password...";

  try {
    const response = await authService.resetPassword({
      token,
      newPassword,
      confirmPassword,
    });

    form.reset();

    showMessage(
      response?.message ||
        "Your password has been reset successfully. You can now log in.",
      "success"
    );

    // The reset token is one-time use. Hide the form after success.
    form.querySelectorAll("input, button").forEach((element) => {
      element.disabled = true;
    });

    const loginLink = document.createElement("a");
    loginLink.href = "./login.html";
    loginLink.textContent = "Continue to login";
    loginLink.className = "reset-login-link";

    form.appendChild(loginLink);
  } catch (error) {
    showMessage(
        error?.message ||
        "Unable to reset your password. The link may have expired or already been used.",
      "error"
    );

    setFormDisabled(false);
    submitButton.textContent = "Reset password";
  }
});
