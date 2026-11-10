USE [dbempleos]
GO
/****** Object:  StoredProcedure [dbo].[sp_GetAvancesBT]    Script Date: 18/05/2026 09:39:01 a. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[sp_GetAvancesBT]
    @mes        INT = NULL,
    @anio       INT = 2026,
    @tipoMetaId INT = 0  -- 0 = General, 1=JCF, 2=Prof, 3=Mujeres, 4=SalarioAlto, 5=Jóvenes, 6=AdultosMayores, 7=Discapacidad, 8=Hombres30-49
AS
BEGIN
    SET NOCOUNT ON;

    -- Parámetro variable para Salario Alto
    -- Según la regla de negocio: salario mayor al mínimo actual (315.04 diarios).
    -- Si en la tabla Vacantes el salario es mensual, se aconseja multiplicar este valor o ajustarlo aquí.
    DECLARE @SalarioMinimo DECIMAL(18,2) = 315.04;

    -- ── Real: Atendidos (AtencionSolicitante con CveEstatusCita = 2) ──────────
    ;WITH RealAtendidos AS (
        SELECT
            Ats.CveUnOperativa  AS IdOficina,
            COUNT(*)        AS Total
        FROM AtencionSolicitante Ats
        LEFT JOIN Solicitante S ON Ats.CveSolicitante = S.CveSolicitante
        WHERE Ats.CveEstatusCita = 2
          AND YEAR(Ats.Fecha)   = @anio
          AND (@mes IS NULL OR MONTH(Ats.Fecha) = @mes)
          -- Salario Alto NO aplica en atendidos, si se selecciona ese segmento, retornará 0
          AND @tipoMetaId != 4 
          AND (
              @tipoMetaId = 0 -- General
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7)
              OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9))
              OR (@tipoMetaId = 3 AND S.CveSexo = 2)
              OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29)
              OR (@tipoMetaId = 6 AND S.Edad >= 50)
              OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3)
              OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49)
          )
        GROUP BY Ats.CveUnOperativa
    ),

    -- ── Real: Vinculados (EnvioSeguimiento Status!=3) ─
    RealVinculados AS (
        Select  Ats.CveUnOperativa AS IdOficina,
            COUNT(ES.CveEnvio) AS Total 
        From EnvioSeguimiento ES 
        Left Join AtencionSolicitante Ats on ES.CveAtencion=Ats.CveAtencion
        Left Join Solicitante S on Ats.CveSolicitante = S.CveSolicitante
        Left Join Vacantes V on ES.CveVacante = V.CveVacante
        WHERE ES.Status!=3
          AND YEAR(ES.FechaEnvio)   = @anio
          AND (@mes IS NULL OR MONTH(ES.FechaEnvio) = @mes)
          AND (
              @tipoMetaId = 0 -- General
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7)
              OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9))
              OR (@tipoMetaId = 3 AND S.CveSexo = 2)
              OR (@tipoMetaId = 4 AND V.Salario > @SalarioMinimo)  -- Adaptar si es necesario salario mensual *(30 o 30.4)
              OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29)
              OR (@tipoMetaId = 6 AND S.Edad >= 50)
              OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3)
              OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49)
          )
        GROUP BY Ats.CveUnOperativa
    ),

    -- ── Real: Colocados (EnvioSeguimiento Status=4) ──────────────────────────
    RealColocados AS (
         Select  Ats.CveUnOperativa AS IdOficina,
            COUNT(ES.CveEnvio) AS Total 
        From EnvioSeguimiento ES 
        Left Join AtencionSolicitante Ats on ES.CveAtencion=Ats.CveAtencion
        Left Join Solicitante S on Ats.CveSolicitante = S.CveSolicitante
        Left Join Vacantes V on ES.CveVacante = V.CveVacante
        WHERE ES.status = 4
          AND YEAR(ES.FechaCol)   = @anio
          AND (@mes IS NULL OR MONTH(ES.FechaCol) = @mes)
          AND (
              @tipoMetaId = 0 -- General
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7)
              OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9))
              OR (@tipoMetaId = 3 AND S.CveSexo = 2)
              OR (@tipoMetaId = 4 AND V.Salario > @SalarioMinimo)  -- Adaptar si es necesario salario mensual *(30 o 30.4)
              OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29)
              OR (@tipoMetaId = 6 AND S.Edad >= 50)
              OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3)
              OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49)
          )
        GROUP BY Ats.CveUnOperativa
    )

    -- ── Metas agregadas por oficina/mes/segmento (columnas normalizadas)
    ,MetaAgg AS (
        SELECT
            m.IdOficina,
            MAX(m.IdMes) AS IdMes,
            CAST(CASE WHEN @tipoMetaId = 0 THEN 'General' ELSE MAX(t.Nombre) END AS NVARCHAR(100)) AS Segmento,
            MAX(m.Oficina) AS Oficina,
            SUM(ISNULL(m.MetaAtendidos,0)) AS MetaAtendidos,
            SUM(ISNULL(m.MetaVinculados,0)) AS MetaVinculados,
            SUM(ISNULL(m.MetaColocados,0)) AS MetaColocados
        FROM Metas_BuscadoresDeTrabajo m
        LEFT JOIN TipoMeta t ON m.TipoMetaId = t.TipoMetaId
        WHERE m.Anio = @anio
          AND (@mes IS NULL OR m.IdMes = @mes)
          AND (
              @tipoMetaId = 0 
              OR m.TipoMetaId = @tipoMetaId 
          )
        GROUP BY m.IdOficina
    )

    -- ── Comparativo Meta vs Real por rubro (Atendidos, Vinculados, Colocados)
    -- Se incluye CatUnOperativa como base para mostrar siempre todas las oficinas.
    SELECT
        o.CveUnOperativa AS IdOficina,
        o.Nombre AS Oficina,
        ISNULL(@mes, 0) AS IdMes,
        ISNULL(ma.Segmento, (SELECT CASE WHEN @tipoMetaId = 0 THEN 'General' ELSE Nombre END FROM TipoMeta WHERE TipoMetaId = CASE WHEN @tipoMetaId = 0 THEN 1 ELSE @tipoMetaId END)) AS Segmento,
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
