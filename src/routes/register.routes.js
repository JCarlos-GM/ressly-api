import { Router } from "express";
import multer from "multer";
import {
  validateInvitationCode,
  registerResident
} from "../controllers/register.controller.js";

const router = Router();

// Configurar multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP)'));
    }
  }
});

// Ruta para validar código de invitación
router.post("/register/validate-code", validateInvitationCode);

// Ruta para registrar residente con imágenes
router.post(
  "/register/resident",
  upload.fields([
    { name: 'ineImage', maxCount: 1 },
    { name: 'residentPhoto', maxCount: 1 }
  ]),
  registerResident
);

export default router;