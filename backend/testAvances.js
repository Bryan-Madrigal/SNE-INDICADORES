const { sql, poolPromise } = require('./src/db/dbConnect');

async function testAvancesSQL() {
    const pool = await poolPromise;
    const RAW_GET_AVANCES_SQL = `
    DECLARE @SalarioMinimo DECIMAL(18,2) = 315.04;
    DECLARE @anio INT = 2026;
    DECLARE @mes INT = 8;
    DECLARE @tipoMetaId INT = 0;

    ;WITH RealVinculados AS (
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
              @tipoMetaId = 0
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7)
          )
        GROUP BY Ats.CveUnOperativa
    )
    SELECT SUM(Total) as TotalRealVinculados FROM RealVinculados;
    `;
    const result1 = await pool.request().query(RAW_GET_AVANCES_SQL);
    console.log("Total Vinculados from Avances Query:", result1.recordset[0].TotalRealVinculados);

    const result2 = await pool.request().query(`EXEC sp_GetResumenKPIs @fecha_inicio = '2026-08-01', @fecha_fin = '2026-08-31'`);
    console.log("Result from sp_GetResumenKPIs:");
    console.table(result2.recordset);

    process.exit(0);
}

testAvancesSQL().catch(console.error);
