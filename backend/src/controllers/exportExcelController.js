const exceljs = require('exceljs');
const { sql, poolPromise } = require('../db/dbConnect');

const SEGMENTOS_FALLBACK = [
    'General', 'JCF', 'Profesionistas', 'Mujeres', 'Salario Alto', 
    'J�venes', 'Adultos Mayores', 'Personas con discapacidad', 'Hombres 30-49'
];

const MESES = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

function getWorkWeeks(year, month) {
    const weeks = [];
    let d = new Date(year, month - 1, 1);
    let start = null;

    while (d.getMonth() === month - 1) {
        if (d.getDay() >= 1 && d.getDay() <= 5) {
            if (start === null) start = d.getDate();
            if (d.getDay() === 5 || d.getDate() === new Date(year, month, 0).getDate()) {
                weeks.push({ start, end: d.getDate(), label: `${String(start).padStart(2, '0')} AL ${String(d.getDate()).padStart(2, '0')}` });
                start = null;
            }
        } else {
            if (start !== null) {
                weeks.push({ start, end: d.getDate() - 1, label: `${String(start).padStart(2, '0')} AL ${String(d.getDate() - 1).padStart(2, '0')}` });
                start = null;
            }
        }
        d.setDate(d.getDate() + 1);
    }
    return weeks;
}

