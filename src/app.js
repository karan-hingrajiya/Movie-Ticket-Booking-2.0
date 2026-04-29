// import "express-async-errors";
import express, { urlencoded } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import ApiError from "./common/utils/api-error.js";
import authRouter from "./module/auth/auth.route.js";
import bookingRouter from "./module/movie-ticket-booking/booking.route.js";
import cors from "cors";

const app = express();

const normalizeOrigin = (value) => (value || "").trim().replace(/\/$/, "");
const allowedOrigins = new Set(
  [
    process.env.APP_URL,
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000",
  ]
    .map(normalizeOrigin)
    .filter(Boolean),
);

// app.use(cors({
//     origin: "https://your-app.vercel.app"
// }));

app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = normalizeOrigin(origin);
      const isRenderOrigin = (() => {
        try {
          return (
            !!normalizedOrigin &&
            new URL(normalizedOrigin).hostname.endsWith(".onrender.com")
          );
        } catch {
          return false;
        }
      })();

      // Allow same-origin/server requests (no Origin header),
      // and explicitly allow configured browser origins.
      if (
        !origin ||
        allowedOrigins.has(normalizedOrigin) ||
        isRenderOrigin
      ) {
        return callback(null, true);
      }
      // Do not throw 500 on CORS mismatch.
      return callback(null, false);
    },
    credentials: true,
  }),
);
/*
  ── HOW STATIC FILE SERVING WORKS ────────────────────────────────
  express.static() maps a folder to the root URL.
  
  With this line:
    app.use(express.static(path.join(process.cwd(), 'src', 'frontend')));
  
  The folder  src/frontend/  becomes the root for static files.
  So the browser requests:
    /styles/structure.css  → src/frontend/styles/structure.css
    /scripts/login-user.js → src/frontend/scripts/login-user.js
    /pages/login.html      → src/frontend/pages/login.html
  
  This is why your HTML files use paths like  ../styles/structure.css
  — they navigate relative to their own location inside the folder.
  
  express.static() will NOT serve /login.html directly because login.html
  lives at /pages/login.html. That's why we add explicit GET routes below
  so users can visit clean URLs like /login.html or /login instead.
  ─────────────────────────────────────────────────────────────────
*/
app.use(express.static(path.join(process.cwd(), 'src', 'frontend')));


// ── Page Routes — clean URLs that serve HTML files ────────────────
/*
  Why do we need these?
  express.static() can serve /pages/login.html but not /login.html.
  These routes let users (and your redirects) use clean top-level URLs
  like /login.html, /register.html etc. without needing the /pages/ prefix.
  
  window.location.href = "/login.html"  → hits this route → serves the file.
*/

const pages = path.join(process.cwd(), 'src', 'frontend', 'pages');

app.get(["/", "/home", "/home.html"], (req, res) => {
    res.sendFile(path.join(pages, 'home.html'));
});

app.get(["/login", "/login.html"], (req, res) => {
    res.sendFile(path.join(pages, 'login.html'));
});

app.get(["/register", "/register.html"], (req, res) => {
    res.sendFile(path.join(pages, 'register.html'));
});

app.get(["/bookings", "/bookings.html"], (req, res) => {
    res.sendFile(path.join(pages, 'bookings.html'));
});

app.get(["/forgot-password", "/forgot-password.html"], (req, res) => {
    res.sendFile(path.join(pages, 'forgot-password.html'));
});

app.get(["/reset-password", "/reset-password.html"], (req, res) => {
    res.sendFile(path.join(pages, 'reset-password.html'));
});

// This is the page the email verification link lands on.
// The email link from mail.js looks like: /verify-email.html?token=abc123
// This route serves the HTML — the JS on that page reads the token from the URL.
app.get(["/verify-email", "/verify-email.html"], (req, res) => {
    res.sendFile(path.join(pages, 'verify-email.html'));
});

app.get(["/profile", "/profile.html"], (req,res) => {
    res.sendFile(path.join(pages, 'profile.html'));
})

// ── API Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api", bookingRouter);

//── Catch-all for unknown routes ──────────────────────────────────
// app.all('*', (req, res, next) => {
//     next(ApiError.notFound(`Requested URL ${req.originalUrl} not found`));
// });

app.use((req, res, next) => {
    next(ApiError.notFound(`Requested URL ${req.originalUrl} not found`));
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        status: false,
        message,
    });
});

export default app;
