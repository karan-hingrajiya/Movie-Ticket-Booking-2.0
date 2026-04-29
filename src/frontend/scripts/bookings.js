import {
  initDarkMode,
  notifyError,
  notifySuccess,
  notifyWarning,
  parseApiResponse,
  getApiMessage,
} from "./ui.js";

const API_AUTH = window.AUTH_API_BASE_URL || `${location.origin}/api/auth`;
const API_BASE = window.BOOKING_API_BASE || `${location.origin}/api`;

const params = new URLSearchParams(window.location.search);
const movieId = params.get("movieId");

const fallbackMovies = {
  1: { movie_id: 1, title: "Inception" },
  2: { movie_id: 2, title: "The Dark Knight" },
  3: { movie_id: 3, title: "Interstellar" },
  4: { movie_id: 4, title: "Dune: Part Two" },
};

const state = {
  movie: null,
  seats: [],
  selectedSeatIds: new Set(),
  usingSeatFallback: false,
};

function extractToken(json) {
  if (!json) return null;
  if (typeof json === "string") return json;
  if (json.data && typeof json.data === "string") return json.data;
  if (json.data && json.data.accessToken) return json.data.accessToken;
  if (json.accessToken) return json.accessToken;
  return null;
}

async function checkAuth() {
  const token = localStorage.getItem("accessToken");

  if (token) {
    try {
      const res = await fetch(API_AUTH + "/getme", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (res.ok) {
        return token;
      }

      if (res.status === 401) {
        const refreshRes = await fetch(API_AUTH + "/refresh-token", {
          method: "POST",
          credentials: "include",
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = extractToken(data);

          if (newToken) {
            localStorage.setItem("accessToken", newToken);
            return newToken;
          }
        }
      }

      localStorage.removeItem("accessToken");
      window.location.href = `/login.html?redirect=${encodeURIComponent(location.href)}`;
      return null;
    } catch (error) {
      setMessage(
        "Unable to verify your session right now. Please try booking again.",
        "error",
      );
      notifyError(
        "We could not verify your session. Please try again in a moment.",
        { title: "Session Check Failed" },
      );
      return null;
    }
  }

  window.location.href = `/login.html?redirect=${encodeURIComponent(location.href)}`;
  return null;
}

async function fetchMovieDetails() {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE}/movies/${movieId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const result = await parseApiResponse(response);
      throw new Error(
        getApiMessage(result, "We could not load this movie right now."),
      );
    }

    const result = await parseApiResponse(response);
    return Array.isArray(result.data) ? result.data[0] : result.data;
  } catch (error) {
    notifyWarning(
      error.message || "Movie details are unavailable, so fallback data is being used.",
      { title: "Using Backup Movie Data" },
    );
    return fallbackMovies[movieId] || null;
  }
}

async function fetchSeats() {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_BASE}/movies/${movieId}/seats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const result = await parseApiResponse(response);
      throw new Error(
        getApiMessage(result, "We could not load the live seat map."),
      );
    }

    const result = await parseApiResponse(response);
    state.usingSeatFallback = false;
    return result.data;
  } catch (error) {
    state.usingSeatFallback = true;
    setMessage(
      "Unable to fetch live seats, so you are seeing demo seats for now.",
      "error",
    );
    notifyWarning(
      error.message || "Live seat data is unavailable, so demo seats are shown for now.",
      { title: "Using Demo Seats", duration: 4400 },
    );
    return createFallbackSeats(Number(movieId));
  }
}

function createFallbackSeats(currentMovieId) {
  const rows = ["A", "B", "C", "D", "E"];
  const seats = [];
  let seatId = currentMovieId * 100;

  rows.forEach((rowLetter) => {
    for (let seatNumber = 1; seatNumber <= 8; seatNumber += 1) {
      seatId += 1;
      seats.push({
        seat_id: seatId,
        movie_id: currentMovieId,
        row_letter: rowLetter,
        seat_number: seatNumber,
        is_booked:
          (rowLetter === "A" && seatNumber === 3) ||
          (rowLetter === "B" && seatNumber === 6) ||
          (rowLetter === "D" && seatNumber === 4),
        booked_by:
          rowLetter === "A" && seatNumber === 3
            ? "Aarav"
            : rowLetter === "B" && seatNumber === 6
              ? "Meera"
              : rowLetter === "D" && seatNumber === 4
                ? "Kabir"
                : null,
      });
    }
  });

  return seats;
}

function renderMovie() {
  const title = document.getElementById("movie-title");
  title.textContent = state.movie.title;
  document.title = `${state.movie.title} | ZohoCine`;
}

