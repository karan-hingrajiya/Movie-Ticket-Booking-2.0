import { init } from "../../common/config/db/postgres_init.js";

// Simple movie table for the 4 movies shown on home page.
const createMoviesTable = `
  CREATE TABLE IF NOT EXISTS movies (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE
  );
`;

// Each movie gets its own 40 seats: A1-A8, B1-B8, ... E1-E8.
const createSeatsTable = `
  CREATE TABLE IF NOT EXISTS seats (
    seat_id SERIAL PRIMARY KEY,
    movie_id INT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    row_letter VARCHAR(1) NOT NULL,
    seat_number INT NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    booked_by VARCHAR(255),
    booked_at TIMESTAMP,
    UNIQUE (movie_id, row_letter, seat_number)
  );
`;

const seedMovies = `
  INSERT INTO movies (title)
  VALUES
    ('Inception'),
    ('The Dark Knight'),
    ('Interstellar'),
    ('Dune: Part Two')
  ON CONFLICT (title) DO NOTHING;
`;

const seedSeats = `
  INSERT INTO seats (movie_id, row_letter, seat_number)
  SELECT
    m.movie_id,
    rows.row_letter,
    numbers.seat_number
  FROM movies m
  CROSS JOIN (
    VALUES ('A'), ('B'), ('C'), ('D'), ('E')
  ) AS rows(row_letter)
  CROSS JOIN generate_series(1, 8) AS numbers(seat_number)
  ON CONFLICT (movie_id, row_letter, seat_number) DO NOTHING;
`;

export async function initSchema() {
  const conn = await init();

  try {
    await conn.query(createMoviesTable);
    await conn.query(createSeatsTable);

    await conn.query(seedMovies);
    await conn.query(seedSeats);

    console.log("Booking schema is ready.");
  } catch (error) {
    console.error("Error while creating booking schema:", error.message);
  } finally {
    conn.release();
  }
}
