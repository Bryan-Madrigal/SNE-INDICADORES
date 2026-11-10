-- =======================================================
-- Tabla para guardar la asignación global por rubro, oficina
-- y distribución mensual.
-- Ejecutar una sola vez con permisos de administrador.
-- =======================================================

IF NOT EXISTS (
    SELECT 1
    FROM sys.objects o
    WHERE o.object_id = OBJECT_ID(N'dbo.AsignacionGlobalMetas')
      AND o.type = N'U'
)
BEGIN
    CREATE TABLE dbo.AsignacionGlobalMetas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Anio INT NOT NULL,
        Rubro NVARCHAR(100) NOT NULL,
        CveUnOperativa INT NOT NULL,
        Oficina NVARCHAR(200) NOT NULL,
        ParticipacionPct DECIMAL(10,4) NOT NULL,
        MetaAnual DECIMAL(18,2) NOT NULL,
        MetaEnero DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaFebrero DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaMarzo DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaAbril DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaMayo DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaJunio DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaJulio DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaAgosto DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaSeptiembre DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaOctubre DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaNoviembre DECIMAL(18,2) NOT NULL DEFAULT 0,
        MetaDiciembre DECIMAL(18,2) NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_AsignacionGlobalMetas UNIQUE (Anio, Rubro, CveUnOperativa),
        CONSTRAINT FK_AsignacionGlobalMetas_CatUnOperativa
            FOREIGN KEY (CveUnOperativa) REFERENCES dbo.CatUnOperativa(CveUnOperativa)
    );
END
GO

IF OBJECT_ID('dbo.AsignacionGlobalMetas', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.AsignacionGlobalMetas', 'IdOficina') IS NOT NULL
    BEGIN
        IF COL_LENGTH('dbo.AsignacionGlobalMetas', 'CveUnOperativa') IS NULL
        BEGIN
            EXEC sp_rename 'dbo.AsignacionGlobalMetas.IdOficina', 'CveUnOperativa', 'COLUMN';
        END
    END

    IF COL_LENGTH('dbo.AsignacionGlobalMetas', 'CatUnOperativa') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.AsignacionGlobalMetas DROP COLUMN CatUnOperativa;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys fk
        WHERE fk.name = 'FK_AsignacionGlobalMetas_CatUnOperativa'
          AND fk.parent_object_id = OBJECT_ID('dbo.AsignacionGlobalMetas')
    )
    BEGIN
        ALTER TABLE dbo.AsignacionGlobalMetas
        ADD CONSTRAINT FK_AsignacionGlobalMetas_CatUnOperativa
            FOREIGN KEY (CveUnOperativa) REFERENCES dbo.CatUnOperativa(CveUnOperativa);
    END
END
GO
