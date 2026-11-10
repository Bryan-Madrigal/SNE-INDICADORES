-- =======================================================
-- Crea tabla de catálogo TipoMeta y altera Metas_BuscadoresDeTrabajo
-- Inserta los tipos solicitados y llena la columna TipoMetaId en Metas_BuscadoresDeTrabajo
-- =======================================================
-- Compatible con SQL Server (T-SQL)
-- Crear la tabla sólo si no existe
IF NOT EXISTS (
    SELECT 1 FROM sys.objects o
    WHERE o.object_id = OBJECT_ID(N'dbo.TipoMeta') AND o.type = N'U'
)
BEGIN
    CREATE TABLE dbo.TipoMeta (
        TipoMetaId INT IDENTITY(1,1) PRIMARY KEY,
        Codigo NVARCHAR(50) NOT NULL UNIQUE,
        Nombre NVARCHAR(150) NOT NULL,
        Descripcion NVARCHAR(500) NULL
    );
END
GO

-- Insertar valores (si no existen)
IF NOT EXISTS (SELECT 1 FROM dbo.TipoMeta WHERE Codigo = 'JCF')
    INSERT INTO dbo.TipoMeta (Codigo, Nombre) VALUES ('JCF', 'JCF');
IF NOT EXISTS (SELECT 1 FROM dbo.TipoMeta WHERE Codigo = 'PROF')
    INSERT INTO dbo.TipoMeta (Codigo, Nombre) VALUES ('PROF', 'Profesionistas');
IF NOT EXISTS (SELECT 1 FROM dbo.TipoMeta WHERE Codigo = 'MUJ')
    INSERT INTO dbo.TipoMeta (Codigo, Nombre) VALUES ('MUJ', 'Mujeres');
IF NOT EXISTS (SELECT 1 FROM dbo.TipoMeta WHERE Codigo = 'SAL_ALT')
    INSERT INTO dbo.TipoMeta (Codigo, Nombre) VALUES ('SAL_ALT', 'Vacantes de Salario Alto');
IF NOT EXISTS (SELECT 1 FROM dbo.TipoMeta WHERE Codigo = 'JOV')
    INSERT INTO dbo.TipoMeta (Codigo, Nombre) VALUES ('JOV', 'Jóvenes (18-29 años)');
IF NOT EXISTS (SELECT 1 FROM dbo.TipoMeta WHERE Codigo = 'ADU_MAY')
    INSERT INTO dbo.TipoMeta (Codigo, Nombre) VALUES ('ADU_MAY', 'Adultos Mayores (>=50 años)');
IF NOT EXISTS (SELECT 1 FROM dbo.TipoMeta WHERE Codigo = 'DIS')
    INSERT INTO dbo.TipoMeta (Codigo, Nombre) VALUES ('DIS', 'Personas con Discapacidad');
IF NOT EXISTS (SELECT 1 FROM dbo.TipoMeta WHERE Codigo = 'HOMB_30_49')
    INSERT INTO dbo.TipoMeta (Codigo, Nombre) VALUES ('HOMB_30_49', 'Hombres (30-49 años)');
GO

-- Añadir columna TipoMetaId a Metas_BuscadoresDeTrabajo si no existe
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'TipoMetaId') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD TipoMetaId INT NULL;
END
GO

-- Añadir columnas normalizadas para metas por rubro si no existen
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaAtendidos') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD MetaAtendidos DECIMAL(10,2) NULL,
        MetaVinculados DECIMAL(10,2) NULL,
        MetaColocados DECIMAL(10,2) NULL;
END
GO

-- Mapear MetaRequerida existente a las nuevas columnas según el campo Indicador
UPDATE dbo.Metas_BuscadoresDeTrabajo
SET MetaAtendidos = CASE WHEN UPPER(ISNULL(Indicador,'')) LIKE '%ATEND%' THEN MetaRequerida ELSE MetaAtendidos END,
    MetaVinculados = CASE WHEN UPPER(ISNULL(Indicador,'')) LIKE '%VINC%' THEN MetaRequerida ELSE MetaVinculados END,
    MetaColocados = CASE WHEN UPPER(ISNULL(Indicador,'')) LIKE '%COLOC%' THEN MetaRequerida ELSE MetaColocados END;
GO

-- Mapear valores existentes de m.Segmento a los códigos del catálogo
-- Ajusta las condiciones si tus valores en la columna Segmento difieren
UPDATE m
SET TipoMetaId = t.TipoMetaId
FROM dbo.Metas_BuscadoresDeTrabajo m
INNER JOIN dbo.TipoMeta t ON
    (   (m.Segmento = 'JCF' AND t.Codigo = 'JCF')
     OR (m.Segmento = 'Profesionistas' AND t.Codigo = 'PROF')
     OR (m.Segmento = 'Mujeres' AND t.Codigo = 'MUJ')
     OR (m.Segmento = 'Salario Alto' AND t.Codigo = 'SAL_ALT')
     OR (m.Segmento LIKE '%Jóvenes%' AND t.Codigo = 'JOV')
     OR (m.Segmento LIKE '%Adultos Mayores%' AND t.Codigo = 'ADU_MAY')
     OR (m.Segmento LIKE '%Personas con discapacidad%' AND t.Codigo = 'DIS')
     OR (m.Segmento LIKE '%Hombres%' AND t.Codigo = 'HOMB_30_49')
    );
GO

-- Finalmente agregar FK (opcional: activa si quieres integridad referencial)
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys fk
    WHERE fk.name = 'FK_Metas_TipoMeta'
      AND fk.parent_object_id = OBJECT_ID('dbo.Metas_BuscadoresDeTrabajo')
)
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD CONSTRAINT FK_Metas_TipoMeta
    FOREIGN KEY (TipoMetaId) REFERENCES dbo.TipoMeta(TipoMetaId);
END
GO

-- Mostrar resumen de TipoMeta
SELECT * FROM dbo.TipoMeta ORDER BY TipoMetaId;

-- Mostrar conteo por TipoMeta en Metas_BuscadoresDeTrabajo para ver la cobertura
SELECT t.Codigo, t.Nombre, COUNT(*) AS MetasCount
FROM dbo.Metas_BuscadoresDeTrabajo m
LEFT JOIN dbo.TipoMeta t ON m.TipoMetaId = t.TipoMetaId
GROUP BY t.Codigo, t.Nombre
ORDER BY t.Codigo;
