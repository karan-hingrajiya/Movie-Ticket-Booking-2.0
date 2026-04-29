import ApiError from "../common/api-error.js";
import {
  setFieldState,
  setStatus,
  updatePasswordMeter,
  passwordPattern,
  validateEmail,
  initDarkMode,
  notifyError,
  notifySuccess,
  parseApiResponse,
  getApiMessage,
} from "./ui.js";

const baseUrl = window.AUTH_API_BASE_URL || `${location.origin}/api/auth`;

const name = document.querySelector("#userName");
const email = document.querySelector("#userEmail");
const password = document.querySelector("#userPassword");
const registerBtn = document.querySelector("#registerBtn");
const registerForm = document.querySelector("#registerForm");
const statusMessage = document.querySelector("#formStatus");
const strengthBar = document.querySelector("#passwordStrengthBar");
const strengthText = document.querySelector("#passwordStrengthText");
const togglePasswordBtn = document.querySelector("#togglePassword");

function extractToken(payload) {
  if (!payload) return null;
  if (typeof payload.data === "string") return payload.data;
  if (payload?.data?.accessToken) return payload.data.accessToken;
  if (payload.accessToken) return payload.accessToken;
  return null;
}

// Guard: redirect already-logged-in users to home
(async () => {
  const token = localStorage.getItem("accessToken");

  // No token at all → definitely not logged in, stay on page
  if (!token) return;

  try {
    // Token exists → verify it's still valid with the server
    const res = await fetch(baseUrl + "/getme", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      // Token is valid → user is logged in → send them away
      window.location.replace("/home.html");
      return;
    }

    // Token is expired (401) → try silent refresh using the cookie
    if (res.status === 401) {
      const refreshRes = await fetch(baseUrl + "/refresh-token", {
        method: "POST",
        credentials: "include", // sends the refreshToken cookie
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        // Got a new accessToken → save it and redirect
        const refreshedToken = extractToken(data);
        if (refreshedToken) {
          localStorage.setItem("accessToken", refreshedToken);
          window.location.replace("/home.html");
        } else {
          localStorage.removeItem("accessToken");
          window.location.replace("/login.html");
        }
      } else {
        // Refresh also failed → truly logged out → clear stale token
        localStorage.removeItem("accessToken");
        window.location.replace("/login.html");
      }
    }
  } catch {
    // Network error → just stay on the page, don't block the user
  }
})();

const errorElements = {
  name: document.querySelector("#userNameError"),
  email: document.querySelector("#userEmailError"),
  password: document.querySelector("#userPasswordError"),
};

function validateCredential() {
  let isValid = true;
  const trimmedName = name.value.trim();
  const trimmedEmail = email.value.trim();
  const passwordValue = password.value;

  setFieldState(name, errorElements.name);
  setFieldState(email, errorElements.email);
  setFieldState(password, errorElements.password);
  setStatus(statusMessage);

  if (!trimmedName) {
    setFieldState(name, errorElements.name, "Name is required.");
    isValid = false;
  } else if (trimmedName.length < 2) {
    setFieldState(
      name,
      errorElements.name,
      "Name must be at least 2 characters.",
    );
    isValid = false;
  }

  if (!trimmedEmail) {
    setFieldState(email, errorElements.email, "Email is required.");
    isValid = false;
  } else if (!validateEmail(trimmedEmail)) {
    setFieldState(
      email,
      errorElements.email,
      "Please enter a valid email address.",
    );
    isValid = false;
  }

  if (!passwordValue) {
    setFieldState(password, errorElements.password, "Password is required.");
    isValid = false;
  } else if (!passwordPattern.test(passwordValue)) {
    setFieldState(
      password,
      errorElements.password,
      "Use 8+ chars with uppercase, lowercase, and a number.",
    );
    isValid = false;
  }

  return isValid;
}

async function registerUser() {
  try {
    registerBtn.disabled = true;
    registerBtn.classList.add("is-loading");
    setStatus(statusMessage, "Creating your account...", "loading");

    const response = await fetch(baseUrl + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
      }),
    });

    const info = await parseApiResponse(response);
    if (!response.ok) {
      const message = getApiMessage(
        info,
        "We could not create your account right now.",
      );
      throw ApiError.badRequest(message);
    }

    registerForm.reset();

    updatePasswordMeter(strengthBar, strengthText, "");
    const successMessage = "Account created successfully. Please check your email to verify it.";
    setStatus(statusMessage, successMessage, "success");
    notifySuccess(successMessage, { title: "Account Created" });
    // remember on this browser that an account exists
    try {
      localStorage.setItem("hasAccount", "true");
    } catch (e) {
      /* ignore */
    }

    // ? do verify-email page
  } catch (err) {
    const message =
      err.message || "We could not create your account. Please try again.";
    setStatus(statusMessage, message, "error");
    notifyError(message, { title: "Registration Failed" });
  } finally {
    registerBtn.disabled = false;
    registerBtn.classList.remove("is-loading");
    // do not redirect here — only redirect on success
  }
}

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (validateCredential()) registerUser();
});

[name, email, password].forEach((field) => {
  field.addEventListener("input", () => {
    validateCredential();
    if (field === password)
      updatePasswordMeter(strengthBar, strengthText, password.value);
  });
});

togglePasswordBtn.addEventListener("click", () => {
  const nextType = password.type === "password" ? "text" : "password";
  password.type = nextType;
  togglePasswordBtn.setAttribute(
    "aria-label",
    nextType === "password" ? "Show password" : "Hide password",
  );
});

initDarkMode("#darkToggle");
updatePasswordMeter(strengthBar, strengthText, password.value);
