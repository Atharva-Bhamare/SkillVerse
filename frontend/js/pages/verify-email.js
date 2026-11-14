import { officerApplicationApi } from "../api/officer-application.api.js";

const elements = {
  icon: document.querySelector("#verify-icon"),
  spinner: document.querySelector("#verify-spinner"),
  eyebrow: document.querySelector("#verify-eyebrow"),
  title: document.querySelector("#verify-title"),
  description: document.querySelector("#verify-description"),
  status: document.querySelector("#verify-status"),
  statusText: document.querySelector("#verify-status-text"),
  nextStep: document.querySelector("#verify-next-step"),
  resendSection: document.querySelector("#verify-resend"),
  resendForm: document.querySelector("#resend-form"),
  resendEmail: document.querySelector("#resend-email"),
  resendEmailError: document.querySelector("#resend-email-error"),
  resendButton: document.querySelector("#resend-button"),
  resendMessage: document.querySelector("#resend-message"),
  actions: document.querySelector("#verify-actions"),
  primaryAction: document.querySelector("#verify-primary-action"),
  journeyApplication: document.querySelector("#journey-application"),
  journeyEmail: document.querySelector("#journey-email"),
  journeyReview: document.querySelector("#journey-review"),
};

function setStatus(message, type = "loading") {
  elements.statusText.textContent = message;
  elements.status.classList.remove(
    "verify-status-success",
    "verify-status-error"
  );

  if (type === "success") {
    elements.status.classList.add("verify-status-success");
  } else if (type === "error") {
    elements.status.classList.add("verify-status-error");
  }
}

function updateJourney(type) {
  const { journeyApplication, journeyEmail, journeyReview } = elements;

  journeyApplication.classList.remove("is-active", "is-completed");
  journeyEmail.classList.remove("is-active", "is-completed");
  journeyReview.classList.remove("is-active", "is-completed");

  if (type === "success") {
    journeyApplication.classList.add("is-completed");
    journeyEmail.classList.add("is-completed");
    journeyReview.classList.add("is-active");

    journeyApplication.querySelector(".verify-journey-marker span").textContent = "✓";
    journeyEmail.querySelector(".verify-journey-marker span").textContent = "✓";
    journeyReview.querySelector(".verify-journey-marker span").textContent = "3";
    return;
  }

  journeyApplication.classList.add("is-completed");
  journeyEmail.classList.add("is-active");

  journeyApplication.querySelector(".verify-journey-marker span").textContent = "✓";
  journeyEmail.querySelector(".verify-journey-marker span").textContent = "2";
  journeyReview.querySelector(".verify-journey-marker span").textContent = "3";
}

function setIcon(type) {
  elements.icon.classList.remove(
    "verify-icon-loading",
    "verify-icon-success",
    "verify-icon-error"
  );

  elements.icon.replaceChildren();

  if (type === "loading") {
    elements.icon.classList.add("verify-icon-loading");
    const spinner = document.createElement("span");
    spinner.className = "verify-spinner";
    elements.icon.appendChild(spinner);
    return;
  }

  const symbol = document.createElement("span");
  symbol.className = "verify-symbol";

  if (type === "success") {
    elements.icon.classList.add("verify-icon-success");
    symbol.textContent = "✓";
  } else {
    elements.icon.classList.add("verify-icon-error");
    symbol.textContent = "!";
  }

  elements.icon.appendChild(symbol);
}

function showVerificationSuccess() {
  setIcon("success");
  updateJourney("success");

  elements.eyebrow.textContent = "EMAIL VERIFIED";
  elements.title.textContent = "Email verified successfully!";
  elements.description.textContent =
    "Your email address has been verified. Your Placement Officer application is now ready for administrative review.";

  setStatus("Email verification completed", "success");

  elements.nextStep.hidden = false;
  elements.resendSection.hidden = true;
  elements.actions.hidden = false;
  elements.primaryAction.textContent = "Back to SkillVerse";
  elements.primaryAction.href = "./index.html";
}

function showVerificationError(message) {
  setIcon("error");
  updateJourney("error");

  elements.eyebrow.textContent = "VERIFICATION NOT COMPLETED";
  elements.title.textContent = "We couldn't verify your email";
  elements.description.textContent = message;

  setStatus("Email verification unsuccessful", "error");

  elements.nextStep.hidden = true;
  elements.resendSection.hidden = false;
  elements.actions.hidden = false;

  elements.primaryAction.textContent = "Back to home";
  elements.primaryAction.href = "./index.html";
}

function showResendMessage(message, type) {
  elements.resendMessage.textContent = message;
  elements.resendMessage.classList.remove("success", "error");

  if (type) {
    elements.resendMessage.classList.add(type);
  }
}

function clearResendEmailError() {
  elements.resendEmailError.textContent = "";
  elements.resendEmail.removeAttribute("aria-invalid");
}

function validateResendEmail() {
  const email = elements.resendEmail.value.trim();

  clearResendEmailError();

  if (!email) {
    elements.resendEmailError.textContent = "Please enter your email address.";
    elements.resendEmail.setAttribute("aria-invalid", "true");
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    elements.resendEmailError.textContent =
      "Please enter a valid email address.";
    elements.resendEmail.setAttribute("aria-invalid", "true");
    return false;
  }

  return true;
}

async function verifyEmail() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    showVerificationError(
      "This verification link is missing its token. You can request a new verification email below."
    );
    return;
  }

  try {
    setIcon("loading");
    setStatus("Verifying your email address...");

    const response = await officerApplicationApi.verifyEmail(token);

    if (!response?.success) {
      throw new Error(
        response?.message || "The email verification could not be completed."
      );
    }

    showVerificationSuccess();
  } catch (error) {
    console.error("Email verification failed:", error);

    showVerificationError(
      error.message ||
        "This verification link may have expired or already been used. You can request a new link below."
    );
  }
}

elements.resendEmail.addEventListener("input", () => {
  clearResendEmailError();
  showResendMessage("", null);
});

elements.resendForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateResendEmail()) {
    return;
  }

  const email = elements.resendEmail.value.trim().toLowerCase();

  elements.resendButton.disabled = true;
  elements.resendButton.textContent = "Sending...";
  showResendMessage("", null);

  try {
    const response = await officerApplicationApi.resendVerification(email);

    showResendMessage(
      response?.message ||
        "If your application is eligible, a new verification email will be sent. Please check your inbox.",
      "success"
    );
  } catch (error) {
    console.error("Resending verification email failed:", error);

    showResendMessage(
      error.message || "Unable to resend the verification email. Please try again later.",
      "error"
    );
  } finally {
    elements.resendButton.disabled = false;
    elements.resendButton.textContent = "Resend verification email";
  }
});

verifyEmail();