const RAW_GET_AVANCES_SQL = `
    DECLARE @SalarioMinimo DECIMAL(18,2) = 315.04;

    ;WITH RealAtendidos AS (
        SELECT
            Ats.CveUnOperativa  AS IdOficina,
            COUNT(*)        AS Total
        FROM AtencionSolicitante Ats
        LEFT JOIN Solicitante S ON Ats.CveSolicitante = S.CveSolicitante
        WHERE Ats.CveEstatusCita = 2
          AND YEAR(Ats.Fecha)   = @anio
          AND (@mes IS NULL OR MONTH(Ats.Fecha) = @mes)
          AND @tipoMetaId != 4 
          AND (
              @tipoMetaId = 0
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7)
              OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9))
              OR (@tipoMetaId = 3 AND S.CveSexo = 2)
              OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29)
              OR (@tipoMetaId = 6 AND S.Edad >= 50)
              OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3)
              OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49)
          )
        GROUP BY Ats.CveUnOperativa
    ),
    RealVinculados AS (
        Select  Ats.CveUnOperativa AS IdOficina,
            COUNT(ES.CveEnvio) AS Total 
        From EnvioSeguimiento ES 
        Left Join AtencionSolicitante Ats on ES.CveAtencion=Ats.CveAtencion
        Left Join Solicitante S on Ats.CveSolicitante = S.CveSolicitante
        Left Join Vacantes V on ES.CveVacante = V.CveVacante
        WHERE ES.Status!=3
          AND YEAR(ES.FechaEnvio)   = @anio
          AND (@mes IS NULL OR MONTH(ES.FechaEnvio) = @mes)
          AND (
              @tipoMetaId = 0
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7)
              OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9))
              OR (@tipoMetaId = 3 AND S.CveSexo = 2)
              OR (@tipoMetaId = 4 AND V.Salario > @SalarioMinimo)  
              OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29)
              OR (@tipoMetaId = 6 AND S.Edad >= 50)
              OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3)
              OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49)
          )
        GROUP BY Ats.CveUnOperativa
    ),
    RealColocados AS (
         Select  Ats.CveUnOperativa AS IdOficina,
            COUNT(ES.CveEnvio) AS Total 
        From EnvioSeguimiento ES 
        Left Join AtencionSolicitante Ats on ES.CveAtencion=Ats.CveAtencion
        Left Join Solicitante S on Ats.CveSolicitante = S.CveSolicitante
        Left Join Vacantes V on ES.CveVacante = V.CveVacante
        WHERE ES.status = 4
          AND YEAR(ES.FechaCol)   = @anio
          AND (@mes IS NULL OR MONTH(ES.FechaCol) = @mes)
          AND (
              @tipoMetaId = 0
              OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7)
              OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9))
              OR (@tipoMetaId = 3 AND S.CveSexo = 2)
              OR (@tipoMetaId = 4 AND V.Salario > @SalarioMinimo)  
              OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29)
              OR (@tipoMetaId = 6 AND S.Edad >= 50)
              OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3)
              OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49)
          )
        GROUP BY Ats.CveUnOperativa
    )
    ,MetaAgg AS (
        SELECT
            m.IdOficina,
            MAX(m.IdMes) AS IdMes,
            CAST(CASE WHEN @tipoMetaId = 0 THEN 'General' ELSE MAX(t.Nombre) END AS NVARCHAR(100)) AS Segmento,
            MAX(m.Oficina) AS Oficina,
            SUM(ISNULL(m.MetaAtendidos,0)) AS MetaAtendidos,
            SUM(ISNULL(m.MetaVinculados,0)) AS MetaVinculados,
            SUM(ISNULL(m.MetaColocados,0)) AS MetaColocados
        FROM Metas_BuscadoresDeTrabajo m
        LEFT JOIN TipoMeta t ON m.TipoMetaId = t.TipoMetaId
        WHERE m.Anio = @anio
          AND (@mes IS NULL OR m.IdMes = @mes)
          AND (
              @tipoMetaId = 0 
              OR m.TipoMetaId = @tipoMetaId 
          )
        GROUP BY m.IdOficina
    )
    SELECT
        o.CveUnOperativa AS IdOficina,
        o.Nombre AS Oficina,
        ISNULL(@mes, 0) AS IdMes,
        ISNULL(ma.Segmento, (SELECT CASE WHEN @tipoMetaId = 0 THEN 'General' ELSE Nombre END FROM TipoMeta WHERE TipoMetaId = CASE WHEN @tipoMetaId = 0 THEN 1 ELSE @tipoMetaId END)) AS Segmento,
        ISNULL(ma.MetaAtendidos,0) AS MetaAtendidos,
        ISNULL(ra.Total,0) AS RealAtendidos,
        CASE WHEN ISNULL(ma.MetaAtendidos,0) > 0 THEN ROUND(CAST(ISNULL(ra.Total,0) AS FLOAT) / CAST(ma.MetaAtendidos AS FLOAT) * 100,2) ELSE 0 END AS PorcAtendidos,

        ISNULL(ma.MetaVinculados,0) AS MetaVinculados,
        ISNULL(rv.Total,0) AS RealVinculados,
        CASE WHEN ISNULL(ma.MetaVinculados,0) > 0 THEN ROUND(CAST(ISNULL(rv.Total,0) AS FLOAT) / CAST(ma.MetaVinculados AS FLOAT) * 100,2) ELSE 0 END AS PorcVinculados,

        ISNULL(ma.MetaColocados,0) AS MetaColocados,
        ISNULL(rc.Total,0) AS RealColocados,
        CASE WHEN ISNULL(ma.MetaColocados,0) > 0 THEN ROUND(CAST(ISNULL(rc.Total,0) AS FLOAT) / CAST(ma.MetaColocados AS FLOAT) * 100,2) ELSE 0 END AS PorcColocados
    FROM CatUnOperativa o
    LEFT JOIN MetaAgg ma ON o.CveUnOperativa = ma.IdOficina
    LEFT JOIN RealAtendidos  ra ON ra.IdOficina = o.CveUnOperativa
    LEFT JOIN RealVinculados rv ON rv.IdOficina = o.CveUnOperativa
    LEFT JOIN RealColocados  rc ON rc.IdOficina = o.CveUnOperativa
    ORDER BY IdMes, IdOficina;
`;

const rawQueryAtendidos = `
    SELECT O.Nombre AS Oficina, DAY(Ats.Fecha) AS Dia
    FROM AtencionSolicitante Ats
    LEFT JOIN Solicitante S ON Ats.CveSolicitante = S.CveSolicitante
    JOIN dbo.CatUnOperativa O ON Ats.CveUnOperativa = O.CveUnOperativa
    WHERE Ats.CveEstatusCita = 2 AND YEAR(Ats.Fecha) = @anio AND MONTH(Ats.Fecha) = @mes
      AND @tipoMetaId != 4 
      AND (@tipoMetaId = 0 OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7) OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9)) OR (@tipoMetaId = 3 AND S.CveSexo = 2) OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29) OR (@tipoMetaId = 6 AND S.Edad >= 50) OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3) OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49))
`;

