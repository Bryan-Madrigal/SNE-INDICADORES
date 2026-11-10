-- =======================================================
-- Módulo 1: Tarjetas de Resumen Generales (KPIs)
-- Descripción: Obtiene el conteo total de las tablas maestras 
-- filtrado por un rango de fechas.
-- =======================================================

ALTER PROCEDURE [dbo].[sp_GetResumenKPIs]
    @fecha_inicio DATE = NULL,
    @fecha_fin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
        @empresas INT = 0, 
        @ofertas INT = 0, 
        @buscadores INT = 0, 
        @citas INT = 0, 
        @vinculaciones INT = 0, 
        @colocaciones INT = 0, 
        @rechazos INT = 0,
        @atenciones INT = 0,
        @enespera INT = 0,
        @nosepresento INT = 0,
        @nocontesto INT = 0;

    -- 1. Empresas registradas (Tabla: CatEmpresa)
    SELECT @empresas = COUNT(*) 
    FROM CatEmpresa 
    WHERE (@fecha_inicio IS NULL OR FechaRegistro >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR FechaRegistro <= @fecha_fin);

    -- 2. Ofertas publicadas/activas (Tabla: Vacantes)
    SELECT @ofertas = COUNT(*) 
    FROM Vacantes 
    WHERE (@fecha_inicio IS NULL OR Fecha >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR Fecha <= @fecha_fin);

    -- 3. Buscadores registrados (Tabla: Solicitante)
    SELECT @buscadores = COUNT(*) 
    FROM Solicitante 
    WHERE (@fecha_inicio IS NULL OR Fecha_Alta >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR Fecha_Alta <= @fecha_fin);

    -- 4. Citas programadas (Tabla: AtencionSolicitante)
    SELECT @citas = COUNT(*) 
    FROM AtencionSolicitante 
    WHERE (@fecha_inicio IS NULL OR Fecha >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR Fecha <= @fecha_fin);

    -- 4.1. Atenciones [CveEstatusCita = 2] (Tabla: AtencionSolicitante)
    SELECT @atenciones = COUNT(*) 
    FROM AtencionSolicitante 
    WHERE CveEstatusCita = 2
      AND (@fecha_inicio IS NULL OR Fecha >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR Fecha <= @fecha_fin);

    -- 4.2. En Espera [CveEstatusCita = 4] (Tabla: AtencionSolicitante)
    SELECT @enespera = COUNT(*) 
    FROM AtencionSolicitante 
    WHERE CveEstatusCita = 4
      AND (@fecha_inicio IS NULL OR Fecha >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR Fecha <= @fecha_fin);

    -- 4.3. No se presentó [CveEstatusCita = 5] (Tabla: AtencionSolicitante)
    SELECT @nosepresento = COUNT(*) 
    FROM AtencionSolicitante 
    WHERE CveEstatusCita = 5
      AND (@fecha_inicio IS NULL OR Fecha >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR Fecha <= @fecha_fin);

    -- 4.4. No contestó la llamada [CveEstatusCita = 6] (Tabla: AtencionSolicitante)
    SELECT @nocontesto = COUNT(*) 
    FROM AtencionSolicitante 
    WHERE CveEstatusCita = 6
      AND (@fecha_inicio IS NULL OR Fecha >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR Fecha <= @fecha_fin);

    -- 5. Vinculaciones [Status = 2] (Tabla: EnvioSeguimiento)
    SELECT @vinculaciones = COUNT(*) 
    FROM EnvioSeguimiento 
    WHERE Status = 2 
      AND (@fecha_inicio IS NULL OR FechaEnvio >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR FechaEnvio <= @fecha_fin);

    -- 6. Colocaciones [Status = 4] (Tabla: EnvioSeguimiento)
    SELECT @colocaciones = COUNT(*) 
    FROM EnvioSeguimiento 
    WHERE Status = 4 
      AND (@fecha_inicio IS NULL OR FechaCol >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR FechaCol <= @fecha_fin);

    -- 7. Rechazos [Status = 3] (Tabla: EnvioSeguimiento)
    SELECT @rechazos = COUNT(*) 
    FROM EnvioSeguimiento 
    WHERE Status = 3 
      AND (@fecha_inicio IS NULL OR FechaRechazo >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR FechaRechazo <= @fecha_fin);

    -- Retornar todos los resultados en un solo registro (Recordset)
    SELECT 
        @empresas AS empresas,
        @ofertas AS ofertas,
        @buscadores AS buscadores,
        @citas AS citas,
        @atenciones AS atenciones,
        @enespera AS enespera,
        @nosepresento AS nosepresento,
        @nocontesto AS nocontesto,
        @vinculaciones AS vinculaciones,
        @colocaciones AS colocaciones,
        @rechazos AS rechazos;
END

