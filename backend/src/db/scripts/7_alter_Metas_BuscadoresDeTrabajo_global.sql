-- =======================================================
-- Extiende Metas_BuscadoresDeTrabajo para guardar asignación
-- global por rubro, oficina y distribución mensual.
-- Ejecutar una sola vez con permisos de ALTER en la tabla.
-- =======================================================

IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'RegistroGlobal') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD RegistroGlobal BIT NOT NULL CONSTRAINT DF_Metas_BuscadoresDeTrabajo_RegistroGlobal DEFAULT (0);
END
GO

IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'RubroGlobal') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD RubroGlobal NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'ParticipacionGlobalPct') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD ParticipacionGlobalPct DECIMAL(10,4) NULL;
END
GO

IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalAnual') IS NULL
BEGIN
    ALTER TABLE dbo.Metas_BuscadoresDeTrabajo
    ADD MetaGlobalAnual DECIMAL(18,2) NULL;
END
GO

IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalEnero') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalEnero DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalFebrero') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalFebrero DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalMarzo') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalMarzo DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalAbril') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalAbril DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalMayo') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalMayo DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalJunio') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalJunio DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalJulio') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalJulio DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalAgosto') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalAgosto DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalSeptiembre') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalSeptiembre DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalOctubre') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalOctubre DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalNoviembre') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalNoviembre DECIMAL(18,2) NULL; END
GO
IF COL_LENGTH('dbo.Metas_BuscadoresDeTrabajo', 'MetaGlobalDiciembre') IS NULL
BEGIN ALTER TABLE dbo.Metas_BuscadoresDeTrabajo ADD MetaGlobalDiciembre DECIMAL(18,2) NULL; END
GO

UPDATE dbo.Metas_BuscadoresDeTrabajo
SET RegistroGlobal = ISNULL(RegistroGlobal, 0)
WHERE RegistroGlobal IS NULL;
GO
