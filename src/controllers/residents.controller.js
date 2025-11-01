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

    // --- INICIO DE LA CORRECCIÓN ---
    const query = `
      SELECT 
        res.id_resident, 
        res.first_name, 
        res.last_name, 
        res.email, 
        res.phone_number, 
        res.resident_photo_url, 
        res.resident_ine_photo_url, 
        res.status, 
        res.id_house,
        h.id_residential  -- <-- ¡CAMPO AÑADIDO!
      FROM residents AS res
      INNER JOIN houses AS h ON res.id_house = h.id_house
      WHERE res.email = $1
    `;
    // --- FIN DE LA CORRECCIÓN ---

    const response = await pool.query(query, [email]); // Se usa la nueva query

    if (response.rows.length === 0) {
      return res.status(404).json({ 
        error: "Residente no encontrado" 
      });
    }

    const resident = response.rows[0]; // 'resident' ahora contendrá 'id_residential'

    res.status(200).json({
      success: true,
      resident: resident // La app recibirá el objeto completo
    });

  } catch (error) {
    console.error("Error en getResidentByEmail:", error);
    res.status(500).json({
      error: "Error en el servidor",
      details: error.message,
    });
  }
};