function renderSeats() {
  const grid = document.getElementById("seat-grid");
  grid.innerHTML = "";

  const rows = ["A", "B", "C", "D", "E"];

  rows.forEach((rowLetter) => {
    const rowElement = document.createElement("div");
    rowElement.className = "seat-row";

    const rowLabel = document.createElement("span");
    rowLabel.className = "row-label";
    rowLabel.textContent = rowLetter;

    const rowButtons = document.createElement("div");
    rowButtons.className = "seat-row-buttons";

    const rowSeats = state.seats
      .filter((seat) => seat.row_letter === rowLetter)
      .sort((a, b) => a.seat_number - b.seat_number);

    rowSeats.forEach((seat) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "seat";
      button.dataset.seatId = String(seat.seat_id);
      button.dataset.seatCode = `${seat.row_letter}${seat.seat_number}`;
      button.dataset.seatLabel = `${seat.row_letter}${seat.seat_number}`;

      const seatCode = `${seat.row_letter}${seat.seat_number}`;
      const seatBack = document.createElement("span");
      seatBack.className = "seat-back";

      const seatNumber = document.createElement("span");
      seatNumber.className = "seat-number";
      seatNumber.textContent = seatCode;

      const seatBase = document.createElement("span");
      seatBase.className = "seat-base";

      button.append(seatBack, seatNumber, seatBase);
      button.setAttribute("aria-label", `Seat ${seatCode}`);

      if (seat.is_booked) {
        button.classList.add("booked");
        button.disabled = true;
        button.dataset.bookedBy = seat.booked_by || "Someone";
        button.setAttribute(
          "aria-label",
          `Seat ${seatCode}, booked by ${seat.booked_by || "someone"}`,
        );
      }

      if (state.selectedSeatIds.has(seat.seat_id)) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => toggleSeatSelection(seat.seat_id));
      rowButtons.appendChild(button);
    });

    rowElement.appendChild(rowLabel);
    rowElement.appendChild(rowButtons);
    grid.appendChild(rowElement);
  });

  updateSummary();
}

function toggleSeatSelection(seatId) {
  if (state.selectedSeatIds.has(seatId)) {
    state.selectedSeatIds.delete(seatId);
  } else {
    state.selectedSeatIds.add(seatId);
  }

  renderSeats();
}

function updateSummary() {
  const bookedCount = state.seats.filter((seat) => seat.is_booked).length;
  const availableCount = state.seats.length - bookedCount;
  const selectedSeats = state.seats
    .filter((seat) => state.selectedSeatIds.has(seat.seat_id))
    .map((seat) => `${seat.row_letter}${seat.seat_number}`);

  document.getElementById("available-count").textContent =
    String(availableCount);
  document.getElementById("booked-count").textContent = String(bookedCount);
  document.getElementById("selected-count").textContent = String(
    selectedSeats.length,
  );
  document.getElementById("selected-seats").textContent =
    selectedSeats.length > 0 ? selectedSeats.join(", ") : "None";
  document.getElementById("book-btn").disabled = selectedSeats.length === 0;
}

function setMessage(message, type = "") {
  const messageElement = document.getElementById("page-message");
  messageElement.textContent = message;
  messageElement.className = "page-message";

  if (type) {
    messageElement.classList.add(type);
  }
}

async function handleBooking() {
  const token = await checkAuth();
  if (!token) {
    return;
  }

  if (state.selectedSeatIds.size === 0) {
    return;
  }

  if (state.usingSeatFallback) {
    setMessage("Live seat data is unavailable, so booking is disabled right now.", "error");
    notifyWarning(
      "Booking is disabled because live seat data is not available right now.",
      { title: "Booking Unavailable" },
    );
    return;
  }

  const seatIds = [...state.selectedSeatIds];
  const button = document.getElementById("book-btn");

  button.disabled = true;
  button.textContent = "Booking...";

  try {
    const response = await fetch(`${API_BASE}/movies/${movieId}/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ seatIds }),
    });

    const result = await parseApiResponse(response);

    if (!response.ok) {
      throw new Error(
        getApiMessage(
          result,
          "We could not complete your booking. Please try again.",
        ),
      );
    }

    const bookedSeatMap = new Map(
      Array.isArray(result.data)
        ? result.data.map((seat) => [Number(seat.seat_id), seat])
        : seatIds.map((seatId) => [Number(seatId), null]),
    );

    state.seats = state.seats.map((seat) =>
      bookedSeatMap.has(Number(seat.seat_id))
        ? {
            ...seat,
            is_booked: true,
            booked_by:
              bookedSeatMap.get(Number(seat.seat_id))?.booked_by ||
              seat.booked_by ||
              "You",
          }
        : seat,
    );

    state.selectedSeatIds.clear();
    renderSeats();
    const successMessage = "Seats booked successfully.";
    setMessage(successMessage, "success");
    notifySuccess(successMessage, { title: "Booking Confirmed" });
  } catch (error) {
    const message =
      error.message || "We could not complete your booking right now.";
    setMessage(message, "error");
    notifyError(message, { title: "Booking Failed" });
  } finally {
    button.textContent = "Book Selected Seats";
    updateSummary();
  }
}

async function init() {
  initDarkMode("#darkToggle");

  if (!movieId) {
    setMessage(
      "No movie selected. Please go back and choose a movie.",
      "error",
    );
    document.getElementById("movie-title").textContent = "Movie not found";
    return;
  }

  state.movie = await fetchMovieDetails();

  if (!state.movie) {
    setMessage("This movie does not exist in the current list.", "error");
    document.getElementById("movie-title").textContent = "Movie not found";
    return;
  }

  renderMovie();
  state.seats = await fetchSeats();
  renderSeats();

  document.getElementById("book-btn").addEventListener("click", handleBooking);
}

document.addEventListener("DOMContentLoaded", init);
