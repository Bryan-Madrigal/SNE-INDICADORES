const { sql, poolPromise } = require('./src/db/dbConnect');

async function checkAugust97() {
    const pool = await poolPromise;
    const RAW = `
        SELECT o.Nombre AS Oficina, COUNT(ES.CveEnvio) AS TotalVinculados
        FROM EnvioSeguimiento ES 
        LEFT JOIN AtencionSolicitante Ats on ES.CveAtencion=Ats.CveAtencion
        LEFT JOIN CatUnOperativa o ON Ats.CveUnOperativa = o.CveUnOperativa
        WHERE ES.Status != 3
          AND YEAR(ES.FechaEnvio) = 2026
          AND MONTH(ES.FechaEnvio) = 8
        GROUP BY o.Nombre
    `;
    const res = await pool.request().query(RAW);
    console.log("By Oficina (Status != 3):");
    console.table(res.recordset);

    const RAW2 = `
        SELECT o.Nombre AS Oficina, COUNT(ES.CveEnvio) AS TotalEnvios
        FROM EnvioSeguimiento ES 
        LEFT JOIN AtencionSolicitante Ats on ES.CveAtencion=Ats.CveAtencion
        LEFT JOIN CatUnOperativa o ON Ats.CveUnOperativa = o.CveUnOperativa
        WHERE YEAR(ES.FechaEnvio) = 2026
          AND MONTH(ES.FechaEnvio) = 8
        GROUP BY o.Nombre
    `;
    const res2 = await pool.request().query(RAW2);
    console.log("By Oficina (All Status):");
    console.table(res2.recordset);
    
    // Check Status 2
    const RAW3 = `
        SELECT o.Nombre AS Oficina, COUNT(ES.CveEnvio) AS Status2
        FROM EnvioSeguimiento ES 
        LEFT JOIN AtencionSolicitante Ats on ES.CveAtencion=Ats.CveAtencion
        LEFT JOIN CatUnOperativa o ON Ats.CveUnOperativa = o.CveUnOperativa
        WHERE ES.Status = 2
          AND YEAR(ES.FechaEnvio) = 2026
          AND MONTH(ES.FechaEnvio) = 8
        GROUP BY o.Nombre
    `;
    const res3 = await pool.request().query(RAW3);
    console.log("By Oficina (Status 2):");
    console.table(res3.recordset);

    process.exit(0);
}

checkAugust97().catch(console.error);