const rawQueryVinculados = `
    DECLARE @SalarioMinimo DECIMAL(18,2) = 315.04;
    SELECT O.Nombre AS Oficina, DAY(ES.FechaEnvio) AS Dia
    FROM EnvioSeguimiento ES
    LEFT JOIN AtencionSolicitante Ats ON ES.CveAtencion = Ats.CveAtencion
    LEFT JOIN Solicitante S ON Ats.CveSolicitante = S.CveSolicitante
    LEFT JOIN Vacantes V ON ES.CveVacante = V.CveVacante
    JOIN dbo.CatUnOperativa O ON Ats.CveUnOperativa = O.CveUnOperativa
    WHERE ES.Status != 3 AND YEAR(ES.FechaEnvio) = @anio AND MONTH(ES.FechaEnvio) = @mes
      AND (@tipoMetaId = 0 OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7) OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9)) OR (@tipoMetaId = 3 AND S.CveSexo = 2) OR (@tipoMetaId = 4 AND V.Salario > @SalarioMinimo)  OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29) OR (@tipoMetaId = 6 AND S.Edad >= 50) OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3) OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49))
`;

const rawQueryColocados = `
    DECLARE @SalarioMinimo DECIMAL(18,2) = 315.04;
    SELECT O.Nombre AS Oficina, DAY(ES.FechaCol) AS Dia
    FROM EnvioSeguimiento ES
    LEFT JOIN AtencionSolicitante Ats ON ES.CveAtencion = Ats.CveAtencion
    LEFT JOIN Solicitante S ON Ats.CveSolicitante = S.CveSolicitante
    LEFT JOIN Vacantes V ON ES.CveVacante = V.CveVacante
    JOIN dbo.CatUnOperativa O ON Ats.CveUnOperativa = O.CveUnOperativa
    WHERE ES.status = 4 AND YEAR(ES.FechaCol) = @anio AND MONTH(ES.FechaCol) = @mes
      AND (@tipoMetaId = 0 OR (@tipoMetaId = 1 AND Ats.CveTipoCita = 7) OR (@tipoMetaId = 2 AND S.CveEscolaridad IN (7, 8, 9)) OR (@tipoMetaId = 3 AND S.CveSexo = 2) OR (@tipoMetaId = 4 AND V.Salario > @SalarioMinimo)  OR (@tipoMetaId = 5 AND S.Edad BETWEEN 18 AND 29) OR (@tipoMetaId = 6 AND S.Edad >= 50) OR (@tipoMetaId = 7 AND S.CveGrupoAE = 3) OR (@tipoMetaId = 8 AND S.CveSexo = 1 AND S.Edad BETWEEN 30 AND 49))
`;

