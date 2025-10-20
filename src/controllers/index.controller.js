/**
 * Este archivo contiene los controladores para manejar la lógica del CRUD de usuarios.
 * Cada función se encarga de una operación específica en la base de datos.
 * Autor: Juan Carlos Govea Magaña
 * Fecha: 20/10/2025
 */

import { pool } from "../db.js";

/**
 * Obtiene todos los usuarios de la base de datos, ordenados por su ID.
 */
export const getUsuarios = async (req, res) => {
  try {
    const response = await pool.query("SELECT * FROM usuarios ORDER BY id ASC");
    res.status(200).json(response.rows);
  } catch (error) {
    res.status(500).json({
      error: "Error al conectar con la base de datos",
      details: error.message,
    });
  }
};

/**
 * Obtiene un único usuario buscando por el ID que se pasa en la URL.
 * Si no encuentra al usuario, devuelve un error 404.
 */
export const getUsuarioById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const response = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);

    if (response.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(response.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: "Error al conectar con la base de datos",
      details: error.message,
    });
  }
};

/**
 * Crea un nuevo usuario con la información enviada en el cuerpo de la petición.
 * Valida que los campos no estén vacíos y maneja el caso de que el correo ya exista.
 */
export const createUsuario = async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({
        error: "Todos los campos son requeridos (nombre, correo, contrasena)",
      });
    }

    const { rows } = await pool.query(
      "INSERT INTO usuarios (nombre, correo, contrasena) VALUES ($1, $2, $3) RETURNING *",
      [nombre, correo, contrasena]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    // Manejo de error específico para email duplicado (código de error de PostgreSQL '23505')
    if (error.code === "23505") {
      return res.status(409).json({
        error: "El correo ya está registrado",
      });
    }

    res.status(500).json({
      error: "Error al crear usuario",
      details: error.message,
    });
  }
};

/**
 * Actualiza el nombre y correo de un usuario existente, buscándolo por su ID.
 * Si el usuario a actualizar no se encuentra, devuelve un error 404.
 */
export const updateUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, correo } = req.body;

    const { rows } = await pool.query(
      "UPDATE usuarios SET nombre = $1, correo = $2 WHERE id = $3 RETURNING *",
      [nombre, correo, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar usuario",
      details: error.message,
    });
  }
};

/**
 * Elimina un usuario de la base de datos, buscándolo por su ID.
 * Si lo elimina con éxito, responde con un estado 204 (No Content).
 * Si el usuario a eliminar no se encuentra, devuelve un error 404.
 */
export const deleteUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar usuario",
      details: error.message,
    });
  }
};