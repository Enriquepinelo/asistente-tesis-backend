import { Router } from "express";
import * as c from "../controllers/coordinacion.controller";
import { requiereAutenticacion, permitirRoles } from "../middleware/auth";

const router = Router();

// Panel de coordinacion: lo usan el coordinador y el administrador.
router.use(requiereAutenticacion, permitirRoles("coordinador", "administrador"));
router.get("/resumen", c.resumen);
router.get("/estudiantes", c.estudiantes);
router.get("/estudiantes/:id", c.detalleEstudiante);
router.get("/cuentas-pendientes", c.cuentasPendientes);
router.patch("/cuentas/:id/activar", c.activarCuenta);

export default router;
