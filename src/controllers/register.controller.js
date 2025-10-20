import { pool } from "../db.js";
import cloudinary from "cloudinary";

// Obtener credenciales del entorno directamente
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Configurar Cloudinary
cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET
});

// Validar código de invitación
export const validateInvitationCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "El código de invitación es requerido"
      });
    }

    const response = await pool.query(
      "SELECT id_code, id_residential, is_used FROM invitation_codes WHERE code = $1",
      [code]
    );

    if (response.rows.length === 0) {
      return res.status(404).json({
        error: "Código de invitación no válido"
      });
    }

    const invitationCode = response.rows[0];

    if (invitationCode.is_used) {
      return res.status(400).json({
        error: "Este código de invitación ya fue utilizado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Código válido",
      id_residential: invitationCode.id_residential,
      id_code: invitationCode.id_code
    });

  } catch (error) {
    console.error("Error al validar código:", error);
    res.status(500).json({
      error: "Error al validar código de invitación",
      details: error.message
    });
  }
};

// Registrar nuevo residente
export const registerResident = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      houseNumber,
      idResidential,
      idCode
    } = req.body;

    // Validaciones básicas
    if (!fullName || !email || !phoneNumber || !houseNumber || !idResidential || !idCode) {
      return res.status(400).json({
        error: "Todos los campos son requeridos"
      });
    }

    if (!req.files || !req.files.ineImage || !req.files.residentPhoto) {
      return res.status(400).json({
        error: "Las imágenes (INE y foto del residente) son requeridas"
      });
    }

    // Verificar que el código no haya sido usado
    const codeCheck = await pool.query(
      "SELECT is_used FROM invitation_codes WHERE id_code = $1",
      [idCode]
    );

    if (codeCheck.rows.length === 0 || codeCheck.rows[0].is_used) {
      return res.status(400).json({
        error: "Código de invitación no válido o ya utilizado"
      });
    }

    // Verificar que la casa existe
    const houseCheck = await pool.query(
      "SELECT id_house FROM houses WHERE house_number = $1 AND id_residential = $2",
      [houseNumber, idResidential]
    );

    if (houseCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Casa no encontrada"
      });
    }

    const idHouse = houseCheck.rows[0].id_house;

    // Subir imágenes a Cloudinary
    let ineUrl, residentPhotoUrl;

    try {
      // Subir INE
      const ineUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "ressly/residents" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.files.ineImage[0].buffer);
      });
      ineUrl = ineUpload.secure_url;

      // Subir Foto del Residente
      const photoUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "ressly/residents" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.files.residentPhoto[0].buffer);
      });
      residentPhotoUrl = photoUpload.secure_url;

    } catch (uploadError) {
      console.error("Error al subir imágenes a Cloudinary:", uploadError);
      return res.status(500).json({
        error: "Error al subir imágenes",
        details: uploadError.message
      });
    }

    // Crear residente en la base de datos
    const residentResponse = await pool.query(
      `INSERT INTO residents (
        full_name,
        email,
        phone_number,
        resident_photo_url,
        resident_ine_url,
        id_house,
        id_residential
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_resident, email, full_name`,
      [fullName, email, phoneNumber, residentPhotoUrl, ineUrl, idHouse, idResidential]
    );

    const newResident = residentResponse.rows[0];

    // Marcar código como usado
    await pool.query(
      "UPDATE invitation_codes SET is_used = true WHERE id_code = $1",
      [idCode]
    );

    res.status(201).json({
      success: true,
      message: "Residente registrado exitosamente",
      resident: {
        id_resident: newResident.id_resident,
        email: newResident.email,
        full_name: newResident.full_name,
        resident_photo_url: residentPhotoUrl,
        resident_ine_url: ineUrl
      }
    });

  } catch (error) {
    console.error("Error al registrar residente:", error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: "El correo ya está registrado"
      });
    }

    res.status(500).json({
      error: "Error al registrar residente",
      details: error.message
    });
  }
};