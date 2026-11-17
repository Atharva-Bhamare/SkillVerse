
import { authService } from "../auth/auth.service.js";
import { showNotification } from "../utils/notification.js";

const form = document.querySelector("#register-form");
const submitButton = document.querySelector("#register-submit");
const message = document.querySelector("#auth-message");

const sendOtpButton = document.querySelector("#send-registration-otp");
const verifyOtpButton = document.querySelector("#verify-registration-otp");
const resendOtpButton = document.querySelector("#resend-registration-otp");

const otpSection = document.querySelector("#registration-otp-section");
const otpInput = document.querySelector("#registration-otp");
const otpError = document.querySelector("#registration-otp-error");

const emailStatus = document.querySelector("#email-verification-status");
const resendStatus = document.querySelector("#registration-resend-status");
const emailRow = document.querySelector(".registration-email-row");

const fields = {
  fullName: document.querySelector("#fullName"),
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  confirmPassword: document.querySelector("#confirmPassword"),
};

const errors = {
  fullName: document.querySelector("#fullName-error"),
  email: document.querySelector("#email-error"),
  password: document.querySelector("#password-error"),
  confirmPassword: document.querySelector("#confirmPassword-error"),
};

let verifiedEmail = null;
let registrationToken = null;
let otpSentForEmail = null;
let resendTimer = null;
let isSendingOtp = false;
let isVerifyingOtp = false;
let isRegistering = false;
let registeredEmail = null;

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

function setOtpError(text) {
  otpInput.setAttribute("aria-invalid", "true");
  otpError.textContent = text;
}

function clearOtpError() {
  otpInput.removeAttribute("aria-invalid");
  otpError.textContent = "";
}

function getNormalizedEmail() {
  return fields.email.value.trim().toLowerCase();
}

function setEmailStatus(text, type = "success") {
  emailStatus.textContent = text;
  emailStatus.className =
    `registration-verification-status registration-verification-status--${type}`;
  emailStatus.hidden = !text;
}

function updateRegistrationButton() {
  const isVerified = Boolean(
    registrationToken &&
    verifiedEmail === getNormalizedEmail()
  );

  submitButton.disabled = !isVerified || isRegistering;

  submitButton.textContent = isVerified
    ? "Create student account"
    : "Verify your email first";

  return isVerified;
}

function stopResendTimer() {
  if (resendTimer) {
    clearInterval(resendTimer);
    resendTimer = null;
  }

  resendOtpButton.disabled = true;
  resendStatus.textContent = "Didn't receive the code?";
}

function startResendTimer(seconds = 60) {
  stopResendTimer();

  let remaining = seconds;

  resendOtpButton.disabled = true;
  resendStatus.textContent = `Resend available in ${remaining}s`;

  resendTimer = setInterval(() => {
    remaining -= 1;

    if (remaining <= 0) {
      stopResendTimer();
      resendOtpButton.disabled = false;
      resendStatus.textContent = "You can request another code now.";
      return;
    }

    resendStatus.textContent = `Resend available in ${remaining}s`;
  }, 1000);
}

