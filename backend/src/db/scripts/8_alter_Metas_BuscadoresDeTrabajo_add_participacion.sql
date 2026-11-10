-- =======================================================
-- Agrega porcentajes de participación por TipoMeta
-- a Metas_BuscadoresDeTrabajo.
-- Ejecutar una sola vez.
-- =======================================================

IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'PctAtendidos') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD PctAtendidos DECIMAL(10,4) NOT NULL CONSTRAINT DF_MBT_PctAtendidos DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'PctVinculados') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD PctVinculados DECIMAL(10,4) NOT NULL CONSTRAINT DF_MBT_PctVinculados DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'PctColocados') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD PctColocados DECIMAL(10,4) NOT NULL CONSTRAINT DF_MBT_PctColocados DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'PctPlazasVacantes') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD PctPlazasVacantes DECIMAL(10,4) NOT NULL CONSTRAINT DF_MBT_PctPlazasVacantes DEFAULT 0;
END
GO