const { sql, poolPromise } = require('./src/db/dbConnect');

async function checkMetas() {
    const pool = await poolPromise;
    
    const rMetas = await pool.request().query(`
        SELECT SUM(MetaVinculados) as SumMetaVinculados
        FROM Metas_BuscadoresDeTrabajo
        WHERE Anio = 2026 AND IdMes = 8
    `);
    console.log("SumMetaVinculados (Agosto 2026):", rMetas.recordset[0]);

    const rReal = await pool.request().query(`
        SELECT COUNT(ES.CveEnvio) AS TotalVinculados
        FROM EnvioSeguimiento ES
        WHERE ES.Status != 3 AND YEAR(ES.FechaEnvio) = 2026 AND MONTH(ES.FechaEnvio) = 8
    `);
    console.log("Total Real Vinculados (Status != 3):", rReal.recordset[0]);

    // Let's try joining the tables just like in exportExcelController.js to see if something restricts it to 97
    const rJoin = await pool.request().query(`
        Select  COUNT(DISTINCT ES.CveEnvio) AS Total 
        From EnvioSeguimiento ES 
        Left Join AtencionSolicitante Ats on ES.CveAtencion=Ats.CveAtencion
        WHERE ES.Status != 3
          AND YEAR(ES.FechaEnvio) = 2026
          AND MONTH(ES.FechaEnvio) = 8
    `);
    console.log("Total DISTINCT CveEnvio (Status != 3):", rJoin.recordset[0]);

    const rJoin2 = await pool.request().query(`
        Select  COUNT(ES.CveEnvio) AS Total 
        From EnvioSeguimiento ES 
        Inner Join AtencionSolicitante Ats on ES.CveAtencion=Ats.CveAtencion
        WHERE ES.Status != 3
          AND YEAR(ES.FechaEnvio) = 2026
          AND MONTH(ES.FechaEnvio) = 8
    `);
    console.log("Total INNER JOIN Atencion (Status != 3):", rJoin2.recordset[0]);
    
    process.exit(0);
}

checkMetas().catch(console.error);
