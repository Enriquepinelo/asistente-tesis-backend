import { Router } from "express";
import * as usuarioController from "../controllers/usuario.controller";
import { requiereAutenticacion, permitirRoles } from "../middleware/auth";

const router = Router();

// Todo el modulo de usuarios es exclusivo del administrador.
router.use(requiereAutenticacion, permitirRoles("administrador"));
router.get("/", usuarioController.listar);
router.post("/", usuarioController.crear);
router.patch("/:id/estado", usuarioController.cambiarEstado);

export default router;
