import {
  initDarkMode,
  notifyInfo,
  notifyOnNextPage,
  parseApiResponse,
  getApiMessage,
} from "./ui.js";

/* ========================================
   HOME.JS - ZohoCine Homepage Interactions
======================================== */

(function () {
  "use strict";

  // Navbar Scroll Effect
  const NavbarScroll = {
    init() {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return;

      let ticking = false;

      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            requestAnimationFrame(() => {
              navbar.classList.toggle("scrolled", window.scrollY > 50);
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true },
      );
    },
  };

  // Scroll Animations
  const ScrollAnimations = {
    init() {
      const elements = document.querySelectorAll(".scroll-animate");
      if (!elements.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -50px 0px",
        },
      );

      elements.forEach((el) => observer.observe(el));
    },
  };

  // Performance: Pause animations when tab not visible
  const VisibilityManager = {
    init() {
      const animatedElements = document.querySelectorAll(
        ".hero-glow, .hero-reel, .hero-card, .floating-element",
      );

      document.addEventListener("visibilitychange", () => {
        animatedElements.forEach((el) => {
          el.style.animationPlayState = document.hidden ? "paused" : "running";
        });
      });
    },
  };

  // Smooth Scroll for anchor links
  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
          const href = anchor.getAttribute("href");
          if (href === "#") return;

          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth" });
          }
        });
      });
    },
  };

  // Button Ripple Effect
  const RippleEffect = {
    init() {
      document.querySelectorAll(".btn").forEach((btn) => {
        btn.addEventListener("click", function (e) {
          const rect = this.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const ripple = document.createElement("span");
          ripple.className = "ripple";
          ripple.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            animation: rippleEffect 0.6s ease-out forwards;
          `;

          this.appendChild(ripple);

          setTimeout(() => ripple.remove(), 600);
        });
      });

      // Add ripple animation
      if (!document.getElementById("ripple-styles")) {
        const style = document.createElement("style");
        style.id = "ripple-styles";
        style.textContent = `
          @keyframes rippleEffect {
            to {
              width: 300px;
              height: 300px;
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
    },
  };

  // Parallax Effect for Hero Glows
  const ParallaxEffect = {
    init() {
      const heroGlows = document.querySelectorAll(".hero-glow");
      if (!heroGlows.length) return;

      let ticking = false;

      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            requestAnimationFrame(() => {
              const scrolled = window.scrollY;
              heroGlows.forEach((glow, index) => {
                const speed = 0.2 + index * 0.1;
                glow.style.transform = `translateY(${scrolled * speed}px) translateZ(0)`;
              });
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true },
      );
    },
  };

  // Card Tilt Effect
  const CardTilt = {
    init() {
      const cards = document.querySelectorAll(".hero-card");

      cards.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / 25;
          const rotateY = (centerX - x) / 25;

          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02) translateZ(0)`;
        });

        card.addEventListener("mouseleave", () => {
          card.style.transform =
            "perspective(1000px) rotateX(0) rotateY(0) scale(1) translateZ(0)";
        });
      });
    },
  };

  // Counter Animation for Stats
  const CounterAnimation = {
    init() {
      const counters = document.querySelectorAll(".stat-value[data-count]");
      if (!counters.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.animate(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 },
      );

      counters.forEach((counter) => observer.observe(counter));
    },

    animate(element) {
      const target = parseInt(element.getAttribute("data-count"), 10);
      const suffix = element.getAttribute("data-suffix") || "";
      const duration = 2000;
      const start = performance.now();

      const update = (currentTime) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * target);

        element.textContent = current.toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    },
  };

  // Movie Card Hover Effects
  const MovieCardEffects = {
    init() {
      const cards = document.querySelectorAll(".movie-card");

      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          cards.forEach((c) => {
            if (c !== card) {
              c.style.opacity = "0.6";
              c.style.transform = "scale(0.98)";
            }
          });
        });

        card.addEventListener("mouseleave", () => {
          cards.forEach((c) => {
            c.style.opacity = "1";
            c.style.transform = "";
          });
        });

        // Navigate to booking page using the movieId stored on the card element
        card.addEventListener("click", () => {
          const movieId = card.dataset.movieId;
          if (!movieId) return;
          window.location.href = `/bookings.html?movieId=${encodeURIComponent(movieId)}`;
        });
      });
    },
  };
 
  // Auth manager: toggle navbar links based on client-side auth state
  const API_BASE = window.AUTH_API_BASE_URL || `${location.origin}/api/auth`;

  const AuthManager = {
    async init() {
      const loginLink = document.getElementById("nav-login");
      const registerLink = document.getElementById("nav-register");
      const navUser = document.getElementById("nav-user");

      const showLoggedOut = () => {
        if (loginLink) loginLink.style.display = "";
        if (registerLink) {
          const hasAccount = localStorage.getItem("hasAccount") === "true";
          registerLink.style.display = hasAccount ? "none" : "";
        }
        if (navUser) {
          navUser.style.display = "none";
          navUser.innerHTML = "";
        }
        try {
          document.body.setAttribute("data-auth-initialized", "guest");
        } catch (e) {
          /* ignore */
        }
      };

      const setupLoggedInUI = () => {
        if (loginLink) loginLink.style.display = "none";
        if (registerLink) registerLink.style.display = "none";
        if (navUser) {
          navUser.style.display = "flex";
          navUser.innerHTML = `
            <a href="/profile.html" id="nav-account" class="nav-link">My Account</a>
            <button id="nav-logout" class="btn btn-ghost">Logout</button>
          `;

          try {
            document.body.setAttribute("data-auth-initialized", "user");
          } catch (e) {
            /* ignore */
          }

          const logoutBtn = document.getElementById("nav-logout");
          if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
              try {
                const token = localStorage.getItem("accessToken");
                await fetch(API_BASE + "/logout", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  credentials: "include",
                });
              } catch (err) {
                // ignore
              } finally {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("hasAccount"); //flag for user who already regsiter now only show them login button but if logout then show them both register and log in cause he want to add new account with new register right.
                notifyOnNextPage("You have been logged out successfully.", "success", {
                  title: "Logged Out",
                });
                window.location.reload();
              }
            });
          }
        }
      };

      const extractToken = (json) => {
        if (!json) return null;
        if (typeof json === "string") return json;
        if (json.data && typeof json.data === "string") return json.data;
        if (json.data && json.data.accessToken) return json.data.accessToken;
        if (json.accessToken) return json.accessToken;
        return null;
      };

      const token = localStorage.getItem("accessToken");

      // If we have an access token, validate it with getme
      if (token) {
        try {
          const res = await fetch(API_BASE + "/getme", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            setupLoggedInUI();
            return;
          }

          if (res.status === 401) {
            // Access token expired or invalid → try refresh using cookie
            const refreshRes = await fetch(API_BASE + "/refresh-token", {
              method: "POST",
              credentials: "include",
            });

            if (refreshRes.ok) {
              const data = await refreshRes.json();
              const newToken = extractToken(data);
              if (newToken) {
                localStorage.setItem("accessToken", newToken);
                setupLoggedInUI();
                return;
              }
            }

            // Refresh failed → clear token and show logged-out UI
            localStorage.removeItem("accessToken");
            showLoggedOut();
            return;
          }

          // Any other non-ok response → treat as logged out
          localStorage.removeItem("accessToken");
          showLoggedOut();
          return;
        } catch (err) {
          // Network error: be conservative and show logged-out UI
          showLoggedOut();
          return;
        }
      }

      // No token: try silent refresh using the refresh token cookie
      try {
        const refreshRes = await fetch(API_BASE + "/refresh-token", {
          method: "POST",
          credentials: "include",
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = extractToken(data);
          if (newToken) {
            localStorage.setItem("accessToken", newToken);
            setupLoggedInUI();
            return;
          }
        }
      } catch (err) {
        // ignore network errors
      }

      // Default: show logged-out UI
      showLoggedOut();
    },
  };

  // Load movies from API and render cards into .movie-grid
  const API_BASE_HOME = window.AUTH_API_BASE_URL
    ? window.AUTH_API_BASE_URL.replace("/auth", "")
    : `${location.origin}/api`;

  const MovieLoader = {
    async init() {
      const grid = document.querySelector(".movie-grid");
      if (!grid) return;

      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_BASE_HOME}/movies`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const payload = await parseApiResponse(res);

        if (!res.ok) {
          throw new Error(
            getApiMessage(payload, "We could not load movies right now."),
          );
        }

        const { data } = payload;

        grid.innerHTML = "";
        const movieImageMap = {
          "inception": "inception-poster.jpeg",
          "the dark knight": "darkknight-poster.jpeg",
          "interstellar": "intersteller.jpg",
          "dune: part two": "dune-poster.jpeg",
        };

        data.forEach((movie) => {
          const card = document.createElement("div");
          card.className = "movie-card scroll-animate";
          card.dataset.movieId = movie.movie_id;

          const normalizedTitle = String(movie.title || "").trim().toLowerCase();
          const imgName = movieImageMap[normalizedTitle];
          const imageMarkup = imgName
            ? `<img src="/images/${imgName}" alt="${movie.title}" class="movie-poster" style="width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: var(--radius-md) var(--radius-md) 0 0; display: block;">`
            : "";

          card.innerHTML = `
            ${imageMarkup}
            <div class="movie-info">
              <div class="movie-title">${movie.title}</div>
            </div>
          `;
          grid.appendChild(card);
        });

        MovieCardEffects.init();
        ScrollAnimations.init();
      } catch (err) {
        // Keep static cards if API unavailable, still wire up click handlers
        MovieCardEffects.init();
        notifyInfo(
          err.message || "Live movies could not be loaded, so cached cards are being shown.",
          { title: "Using Available Movie List" },
        );
      }
    },
  };

  // Initialize all modules on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    NavbarScroll.init(); // Initializes navbar scroll effect
    ScrollAnimations.init(); // Initializes scroll-triggered animations
    VisibilityManager.init(); // Manages animation play state based on tab visibility
    SmoothScroll.init(); // Enables smooth scrolling for anchor links
    RippleEffect.init(); // Adds ripple effect to buttons
    ParallaxEffect.init(); // Initializes parallax effect for hero glows
    CardTilt.init(); // Adds tilt effect to hero cards
    CounterAnimation.init(); // Animates stats counters
    AuthManager.init().then(() => { // Ensure AuthManager finishes before other UI setup that might depend on it
      MovieLoader.init(); // Fetches movies and initializes movie card effects
      initDarkMode(".dark-toggle"); // Initialize dark mode toggle after AuthManager might have re-rendered parts of the navbar
    });
  });
})();
