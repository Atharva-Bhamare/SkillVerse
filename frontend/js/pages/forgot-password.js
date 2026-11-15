
import { authService } from "../auth/auth.service.js";

const form = document.getElementById("forgot-password-form");
const emailInput = document.getElementById("email");
const submitButton = document.getElementById("submit-button");
const messageElement = document.getElementById("form-message");

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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const email = emailInput.value.trim();

  if (!email) {
    showMessage("Please enter your email address.", "error");
    emailInput.focus();
    return;
  }

  if (!emailInput.checkValidity()) {
    showMessage("Please enter a valid email address.", "error");
    emailInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending reset link...";

  try {
    const response = await authService.forgotPassword(email);

    showMessage(
      response?.message ||
        "If an eligible account exists for this email, a password reset link will be sent.",
      "success"
    );

    form.reset();
  } catch (error) {
    showMessage(
        error?.message || "Unable to process your request. Please try again.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send reset link";
  }
});
