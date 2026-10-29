import { config } from "./config.js";
import { connectDatabase } from "./models.js";
import { createApp } from "./app.js";
import { expireAttempts } from "./attempts.js";
import mongoose from "mongoose";
const cfg = config();
try {
  await connectDatabase(cfg.mongoUri);
  const server = createApp(cfg).listen(cfg.port, () =>
    console.log(`Diyaprosoft LMS API: http://localhost:${cfg.port}`),
  );
  let sweeping = false;
  const timer = setInterval(async () => {
    if (sweeping) return;
    sweeping = true;
    try {
      await expireAttempts();
    } catch (e) {
      console.error("Attempt expiry:", e.message);
    } finally {
      sweeping = false;
    }
  }, 30000);
  timer.unref();
  const stop = () => {
    clearInterval(timer);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} catch (e) {
  console.error(e.message);
  await mongoose.disconnect();
  process.exit(1);
}
