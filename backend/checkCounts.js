const { sql, poolPromise } = require('./src/db/dbConnect');

async function checkAugustCounts() {
    const pool = await poolPromise;
    
    // Total Atenciones
    const rAts = await pool.request().query(`
        SELECT COUNT(*) as Atenciones 
        FROM AtencionSolicitante 
        WHERE YEAR(Fecha) = 2026 AND MONTH(Fecha) = 8
    `);
    console.log("Total Atenciones:", rAts.recordset[0]);

    // Total EnvioSeguimiento
    const rEnv = await pool.request().query(`
        SELECT Status, COUNT(*) as Count 
        FROM EnvioSeguimiento 
        WHERE YEAR(FechaEnvio) = 2026 AND MONTH(FechaEnvio) = 8
        GROUP BY Status
    `);
    console.log("Envios (Postulados):", rEnv.recordset);

    // Total EnvioSeguimiento (All)
    const rEnvAll = await pool.request().query(`
        SELECT COUNT(*) as Count 
        FROM EnvioSeguimiento 
        WHERE YEAR(FechaEnvio) = 2026 AND MONTH(FechaEnvio) = 8
    `);
    console.log("Total Envios:", rEnvAll.recordset[0]);

    process.exit(0);
}

checkAugustCounts().catch(console.error);
