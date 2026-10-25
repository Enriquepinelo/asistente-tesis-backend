import { Router } from "express";
import { login, logout, obtenerPerfil } from "../controllers/auth.controller";
import { requiereAutenticacion } from "../middleware/auth";
import { limitarIntentosLogin } from "../middleware/limiteLogin";

const router = Router();

router.post("/login", limitarIntentosLogin, login);
router.post("/logout", requiereAutenticacion, logout);
router.get("/me", requiereAutenticacion, obtenerPerfil);

export default router;
