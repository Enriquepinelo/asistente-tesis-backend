import { Router } from "express";
import * as usuarioController from "../controllers/usuario.controller";
import { requiereAutenticacion, permitirRoles } from "../middleware/auth";

const router = Router();

// Todo el modulo de usuarios es exclusivo del administrador.
router.use(requiereAutenticacion, permitirRoles("administrador"));
router.get("/", usuarioController.listar);
router.get("/estado-sistema", usuarioController.estadoSistema);
router.post("/", usuarioController.crear);
router.patch("/:id/estado", usuarioController.cambiarEstado);
router.patch("/:id/rol", usuarioController.cambiarRol);
router.post("/:id/restablecer-contrasena", usuarioController.restablecerContrasena);

export default router;
