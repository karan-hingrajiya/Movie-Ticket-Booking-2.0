import { Router } from "express";
import * as bookingController from "./booking.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.get("/movies", bookingController.getMovies);
router.get("/movies/:movieId", bookingController.getMovieById);
router.get("/movies/:movieId/seats", bookingController.getSeats);
router.post("/movies/:movieId/book", authenticate, bookingController.bookSeats);

export default router;
