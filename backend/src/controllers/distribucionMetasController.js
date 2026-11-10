const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const { poolPromise } = require('../db/dbConnect');

const MONTHS = [
    { key: 'Enero', index: 1 },
    { key: 'Febrero', index: 2 },
    { key: 'Marzo', index: 3 },
    { key: 'Abril', index: 4 },
    { key: 'Mayo', index: 5 },
    { key: 'Junio', index: 6 },
    { key: 'Julio', index: 7 },
    { key: 'Agosto', index: 8 },
    { key: 'Septiembre', index: 9 },
    { key: 'Octubre', index: 10 },
    { key: 'Noviembre', index: 11 },
    { key: 'Diciembre', index: 12 }
];

const TEXT_KEYS = ['oficina', 'unidad operativa', 'unidad_operativa', 'catunoperativa', 'unidad'];
const TOTAL_KEYS = ['total', 'total metas', 'metatotal', 'meta total', 'meta', 'metas'];
const PERCENT_KEYS = ['porcentaje', '%', 'pct', 'participacion', 'participación'];

function normalizeText(value) {
    return (value ?? '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function parsePercent(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value > 1 ? value / 100 : value;
    const raw = value.toString().replace('%', '').replace(',', '.').trim();
    if (!raw) return null;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return null;
    return parsed > 1 ? parsed / 100 : parsed;
}

function parseNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    const raw = value.toString().replace(/,/g, '').trim();
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
}

function distributeByWeights(total, weights) {
    const normalized = weights.length
        ? weights.map((weight) => (weight || 0))
        : Array.from({ length: 12 }, () => 1 / 12);

    const weightSum = normalized.reduce((sum, weight) => sum + weight, 0) || 1;
    const raw = normalized.map((weight) => (total * weight) / weightSum);
    const rounded = raw.map((value) => Math.round(value * 100) / 100);
    const diff = Math.round((total - rounded.reduce((sum, value) => sum + value, 0)) * 100) / 100;

    if (rounded.length > 0) {
        rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + diff) * 100) / 100;
    }

    return rounded;
}

function buildWorkbook(rows, anio) {
    const workbook = new ExcelJS.Workbook();
    const totalsByMonth = Array.from({ length: 12 }, () => 0);

    const resumen = workbook.addWorksheet('Resumen');
    resumen.columns = [
        { header: 'Oficina', key: 'oficina', width: 32 },
        { header: 'CatUnOperativa', key: 'cat', width: 16 },
        { header: 'Porcentaje', key: 'porcentaje', width: 14 },
        { header: 'Meta anual', key: 'total', width: 16 },
        { header: 'Diferencia', key: 'diferencia', width: 14 }
    ];

    resumen.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    resumen.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3E74' } };
    resumen.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    const monthlySheets = new Map();
    MONTHS.forEach((month) => {
        const sheet = workbook.addWorksheet(month.key);
        sheet.columns = [
            { header: 'Oficina', key: 'oficina', width: 32 },
            { header: 'CatUnOperativa', key: 'cat', width: 16 },
            { header: 'Porcentaje', key: 'porcentaje', width: 14 },
            { header: 'Meta mensual', key: 'meta', width: 16 },
            { header: 'Acumulado', key: 'acumulado', width: 16 }
        ];
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A73B6' } };
        sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
        monthlySheets.set(month.key, sheet);
    });

    let totalGeneral = 0;
    rows.forEach((item) => {
        totalGeneral += item.metaAnual;

        resumen.addRow({
            oficina: item.oficina,
            cat: item.catUnOperativa ?? '',
            porcentaje: item.porcentaje,
            total: item.metaAnual,
            diferencia: item.diferencia
        });

        const acumulado = item.monthly.reduce((sum, value) => sum + value, 0);

        MONTHS.forEach((month, index) => {
            totalsByMonth[index] += item.monthly[index];
            monthlySheets.get(month.key).addRow({
                oficina: item.oficina,
                cat: item.catUnOperativa ?? '',
                porcentaje: item.porcentaje,
                meta: item.monthly[index],
                acumulado
            });
        });
    });

    resumen.addRow({
        oficina: 'TOTAL GENERAL',
        cat: '',
        porcentaje: '',
        total: totalGeneral,
        diferencia: 0
    });

    resumen.getRow(resumen.lastRow.number).font = { bold: true };
    resumen.getRow(resumen.lastRow.number).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF2F8' } };

    MONTHS.forEach((month) => {
        const sheet = monthlySheets.get(month.key);
        sheet.addRow({ oficina: 'TOTAL MES', cat: '', porcentaje: '', meta: totalsByMonth[month.index - 1], acumulado: '' });
        sheet.getRow(sheet.lastRow.number).font = { bold: true };
        sheet.getRow(sheet.lastRow.number).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF2F8' } };
    });

    return workbook;
}

