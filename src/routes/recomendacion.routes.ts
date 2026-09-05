import { Router } from "express";
import * as recomendacionController from "../controllers/recomendacion.controller";
import { requiereAutenticacion } from "../middleware/auth";

const router = Router();

router.use(requiereAutenticacion);
router.get("/", recomendacionController.listar);

export default router;
