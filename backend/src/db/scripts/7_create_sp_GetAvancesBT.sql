CREATE PROCEDURE dbo.sp_GetAvancesBT
    @anio INT,
    @mes INT = NULL,
    @tipoMetaId INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Definición de Constantes (Evita Magic Numbers)
    DECLARE @SalarioMinimo DECIMAL(18,2) = 315.04;
    DECLARE @ESTATUS_ATENDIDO INT = 2;
    DECLARE @TIPO_CITA_JCF INT = 7;
    DECLARE @ESTATUS_VINCULADO_RECHAZADO INT = 3; -- Status != 3 es vinculado
    DECLARE @ESTATUS_COLOCADO INT = 4;

    ;WITH RealAtendidos AS (
        SELECT Ats.CveUnOperativa AS IdOficina, COUNT(*) AS Total
        FROM AtencionSolicitante Ats
        LEFT JOIN Solicitante S ON Ats.CveSolicitante = S.CveSolicitante
        WHERE Ats.CveEstatusCita = @ESTATUS_ATENDIDO
          AND YEAR(Ats.Fecha) = @anio
          AND (@mes IS NULL OR MONTH(Ats.Fecha) = @mes)
          AND @tipoMetaId != 4 
          AND (
              @tipoMetaId = 0
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = @TIPO_CITA_JCF)
              OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9))
              OR (@tipoMetaId = 3 AND S.CveSexo = 2)
              OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29)
              OR (@tipoMetaId = 6 AND S.Edad >= 50)
              OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3)
              OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49)
          )
        GROUP BY Ats.CveUnOperativa
    ),
    RealVinculados AS (
        SELECT Ats.CveUnOperativa AS IdOficina, COUNT(ES.CveEnvio) AS Total 
        FROM EnvioSeguimiento ES 
        LEFT JOIN AtencionSolicitante Ats ON ES.CveAtencion = Ats.CveAtencion
        LEFT JOIN Solicitante S ON Ats.CveSolicitante = S.CveSolicitante
        LEFT JOIN Vacantes V ON ES.CveVacante = V.CveVacante
        WHERE ES.Status != @ESTATUS_VINCULADO_RECHAZADO
          AND YEAR(ES.FechaEnvio) = @anio
          AND (@mes IS NULL OR MONTH(ES.FechaEnvio) = @mes)
          AND (
              @tipoMetaId = 0
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = @TIPO_CITA_JCF)
              OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9))
              OR (@tipoMetaId = 3 AND S.CveSexo = 2)
              OR (@tipoMetaId = 4 AND V.Salario > @SalarioMinimo)  
              OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29)
              OR (@tipoMetaId = 6 AND S.Edad >= 50)
              OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3)
              OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49)
          )
        GROUP BY Ats.CveUnOperativa
    ),
    RealColocados AS (
        SELECT Ats.CveUnOperativa AS IdOficina, COUNT(ES.CveEnvio) AS Total 
        FROM EnvioSeguimiento ES 
        LEFT JOIN AtencionSolicitante Ats ON ES.CveAtencion = Ats.CveAtencion
        LEFT JOIN Solicitante S ON Ats.CveSolicitante = S.CveSolicitante
        LEFT JOIN Vacantes V ON ES.CveVacante = V.CveVacante
        WHERE ES.Status = @ESTATUS_COLOCADO
          AND YEAR(ES.FechaCol) = @anio
          AND (@mes IS NULL OR MONTH(ES.FechaCol) = @mes)
          AND (
              @tipoMetaId = 0
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = @TIPO_CITA_JCF)
              OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9))
              OR (@tipoMetaId = 3 AND S.CveSexo = 2)
              OR (@tipoMetaId = 4 AND V.Salario > @SalarioMinimo)  
              OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29)
              OR (@tipoMetaId = 6 AND S.Edad >= 50)
              OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3)
              OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49)
          )
        GROUP BY Ats.CveUnOperativa
    ),
    MetaAgg AS (
        SELECT
            m.IdOficina,
            MAX(m.IdMes) AS IdMes,
            CAST(CASE WHEN @tipoMetaId = 0 THEN 'General' ELSE MAX(t.Nombre) END AS NVARCHAR(100)) AS Segmento,
            SUM(ISNULL(m.MetaAtendidos,0)) AS MetaAtendidos,
            SUM(ISNULL(m.MetaVinculados,0)) AS MetaVinculados,
            SUM(ISNULL(m.MetaColocados,0)) AS MetaColocados
        FROM Metas_BuscadoresDeTrabajo m
        LEFT JOIN TipoMeta t ON m.TipoMetaId = t.TipoMetaId
        WHERE m.Anio = @anio AND (@mes IS NULL OR m.IdMes = @mes)
          AND (@tipoMetaId = 0 OR m.TipoMetaId = @tipoMetaId)
        GROUP BY m.IdOficina
    )
    SELECT
        o.CveUnOperativa AS IdOficina,
        o.Nombre AS Oficina,
        ISNULL(@mes, 0) AS IdMes,
        ISNULL(ma.Segmento, 'General') AS Segmento,
        ISNULL(ma.MetaAtendidos,0) AS MetaAtendidos,
        ISNULL(ra.Total,0) AS RealAtendidos,
        CASE WHEN ISNULL(ma.MetaAtendidos,0) > 0 THEN ROUND(CAST(ISNULL(ra.Total,0) AS FLOAT) / CAST(ma.MetaAtendidos AS FLOAT) * 100,2) ELSE 0 END AS PorcAtendidos,
        ISNULL(ma.MetaVinculados,0) AS MetaVinculados,
        ISNULL(rv.Total,0) AS RealVinculados,
        CASE WHEN ISNULL(ma.MetaVinculados,0) > 0 THEN ROUND(CAST(ISNULL(rv.Total,0) AS FLOAT) / CAST(ma.MetaVinculados AS FLOAT) * 100,2) ELSE 0 END AS PorcVinculados,
        ISNULL(ma.MetaColocados,0) AS MetaColocados,
        ISNULL(rc.Total,0) AS RealColocados,
        CASE WHEN ISNULL(ma.MetaColocados,0) > 0 THEN ROUND(CAST(ISNULL(rc.Total,0) AS FLOAT) / CAST(ma.MetaColocados AS FLOAT) * 100,2) ELSE 0 END AS PorcColocados
    FROM CatUnOperativa o
    LEFT JOIN MetaAgg ma ON o.CveUnOperativa = ma.IdOficina
    LEFT JOIN RealAtendidos  ra ON ra.IdOficina = o.CveUnOperativa
    LEFT JOIN RealVinculados rv ON rv.IdOficina = o.CveUnOperativa
    LEFT JOIN RealColocados  rc ON rc.IdOficina = o.CveUnOperativa
    ORDER BY IdMes, IdOficina;
END