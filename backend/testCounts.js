const { sql, poolPromise } = require('./src/db/dbConnect');

async function testCounts() {
    const pool = await poolPromise;
    const result1 = await pool.request().query(`
        SELECT COUNT(ES.CveEnvio) as TotalVinculados_No3
        FROM EnvioSeguimiento ES
        WHERE YEAR(ES.FechaEnvio) = 2026 AND MONTH(ES.FechaEnvio) = 8 AND ES.Status != 3
    `);
    console.log("Total Vinculados (Status != 3):", result1.recordset[0].TotalVinculados_No3);

    const result2 = await pool.request().query(`
        SELECT COUNT(ES.CveEnvio) as TotalVinculados_All
        FROM EnvioSeguimiento ES
        WHERE YEAR(ES.FechaEnvio) = 2026 AND MONTH(ES.FechaEnvio) = 8
    `);
    console.log("Total Vinculados (All Statuses):", result2.recordset[0].TotalVinculados_All);

    const result3 = await pool.request().query(`
        SELECT ES.Status, COUNT(ES.CveEnvio) as Total
        FROM EnvioSeguimiento ES
        WHERE YEAR(ES.FechaEnvio) = 2026 AND MONTH(ES.FechaEnvio) = 8
        GROUP BY ES.Status
    `);
    console.log("Counts by Status:");
    console.table(result3.recordset);

    process.exit(0);
}

testCounts().catch(console.error);
