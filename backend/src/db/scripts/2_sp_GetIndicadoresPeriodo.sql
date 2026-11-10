-- =======================================================
-- Módulo 2: Gráfica de Indicadores por Periodo
-- Descripción: Retorna series de tiempo de las métricas principales.
-- Filtros: fecha_inicio, fecha_fin, tipo de agrupacion (dia, mes, anio)
-- =======================================================

ALTER PROCEDURE [dbo].[sp_GetIndicadoresPeriodo]
    @fecha_inicio DATE = NULL,
    @fecha_fin DATE = NULL,
    @agrupacion VARCHAR(20) = 'mes'
AS
BEGIN
    SET NOCOUNT ON;

    CREATE TABLE #BaseData (
        fecha DATE,
        tipo VARCHAR(50)
    );

    -- 1. Atrapar Todas las Ofertas Activas
    INSERT INTO #BaseData (fecha, tipo)
    SELECT Fecha, 'ofertas_activas'
    FROM Vacantes
    WHERE (@fecha_inicio IS NULL OR Fecha >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR Fecha <= @fecha_fin);

    -- 2. Atrapar Todas las Vinculaciones
    INSERT INTO #BaseData (fecha, tipo)
    SELECT FechaEnvio, 'vinculaciones_realizadas'
    FROM EnvioSeguimiento
    WHERE Status = 2
      AND (@fecha_inicio IS NULL OR FechaEnvio >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR FechaEnvio <= @fecha_fin);

    -- 3. Atrapar Todas las Colocaciones
    INSERT INTO #BaseData (fecha, tipo)
    SELECT FechaCol, 'colocaciones_realizadas'
    FROM EnvioSeguimiento
    WHERE Status = 4
      AND (@fecha_inicio IS NULL OR FechaCol >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR FechaCol <= @fecha_fin);

    -- 4. Ahora generamos el conteo final según el agrupamiento solicitado:
    IF @agrupacion = 'dia'
    BEGIN
        SELECT 
            FORMAT(fecha, 'yyyy-MM-dd') AS periodo,
            SUM(CASE WHEN tipo = 'ofertas_activas' THEN 1 ELSE 0 END) AS ofertas_activas,
            SUM(CASE WHEN tipo = 'vinculaciones_realizadas' THEN 1 ELSE 0 END) AS vinculaciones_realizadas,
            SUM(CASE WHEN tipo = 'colocaciones_realizadas' THEN 1 ELSE 0 END) AS colocaciones_realizadas
        FROM #BaseData
        WHERE fecha IS NOT NULL
        GROUP BY FORMAT(fecha, 'yyyy-MM-dd')
        ORDER BY periodo ASC;
    END

    ELSE IF @agrupacion = 'mes'
    BEGIN
        SELECT 
            FORMAT(fecha, 'yyyy-MM') AS periodo,
            SUM(CASE WHEN tipo = 'ofertas_activas' THEN 1 ELSE 0 END) AS ofertas_activas,
            SUM(CASE WHEN tipo = 'vinculaciones_realizadas' THEN 1 ELSE 0 END) AS vinculaciones_realizadas,
            SUM(CASE WHEN tipo = 'colocaciones_realizadas' THEN 1 ELSE 0 END) AS colocaciones_realizadas
        FROM #BaseData
        WHERE fecha IS NOT NULL
        GROUP BY FORMAT(fecha, 'yyyy-MM')
        ORDER BY periodo ASC;
    END

    ELSE IF @agrupacion = 'anio'
    BEGIN
        SELECT 
            FORMAT(fecha, 'yyyy') AS periodo,
            SUM(CASE WHEN tipo = 'ofertas_activas' THEN 1 ELSE 0 END) AS ofertas_activas,
            SUM(CASE WHEN tipo = 'vinculaciones_realizadas' THEN 1 ELSE 0 END) AS vinculaciones_realizadas,
            SUM(CASE WHEN tipo = 'colocaciones_realizadas' THEN 1 ELSE 0 END) AS colocaciones_realizadas
        FROM #BaseData
        WHERE fecha IS NOT NULL
        GROUP BY FORMAT(fecha, 'yyyy')
        ORDER BY periodo ASC;
    END

    ELSE
    BEGIN
        SELECT 
            FORMAT(fecha, 'yyyy-MM') AS periodo,
            SUM(CASE WHEN tipo = 'ofertas_activas' THEN 1 ELSE 0 END) AS ofertas_activas,
            SUM(CASE WHEN tipo = 'vinculaciones_realizadas' THEN 1 ELSE 0 END) AS vinculaciones_realizadas,
            SUM(CASE WHEN tipo = 'colocaciones_realizadas' THEN 1 ELSE 0 END) AS colocaciones_realizadas
        FROM #BaseData
        WHERE fecha IS NOT NULL
        GROUP BY FORMAT(fecha, 'yyyy-MM')
        ORDER BY periodo ASC;
    END

    DROP TABLE #BaseData;
END
