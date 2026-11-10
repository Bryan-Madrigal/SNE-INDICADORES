const { sql, poolPromise } = require('./src/db/dbConnect');

async function check97or144() {
    const pool = await poolPromise;
    
    const r1 = await pool.request().query(`
        SELECT COUNT(DISTINCT Ats.CveSolicitante) as DistSolicitantes
        FROM EnvioSeguimiento ES
        JOIN AtencionSolicitante Ats ON ES.CveAtencion = Ats.CveAtencion
        WHERE YEAR(ES.FechaEnvio) = 2026 AND MONTH(ES.FechaEnvio) = 8
    `);
    console.log("Distinct Solicitantes in Envios (Agosto):", r1.recordset[0]);

    const r2 = await pool.request().query(`
        SELECT COUNT(DISTINCT ES.CveAtencion) as DistAtenciones
        FROM EnvioSeguimiento ES
        WHERE YEAR(ES.FechaEnvio) = 2026 AND MONTH(ES.FechaEnvio) = 8
    `);
    console.log("Distinct Atenciones in Envios:", r2.recordset[0]);

    const r3 = await pool.request().query(`
        SELECT COUNT(*) as CountStatus1
        FROM EnvioSeguimiento ES
        WHERE ES.Status = 1 AND YEAR(ES.FechaEnvio) = 2026 AND MONTH(ES.FechaEnvio) = 8
    `);
    console.log("Envios Status = 1:", r3.recordset[0]);

    const r4 = await pool.request().query(`
        SELECT ES.Status, COUNT(*) as Count 
        FROM EnvioSeguimiento ES 
        WHERE YEAR(ES.FechaEnvio) = 2026 AND MONTH(ES.FechaEnvio) = 8
        GROUP BY ES.Status
    `);
    console.log("Status distribution:", r4.recordset);

    process.exit(0);
}

check97or144().catch(console.error);