async function generarDistribucionMetasExcel(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Debes subir un archivo Excel.' });
        }

        const anio = parseInt(req.body.anio || new Date().getFullYear(), 10);
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (data.length < 2) {
            return res.status(400).json({ message: 'El Excel no tiene filas de datos.' });
        }

        const headers = data[0].map((value) => normalizeText(value));
        const headerMap = new Map();
        headers.forEach((header, index) => {
            if (header) headerMap.set(header, index);
        });

        const oficinaIndex = headers.findIndex((header) => TEXT_KEYS.includes(header));
        const totalIndex = headers.findIndex((header) => TOTAL_KEYS.includes(header));
        const percentIndex = headers.findIndex((header) => PERCENT_KEYS.includes(header));

        if (oficinaIndex === -1 || totalIndex === -1 || percentIndex === -1) {
            return res.status(400).json({
                message: 'El archivo debe incluir columnas para Oficina, Total y Porcentaje.'
            });
        }

        const pool = await poolPromise;
        const catalogo = await pool.request().query('SELECT CveUnOperativa, Nombre FROM dbo.CatUnOperativa');
        const oficinasCatalogo = new Map(
            catalogo.recordset.map((row) => [normalizeText(row.Nombre), {
                id: row.CveUnOperativa,
                nombre: row.Nombre
            }])
        );

        const resultRows = [];
        for (const row of data.slice(1)) {
            const oficinaRaw = row[oficinaIndex];
            const totalRaw = row[totalIndex];
            const percentRaw = row[percentIndex];

            if (!oficinaRaw || totalRaw === '' || percentRaw === '') continue;

            const oficina = oficinaRaw.toString().trim();
            const metaTotal = parseNumber(totalRaw);
            const porcentaje = parsePercent(percentRaw);

            if (metaTotal === null || porcentaje === null) continue;

            const cat = oficinasCatalogo.get(normalizeText(oficina));
            const metaAnual = Math.round((metaTotal * porcentaje) * 100) / 100;
            const monthly = distributeByWeights(metaAnual, Array.from({ length: 12 }, () => 1 / 12));
            const sumMonthly = monthly.reduce((sum, value) => sum + value, 0);

            resultRows.push({
                oficina: cat?.nombre || oficina,
                catUnOperativa: cat?.id || '',
                porcentaje: Math.round(porcentaje * 10000) / 100,
                metaAnual,
                diferencia: Math.round((metaAnual - sumMonthly) * 100) / 100,
                monthly
            });
        }

        if (resultRows.length === 0) {
            return res.status(400).json({ message: 'No se encontraron registros válidos en el archivo.' });
        }

        const outputWorkbook = buildWorkbook(resultRows, anio);
        const fileName = `Distribucion_Mensual_Metas_${anio}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        await outputWorkbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al generar la distribución mensual:', error);
        res.status(500).json({ message: 'No fue posible generar la distribución mensual.', error: error.message });
    }
}

module.exports = {
    generarDistribucionMetasExcel
};