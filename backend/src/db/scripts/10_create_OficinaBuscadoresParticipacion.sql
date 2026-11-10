-- =======================================================
-- Tabla para guardar el porcentaje de participación
-- de cada Oficina Buscadores para cada año.
-- Este porcentaje es común a todos los rubros.
-- =======================================================

IF NOT EXISTS (
    SELECT 1
    FROM sys.objects o
    WHERE o.object_id = OBJECT_ID(N'dbo.OficinaBuscadoresParticipacion')
      AND o.type = N'U'
)
BEGIN
    CREATE TABLE dbo.OficinaBuscadoresParticipacion (
        OficinaBuscadoresParticipacionId INT IDENTITY(1,1) PRIMARY KEY,
        OficinaBuscadoresId INT NOT NULL,
        Anio INT NOT NULL,
        PorcentajeParticipacion DECIMAL(10,4) NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_OficinaBuscadoresParticipacion_OficinaBuscadores
            FOREIGN KEY (OficinaBuscadoresId) REFERENCES dbo.CatUnOperativa(CveUnOperativa),
        CONSTRAINT UQ_OficinaBuscadoresParticipacion_OficinaAnio
            UNIQUE (OficinaBuscadoresId, Anio)
    );

    CREATE NONCLUSTERED INDEX IX_OficinaBuscadoresParticipacion_OficinaBuscadoresId
        ON dbo.OficinaBuscadoresParticipacion(OficinaBuscadoresId);
    
    CREATE NONCLUSTERED INDEX IX_OficinaBuscadoresParticipacion_Anio
        ON dbo.OficinaBuscadoresParticipacion(Anio);
END
GO
