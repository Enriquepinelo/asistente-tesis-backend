import { Router } from "express";
import * as historialController from "../controllers/historial.controller";
import { requiereAutenticacion } from "../middleware/auth";

const router = Router();

router.use(requiereAutenticacion);
router.get("/", historialController.listar);
router.get("/resumen", historialController.resumen);

export default router;
