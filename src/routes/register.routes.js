/**
 * Este archivo define las rutas para el proceso de registro, incluyendo la validación
 * de códigos y el registro de nuevos residentes con carga de archivos.
 * Autor: Juan Carlos Govea Magaña
 * Fecha: 20/10/2025
 */

import { Router } from "express";
import multer from "multer";
import { validateInvitationCode, registerResident } from "../controllers/register.controller.js";

const router = Router();

// --- Configuración de Multer para la carga de archivos ---
// Se utiliza memoryStorage para procesar las imágenes en memoria antes de
// subirlas a un servicio de almacenamiento en la nube (Cloudinary).
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  // Límite de tamaño de archivo de 5MB para prevenir ataques de denegación de servicio.
  limits: { fileSize: 5 * 1024 * 1024 },
  // Filtro para asegurar que solo se suban archivos de imagen válidos.
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WebP).'));
    }
  }
});

/**
 * Ruta para validar un código de invitación.
 * URL: POST /api/register/validate-code
 * Acceso: Público
 * Body esperado: { "invitationCode": "string" }
 */
router.post("/validate-code", validateInvitationCode);

/**
 * Ruta para registrar un nuevo residente.
 * URL: POST /api/register/resident
 * Espera datos de formulario (multipart/form-data) que incluyen la foto del INE
 * ('ineImage') y la foto del residente ('residentPhoto').
 * Acceso: Público
 */
router.post(
  "/resident",
  upload.fields([
    { name: 'ineImage', maxCount: 1 },
    { name: 'residentPhoto', maxCount: 1 }
  ]),
  registerResident
);

export default router;