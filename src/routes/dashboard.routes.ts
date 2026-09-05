import { Router } from "express";
import { resumen, actividadReciente } from "../controllers/dashboard.controller";
import { requiereAutenticacion } from "../middleware/auth";

const router = Router();

router.use(requiereAutenticacion);
router.get("/resumen", resumen);
router.get("/actividad-reciente", actividadReciente);

export default router;
