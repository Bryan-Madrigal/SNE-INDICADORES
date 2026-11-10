const { sql, poolPromise } = require('./src/db/dbConnect');

async function checkAugustAttentionDate() {
    const pool = await poolPromise;
    
    const r1 = await pool.request().query(`
        SELECT COUNT(ES.CveEnvio) as CountByAtencionDate
        FROM EnvioSeguimiento ES
        LEFT JOIN AtencionSolicitante Ats ON ES.CveAtencion = Ats.CveAtencion
        WHERE YEAR(Ats.Fecha) = 2026 AND MONTH(Ats.Fecha) = 8
    `);
    console.log("Count by Atencion Date (All statuses):", r1.recordset[0]);

    const r2 = await pool.request().query(`
        SELECT COUNT(ES.CveEnvio) as CountByAtencionDate_Not3
        FROM EnvioSeguimiento ES
        LEFT JOIN AtencionSolicitante Ats ON ES.CveAtencion = Ats.CveAtencion
        WHERE YEAR(Ats.Fecha) = 2026 AND MONTH(Ats.Fecha) = 8 AND ES.Status != 3
    `);
    console.log("Count by Atencion Date (Status != 3):", r2.recordset[0]);
    
    // what if we just count where es.Status is anything but we group by office?
    const r3 = await pool.request().query(`
        SELECT COUNT(*)
        FROM EnvioSeguimiento ES
        WHERE ES.FechaEnvio >= '2026-08-01' AND ES.FechaEnvio < '2026-09-01'
    `);
    console.log("Count by FechaEnvio >= Aug 1 AND < Sept 1:", r3.recordset[0]);

    process.exit(0);
}

checkAugustAttentionDate().catch(console.error);
