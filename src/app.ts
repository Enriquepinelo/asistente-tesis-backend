import express from "express";
import cors from "cors";
import "dotenv/config";
import rutasApi from "./routes/index";
import { manejadorDeErrores, rutaNoEncontrada } from "./middleware/errorHandler";

const app = express();

// CORS: solo se permite el origen del frontend en desarrollo.
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Ruta simple para confirmar que el servidor esta vivo.
app.get("/api/salud", (_req, res) => {
  res.json({ exito: true, mensaje: "El servidor está funcionando correctamente." });
});

app.use("/api", rutasApi);

app.use(rutaNoEncontrada);
app.use(manejadorDeErrores);

export default app;
