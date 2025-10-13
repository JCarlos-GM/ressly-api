CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

SELECT * from usuarios;

DROP TABLE usuarios;

INSERT INTO usuarios (nombre, correo, contrasena)
    VALUES ('Juan Pérez', 'juan.perez@example.com', 'una_contrasena_segura');

UPDATE usuarios
SET nombre = 'Juan Carlos Govea Magaña', 
    correo = 'jgoveamagana@gmail.com', 
    contrasena = '380674'
WHERE id = 1;
