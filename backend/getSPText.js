const { sql, poolPromise } = require('./src/db/dbConnect');

async function getSPText() {
    const pool = await poolPromise;
    const rSP = await pool.request().query(`
        SELECT definition 
        FROM sys.sql_modules 
        WHERE object_id = OBJECT_ID('sp_GetResumenKPIs');
    `);
    console.log("--- sp_GetResumenKPIs ---");
    console.log(rSP.recordset[0]?.definition);

    const rSP2 = await pool.request().query(`
        SELECT definition 
        FROM sys.sql_modules 
        WHERE object_id = OBJECT_ID('sp_GetAvancesBT');
    `);
    console.log("--- sp_GetAvancesBT ---");
    console.log(rSP2.recordset[0]?.definition);
    
    process.exit(0);
}

getSPText().catch(console.error);
