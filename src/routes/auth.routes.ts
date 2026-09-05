import { Router } from "express";
import { login, logout, obtenerPerfil } from "../controllers/auth.controller";
import { requiereAutenticacion } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/logout", requiereAutenticacion, logout);
router.get("/me", requiereAutenticacion, obtenerPerfil);

export default router;
