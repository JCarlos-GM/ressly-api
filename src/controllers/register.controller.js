/**
 * Este archivo contiene toda la lógica para el registro de nuevos residentes,
 * desde validar un código de invitación hasta crear el perfil en la base de datos.
 */

import { pool } from "../db.js";
import cloudinary from "cloudinary";

// Configuración de Cloudinary usando las credenciales de las variables de entorno.
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube un archivo de imagen a la carpeta "ressly/residents" en Cloudinary.
 * Recibe el buffer de la imagen y devuelve la URL segura donde quedó almacenada.
 */
const uploadImage = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: "ressly/residents" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Controlador para validar un código de invitación.
 * Busca el código en la base de datos para confirmar que existe y que no ha sido usado.
 * Espera recibir en el body de la petición un objeto como: { "code": "..." }.
 */
export const validateInvitationCode = async (req, res) => {
  try {
    const { code } = req.body;

    // 1. Validar que se recibió un código.
    if (!code) {
      return res.status(400).json({ error: "El código de invitación es requerido" });
    }

    // 2. Buscar el código en la base de datos.
    const response = await pool.query(
      "SELECT id_code, id_residential, is_used FROM invitation_codes WHERE code = $1",
      [code]
    );

    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Código de invitación no válido" });
    }

    // 3. Verificar si el código ya fue utilizado.
    const invitationCode = response.rows[0];
    if (invitationCode.is_used) {
      return res.status(400).json({ error: "Este código de invitación ya fue utilizado" });
    }

    // 4. Si es válido, responder con éxito.
    res.status(200).json({
      success: true,
      message: "Código válido",
      id_residential: invitationCode.id_residential,
      id_code: invitationCode.id_code,
    });

  } catch (error) {
    res.status(500).json({
      error: "Error en el servidor al validar el código",
      details: error.message,
    });
  }
};

/**
 * Controlador para registrar a un nuevo residente.
 * (Versión actualizada: NO recibe password, SÍ recibe firstName y lastName)
 */
export const registerResident = async (req, res) => {
  try {
    // --- CAMBIO 1: Recibir campos del body ---
    // NO hay 'password'. 
    // SÍ hay 'firstName' y 'lastName' (en lugar de 'fullName').
    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      houseNumber, 
      idResidential, 
      idCode 
    } = req.body;

    // 2. Validar campos de texto y archivos
    // Se quita la validación de 'password'
    if (!firstName || !lastName || !email || !phoneNumber || !houseNumber || !idResidential || !idCode) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }
    if (!req.files || !req.files.ineImage || !req.files.residentPhoto) {
      return res.status(400).json({ error: "Las imágenes (INE y foto del residente) son requeridas" });
    }

    // 3. Verificar que el código de invitación es válido (Sin cambios)
    const codeCheck = await pool.query("SELECT is_used FROM invitation_codes WHERE id_code = $1", [idCode]);
    if (codeCheck.rows.length === 0 || codeCheck.rows[0].is_used) {
      return res.status(400).json({ error: "Código de invitación no válido o ya utilizado" });
    }

    // 4. Verificar que la casa existe y obtener su ID (Sin cambios)
    const houseCheck = await pool.query(
      "SELECT id_house FROM houses WHERE house_number = $1 AND id_residential = $2",
      [houseNumber, idResidential]
    );
    if (houseCheck.rows.length === 0) {
      return res.status(404).json({ error: "El número de casa no fue encontrado en esta residencial" });
    }
    const idHouse = houseCheck.rows[0].id_house;

    // 5. Subir imágenes a Cloudinary (Sin cambios)
    const [ineUrl, residentPhotoUrl] = await Promise.all([
      uploadImage(req.files.ineImage[0].buffer),
      uploadImage(req.files.residentPhoto[0].buffer)
    ]);

    // 6. Insertar el nuevo residente en la base de datos
    // --- CAMBIO 2: Actualizar la consulta INSERT ---
    // (Sin 'password', y usando 'first_name', 'last_name', 'resident_ine_photo_url')
    const residentResponse = await pool.query(
      `INSERT INTO residents (first_name, last_name, email, phone_number, resident_photo_url, resident_ine_photo_url, id_house)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_resident, email, first_name, last_name`,
      [firstName, lastName, email, phoneNumber, residentPhotoUrl, ineUrl, idHouse]
    );
    const newResident = residentResponse.rows[0];

    // 7. Marcar el código de invitación como utilizado (Sin cambios)
    await pool.query("UPDATE invitation_codes SET is_used = true WHERE id_code = $1", [idCode]);

    // 8. Responder con éxito (Sin cambios)
    res.status(201).json({
      success: true,
      message: "Residente registrado exitosamente",
      resident: { 
        ...newResident, 
        resident_photo_url: residentPhotoUrl, 
        resident_ine_photo_url: ineUrl // Nombre de clave corregido
      },
    });

  } catch (error) {
    // Manejo de error para email duplicado (Sin cambios)
    if (error.code === '23505') {
      return res.status(409).json({ error: "El correo electrónico ya está registrado" });
    }
    
    console.error("Error en registerResident:", error);
    res.status(500).json({
      error: "Error en el servidor al registrar al residente",
      details: error.message,
    });
  }
};

/**
 * Actualiza los datos de una mascota
 */
export const updatePet = async (req, res) => {
  try {
    const { idPet } = req.params;
    const { name, specie, breed, color, description, status } = req.body;

    // Validar campos obligatorios
    if (!name || !specie || !breed || !color) {
      return res.status(400).json({ 
        error: "Los campos nombre, especie, raza y color son obligatorios" 
      });
    }

    // Validar que el status sea válido
    const validStatuses = ['En Casa', 'Desaparecida', 'Fallecida'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Estado no válido. Debe ser: En Casa, Desaparecida o Fallecida" 
      });
    }

    // Verificar que la mascota existe
    const petCheck = await pool.query(
      "SELECT id_pet FROM pets WHERE id_pet = $1",
      [idPet]
    );
    
    if (petCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: "Mascota no encontrada" 
      });
    }

    // Actualizar la mascota
    const updateResponse = await pool.query(
      `UPDATE pets 
       SET name = $1, specie = $2, breed = $3, color = $4, 
           description = $5, status = $6
       WHERE id_pet = $7
       RETURNING id_pet, name, specie, breed, color, description, 
                 status, pet_photo_url, created_at, id_resident`,
      [name, specie, breed, color, description || null, status || 'En Casa', idPet]
    );

    const updatedPet = updateResponse.rows[0];

    res.status(200).json({
      success: true,
      message: "Mascota actualizada exitosamente",
      pet: updatedPet
    });

  } catch (error) {
    console.error("Error en updatePet:", error);
    res.status(500).json({
      error: "Error en el servidor al actualizar la mascota",
      details: error.message,
    });
  }
};