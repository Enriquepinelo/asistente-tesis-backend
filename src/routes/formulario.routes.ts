import { Router } from "express";
import * as formularioController from "../controllers/formulario.controller";
import { requiereAutenticacion } from "../middleware/auth";

const router = Router();

router.use(requiereAutenticacion);
router.get("/", formularioController.listar);
router.get("/:id", formularioController.obtener);
router.post("/", formularioController.crear);
router.put("/:id", formularioController.actualizar);
router.post("/:id/guardar-borrador", formularioController.guardarBorrador);
router.post("/guardar-borrador", formularioController.guardarBorrador);
router.post("/:id/generar-propuesta", formularioController.generarPropuesta);
router.post("/generar-propuesta", formularioController.generarPropuesta);

export default router;
