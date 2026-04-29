import ApiError from "../common/api-error.js";
import {
  setFieldState,
  setStatus,
  validatePassword,
  initDarkMode,
  updatePasswordMeter,
  notifyError,
  notifySuccess,
  parseApiResponse,
  getApiMessage,
} from "./ui.js";

const baseUrl = window.AUTH_API_BASE_URL || `${location.origin}/api/auth`;

const password = document.querySelector("#userPassword");
const form = document.querySelector("#resetForm");
const btn = document.querySelector("#resetBtn");
const status = document.querySelector("#formStatus");

const strengthBar = document.querySelector("#strengthBar");
const strengthText = document.querySelector("#strengthText");

const errorElements = {
  password: document.querySelector("#userPasswordError"),
};

// 🔐 GET TOKEN FROM URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

// VALIDATION
function validateForm() {
  let isValid = true;

  setFieldState(password, errorElements.password);
  setStatus(status);

  const value = password.value.trim();

  if (!value) {
    setFieldState(password, errorElements.password, "Password is required.");
    isValid = false;
  } else if (!validatePassword(value)) {
    setFieldState(
      password,
      errorElements.password,
      "Must be 8+ chars with uppercase, number & symbol.",
    );
    isValid = false;
  }

  return isValid;
}

// API CALL
async function resetPassword() {
  try {
    if (!token) {
      throw ApiError.badRequest("Invalid or expired reset link.");
    }

    btn.disabled = true;
    btn.classList.add("is-loading");

    setStatus(status, "Updating password...", "loading");

    const res = await fetch(
      `${baseUrl}/reset-password/${encodeURIComponent(token)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: password.value.trim(),
        }),
      },
    );

    const data = await parseApiResponse(res);

    if (!res.ok) {
      throw ApiError.badRequest(
        getApiMessage(data, "We could not reset your password."),
      );
    }

    form.reset();
    updatePasswordMeter(strengthBar, strengthText, "");

    const successMessage = "Password updated successfully. You can sign in now.";
    setStatus(status, successMessage, "success");
    notifySuccess(successMessage, { title: "Password Updated" });

    // optional redirect after delay
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1500);
    
  } catch (err) {
    const message =
      err.message || "We could not update your password right now.";
    setStatus(status, message, "error");
    notifyError(message, { title: "Reset Failed" });
  } finally {
    btn.disabled = false;
    btn.classList.remove("is-loading");
  }
}

// EVENTS
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (validateForm()) resetPassword();
});

password.addEventListener("input", () => {
  updatePasswordMeter(strengthBar, strengthText, password.value);
  validateForm();
});

// 👁 TOGGLE PASSWORD
document.querySelector("#togglePassword").addEventListener("click", () => {
  password.type = password.type === "password" ? "text" : "password";
});

// DARK MODE
initDarkMode("#darkToggle");

// INIT
updatePasswordMeter(strengthBar, strengthText, password.value);
