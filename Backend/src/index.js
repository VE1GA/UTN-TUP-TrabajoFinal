import express from "express";
import cors from "cors";

import { PORT } from "./config.js";
import { sequelize } from "./db.js";

import wordleRoutes from "./routes/wordle.routes.js";

import { crearAdminInicial } from "./services/auth.services.js";
import { importarPalabrasIniciales } from "./services/words.services.js";
import { initializeCronJobs } from "./services/tournament.services.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());
app.use(wordleRoutes);

try {
  await sequelize.sync();

  await crearAdminInicial();
  await importarPalabrasIniciales();

  // ✅ ACÁ ESTABA EL ERROR REAL
  await initializeCronJobs();

  app.listen(PORT, () => {
    console.log("server listening on port", PORT);
  });
} catch (error) {
  console.log("there was an error on initialization", error);
}
