import { pool } from "../db.js";
import cloudinary from "cloudinary";

// Cloudinary ya está configurado en tu registro controller
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen a Cloudinary en la carpeta "ressly/pets"
 */
const uploadPetImage = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: "ressly/pets" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Controlador para registrar una nueva mascota
 */
export const registerPet = async (req, res) => {
  try {
    const { name, specie, breed, color, description, idResident } = req.body;

    // 1. Validar campos obligatorios
    if (!name || !specie || !breed || !color || !idResident) {
      return res.status(400).json({ 
        error: "Los campos nombre, especie, raza, color e ID de residente son obligatorios" 
      });
    }

    // 2. Validar que se recibió la imagen
    if (!req.files || !req.files.petImage) {
      return res.status(400).json({ 
        error: "La imagen de la mascota es obligatoria" 
      });
    }

    // 3. Verificar que el residente existe
    const residentCheck = await pool.query(
      "SELECT id_resident FROM residents WHERE id_resident = $1",
      [idResident]
    );
    
    if (residentCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: "El residente no fue encontrado" 
      });
    }

    // 4. Subir imagen a Cloudinary
    const petPhotoUrl = await uploadPetImage(req.files.petImage[0].buffer);

    // 5. Insertar la mascota en la base de datos
    const petResponse = await pool.query(
      `INSERT INTO pets (name, specie, breed, color, description, pet_photo_url, id_resident)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_pet, name, specie, breed, color, description, status, pet_photo_url, created_at, id_resident`,
      [name, specie, breed, color, description || null, petPhotoUrl, idResident]
    );

    const newPet = petResponse.rows[0];

    // 6. Responder con éxito
    res.status(201).json({
      success: true,
      message: "Mascota registrada exitosamente",
      pet: newPet
    });

  } catch (error) {
    console.error("Error en registerPet:", error);
    res.status(500).json({
      error: "Error en el servidor al registrar la mascota",
      details: error.message,
    });
  }
};