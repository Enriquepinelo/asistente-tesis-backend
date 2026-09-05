import { Router } from "express";
import * as propuestaController from "../controllers/propuesta.controller";
import { requiereAutenticacion } from "../middleware/auth";

const router = Router();

router.use(requiereAutenticacion);
router.get("/", propuestaController.listar);
router.get("/:id", propuestaController.obtener);
router.get("/:id/descargar", propuestaController.descargar);

export default router;
