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
 * Este proceso incluye varias validaciones, la subida de dos imágenes a Cloudinary,
 * la inserción del nuevo usuario en la base de datos y la invalidación
 * del código de invitación que se usó.
 */
export const registerResident = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, houseNumber, idResidential, idCode } = req.body;

    // 1. Validar que todos los campos de texto y archivos necesarios están presentes.
    if (!fullName || !email || !phoneNumber || !houseNumber || !idResidential || !idCode) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }
    if (!req.files || !req.files.ineImage || !req.files.residentPhoto) {
      return res.status(400).json({ error: "Las imágenes (INE y foto del residente) son requeridas" });
    }

    // 2. Verificar que el código de invitación es válido y no ha sido usado.
    const codeCheck = await pool.query("SELECT is_used FROM invitation_codes WHERE id_code = $1", [idCode]);
    if (codeCheck.rows.length === 0 || codeCheck.rows[0].is_used) {
      return res.status(400).json({ error: "Código de invitación no válido o ya utilizado" });
    }

    // 3. Verificar que la casa existe en la residencial y obtener su ID.
    const houseCheck = await pool.query(
      "SELECT id_house FROM houses WHERE house_number = $1 AND id_residential = $2",
      [houseNumber, idResidential]
    );
    if (houseCheck.rows.length === 0) {
      return res.status(404).json({ error: "El número de casa no fue encontrado en esta residencial" });
    }
    const idHouse = houseCheck.rows[0].id_house;

    // 4. Subir imágenes a Cloudinary en paralelo.
    const [ineUrl, residentPhotoUrl] = await Promise.all([
      uploadImage(req.files.ineImage[0].buffer),
      uploadImage(req.files.residentPhoto[0].buffer)
    ]);

    // 5. Insertar el nuevo residente en la base de datos.
    const residentResponse = await pool.query(
      `INSERT INTO residents (full_name, email, phone_number, resident_photo_url, resident_ine_url, id_house, id_residential)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_resident, email, full_name`,
      [fullName, email, phoneNumber, residentPhotoUrl, ineUrl, idHouse, idResidential]
    );
    const newResident = residentResponse.rows[0];

    // 6. Marcar el código de invitación como utilizado.
    await pool.query("UPDATE invitation_codes SET is_used = true WHERE id_code = $1", [idCode]);

    // 7. Responder con éxito y los datos del nuevo residente.
    res.status(201).json({
      success: true,
      message: "Residente registrado exitosamente",
      resident: { ...newResident, resident_photo_url: residentPhotoUrl, resident_ine_url: ineUrl },
    });

  } catch (error) {
    // Manejo de error específico para email duplicado.
    if (error.code === '23505') {
      return res.status(409).json({ error: "El correo electrónico ya está registrado" });
    }
    
    // Manejo de otros errores del servidor.
    res.status(500).json({
      error: "Error en el servidor al registrar al residente",
      details: error.message,
    });
  }
};