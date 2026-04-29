import pg from "pg";

// Equivalent to mongoose connection
// Pool is nothing but group of connections
// If you pick one connection out of the pool and release it
// the pooler will keep that connection open for sometime to other clients to reuse
const nodeEnv = process.env.NODE_ENV || "development";
const useDatabaseUrl =
  process.env.PG_USE_DATABASE_URL === "true" ||
  (nodeEnv === "production" && Boolean(process.env.DATABASE_URL));

const poolConfig = useDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      // Render Postgres uses SSL for external connections.
      ssl: { rejectUnauthorized: false },
      max: 20,
      connectionTimeoutMillis: 0,
      idleTimeoutMillis: 0,
    }
  : {
      host: process.env.POSTGRES_HOST || "localhost",
      port: Number(process.env.POSTGRES_PORT || 5432),
      user: process.env.POSTGRES_USER || "postgres",
      password: process.env.POSTGRES_PASS,
      database: process.env.POSTGRES_DB || "movie_ticket_booking_db",
      max: 20,
      connectionTimeoutMillis: 0,
      idleTimeoutMillis: 0,
    };

export const pool = new pg.Pool(poolConfig);

export async function init() {
  const conn = await pool.connect(); // pick a connection from the pool

  if (conn) {
    return conn;
  } else {
    throw new Error("connection to postgres is failed !!");
  }
}
