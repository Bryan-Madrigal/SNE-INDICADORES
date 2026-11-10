const { sql, poolPromise } = require('./src/db/dbConnect');

async function listSPs() {
    const pool = await poolPromise;
    const rSPs = await pool.request().query(`
        SELECT name 
        FROM sys.objects 
        WHERE type = 'P' 
        AND name LIKE '%Avance%' OR name LIKE '%KPI%' OR name LIKE '%Postulad%' OR name LIKE '%Vinculad%';
    `);
    console.log("SPs:", rSPs.recordset);
    process.exit(0);
}

listSPs().catch(console.error);
