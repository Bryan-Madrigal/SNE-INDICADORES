
-- =======================================================
-- Módulo: Normalización de tabla Metas_BuscadoresDeTrabajo
-- Descripción: Consolida las filas repetidas en una sola 
-- fila por Oficina, Mes, Año y TipoMetaId, con columnas 
-- agrupadas de Atendidos, Vinculados y Colocados.
-- Se añade restricción UNIQUE para evitar duplicados.
-- =======================================================
BEGIN TRANSACTION;
BEGIN TRY

    -- 1. Crear respaldo opcional por si acaso
    IF OBJECT_ID('dbo.Metas_Buscadores_BKP', 'U') IS NULL
    BEGIN
        SELECT * INTO dbo.Metas_Buscadores_BKP FROM dbo.Metas_BuscadoresDeTrabajo;
    END

    -- 2. Crear nueva tabla consolidada
    IF OBJECT_ID('dbo.Metas_BuscadoresDeTrabajo_New', 'U') IS NOT NULL
        DROP TABLE dbo.Metas_BuscadoresDeTrabajo_New;

    CREATE TABLE dbo.Metas_BuscadoresDeTrabajo_New (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        IdOficina INT NOT NULL,
        Oficina NVARCHAR(200) NOT NULL,
        IdMes INT NOT NULL,
        Mes NVARCHAR(50) NOT NULL,
        Anio INT NOT NULL,
        TipoMetaId INT NOT NULL,
        MetaAtendidos DECIMAL(18,2) DEFAULT 0,
        MetaVinculados DECIMAL(18,2) DEFAULT 0,
        MetaColocados DECIMAL(18,2) DEFAULT 0,
        CONSTRAINT UQ_Meta_Buscadores UNIQUE (IdOficina, IdMes, Anio, TipoMetaId)
    );

    -- 3. Insertar datos agrupados desde la tabla vieja
    -- Usamos SUM(ISNULL(Meta... ,0)) que ya fueron populadas en el script 4
    INSERT INTO dbo.Metas_BuscadoresDeTrabajo_New 
        (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, MetaAtendidos, MetaVinculados, MetaColocados)
    SELECT 
        IdOficina,
        MAX(Oficina) AS Oficina,
        IdMes,
        MAX(Mes) AS Mes,
        Anio,
        TipoMetaId,
        SUM(ISNULL(MetaAtendidos, 0)) AS MetaAtendidos,
        SUM(ISNULL(MetaVinculados, 0)) AS MetaVinculados,
        SUM(ISNULL(MetaColocados, 0)) AS MetaColocados
    FROM dbo.Metas_BuscadoresDeTrabajo
    WHERE TipoMetaId IS NOT NULL
    GROUP BY IdOficina, IdMes, Anio, TipoMetaId;

    -- 4. Reemplazar tabla
    DROP TABLE dbo.Metas_BuscadoresDeTrabajo;
    EXEC sp_rename 'dbo.Metas_BuscadoresDeTrabajo_New', 'Metas_BuscadoresDeTrabajo';

    COMMIT TRANSACTION;
    PRINT 'Tabla Metas_BuscadoresDeTrabajo refactorizada con éxito.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT ERROR_MESSAGE();
END CATCH;

