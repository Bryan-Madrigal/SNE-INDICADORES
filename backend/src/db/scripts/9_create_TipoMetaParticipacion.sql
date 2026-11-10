-- =======================================================
-- Tabla para guardar la participación global por TipoMeta.
-- Se captura una sola vez y aplica a todos los meses.
-- =======================================================

IF NOT EXISTS (
    SELECT 1
    FROM sys.objects o
    WHERE o.object_id = OBJECT_ID(N'dbo.TipoMetaParticipacion')
      AND o.type = N'U'
)
BEGIN
    CREATE TABLE dbo.TipoMetaParticipacion (
        TipoMetaId INT NOT NULL PRIMARY KEY,
        PctAtendidos DECIMAL(10,4) NOT NULL DEFAULT 0,
        PctVinculados DECIMAL(10,4) NOT NULL DEFAULT 0,
        PctColocados DECIMAL(10,4) NOT NULL DEFAULT 0,
        PctPlazasVacantes DECIMAL(10,4) NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_TipoMetaParticipacion_TipoMeta
            FOREIGN KEY (TipoMetaId) REFERENCES dbo.TipoMeta(TipoMetaId)
    );
END
GO