function armarHoja(workbook, nombreHoja, oficinasData, totalMeta, totalReal, titulo, subTituloColor, weeks, iMes, iAnio) {
    const sheet = workbook.addWorksheet(nombreHoja);

    const colDef = [{ width: 30 }, { width: 15 }];
    weeks.forEach(() => colDef.push({ width: 12 }));
    colDef.push({ width: 15 });
    colDef.push({ width: 15 });
    sheet.columns = colDef;
    const maxColIndex = 2 + weeks.length + 2;

    const titleRow = sheet.addRow([titulo]);
    sheet.mergeCells(`A1:${sheet.getColumn(maxColIndex).letter}1`);
    titleRow.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3E74' } };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };

    const subHeadVals = [`MES: ${MESES[iMes-1]} ${iAnio}`, ''];
    weeks.forEach((w, i) => subHeadVals.push(i === 0 ? 'ITERACIONES SEMANALES' : ''));
    subHeadVals.push('REAL ACUM.');
    subHeadVals.push('% META');
    
    const subRow2 = sheet.addRow(subHeadVals);
    sheet.mergeCells(`A2:B2`);
    if(weeks.length > 1) sheet.mergeCells(`C2:${sheet.getColumn(2 + weeks.length).letter}2`);
    subRow2.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
    subRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subTituloColor } };
    subRow2.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' };
    sheet.getCell(`${sheet.getColumn(maxColIndex).letter}2`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };

    const headers = ['UNIDAD REGIONAL', `META ${MESES[iMes-1]}`];
    weeks.forEach(w => headers.push(w.label));
    headers.push('TOTAL REAL');
    headers.push('CUMPL. %');
    const subRow3 = sheet.addRow(headers);
    subRow3.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 9 };
    subRow3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subTituloColor } };
    subRow3.alignment = { horizontal: 'center', vertical: 'middle' };

    let currentRow = 4;
    Object.keys(oficinasData).forEach(ofi => {
        const data = oficinasData[ofi];
        
        const rowOfi = sheet.addRow([`? ${ofi}`]);
        sheet.mergeCells(`A${currentRow}:${sheet.getColumn(maxColIndex).letter}${currentRow}`);
        rowOfi.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
        rowOfi.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subTituloColor } };
        rowOfi.alignment = { horizontal: 'left', vertical: 'middle' };
        currentRow++;

        const pctVal = data.Meta > 0 ? (data.RealTotal / data.Meta) : 0;

        const arrMeta = ['Meta', data.Meta];
        weeks.forEach(() => arrMeta.push('')); 
        arrMeta.push(''); 
        arrMeta.push(pctVal); 
        const metaRowObj = sheet.addRow(arrMeta);
        metaRowObj.font = { italic: true, color: {argb: 'FF000000'} };
        metaRowObj.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDEEAF6' } };
        metaRowObj.alignment = { horizontal: 'center' };
        sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left' };
        sheet.getCell(`B${currentRow}`).font = { bold: true };
        currentRow++;

        const arrReal = ['Real', data.Meta]; 
        weeks.forEach(w => arrReal.push(data.Semanas[w.label]));
        arrReal.push(data.RealTotal);
        arrReal.push(''); 
        const realRowObj = sheet.addRow(arrReal);
        realRowObj.font = { bold: true, color: {argb: 'FF000000'} };
        realRowObj.alignment = { horizontal: 'center' };
        sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left' };
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).font = { italic: true, color: {argb: 'FF888888'}, bold: false };

        sheet.mergeCells(`${sheet.getColumn(maxColIndex).letter}${currentRow-1}:${sheet.getColumn(maxColIndex).letter}${currentRow}`);
        const celPct = sheet.getCell(`${sheet.getColumn(maxColIndex).letter}${currentRow-1}`);
        celPct.numFmt = '0.0%';
        celPct.font = { color: {argb: 'FFFFFFFF'}, bold: true, size: 11 };
        celPct.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (pctVal >= 1 ? 'FF70AD47' : 'FFED7D31') } };
        celPct.alignment = { vertical: 'middle', horizontal: 'center' };

        weeks.forEach((w, i) => {
            if(data.Semanas[w.label] === 0) {
                const colLetter = sheet.getColumn(3 + i).letter;
                sheet.getCell(`${colLetter}${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
                sheet.getCell(`${colLetter}${currentRow}`).font = { color: {argb: 'FFC00000'} };
            }
        });
        currentRow++;
    });

    const totalPct = totalMeta > 0 ? (totalReal / totalMeta) : 0;
    const totalSemanas = {};
    weeks.forEach(w => totalSemanas[w.label] = 0);
    Object.values(oficinasData).forEach(ofiData => {
        weeks.forEach(w => { totalSemanas[w.label] += ofiData.Semanas[w.label]; });
    });

    const arrTotal = ['TOTAL ESTATAL (CHIAPAS)', totalMeta];
    weeks.forEach(w => arrTotal.push(totalSemanas[w.label]));
    arrTotal.push(totalReal);
    arrTotal.push(totalPct);

    const totalRowTitle = sheet.addRow(arrTotal);
    totalRowTitle.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
    totalRowTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3E74' } };
    totalRowTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
    
    const cellPctTotal = sheet.getCell(`${sheet.getColumn(maxColIndex).letter}${currentRow}`);
    cellPctTotal.numFmt = '0.0%';
    cellPctTotal.font = { color: {argb: 'FF000000'}, bold: true };
    cellPctTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };

    sheet.eachRow((row) => {
        row.eachCell((cell) => {
            if(!cell.border) {
                cell.border = { top: {style:'thin', color: {argb:'FFB4C6E7'}}, left: {style:'thin', color: {argb:'FFB4C6E7'}}, bottom: {style:'thin', color: {argb:'FFB4C6E7'}}, right: {style:'thin', color: {argb:'FFB4C6E7'}} };
            }
        });
    });
}

const exportAvancesAtendidosExcel = async (req, res) => {
    try {
        const { mes, anio = 2026, segmento = 'General' } = req.query;
        if (!mes) return res.status(400).json({ message: "Mes es requerido" });

        const iMes = parseInt(mes);
        const iAnio = parseInt(anio);
        
        const pool = await poolPromise;
        let tipoMetaId = 0;
        if (segmento !== 'General') {
            try {
                const poolRes = await pool.request().query('SELECT TipoMetaId, Nombre FROM dbo.TipoMeta');
                const match = poolRes.recordset.find(r => r.Nombre === segmento);
                if (match) tipoMetaId = match.TipoMetaId;
                else {
                    const idx = SEGMENTOS_FALLBACK.indexOf(segmento);
                    if(idx > 0) tipoMetaId = idx;
                }
            } catch(e) {
                const idx = SEGMENTOS_FALLBACK.indexOf(segmento);
                if(idx > 0) tipoMetaId = idx;
            }
        }

        const spReq = pool.request();
        spReq.input('mes', sql.Int, iMes);
        spReq.input('anio', sql.Int, iAnio);
        spReq.input('tipoMetaId', sql.Int, tipoMetaId);
        
        const spResult = await spReq.query(RAW_GET_AVANCES_SQL);
        
        let oficinasDataAtendidos = {};
        let oficinasDataVinculados = {};
        let oficinasDataColocados = {};
        
        let totalesAtendidos = { meta: 0, real: 0 };
        let totalesVinculados = { meta: 0, real: 0 };
        let totalesColocados = { meta: 0, real: 0 };

        spResult.recordset.forEach(row => {
            if(row.Oficina) {
                const ofi = row.Oficina.trim();
                oficinasDataAtendidos[ofi] = { Meta: row.MetaAtendidos || 0, RealTotal: row.RealAtendidos || 0, Semanas: {} };
                totalesAtendidos.meta += (row.MetaAtendidos || 0); totalesAtendidos.real += (row.RealAtendidos || 0);

                oficinasDataVinculados[ofi] = { Meta: row.MetaVinculados || 0, RealTotal: row.RealVinculados || 0, Semanas: {} };
                totalesVinculados.meta += (row.MetaVinculados || 0); totalesVinculados.real += (row.RealVinculados || 0);

                oficinasDataColocados[ofi] = { Meta: row.MetaColocados || 0, RealTotal: row.RealColocados || 0, Semanas: {} };
                totalesColocados.meta += (row.MetaColocados || 0); totalesColocados.real += (row.RealColocados || 0);
            }
        });

        const qReq = pool.request();
        qReq.input('mes', sql.Int, iMes);
        qReq.input('anio', sql.Int, iAnio);
        qReq.input('tipoMetaId', sql.Int, tipoMetaId);
        
        const rDaysAtendidos = await qReq.query(rawQueryAtendidos);
        const rDaysVinculados = await qReq.query(rawQueryVinculados);
        const rDaysColocados = await qReq.query(rawQueryColocados);
        
        const weeks = getWorkWeeks(iAnio, iMes);
        weeks.forEach(w => {
            Object.keys(oficinasDataAtendidos).forEach(ofi => {
                oficinasDataAtendidos[ofi].Semanas[w.label] = 0;
                oficinasDataVinculados[ofi].Semanas[w.label] = 0;
                oficinasDataColocados[ofi].Semanas[w.label] = 0;
            });
        });

        const poblarSemanas = (rdays, dataObj) => {
            if(rdays && rdays.recordset) rdays.recordset.forEach(r => {
                const ofi = r.Oficina.trim();
                const week = weeks.find(w => r.Dia >= w.start && r.Dia <= w.end);
                if(week && dataObj[ofi]) dataObj[ofi].Semanas[week.label] += 1;
            });
        };

        poblarSemanas(rDaysAtendidos, oficinasDataAtendidos);
        poblarSemanas(rDaysVinculados, oficinasDataVinculados);
        poblarSemanas(rDaysColocados, oficinasDataColocados);

        const workbook = new exceljs.Workbook();
        
        armarHoja(workbook, 'ATENDIDOS', oficinasDataAtendidos, totalesAtendidos.meta, totalesAtendidos.real, 'REPORTE DE PERSONAS ATENDIDAS VL CHIAPAS', 'FF2A73B6', weeks, iMes, iAnio);
        armarHoja(workbook, 'VINCULADOS', oficinasDataVinculados, totalesVinculados.meta, totalesVinculados.real, 'REPORTE DE PERSONAS VINCULADAS VL CHIAPAS', 'FFE69B00', weeks, iMes, iAnio); 
        armarHoja(workbook, 'COLOCADOS', oficinasDataColocados, totalesColocados.meta, totalesColocados.real, 'REPORTE DE PERSONAS COLOCADAS VL CHIAPAS', 'FF46647B', weeks, iMes, iAnio); 

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_Avances_SNE_${MESES[iMes-1]}_${iAnio}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exportando:', error);
        res.status(500).json({ message: 'Error interno pidiendo reporte excel' });
    }
};

module.exports = { exportAvancesAtendidosExcel };
