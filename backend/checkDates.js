const { sql, poolPromise } = require('./src/db/dbConnect');

async function checkAugustDates() {
    const pool = await poolPromise;
    
    const r1 = await pool.request().query(`
        SELECT COUNT(*) as CountToAug6
        FROM EnvioSeguimiento 
        WHERE Status = 2 
          AND FechaEnvio >= '2026-08-01' 
          AND FechaEnvio <= '2026-08-06 23:59:59'
    `);
    console.log("Status = 2 up to Aug 6:", r1.recordset[0]);

    const r2 = await pool.request().query(`
        SELECT COUNT(*) as CountToAug6_Not3
        FROM EnvioSeguimiento 
        WHERE Status != 3 
          AND FechaEnvio >= '2026-08-01' 
          AND FechaEnvio <= '2026-08-06 23:59:59'
    `);
    console.log("Status != 3 up to Aug 6:", r2.recordset[0]);

    const r3 = await pool.request().query(`
        SELECT COUNT(*) as CountAll_ToAug6
        FROM EnvioSeguimiento 
        WHERE FechaEnvio >= '2026-08-01' 
          AND FechaEnvio <= '2026-08-06 23:59:59'
    `);
    console.log("All up to Aug 6:", r3.recordset[0]);
    
    // Check with AtencionSolicitante joins for AvancesBT
    const r4 = await pool.request().query(`
        SELECT COUNT(ES.CveEnvio) AS Total 
        FROM EnvioSeguimiento ES 
        LEFT JOIN AtencionSolicitante Ats ON ES.CveAtencion = Ats.CveAtencion
        WHERE ES.Status != 3
          AND YEAR(ES.FechaEnvio) = 2026
          AND MONTH(ES.FechaEnvio) = 8
    `);
    console.log("AvancesBT logic total for August:", r4.recordset[0]);
    
    const r5 = await pool.request().query(`
        SELECT COUNT(ES.CveEnvio) AS Total 
        FROM EnvioSeguimiento ES 
        LEFT JOIN AtencionSolicitante Ats ON ES.CveAtencion = Ats.CveAtencion
        WHERE YEAR(ES.FechaEnvio) = 2026
          AND MONTH(ES.FechaEnvio) = 8
    `);
    console.log("AvancesBT logic total for August (NO STATUS FILTER):", r5.recordset[0]);

    process.exit(0);
}

checkAugustDates().catch(console.error);
