import { Router } from "express";
import { login, logout, obtenerPerfil, registro } from "../controllers/auth.controller";
import { requiereAutenticacion } from "../middleware/auth";
import { limitarIntentosLogin, limitarRegistros } from "../middleware/limiteLogin";

const router = Router();

router.post("/login", limitarIntentosLogin, login);
router.post("/registro", limitarRegistros, registro);
router.post("/logout", requiereAutenticacion, logout);
router.get("/me", requiereAutenticacion, obtenerPerfil);

export default router;
