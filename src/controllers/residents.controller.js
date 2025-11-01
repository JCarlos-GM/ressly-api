import { pool } from "../db.js";

/**
 * Obtiene los datos de un residente por su email
 */
export const getResidentByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ 
        error: "El email es requerido" 
      });
    }

    const response = await pool.query(
      `SELECT id_resident, first_name, last_name, email, phone_number, 
              resident_photo_url, resident_ine_photo_url, status, id_house
       FROM residents 
       WHERE email = $1`,
      [email]
    );

    if (response.rows.length === 0) {
      return res.status(404).json({ 
        error: "Residente no encontrado" 
      });
    }

    const resident = response.rows[0];

    res.status(200).json({
      success: true,
      resident: resident
    });

  } catch (error) {
    console.error("Error en getResidentByEmail:", error);
    res.status(500).json({
      error: "Error en el servidor",
      details: error.message,
    });
  }
};