import { Router } from "express";
import multer from "multer";
import { registerPet } from "../controllers/pets.controller.js";

const router = Router();

// Configurar multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para registrar una mascota
router.post(
  "/register",
  upload.fields([{ name: "petImage", maxCount: 1 }]),
  registerPet
);

export default router;