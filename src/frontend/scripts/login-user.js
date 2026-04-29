import ApiError from "../common/api-error.js";
import {
    setFieldState,
    setStatus,
    validateEmail,
    initDarkMode,
    notifyError,
    notifyOnNextPage,
    parseApiResponse,
    getApiMessage,
} from "./ui.js";

const baseUrl = window.AUTH_API_BASE_URL || `${location.origin}/api/auth`;

const email = document.querySelector("#userEmail");
const password = document.querySelector("#userPassword");
const loginBtn = document.querySelector("#loginBtn");
const loginForm = document.querySelector("#loginForm");
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


//if user is already logged in and coming again to this page redirect it to home cause he is already logged in
// Guard: redirect already-logged-in users to home
(async () => {
    const token = localStorage.getItem("accessToken");

    // No token at all → definitely not logged in, stay on page
    if (!token) return;

    try {
        // Token exists → verify it's still valid with the server
        const res = await fetch(baseUrl + "/getme", {
            headers: { "Authorization": `Bearer ${token}` }
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
                credentials: "include"  // sends the refreshToken cookie
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
                }
            } else {
                // Refresh also failed → truly logged out → clear stale token
                localStorage.removeItem("accessToken");
            }
        }

    } catch {
        // Network error → just stay on the page, don't block the user
    }
})();

const errorElements = {
    email: document.querySelector("#userEmailError"),
    password: document.querySelector("#userPasswordError"),
};

function validateCredential() {
    let isValid = true;
    const trimmedEmail = email.value.trim();
    const passwordValue = password.value;

    setFieldState(email, errorElements.email);
    setFieldState(password, errorElements.password);
    setStatus(statusMessage);

    if (!trimmedEmail) {
        setFieldState(email, errorElements.email, "Email is required.");
        isValid = false;
    } else if (!validateEmail(trimmedEmail)) {
        setFieldState(email, errorElements.email, "Please enter a valid email address.");
        isValid = false;
    }

    if (!passwordValue) {
        setFieldState(password, errorElements.password, "Password is required.");
        isValid = false;
    } 
    // else if (!passwordPattern.test(passwordValue)) {
    //     setFieldState(password, errorElements.password, "Use 8+ chars with uppercase, lowercase, and a number.");
    //     isValid = false;
    // }

    return isValid;
}

async function loginUser() {
    try {
        loginBtn.disabled = true;
        loginBtn.classList.add("is-loading");
        setStatus(statusMessage, "Signing in...", "loading");

        const response = await fetch(baseUrl + "/login", {
            method: "POST",
            body: JSON.stringify({ email: email.value.trim(), password: password.value }),
            headers: { "Content-Type": "application/json" },
        });

        const info = await parseApiResponse(response);
        if (!response.ok) {
            const message = getApiMessage(
                info,
                "We could not sign you in. Please check your email and password.",
            );
            throw ApiError.badRequest(message);
        }

        loginForm.reset();
        // updatePasswordMeter(strengthBar, strengthText, "");
        // persist access token (short-lived) for API calls (consider more secure storage in production)
        // server responses wrap payload under `data` (ApiResponse)
        if (info?.data?.accessToken) {
            localStorage.setItem("accessToken", info.data.accessToken);
        }
        const successMessage = getApiMessage(info, "Login successful.");
        setStatus(statusMessage, successMessage, "success");
        notifyOnNextPage(successMessage, "success", { title: "Welcome Back" });
        // redirect to home/dashboard
        window.location.href = "/home.html";
    } catch (err) {
        const message = err.message || "We could not sign you in right now. Please try again.";
        setStatus(statusMessage, message, "error");
        notifyError(message, { title: "Login Failed" });
    } finally {
        loginBtn.disabled = false;
        loginBtn.classList.remove("is-loading");
    }
}

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateCredential()) loginUser();
});

[email, password].forEach((field) => {
    field.addEventListener("input", () => {
        validateCredential();
        // if (field === password) updatePasswordMeter(strengthBar, strengthText, password.value);
    });
});

togglePasswordBtn.addEventListener("click", () => {
    const nextType = password.type === "password" ? "text" : "password";
    password.type = nextType;
    togglePasswordBtn.setAttribute("aria-label", nextType === "password" ? "Show password" : "Hide password");
});

initDarkMode('#darkToggle');
// updatePasswordMeter(strengthBar, strengthText, password.value);