function resetEmailVerification() {
  verifiedEmail = null;
  registrationToken = null;
  otpSentForEmail = null;

  stopResendTimer();

  otpSection.hidden = true;
  otpInput.value = "";

  clearOtpError();

  setEmailStatus("");
  emailRow.classList.remove("is-verified");

  sendOtpButton.disabled = false;
  sendOtpButton.textContent = "Verify";

  updateRegistrationButton();
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

    if (trimmed.length < 3 || trimmed.length > 100) {
      setFieldError(
        name,
        "Your name must be between 3 and 100 characters."
      );
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

  if (name === "password") {
    if (!value) {
      setFieldError(name, "Please create a password.");
      return false;
    }

    if (value.length < 8) {
      setFieldError(name, "Password must be at least 8 characters long.");
      return false;
    }
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

// Extract data from the standard API response envelope.
function getResponseData(response) {
  return (
    response?.data?.data ??
    response?.data ??
    response?.result ??
    response
  );
}

// Validate registration fields as the user types.
for (const [name, input] of Object.entries(fields)) {
  input.addEventListener("input", () => {
    clearMessage();
    validateField(name);
  
    if (name === "email") {
      const currentEmail = getNormalizedEmail();
  
      // Clear the duplicate-email block when the email changes.
      if (registeredEmail && currentEmail !== registeredEmail) {
        registeredEmail = null;
        sendOtpButton.disabled = false;
        sendOtpButton.textContent = "Verify";
        setEmailStatus("");
      }
  
      const emailHasChanged =
        (verifiedEmail && currentEmail !== verifiedEmail) ||
        (otpSentForEmail && currentEmail !== otpSentForEmail);
  
      if (emailHasChanged) {
        resetEmailVerification();
  
        setEmailStatus(
          "Email address changed. Please verify this email address again.",
          "info"
        );
      }
  
      updateRegistrationButton();
    }
  });

  input.addEventListener("blur", () => {
    if (name === "email") {
      input.value = input.value.trim().toLowerCase();
    }

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

// Send registration OTP.
async function sendRegistrationOtp(isResend = false) {
  clearMessage();

  if (!validateField("email")) {
    fields.email.focus();
    return;
  }

  const email = getNormalizedEmail();

  // Do not request another OTP for a known registered email.
  if (registeredEmail === email) {
    return;
  }

  if (verifiedEmail === email && registrationToken) {
    return;
  }

  if (otpSentForEmail === email && !isResend) {
    return;
  }

  if (isSendingOtp) return;

  isSendingOtp = true;
  sendOtpButton.disabled = true;
  sendOtpButton.textContent = "Checking...";

  try {
    await authService.sendRegistrationOtp(email);

    // Ignore a response belonging to an old email.
    if (email !== getNormalizedEmail()) return;

    otpSentForEmail = email;

    otpSection.hidden = false;
    otpInput.value = "";

    clearOtpError();

    startResendTimer(60);

    setEmailStatus(
      "If this email is eligible, a verification code has been sent. Check your inbox and spam folder.",
      "info"
    );

    sendOtpButton.disabled = true;
    sendOtpButton.textContent = "Code sent";

    otpInput.focus();

  } catch (error) {
    if (email !== getNormalizedEmail()) return;

    if (error?.status === 409) {
      registeredEmail = email;

      // Remove any previous OTP or verification state.
      resetEmailVerification();

      // Restore the duplicate-email block after resetting.
      registeredEmail = email;

      sendOtpButton.disabled = true;
      sendOtpButton.textContent = "Already registered";

      setEmailStatus(
        "This email is already registered. Please login instead.",
        "error"
      );

      return;
    }

    showMessage(
      error?.message ||
      "Unable to send the verification code. Please try again."
    );

  } finally {
    isSendingOtp = false;

    // Never re-enable Verify for an existing registered email.
    if (registeredEmail === getNormalizedEmail()) {
      sendOtpButton.disabled = true;
      sendOtpButton.textContent = "Already registered";
    } else if (
      otpSentForEmail !== getNormalizedEmail() &&
      verifiedEmail !== getNormalizedEmail()
    ) {
      sendOtpButton.disabled = false;
      sendOtpButton.textContent = "Verify";
    }
  }
}

sendOtpButton.addEventListener("click", sendRegistrationOtp);

resendOtpButton.addEventListener("click", async () => {
  if (resendOtpButton.disabled) return;

  // Resending is allowed even when the original Verify button is disabled.
  await sendRegistrationOtp(true);
});

// Keep the OTP input uppercase and alphanumeric.
otpInput.addEventListener("input", () => {
  otpInput.value = otpInput.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  clearOtpError();
  clearMessage();
});

// Verify the registration OTP.
verifyOtpButton.addEventListener("click", async () => {
  clearMessage();
  clearOtpError();

  if (!otpSection.hidden && !/^[A-Z0-9]{6}$/.test(otpInput.value)) {
    setOtpError("Enter a valid six-character verification code.");
    otpInput.focus();
    return;
  }

  if (isVerifyingOtp) return;

  const email = getNormalizedEmail();
  const otp = otpInput.value;

  isVerifyingOtp = true;
  verifyOtpButton.disabled = true;
  verifyOtpButton.textContent = "Verifying...";

  try {
    const response = await authService.verifyRegistrationOtp({
      email,
      otp,
    });

    const data = getResponseData(response);
    const token = data?.registrationToken;

    if (!token || typeof token !== "string") {
      throw new Error(
        "The server did not return a registration verification token."
      );
    }

    if (email !== getNormalizedEmail()) {
      throw new Error(
        "The email address changed. Please verify the current address."
      );
    }

    verifiedEmail = email;
    registrationToken = token;

    otpSection.hidden = true;
    stopResendTimer();

    emailRow.classList.add("is-verified");

    sendOtpButton.disabled = true;
    sendOtpButton.textContent = "Verified";

    setEmailStatus(
      "Your email address has been verified successfully.",
      "success"
    );

    updateRegistrationButton();

    showNotification("Email verified successfully!");

  } catch (error) {
    setOtpError(
      error?.message || "Unable to verify the code. Please try again."
    );
  } finally {
    isVerifyingOtp = false;
    verifyOtpButton.disabled = false;
    verifyOtpButton.textContent = "Verify Code";
  }
});

// Submit the registration form.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!validateForm()) return;

  if (
    !registrationToken ||
    verifiedEmail !== getNormalizedEmail()
  ) {
    showMessage("Please verify your email address before registering.");
    fields.email.focus();
    return;
  }

  if (isRegistering) return;

  isRegistering = true;
  submitButton.disabled = true;
  submitButton.textContent = "Creating account...";

  try {
    await authService.register({
      fullName: fields.fullName.value.trim(),
      email: getNormalizedEmail(),
      password: fields.password.value,
      confirmPassword: fields.confirmPassword.value,
      registrationToken,
    });

    registrationToken = null;
    verifiedEmail = null;

    showNotification(
      "Account created successfully! Welcome to SkillVerse."
    );

    form.reset();
    resetEmailVerification();

  } catch (error) {
    showMessage(
      error?.message || "Unable to create your account. Please try again."
    );
  } finally {
    isRegistering = false;
    updateRegistrationButton();
  }
});

// Registration is disabled until email verification succeeds.
updateRegistrationButton();
