/**
 * Este archivo define las rutas para el CRUD (Crear, Leer, Actualizar, Eliminar) de usuarios.
 * Cada ruta está asociada a una función del controlador 'index.controller.js'.
 * Autor: Juan Carlos Govea Magaña
 * Fecha: 20/10/2025
 */

import { Router } from "express";
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "../controllers/index.controller.js";

const router = Router();

/**
 * Ruta para obtener la lista completa de usuarios.
 * URL: GET /usuarios
 */
router.get("/usuarios", getUsuarios);

/**
 * Ruta para obtener un único usuario por su ID.
 * URL: GET /usuarios/:id
 * El ':id' es un parámetro que se recibe en la URL.
 */
router.get("/usuarios/:id", getUsuarioById);

/**
 * Ruta para crear un nuevo usuario.
 * URL: POST /usuarios
 * Los datos del nuevo usuario se envían en el cuerpo (body) de la solicitud.
 */
router.post("/usuarios", createUsuario);

/**
 * Ruta para actualizar un usuario existente por su ID.
 * URL: PUT /usuarios/:id
 * Los nuevos datos se envían en el cuerpo (body) de la solicitud.
 */
router.put("/usuarios/:id", updateUsuario);

/**
 * Ruta para eliminar un usuario por su ID.
 * URL: DELETE /usuarios/:id
 */
router.delete("/usuarios/:id", deleteUsuario);

export default router;