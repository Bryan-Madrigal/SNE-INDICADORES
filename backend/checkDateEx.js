const { sql, poolPromise } = require('./src/db/dbConnect');

async function checkDateExclusion() {
    const pool = await poolPromise;
    
    const r1 = await pool.request().query(`
        SELECT COUNT(*) as CountToAug5
        FROM EnvioSeguimiento 
        WHERE Status = 2 
          AND FechaEnvio >= '2026-08-01' 
          AND FechaEnvio <= '2026-08-06 00:00:00'
    `);
    console.log("Status = 2 up to Aug 6 00:00:00:", r1.recordset[0]);

    const r2 = await pool.request().query(`
        SELECT COUNT(*) as CountToAug5_All
        FROM EnvioSeguimiento 
        WHERE FechaEnvio >= '2026-08-01' 
          AND FechaEnvio <= '2026-08-06 00:00:00'
    `);
    console.log("All Status up to Aug 6 00:00:00:", r2.recordset[0]);

    process.exit(0);
}

checkDateExclusion().catch(console.error);
