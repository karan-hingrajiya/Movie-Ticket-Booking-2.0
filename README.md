# ZohoCine

Simple movie ticket booking application (Node.js backend + static frontend).

## 🌟 Project Features & Architecture

### User Authentication & Management (MongoDB)
- **Secure Registration & Login**: Users can create accounts and log in securely. Passwords are encrypted using `bcrypt`.
- **Email Verification**: New accounts require email verification before logging in, ensuring valid users.
- **JWT-Based Authentication**: Implements a robust dual-token system (short-lived Access Tokens and long-lived Refresh Tokens) for secure session management. Refresh tokens are hashed before being stored in the database.
- **Password Recovery**: Users can request password reset links via email if they forget their credentials.
- **Role-Based Access Control (RBAC)**: Middleware to restrict API access based on user roles.

### Movie & Booking System (PostgreSQL)
- **Movie Catalog**: Users can browse currently showing movies and view their details.
- **Seat Selection**: Fetch and display available, sorted seats for specific movies.
- **Concurrent Booking Safety**: Utilizes strict PostgreSQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) and row-level locking (`SELECT ... FOR UPDATE`) to handle concurrent booking requests and prevent race conditions (double-booking).
- **Data Security**: Strict use of parameterized queries to prevent SQL injection attacks.

### Modern Dynamic Frontend
- **Responsive UI**: A fully responsive, modern interface built with vanilla HTML, CSS, and JavaScript.
- **Interactive Design**: Features smooth scrolling, parallax effects, card tilts, glassmorphism elements, and engaging CSS animations (e.g., floating ticket stacks).
- **Dark/Light Mode**: Seamless theme toggling supported across the entire application.
- **Client-Side State Management**: The frontend handles authentication state securely, automatically refreshing expired access tokens using background requests to keep users logged in without manual interruptions.
- **Clean URLs**: Express serves static HTML files through elegantly mapped top-level routes (e.g., `/login` instead of `/pages/login.html`).

## Repository layout

- `server.js` — Node/Express server entrypoint (backend API)
- `src/`
  - `frontend/` — static site (HTML/CSS/JS) served to users. Deploy this folder to Vercel.
  - `module/` — backend modules (auth, movie-ticket-booking)
  - `common/` — shared backend config (DB, mail), DTOs, middleware, utils

## Prerequisites

- Node.js (v16+ recommended)
- PostgreSQL (if using the included DB init scripts)

## Install

```bash
npm install
```

## Running locally

1. Configure environment variables (create a `.env` file at project root):

- `DATABASE_URL` — Postgres connection string (or set DB config in `src/common/config/db`)
- `JWT_SECRET` — JWT signing secret
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` — mailer settings
- `FRONTEND_URL` — frontend origin (for CORS, optional)

2. Start the backend API:

```bash
node server.js
# or if you have a start script
npm start
```

3. Serve the frontend locally:

- Open `src/frontend/pages/home.html` (and other pages) directly in a browser, or run a simple static server from `src/frontend`:

```bash
# from project root
npx serve src/frontend
```

## Database

- DB init scripts are in `src/common/config/db/` (`init.js`, `postgres_init.js`). Run them or use your own migration setup.

