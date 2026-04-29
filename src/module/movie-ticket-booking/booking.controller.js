import * as bookingService from "./booking.service.js";
import ApiResponse from "../../common/utils/api-response.js";

export const getMovies = async (req, res) => {
  const movies = await bookingService.getMovies();
  return ApiResponse.ok(res, "movies fetched successfully !", movies);
};

export const getMovieById = async (req, res) => {
  const movie = await bookingService.getMoviesById(req.params.movieId);

  return ApiResponse.ok(res, "movie fetched successfully !", movie);
};

export const getSeats = async (req, res) => {
  const seats = await bookingService.getSeats(req.params.movieId);

  return ApiResponse.ok(res, "seats fetched successfully !", seats);
};
// export const getSeats = async (req, res) => {
//   const result = await bookingService.getSeats();
//   return ApiResponse.ok(res, "All Seats fetched successfully", result);
//   //whenever query fetched and return result in pg is this type of reslut we get {rows: {...}, error} etc.. so we are accessing rows which is the seats all that we have fetched
// };

export const bookSeats = async (req, res) => {
  const data = await bookingService.bookSeats(
    req.params.movieId,
    req.body.seatIds,
    req.user.id,
  );
  return ApiResponse.ok(res, "ticket booked successfully!", data);
};
