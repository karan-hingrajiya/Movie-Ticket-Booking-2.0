import {
  initDarkMode,
  notifyError,
  notifySuccess,
  notifyWarning,
  parseApiResponse,
  getApiMessage,
} from "./ui.js";

/* ================================================================
   VERIFY-EMAIL.JS — ZohoCine Email Verification Handler
   ================================================================
   
   Flow:
   1. On page load, extract token from URL query parameter
   2. If no token → show "Missing Token" state
   3. If token exists → call API to verify
   4. On success → show success state + countdown redirect to login
   5. On error → show error state with appropriate message
   
   ================================================================ */


(function () {
  "use strict";

  // ─────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────
  const API_BASE = window.AUTH_API_BASE_URL || `${location.origin}/api/auth`;
  const REDIRECT_DELAY = 5; // seconds before auto-redirect to login

  // ─────────────────────────────────────────────────────────────
  // DOM Elements
  // ─────────────────────────────────────────────────────────────
  const loadingState = document.getElementById("loadingState");
  const successState = document.getElementById("successState");
  const errorState = document.getElementById("errorState");
  const noTokenState = document.getElementById("noTokenState");
  const errorMessage = document.getElementById("errorMessage");
  const countdownEl = document.getElementById("countdown");
  // ─────────────────────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────────────────────
  function showState(stateName) {
    // Hide all states
    loadingState.style.display = "none";
    successState.style.display = "none";
    errorState.style.display = "none";
    noTokenState.style.display = "none";

    // Show requested state
    switch (stateName) {
      case "loading":
        loadingState.style.display = "flex";
        break;
      case "success":
        successState.style.display = "flex";
        break;
      case "error":
        errorState.style.display = "flex";
        break;
      case "no-token":
        noTokenState.style.display = "flex";
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Countdown & Redirect
  // ─────────────────────────────────────────────────────────────
  function startCountdown() {
    let seconds = REDIRECT_DELAY;
    countdownEl.textContent = seconds;

    const interval = setInterval(() => {
      seconds--;
      countdownEl.textContent = seconds;

      if (seconds <= 0) {
        clearInterval(interval);
        window.location.href = "/login.html";
      }
    }, 1000);
  }

  // ─────────────────────────────────────────────────────────────
  // API Call to Verify Email
  // ─────────────────────────────────────────────────────────────
  async function verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE}/verify-email/${token}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await parseApiResponse(response);

      if (response.ok) {
        // Success!
        showState("success");
        notifySuccess("Your email has been verified successfully.", {
          title: "Email Verified",
        });
        startCountdown();
      } else {
        // API returned an error
        showState("error");
        const message = getApiMessage(
          data,
          "The verification link may have expired or is invalid. Please request a new one.",
        );
        errorMessage.textContent = message;
        notifyError(message, { title: "Verification Failed" });
      }
    } catch (err) {
      // Network or other error
      console.error("Verification error:", err);
      showState("error");
      const message =
        "Unable to connect to the server. Please check your connection and try again.";
      errorMessage.textContent = message;
      notifyError(message, { title: "Connection Problem" });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Extract Token from URL
  // ─────────────────────────────────────────────────────────────
  function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("token");
  }

  // ─────────────────────────────────────────────────────────────
  // Initialize
  // ─────────────────────────────────────────────────────────────
  function init() {
    initDarkMode("#darkToggle");

    const token = getTokenFromURL();

    if (!token) {
      // No token in URL → show warning state
      showState("no-token");
      notifyWarning(
        "This verification link is incomplete. Please open the full link from your email.",
        { title: "Missing Verification Token" },
      );
      return;
    }

    // Token exists → show loading and verify
    showState("loading");

    // Small delay to show loading animation (better UX)
    setTimeout(() => {
      verifyEmail(token);
    }, 1500);
  }

  // ─────────────────────────────────────────────────────────────
  // Start on DOM ready
  // ─────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
