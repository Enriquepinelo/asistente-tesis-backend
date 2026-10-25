-- Tabla nueva para los documentos que el asesor sube con sus observaciones.
-- No modifica ninguna tabla existente. Ejecutar una sola vez en asistente_tesis.
CREATE TABLE IF NOT EXISTS documentos_revision (
  id_documento   INT AUTO_INCREMENT PRIMARY KEY,
  id_propuesta   INT NOT NULL,
  nombre_archivo VARCHAR(200) NOT NULL,
  tipo_mime      VARCHAR(100) NOT NULL,
  tamano_bytes   INT NOT NULL,
  contenido      MEDIUMBLOB NOT NULL,
  subido_por     INT NULL,
  fecha_subida   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documento_propuesta FOREIGN KEY (id_propuesta)
    REFERENCES propuestas_generadas (id_propuesta) ON DELETE CASCADE,
  CONSTRAINT fk_documento_usuario FOREIGN KEY (subido_por)
    REFERENCES usuarios_sistema (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
