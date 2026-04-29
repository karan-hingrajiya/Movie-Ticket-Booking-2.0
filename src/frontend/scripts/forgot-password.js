import ApiError from "../common/api-error.js";
import {
  setFieldState,
  setStatus,
  validateEmail,
  initDarkMode,
  notifyError,
  notifySuccess,
  parseApiResponse,
  getApiMessage,
} from "./ui.js";

const baseUrl = window.AUTH_API_BASE_URL || `${location.origin}/api/auth`;

const email = document.querySelector("#userEmail");
const form = document.querySelector("#forgotForm");
const btn = document.querySelector("#forgotBtn");
const status = document.querySelector("#formStatus");

const errorElements = {
  email: document.querySelector("#userEmailError"),
};

// VALIDATION
function validateForm() {
  let isValid = true;

  setFieldState(email, errorElements.email);
  setStatus(status);

  const value = email.value.trim();

  if (!value) {
    setFieldState(email, errorElements.email, "Email is required.");
    isValid = false;
  } else if (!validateEmail(value)) {
    setFieldState(email, errorElements.email, "Enter a valid email.");
    isValid = false;
  }

  return isValid;
}

// API CALL
async function sendResetLink() {
  try {
    btn.disabled = true;
    btn.classList.add("is-loading");
    setStatus(status, "Sending reset password link...", "loading");

    const res = await fetch(baseUrl + "/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value.trim() })
    });

    const data = await parseApiResponse(res);

    if (!res.ok) {
        throw ApiError.badRequest(
          getApiMessage(data, "We could not send the reset link."),
        );
    }

    form.reset();

    const successMessage = "Reset link sent. Check your email for the next step.";
    setStatus(status, successMessage, "success");
    notifySuccess(successMessage, { title: "Email Sent" });

    } catch (err) {
        const message =
          err.message || "We could not send the reset link right now.";
        setStatus(status, message, "error");
        notifyError(message, { title: "Request Failed" });
    } finally {
        btn.disabled = false;
        btn.classList.remove("is-loading");
    }
}

// EVENTS
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (validateForm()) sendResetLink();
});

email.addEventListener("input", validateForm);

// DARK MODE
initDarkMode("#darkToggle");
