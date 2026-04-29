import {
  initDarkMode,
  notifyError,
  notifyOnNextPage,
  notifySuccess,
  parseApiResponse,
  getApiMessage,
} from "./ui.js";

/* ========================================
   PROFILE.JS - ZohoCine User Profile Page
======================================== */

(function () {
  "use strict";

  // API Base URL - configurable
  const API_BASE_URL = window.AUTH_API_BASE_URL || `${location.origin}/api/auth`;

  // Profile Manager
  const ProfileManager = {
    init() {
      this.loadingState = document.getElementById("loading-state");
      this.errorState = document.getElementById("error-state");
      this.profileContent = document.getElementById("profile-content");
      this.errorMessage = document.getElementById("error-message");

      this.checkAuth();
    },

    checkAuth() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/login.html";
        return;
      }

      this.fetchProfile(token);
    },

    async fetchProfile(token) {
      try {
        const response = await fetch(`${API_BASE_URL}/getme`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
          // Token might be expired, try to refresh
          if (response.status === 401) {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              return this.fetchProfile(localStorage.getItem("accessToken"));
            }
            throw new Error("Session expired. Please login again.");
          }
          throw new Error(
            getApiMessage(data, "We could not load your profile right now."),
          );
        }

        this.renderProfile(data.data);
      } catch (error) {
        this.showError(error.message);
      }
    },

    async refreshToken() {
      try {
        const response = await fetch(`${API_BASE_URL}/refresh-token`, {
          method: "POST",
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.data) {
          localStorage.setItem("accessToken", data.data);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    renderProfile(user) {
      // Hide loading, show content
      this.loadingState.style.display = "none";
      this.errorState.style.display = "none";
      this.profileContent.style.display = "flex";

      // Avatar initials
      const initials = this.getInitials(user.name);
      document.getElementById("avatar-initials").textContent = initials;
      document.getElementById("user-avatar").title = user.name;

      // Basic info
      document.getElementById("user-name").textContent = user.name;
      document.getElementById("user-email").textContent = user.email;

      // Role badge
      const roleEl = document.getElementById("user-role");
      roleEl.textContent = this.capitalizeFirst(user.role);

      // Verified status
      const verifiedBadge = document.getElementById("verified-badge");
      const verificationStatus = document.getElementById("verification-status");

      if (user.isVerified) {
        verifiedBadge.style.display = "flex";
        verificationStatus.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          Verified
        `;
        verificationStatus.classList.remove("badge-unverified");
        verificationStatus.classList.add("badge-verified");
      } else {
        verifiedBadge.style.display = "none";
        verificationStatus.textContent = "Not Verified";
        verificationStatus.classList.remove("badge-verified");
        verificationStatus.classList.add("badge-unverified");
        verificationStatus.style.background = "rgba(239, 68, 68, 0.15)";
        verificationStatus.style.color = "#ef4444";
      }

      // Stats
      const createdAt = new Date(user.createdAt);
      document.getElementById("member-since").textContent = this.formatDate(
        createdAt,
        "short",
      );
      document.getElementById("account-status").textContent = user.isVerified
        ? "Active"
        : "Pending";
      document.getElementById("membership-tier").textContent =
        user.role === "admin" ? "Premium" : "Standard";

      // Details
      document.getElementById("detail-name").textContent = user.name;
      document.getElementById("detail-email").textContent = user.email;
      document.getElementById("detail-role").textContent = this.capitalizeFirst(
        user.role,
      );
      document.getElementById("detail-verified").textContent = user.isVerified
        ? "Yes"
        : "No";
      document.getElementById("detail-created").textContent = this.formatDate(
        createdAt,
        "long",
      );

      if (user.updatedAt) {
        const updatedAt = new Date(user.updatedAt);
        document.getElementById("detail-updated").textContent = this.formatDate(
          updatedAt,
          "long",
        );
      } else {
        document.getElementById("detail-updated").textContent = "Never";
      }

      // Setup logout
      this.setupLogout();

      // Show welcome toast
      notifySuccess(`Welcome back, ${user.name.split(" ")[0]}!`, {
        title: "Profile Ready",
      });
    },

    showError(message) {
      this.loadingState.style.display = "none";
      this.profileContent.style.display = "none";
      this.errorState.style.display = "flex";
      this.errorMessage.textContent = message;
      notifyError(message, { title: "Profile Unavailable" });

      // Setup retry button
      document.getElementById("retry-btn").addEventListener("click", () => {
        this.errorState.style.display = "none";
        this.loadingState.style.display = "flex";
        this.checkAuth();
      });
    },

    setupLogout() {
      const logoutBtn = document.getElementById("logout-btn");
      logoutBtn.addEventListener("click", async () => {
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = `
          <svg class="btn-spinner" viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
          Logging out...
        `;

        try {
          const token = localStorage.getItem("accessToken");
          await fetch(`${API_BASE_URL}/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          });
        } catch {
          // Ignore logout errors
        } finally {
          localStorage.removeItem("accessToken");
          notifyOnNextPage("Logged out successfully.", "success", {
            title: "Signed Out",
          });
          setTimeout(() => {
            window.location.href = "/login.html";
          }, 1000);
        }
      });
    },

    getInitials(name) {
      if (!name) return "U";
      const parts = name.trim().split(" ");
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (
        parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
      ).toUpperCase();
    },

    capitalizeFirst(str) {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    formatDate(date, format = "long") {
      if (format === "short") {
        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  };

  // Pause animations when tab not visible
  const VisibilityManager = {
    init() {
      const animatedElements = document.querySelectorAll(
        ".bg-glow, .particle, .avatar-glow",
      );

      document.addEventListener("visibilitychange", () => {
        animatedElements.forEach((el) => {
          el.style.animationPlayState = document.hidden ? "paused" : "running";
        });
      });
    },
  };

  // Initialize on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    initDarkMode(".dark-toggle");
    ProfileManager.init();
    VisibilityManager.init();
  });
})();
