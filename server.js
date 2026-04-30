import "dotenv/config"; // Load .env before importing modules that read process.env
import app from "./src/app.js";
import { connectDB } from "./src/common/config/db.js";
import initDB from "./src/common/config/db/init.js";
import { initSchema } from "./src/module/movie-ticket-booking/booking.model.js";
import { verifyTransporter } from "./src/common/config/mail.js";

const PORT = process.env.PORT || 5000;
const nodeEnv = process.env.NODE_ENV || "development";
const verifyMailOnStartup = process.env.MAIL_VERIFY_ON_STARTUP === "true";
const allowStartWithoutPostgres = process.env.ALLOW_START_WITHOUT_POSTGRES !== "false";

const server = async function () {
    await connectDB();
    await initDB();
    try {
      await initSchema();
    } catch (err) {
      if (!allowStartWithoutPostgres) {
        throw err;
      }
      console.warn("Postgres init skipped:", err.message);
    }
    if (verifyMailOnStartup) {
      await verifyTransporter();
    }
    app.listen(PORT, () => {
    console.log(`port is running on ${PORT} on ${nodeEnv} mode`);
    });
};


server().then(() => {
    console.log("everything is okay server & db connected!!");
}).catch((err) => {
    console.log("error is coming:", err);
});
