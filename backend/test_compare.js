const { poolPromise, sql } = require('./src/db/dbConnect');

async function testPeriod(periodo) {
    const pool = await poolPromise;
    const hoy = new Date();
    let dateInicio = null, dateFin = null;
    if (periodo && periodo !== 'todos') {
        dateFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
        dateInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
        if (periodo === 'semanal') dateInicio.setDate(hoy.getDate() - 7);
        else if (periodo === 'mensual') dateInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        else if (periodo === 'anual') dateInicio = new Date(hoy.getFullYear(), 0, 1);
    }
    const reqSP = pool.request();
    if (dateInicio) {
        reqSP.input('fecha_inicio', sql.Date, dateInicio);
        reqSP.input('fecha_fin', sql.Date, dateFin);
    }
    const spRes = await reqSP.execute('sp_GetResumenKPIs');
    const spRow = spRes.recordset[0];

    const whereBase = [];
    if (dateInicio) whereBase.push('a.Fecha >= @fechaInicio');
    if (dateFin) whereBase.push('a.Fecha <= @fechaFin');
    const whereBaseSQL = whereBase.length ? whereBase.join(' AND ') : '1=1';

    const reqC = pool.request();
    if (dateInicio) reqC.input('fechaInicio', sql.Date, dateInicio);
    if (dateFin) reqC.input('fechaFin', sql.Date, dateFin);

    const queryConteos = `
        SELECT a.CveEstatusCita AS Status, COUNT(DISTINCT a.CveAtencion) AS Total
        FROM dbo.AtencionSolicitante a
        LEFT JOIN dbo.Solicitante s ON s.CveSolicitante = a.CveSolicitante
        WHERE ${whereBaseSQL}
        GROUP BY a.CveEstatusCita
    `;
    const rC = await reqC.query(queryConteos);
    const conteos = { total: 0, atendidas: 0, enEspera: 0, noSePresento: 0, noContesto: 0, canceladas: 0 };
    rC.recordset.forEach((row) => {
        const total = Number(row.Total) || 0;
        conteos.total += total;
        switch (row.Status) {
            case 1: case 4: conteos.enEspera += total; break;
            case 2: conteos.atendidas = total; break;
            case 3: case 6: conteos.canceladas += total; conteos.noContesto += total; break;
            case 5: conteos.noSePresento = total; break;
        }
    });

    console.log('--- ' + periodo.toUpperCase() + ' ---');
    console.log('SP:        ', { citas: spRow.citas, atenciones: spRow.atenciones, enespera: spRow.enespera, nosepresento: spRow.nosepresento, nocontesto: spRow.nocontesto });
    console.log('CITAS CTRL:', { total: conteos.total, atendidas: conteos.atendidas, enespera: conteos.enEspera, nosepresento: conteos.noSePresento, nocontesto: conteos.noContesto });
}

async function run() {
    for (const p of ['diario', 'semanal', 'mensual', 'anual']) {
        await testPeriod(p);
    }
    process.exit(0);
}
run();
