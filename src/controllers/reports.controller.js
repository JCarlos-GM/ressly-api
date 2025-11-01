/**
 * Controlador para manejar la lógica del CRUD de reportes.
 * Autor: Juan Carlos Govea Magaña
 * Fecha: 01/11/2025
 * Actualizado: Reportes comunitarios y sistema de votación
 */

import { pool } from "../db.js";
import cloudinary from "cloudinary";

// Configuración de Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Función auxiliar para subir una imagen a Cloudinary
 */
const uploadReportImage = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: "ressly/reports" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Controlador para crear un nuevo reporte con múltiples imágenes
 */
export const createReport = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    const { 
      idResident,
      title, 
      category, 
      urgency, 
      location, 
      description, 
      anonymous, 
      publicReport
    } = req.body;

    // 1. Validar campos obligatorios
    if (!title || !category || !urgency || !description || !idResident) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Los campos título, categoría, urgencia, descripción e ID de residente son obligatorios"
      });
    }

    // 2. Validar que se recibió al menos una imagen
    if (!req.files || req.files.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Debes subir al menos una imagen para el reporte"
      });
    }

    // 3. Validar máximo de imágenes
    if (req.files.length > 5) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "El máximo de imágenes permitidas es 5"
      });
    }

    // 4. Verificar que el residente existe
    const residentCheck = await client.query(
      "SELECT id_resident FROM residents WHERE id_resident = $1",
      [idResident]
    );

    if (residentCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "El residente no fue encontrado"
      });
    }

    // 5. Validar categoría
    const validCategories = [
      "Mantenimiento",
      "Seguridad",
      "Limpieza",
      "Áreas Comunes",
      "Administración",
      "Quejas de Vecinos",
      "Otro"
    ];
    if (!validCategories.includes(category)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Categoría no válida"
      });
    }

    // 6. Validar nivel de urgencia
    const validUrgency = ["Bajo", "Medio", "Alto"];
    if (!validUrgency.includes(urgency)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Nivel de urgencia no válido. Debe ser: Bajo, Medio o Alto"
      });
    }

    // 7. Convertir valores booleanos
    const isAnonymous = anonymous === "true" || anonymous === true;
    const isPublicReport = publicReport === "true" || publicReport === true;

    // 8. Insertar el reporte en la base de datos
    const reportResponse = await client.query(
      `INSERT INTO reports 
       (title, category, urgency, location, description, anonymous, public, id_resident)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_report, title, category, urgency, location, description, 
                 anonymous, public, status, created_at, id_resident`,
      [
        title,
        category,
        urgency,
        location || null,
        description,
        isAnonymous,
        isPublicReport,
        idResident
      ]
    );

    const newReport = reportResponse.rows[0];

    // 9. Subir todas las imágenes a Cloudinary y guardar en reports_images
    const imageUrls = [];

    for (const image of req.files) {
      try {
        const imageUrl = await uploadReportImage(image.buffer);
        
        const imageResponse = await client.query(
          `INSERT INTO reports_images (report_image_photo_url, id_report)
           VALUES ($1, $2)
           RETURNING id_report_image, report_image_photo_url`,
          [imageUrl, newReport.id_report]
        );

        imageUrls.push(imageResponse.rows[0].report_image_photo_url);
      } catch (uploadError) {
        console.error("Error al subir imagen:", uploadError);
        await client.query("ROLLBACK");
        return res.status(500).json({
          error: "Error al subir las imágenes a Cloudinary",
          details: uploadError.message
        });
      }
    }

    // 10. Commit de la transacción
    await client.query("COMMIT");

    // 11. Responder con éxito
    res.status(201).json({
      success: true,
      message: "Reporte creado exitosamente",
      report: {
        ...newReport,
        images: imageUrls
      }
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en createReport:", error);
    res.status(500).json({
      error: "Error en el servidor al crear el reporte",
      details: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Obtiene todos los reportes de un residente específico con sus imágenes
 */
export const getReportsByResident = async (req, res) => {
  try {
    const { idResident } = req.params;

    if (!idResident) {
      return res.status(400).json({
        error: "El ID del residente es requerido"
      });
    }

    // 1. Verificar que el residente existe
    const residentCheck = await pool.query(
      "SELECT id_resident FROM residents WHERE id_resident = $1",
      [idResident]
    );

    if (residentCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Residente no encontrado"
      });
    }

    // 2. Obtener todos los reportes del residente
    const reportsResponse = await pool.query(
      `SELECT id_report, title, category, urgency, location, description,
              anonymous, public, status, created_at, id_resident
       FROM reports
       WHERE id_resident = $1
       ORDER BY created_at DESC`,
      [idResident]
    );

    const reports = reportsResponse.rows;

    // 3. Para cada reporte, obtener sus imágenes
    const reportsWithImages = await Promise.all(
      reports.map(async (report) => {
        const imagesResponse = await pool.query(
          `SELECT report_image_photo_url
           FROM reports_images
           WHERE id_report = $1
           ORDER BY id_report_image ASC`,
          [report.id_report]
        );

        return {
          ...report,
          images: imagesResponse.rows.map(img => img.report_image_photo_url)
        };
      })
    );

    // 4. Responder con éxito
    res.status(200).json({
      success: true,
      count: reportsWithImages.length,
      reports: reportsWithImages
    });

  } catch (error) {
    console.error("Error en getReportsByResident:", error);
    res.status(500).json({
      error: "Error en el servidor al obtener los reportes",
      details: error.message
    });
  }
};

/**
 * Obtiene todos los reportes públicos de un residencial con sistema de votación
 * Query params: ?filter=todas|semana|mes&idResident=xxx
 */
export const getCommunityReports = async (req, res) => {
  try {
    const { idResidential } = req.params;
    const { filter = 'todas', idResident } = req.query;

    if (!idResidential) {
      return res.status(400).json({
        error: "El ID del residencial es requerido"
      });
    }

    // 1. Construir filtro de fecha según el parámetro
    let dateFilter = '';
    if (filter === 'semana') {
      dateFilter = "AND r.created_at >= NOW() - INTERVAL '7 days'";
    } else if (filter === 'mes') {
      dateFilter = "AND r.created_at >= NOW() - INTERVAL '30 days'";
    }

    // 2. Query principal: obtener reportes públicos con votos
    const query = `
      SELECT 
        r.id_report,
        r.title,
        r.category,
        r.urgency,
        r.location,
        r.description,
        r.anonymous,
        r.public,
        r.status,
        r.created_at,
        r.id_resident,
        res.first_name,
        res.last_name,
        res.resident_photo_url,
        COALESCE(SUM(rv.vote_value), 0)::INTEGER AS vote_count,
        ${idResident ? `MAX(CASE WHEN rv.id_resident = $2 THEN rv.vote_value ELSE NULL END) AS user_vote` : 'NULL AS user_vote'}
      FROM reports r
      INNER JOIN residents res ON r.id_resident = res.id_resident
      INNER JOIN houses h ON res.id_house = h.id_house
      LEFT JOIN report_votes rv ON r.id_report = rv.id_report
      WHERE h.id_residential = $1
        AND r.public = true
        ${dateFilter}
      GROUP BY r.id_report, res.first_name, res.last_name, res.resident_photo_url
      ORDER BY vote_count DESC, r.created_at DESC
    `;

    const params = idResident ? [idResidential, idResident] : [idResidential];
    const reportsResponse = await pool.query(query, params);

    const reports = reportsResponse.rows;

    // 3. Para cada reporte, obtener sus imágenes
    const reportsWithImages = await Promise.all(
      reports.map(async (report) => {
        const imagesResponse = await pool.query(
          `SELECT report_image_photo_url
           FROM reports_images
           WHERE id_report = $1
           ORDER BY id_report_image ASC`,
          [report.id_report]
        );

        return {
          ...report,
          images: imagesResponse.rows.map(img => img.report_image_photo_url),
          // Ocultar nombre si es anónimo
          first_name: report.anonymous ? null : report.first_name,
          last_name: report.anonymous ? null : report.last_name,
          resident_photo_url: report.anonymous ? null : report.resident_photo_url
        };
      })
    );

    // 4. Responder con éxito
    res.status(200).json({
      success: true,
      count: reportsWithImages.length,
      filter: filter,
      reports: reportsWithImages
    });

  } catch (error) {
    console.error("Error en getCommunityReports:", error);
    res.status(500).json({
      error: "Error en el servidor al obtener los reportes comunitarios",
      details: error.message
    });
  }
};

/**
 * Vota por un reporte (upvote: 1, downvote: -1)
 * Si el usuario ya votó, actualiza su voto
 */
export const voteReport = async (req, res) => {
  const client = await pool.connect();

  try {
    const { idReport, idResident, voteValue } = req.body;

    // 1. Validaciones
    if (!idReport || !idResident || voteValue === undefined) {
      return res.status(400).json({
        error: "Los campos idReport, idResident y voteValue son obligatorios"
      });
    }

    if (voteValue !== 1 && voteValue !== -1) {
      return res.status(400).json({
        error: "El voteValue debe ser 1 (upvote) o -1 (downvote)"
      });
    }

    // 2. Verificar que el reporte existe y es público
    const reportCheck = await client.query(
      "SELECT id_report, public FROM reports WHERE id_report = $1",
      [idReport]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Reporte no encontrado"
      });
    }

    if (!reportCheck.rows[0].public) {
      return res.status(403).json({
        error: "No puedes votar en reportes privados"
      });
    }

    // 3. Verificar que el residente existe
    const residentCheck = await client.query(
      "SELECT id_resident FROM residents WHERE id_resident = $1",
      [idResident]
    );

    if (residentCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Residente no encontrado"
      });
    }

    await client.query("BEGIN");

    // 4. Verificar si el usuario ya votó
    const existingVote = await client.query(
      "SELECT vote_value FROM report_votes WHERE id_report = $1 AND id_resident = $2",
      [idReport, idResident]
    );

    if (existingVote.rows.length > 0) {
      // Si el voto es el mismo, eliminarlo (toggle)
      if (existingVote.rows[0].vote_value === voteValue) {
        await client.query(
          "DELETE FROM report_votes WHERE id_report = $1 AND id_resident = $2",
          [idReport, idResident]
        );

        await client.query("COMMIT");

        return res.status(200).json({
          success: true,
          message: "Voto eliminado",
          action: "removed",
          voteValue: null
        });
      } else {
        // Actualizar el voto
        await client.query(
          "UPDATE report_votes SET vote_value = $1 WHERE id_report = $2 AND id_resident = $3",
          [voteValue, idReport, idResident]
        );

        await client.query("COMMIT");

        return res.status(200).json({
          success: true,
          message: "Voto actualizado",
          action: "updated",
          voteValue: voteValue
        });
      }
    } else {
      // Insertar nuevo voto
      await client.query(
        "INSERT INTO report_votes (id_report, id_resident, vote_value) VALUES ($1, $2, $3)",
        [idReport, idResident, voteValue]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Voto registrado",
        action: "created",
        voteValue: voteValue
      });
    }

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en voteReport:", error);
    res.status(500).json({
      error: "Error en el servidor al votar",
      details: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Elimina el voto de un residente en un reporte
 */
export const removeVote = async (req, res) => {
  try {
    const { idReport, idResident } = req.params;

    if (!idReport || !idResident) {
      return res.status(400).json({
        error: "Los parámetros idReport e idResident son obligatorios"
      });
    }

    // 1. Verificar que el voto existe
    const voteCheck = await pool.query(
      "SELECT * FROM report_votes WHERE id_report = $1 AND id_resident = $2",
      [idReport, idResident]
    );

    if (voteCheck.rows.length === 0) {
      return res.status(404).json({
        error: "No se encontró el voto"
      });
    }

    // 2. Eliminar el voto
    await pool.query(
      "DELETE FROM report_votes WHERE id_report = $1 AND id_resident = $2",
      [idReport, idResident]
    );

    res.status(200).json({
      success: true,
      message: "Voto eliminado exitosamente"
    });

  } catch (error) {
    console.error("Error en removeVote:", error);
    res.status(500).json({
      error: "Error en el servidor al eliminar el voto",
      details: error.message
    });
  }
};

/**
 * Elimina un reporte (las imágenes se eliminan automáticamente por CASCADE)
 */
export const deleteReport = async (req, res) => {
  try {
    const { idReport } = req.params;

    if (!idReport) {
      return res.status(400).json({
        error: "El ID del reporte es requerido"
      });
    }

    // 1. Verificar que el reporte existe
    const reportCheck = await pool.query(
      "SELECT id_report, title FROM reports WHERE id_report = $1",
      [idReport]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Reporte no encontrado"
      });
    }

    const reportTitle = reportCheck.rows[0].title;

    // 2. Eliminar el reporte (CASCADE eliminará imágenes y votos)
    await pool.query(
      "DELETE FROM reports WHERE id_report = $1",
      [idReport]
    );

    // 3. Responder con éxito
    res.status(200).json({
      success: true,
      message: `El reporte "${reportTitle}" ha sido eliminado exitosamente`
    });

  } catch (error) {
    console.error("Error en deleteReport:", error);
    res.status(500).json({
      error: "Error en el servidor al eliminar el reporte",
      details: error.message
    });
  }
};