
import { authService } from "../auth/auth.service.js";

export function initializeAccountSecurity(loginUrl = "../login.html") {
  const form = document.querySelector("#change-password-form");

  if (!form) return;

  const currentPasswordInput = document.querySelector("#current-password");
  const newPasswordInput = document.querySelector("#new-password");
  const confirmPasswordInput = document.querySelector("#confirm-password");
  const submitButton = document.querySelector("#change-password-button");
  const feedback = document.querySelector("#password-feedback");

  function showFeedback(message, type = "error") {
    feedback.textContent = message;
    feedback.className = `account-security-feedback is-${type}`;
    feedback.hidden = false;
  }

  function clearFeedback() {
    feedback.textContent = "";
    feedback.className = "account-security-feedback";
    feedback.hidden = true;
  }

  function setFormDisabled(disabled) {
    form.querySelectorAll("input, button").forEach((element) => {
      element.disabled = disabled;
    });
  }

  // Show / Hide password controls
  form.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);

      if (!input) return;

      const showPassword = input.type === "password";

      input.type = showPassword ? "text" : "password";
      button.textContent = showPassword ? "Hide" : "Show";

      const fieldName = input.labels?.[0]?.textContent || "password";
      button.setAttribute(
        "aria-label",
        `${showPassword ? "Hide" : "Show"} ${fieldName.toLowerCase()}`
      );
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback();

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showFeedback("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      showFeedback("Your new password must contain at least 8 characters.");
      newPasswordInput.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      showFeedback("Your new passwords do not match.");
      confirmPasswordInput.focus();
      return;
    }

    if (currentPassword === newPassword) {
      showFeedback("Your new password must be different from your current password.");
      newPasswordInput.focus();
      return;
    }

    setFormDisabled(true);
    submitButton.textContent = "Updating password...";

    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      showFeedback(
        response?.message ||
          "Password changed successfully. Please log in again.",
        "success"
      );

      form.reset();
      authService.clearLocalSession();

      window.setTimeout(() => {
        window.location.replace(loginUrl);
      }, 1800);
    } catch (error) {
      showFeedback(
        error?.message || "Unable to change your password. Please try again.",
        "error"
      );

      setFormDisabled(false);
      submitButton.textContent = "Update password";
    }
  });
}
