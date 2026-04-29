import { init, pool } from "../../common/config/db/postgres_init.js";
import { getCollection } from "../../common/config/db.js";
import ApiError from "../../common/utils/api-error.js";

//get all seats
export const getMovies = async () => {
  const result = await pool.query("select * from movies");
  return result.rows;
};

export const getMoviesById = async (movieId) => {
  const conn = await init();
  try {
    const result = await conn.query(
      `select * from movies where movie_id = $1 `,
      [movieId],
    );
    if (result.rowCount === 0) {
      throw ApiError.badRequest("movie doesn't exist");
    }
    return result.rows[0];
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw ApiError.badRequest(err.message || "unable to fetch movie");
  } finally {
    conn.release();
  }
};

export const getSeats = async (movieId) => {
  const conn = await init();
  try {
    const result = await conn.query(
      `select * from seats where movie_id = $1 order by row_letter, seat_number`,
      // look inside seats
      // take only seats for one movie
      // sort them nicely like A1, A2 ... E8
      // return actual rows, not just count
      [movieId],
    );
    if (result.rowCount === 0) {
      throw ApiError.badRequest("movie doesn't exist");
    }
    return result.rows;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw ApiError.badRequest(err.message || "unable to fetch seats");
  } finally {
    conn.release();
  }
};

// book a seat give the seatId and your name
export const bookSeats = async (movieId, seatIds, userId) => {
  const UserCollection = getCollection("users");
  const user = await UserCollection.findOne(
    { _id: userId },
    {
      projection: {
        verificationToken: 0,
        refreshToken: 0,
        password: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
      },
    },
  );

  if (!user) {
    throw ApiError.unauthorized("user not found !!");
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw ApiError.badRequest("please select at least one seat");
  }

  const normalizedSeatIds = [...new Set(seatIds.map((seatId) => Number(seatId)))];

  if (normalizedSeatIds.some((seatId) => Number.isNaN(seatId))) {
    throw ApiError.badRequest("invalid seat selection");
  }

  const conn = await init();
  try {
    //begin transaction
    // KEEP THE TRANSACTION AS SMALL AS POSSIBLE
    await conn.query("BEGIN");
    //getting the row to make sure it is not booked
    /// $1 is a variable which we are passing in the array as the second parameter of query function,
    // Why do we use $1? -> this is to avoid SQL INJECTION
    // (If you do ${id} directly in the query string,
    // then it can be manipulated by the user to execute malicious SQL code)
    const sql =
      "SELECT * FROM seats where movie_id = $1 and seat_id = ANY($2::int[]) and is_booked = false FOR UPDATE";
    const result = await conn.query(sql, [movieId, normalizedSeatIds]);

    //if no rows found then the operation should fail can't book
    // This shows we Do not have the current seat available for booking
    if (result.rowCount !== normalizedSeatIds.length) {
      throw ApiError.badRequest(
        "one or more selected seats are already booked or invalid",
      );
    }

    const sqlU = `
      update seats
      set is_booked = true, booked_by = $1, booked_at = CURRENT_TIMESTAMP
      where movie_id = $2 and seat_id = ANY($3::int[])
      returning seat_id, row_letter, seat_number, is_booked, booked_by, booked_at
    `;
    const updateResult = await conn.query(sqlU, [
      user.name,
      movieId,
      normalizedSeatIds,
    ]); 

    //end transaction by committing
    await conn.query("COMMIT");

    return updateResult.rows;
  } catch (err) {
    try {
      await conn.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr.message);
    }
    console.error("error with booking the seats", err.message);
    if (err instanceof ApiError) {
      throw err;
    }
    throw ApiError.badRequest(err.message || "unable to book seats");
  } finally {
    conn.release(); // release the connection back to the pool (so we do not keep the connection open unnecessarily)
  }
};
