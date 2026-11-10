const ExcelJS = require('exceljs');
const { sql, poolPromise } = require('../db/dbConnect');

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DEFAULT_RUBROS = ['Atendidos', 'Postulados', 'Colocados', 'Plazas vacantes'];

const GLOBAL_RUBROS = [
    { nombre: 'Atendidos', codigo: 'GLOB_ATEND' },
    { nombre: 'Postulados', codigo: 'GLOB_POST' },
    { nombre: 'Colocados', codigo: 'GLOB_COLOC' },
    { nombre: 'Plazas Vacantes', codigo: 'GLOB_VAC' },
];

const RUBRO_INDEX_BY_VALUE = new Map([
    ['GLOB_ATEND', 0],
    ['ATENDIDOS', 0],
    ['GLOB_POST', 1],
    ['POSTULADOS', 1],
    ['GLOB_COLOC', 2],
    ['COLOCADOS', 2],
    ['GLOB_VAC', 3],
    ['PLAZAS VACANTES', 3],
]);

function round2(value) {
    return Math.round(value * 100) / 100;
}

function normalizeParticipation(value) {
    if (value === null || value === undefined || value === '') return null;
    const numeric = typeof value === 'number' ? value : Number(String(value).replace('%', '').replace(',', '.').trim());
    if (Number.isNaN(numeric)) return null;
    return numeric > 1 ? numeric / 100 : numeric;
}

function distributeAcrossMonths(total, monthWeights) {
    const weights = Array.isArray(monthWeights) && monthWeights.length === 12
        ? monthWeights.map((weight) => Number(weight) || 0)
        : Array.from({ length: 12 }, () => 1);

    const weightSum = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    const base = weights.map((weight) => (total * weight) / weightSum);
    const rounded = base.map((value) => round2(value));
    const diff = round2(total - rounded.reduce((sum, value) => sum + value, 0));

    if (rounded.length > 0) {
        rounded[rounded.length - 1] = round2(rounded[rounded.length - 1] + diff);
    }

    return rounded;
}

function normalizeMonthlyDistribution(total, monthlyValues, rubroName) {
    if (!Array.isArray(monthlyValues) || monthlyValues.length !== 12) {
        throw new Error(`Debes capturar la distribución mensual completa de 12 meses para ${rubroName}.`);
    }

    const values = monthlyValues.map((value) => Number(value));
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
        throw new Error(`La distribución mensual de ${rubroName} contiene valores inválidos.`);
    }

    const sum = round2(values.reduce((acc, value) => acc + value, 0));
    const diff = round2(total - sum);

    if (Math.abs(diff) > 0.01) {
        throw new Error(`La suma de la distribución mensual de ${rubroName} debe coincidir con su total anual. Actualmente suma ${sum.toFixed(2)} y el total anual es ${total.toFixed(2)}.`);
    }

    if (Math.abs(diff) > 0) {
        values[11] = round2(values[11] + diff);
    }

    return values.map((value) => round2(value));
}

function resolveRubroIndex(value) {
    const normalized = String(value || '').trim().toUpperCase();
    return RUBRO_INDEX_BY_VALUE.has(normalized) ? RUBRO_INDEX_BY_VALUE.get(normalized) : null;
}

function buildResumenGlobalRubros(rows) {
    const rubros = GLOBAL_RUBROS.map((rubro) => ({
        codigo: rubro.codigo,
        nombre: rubro.nombre,
        total: 0,
        mensual: Array.from({ length: 12 }, () => 0),
        oficinas: [],
    }));

    for (const row of rows) {
        const rubroIndex = resolveRubroIndex(row.Rubro);
        if (rubroIndex === null) continue;

        const rubro = rubros[rubroIndex];
        rubro.total = round2(rubro.total + (Number(row.MetaAnual) || 0));
        rubro.mensual[0] = round2(rubro.mensual[0] + (Number(row.MetaEnero) || 0));
        rubro.mensual[1] = round2(rubro.mensual[1] + (Number(row.MetaFebrero) || 0));
        rubro.mensual[2] = round2(rubro.mensual[2] + (Number(row.MetaMarzo) || 0));
        rubro.mensual[3] = round2(rubro.mensual[3] + (Number(row.MetaAbril) || 0));
        rubro.mensual[4] = round2(rubro.mensual[4] + (Number(row.MetaMayo) || 0));
        rubro.mensual[5] = round2(rubro.mensual[5] + (Number(row.MetaJunio) || 0));
        rubro.mensual[6] = round2(rubro.mensual[6] + (Number(row.MetaJulio) || 0));
        rubro.mensual[7] = round2(rubro.mensual[7] + (Number(row.MetaAgosto) || 0));
        rubro.mensual[8] = round2(rubro.mensual[8] + (Number(row.MetaSeptiembre) || 0));
        rubro.mensual[9] = round2(rubro.mensual[9] + (Number(row.MetaOctubre) || 0));
        rubro.mensual[10] = round2(rubro.mensual[10] + (Number(row.MetaNoviembre) || 0));
        rubro.mensual[11] = round2(rubro.mensual[11] + (Number(row.MetaDiciembre) || 0));

        rubro.oficinas.push({
            id: Number(row.CveUnOperativa),
            label: row.Oficina,
            participacion: Number(row.ParticipacionPct) || 0,
        });
    }

    return rubros.map((rubro) => ({
        ...rubro,
        total: round2(rubro.total),
        mensual: rubro.mensual.map((value) => round2(value)),
        distribucionMensual: rubro.mensual.map((value) => round2(value)),
    }));
}

function safeSheetName(name, fallbackIndex) {
    const cleaned = String(name || `Rubro ${fallbackIndex + 1}`)
        .replace(/[\[\]:*?/\\]/g, ' ')
        .trim();
    return cleaned.slice(0, 31) || `Rubro ${fallbackIndex + 1}`;
}

function styleHeader(sheet, rowNumber, fillColor) {
    const row = sheet.getRow(rowNumber);
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    row.alignment = { horizontal: 'center', vertical: 'middle' };
}

async function getSavedAsignacionGlobalRubros(pool, anio) {
    const request = pool.request();
    request.input('Anio', sql.Int, anio);

    const result = await request.query(`
        SELECT
            Rubro,
            CveUnOperativa,
            Oficina,
            ParticipacionPct,
            MetaAnual,
            MetaEnero,
            MetaFebrero,
            MetaMarzo,
            MetaAbril,
            MetaMayo,
            MetaJunio,
            MetaJulio,
            MetaAgosto,
            MetaSeptiembre,
            MetaOctubre,
            MetaNoviembre,
            MetaDiciembre
        FROM dbo.AsignacionGlobalMetas
        WHERE Anio = @Anio
        ORDER BY Rubro, CveUnOperativa;
    `);

    return buildResumenGlobalRubros(result.recordset);
}

async function parseAsignacionGlobalPayload(body, pool) {
    const { anio = new Date().getFullYear(), rubros = [] } = body || {};

    let rubrosInput = Array.isArray(rubros) ? rubros : [];
    if (rubrosInput.length === 0 && body?.totalGlobal && Array.isArray(body?.oficinas)) {
        rubrosInput = [{
            nombre: 'Atendidos',
            total: body.totalGlobal,
            oficinas: body.oficinas,
        }];
    }

    if (rubrosInput.length === 0) {
        throw new Error('Debes enviar al menos un rubro.');
    }

    const catRows = await pool.request().query('SELECT CveUnOperativa, Nombre FROM dbo.CatUnOperativa');
    const catMap = new Map(catRows.recordset.map((row) => [String(row.Nombre || '').trim().toLowerCase(), row.CveUnOperativa]));

    const parsedRubros = rubrosInput.map((rubro) => {
        const resolvedIdx = resolveRubroIndex(rubro.nombre) ?? resolveRubroIndex(rubro.codigo);
        if (resolvedIdx === null) {
            throw new Error(`Rubro no reconocido: "${rubro.nombre || rubro.codigo}"`);
        }
        const refRubro = GLOBAL_RUBROS[resolvedIdx];

        const total = Number(rubro.total);
        if (!Number.isFinite(total) || total <= 0) {
            throw new Error(`El total del rubro ${rubro.nombre || refRubro.nombre} debe ser un número mayor a cero.`);
        }

        const distribucionMensual = normalizeMonthlyDistribution(
            total,
            rubro.distribucionMensual || rubro.monthDistribution || rubro.monthWeights || [],
            rubro.nombre || refRubro.nombre
        );

        const oficinas = Array.isArray(rubro.oficinas) ? rubro.oficinas : [];
        if (oficinas.length === 0) {
            throw new Error(`El rubro ${rubro.nombre || refRubro.nombre} no tiene oficinas.`);
        }

        const parsedOffices = oficinas.map((item) => {
            const participacion = normalizeParticipation(item.participacion);
            if (participacion === null) return null;

            const officeName = String(item.oficina || item.label || '').trim();
            const cveUnOperativa = item.cveUnOperativa ?? item.idOficina ?? item.catUnOperativa;
            const resolvedCve = cveUnOperativa === '' || cveUnOperativa === null || cveUnOperativa === undefined
                ? catMap.get(officeName.toLowerCase()) ?? null
                : Number(cveUnOperativa);

            if (!resolvedCve) {
                throw new Error(`No se pudo resolver la oficina "${officeName}" a un CveUnOperativa válido.`);
            }

            return {
                oficina: officeName,
                cveUnOperativa: resolvedCve,
                participacion,
            };
        }).filter(Boolean);

        if (parsedOffices.length === 0) {
            throw new Error(`El rubro ${rubro.nombre || refRubro.nombre} no tiene oficinas válidas.`);
        }

        const participationSum = parsedOffices.reduce((sum, item) => sum + item.participacion, 0);
        if (Math.abs(participationSum - 1) > 0.0001) {
            throw new Error(`La suma de participaciones del rubro ${rubro.nombre || refRubro.nombre} debe ser 100%. Actualmente suma ${(participationSum * 100).toFixed(2)}%.`);
        }

        return {
            codigo: refRubro.codigo,
            nombre: refRubro.nombre,
            total: round2(total),
            distribucionMensual,
            oficinas: parsedOffices,
        };
    });

    return {
        anio: Number(anio),
        parsedRubros,
    };
}

async function getResumenGlobalMetas(req, res) {
    try {
        const { anio } = req.query || {};

        if (!anio) {
            return res.status(400).json({ message: 'Debes enviar anio.' });
        }

        const pool = await poolPromise;
        const request = pool.request();
        request.input('Anio', sql.Int, parseInt(anio, 10));

        const result = await request.query(`
            SELECT
                Rubro,
                CveUnOperativa,
                Oficina,
                ParticipacionPct,
                MetaAnual,
                MetaEnero,
                MetaFebrero,
                MetaMarzo,
                MetaAbril,
                MetaMayo,
                MetaJunio,
                MetaJulio,
                MetaAgosto,
                MetaSeptiembre,
                MetaOctubre,
                MetaNoviembre,
                MetaDiciembre
            FROM dbo.AsignacionGlobalMetas
            WHERE Anio = @Anio
            ORDER BY Rubro, CveUnOperativa;
        `);

        res.json({ rubros: buildResumenGlobalRubros(result.recordset) });
    } catch (error) {
        console.error('Error al obtener el resumen global:', error);
        res.status(500).json({
            message: error.message || 'No fue posible obtener el resumen global.'
        });
    }
}

async function saveAsignacionGlobalMetas(pool, anio, parsedRubros) {
    const insertSql = `
        INSERT INTO dbo.AsignacionGlobalMetas (
            Anio, Rubro, CveUnOperativa, Oficina, ParticipacionPct, MetaAnual,
            MetaEnero, MetaFebrero, MetaMarzo, MetaAbril, MetaMayo, MetaJunio,
            MetaJulio, MetaAgosto, MetaSeptiembre, MetaOctubre, MetaNoviembre, MetaDiciembre
        ) VALUES (
            @Anio, @Rubro, @CveUnOperativa, @Oficina, @ParticipacionPct, @MetaAnual,
            @MetaEnero, @MetaFebrero, @MetaMarzo, @MetaAbril, @MetaMayo, @MetaJunio,
            @MetaJulio, @MetaAgosto, @MetaSeptiembre, @MetaOctubre, @MetaNoviembre, @MetaDiciembre
        )
    `;

    // 1. Obtener catálogo de TipoMeta y sus participaciones
    const segmentsQuery = `
        SELECT
            tm.TipoMetaId,
            ISNULL(tp.PctAtendidos, 0) AS PctAtendidos,
            ISNULL(tp.PctVinculados, 0) AS PctVinculados,
            ISNULL(tp.PctColocados, 0) AS PctColocados,
            ISNULL(tp.PctPlazasVacantes, 0) AS PctPlazasVacantes
        FROM dbo.TipoMeta tm
        LEFT JOIN dbo.TipoMetaParticipacion tp ON tp.TipoMetaId = tm.TipoMetaId
    `;
    const segmentsResult = await pool.request().query(segmentsQuery);
    const segments = segmentsResult.recordset;

    for (const rubro of parsedRubros) {
        // Delete only the records for this specific Rubro and Anio
        const deleteRequest = pool.request();
        deleteRequest.input('Anio', sql.Int, anio);
        deleteRequest.input('Rubro', sql.NVarChar(100), rubro.codigo);
        await deleteRequest.query('DELETE FROM dbo.AsignacionGlobalMetas WHERE Anio = @Anio AND Rubro = @Rubro');

        let assigned = 0;
        const valuesRows = [];

        for (const [officeIndex, officeRow] of rubro.oficinas.entries()) {
            const annual = officeIndex === rubro.oficinas.length - 1
                ? round2(rubro.total - assigned)
                : round2(rubro.total * officeRow.participacion);
            assigned = round2(assigned + annual);

            const monthly = distributeAcrossMonths(annual, rubro.distribucionMensual);
            const request = pool.request();

            request.input('Anio', sql.Int, anio);
            request.input('Rubro', sql.NVarChar(100), rubro.codigo);
            request.input('CveUnOperativa', sql.Int, officeRow.cveUnOperativa);
            request.input('Oficina', sql.NVarChar(200), officeRow.oficina);
            request.input('ParticipacionPct', sql.Decimal(10, 4), round2(officeRow.participacion * 100));
            request.input('MetaAnual', sql.Decimal(18, 2), annual);
            request.input('MetaEnero', sql.Decimal(18, 2), monthly[0]);
            request.input('MetaFebrero', sql.Decimal(18, 2), monthly[1]);
            request.input('MetaMarzo', sql.Decimal(18, 2), monthly[2]);
            request.input('MetaAbril', sql.Decimal(18, 2), monthly[3]);
            request.input('MetaMayo', sql.Decimal(18, 2), monthly[4]);
            request.input('MetaJunio', sql.Decimal(18, 2), monthly[5]);
            request.input('MetaJulio', sql.Decimal(18, 2), monthly[6]);
            request.input('MetaAgosto', sql.Decimal(18, 2), monthly[7]);
            request.input('MetaSeptiembre', sql.Decimal(18, 2), monthly[8]);
            request.input('MetaOctubre', sql.Decimal(18, 2), monthly[9]);
            request.input('MetaNoviembre', sql.Decimal(18, 2), monthly[10]);
            request.input('MetaDiciembre', sql.Decimal(18, 2), monthly[11]);

            await request.query(insertSql);

            // Preparar distribución en Metas_BuscadoresDeTrabajo para todos los meses del año
            for (const [monthIndex, monthValue] of monthly.entries()) {
                const idMes = monthIndex + 1;
                const mesName = MONTHS[monthIndex];

                for (const segment of segments) {
                    let percentage = 0;
                    if (rubro.codigo === 'GLOB_ATEND') {
                        percentage = Number(segment.PctAtendidos) || 0;
                    } else if (rubro.codigo === 'GLOB_POST') {
                        percentage = Number(segment.PctVinculados) || 0;
                    } else if (rubro.codigo === 'GLOB_COLOC') {
                        percentage = Number(segment.PctColocados) || 0;
                    } else if (rubro.codigo === 'GLOB_VAC') {
                        percentage = Number(segment.PctPlazasVacantes) || 0;
                    }

                    const distributedMeta = round2(monthValue * (percentage / 100));
                    const escapedOffice = officeRow.oficina.replace(/'/g, "''");

                    valuesRows.push(`(${officeRow.cveUnOperativa}, '${escapedOffice}', ${idMes}, '${mesName}', ${anio}, ${segment.TipoMetaId}, ${distributedMeta}, ${percentage})`);
                }
            }
        }

        // Ejecutar MERGE masivo (bulk) para la distribución por Tipo de Meta
        if (valuesRows.length > 0) {
            let mergeMetasQuery = '';
            const valuesStr = valuesRows.join(',\n');

            if (rubro.codigo === 'GLOB_ATEND') {
                mergeMetasQuery = `
                    MERGE INTO dbo.Metas_BuscadoresDeTrabajo AS target
                    USING (VALUES
                        ${valuesStr}
                    ) AS source (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, MetaAtendidos, PctAtendidos)
                    ON (target.IdOficina = source.IdOficina 
                        AND target.IdMes = source.IdMes 
                        AND target.Anio = source.Anio 
                        AND target.TipoMetaId = source.TipoMetaId)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            MetaAtendidos = source.MetaAtendidos,
                            PctAtendidos = source.PctAtendidos,
                            Oficina = source.Oficina,
                            Mes = source.Mes
                    WHEN NOT MATCHED THEN
                        INSERT (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, MetaAtendidos, PctAtendidos)
                        VALUES (source.IdOficina, source.Oficina, source.IdMes, source.Mes, source.Anio, source.TipoMetaId, source.MetaAtendidos, source.PctAtendidos);
                `;
            } else if (rubro.codigo === 'GLOB_POST') {
                mergeMetasQuery = `
                    MERGE INTO dbo.Metas_BuscadoresDeTrabajo AS target
                    USING (VALUES
                        ${valuesStr}
                    ) AS source (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, MetaVinculados, PctVinculados)
                    ON (target.IdOficina = source.IdOficina 
                        AND target.IdMes = source.IdMes 
                        AND target.Anio = source.Anio 
                        AND target.TipoMetaId = source.TipoMetaId)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            MetaVinculados = source.MetaVinculados,
                            PctVinculados = source.PctVinculados,
                            Oficina = source.Oficina,
                            Mes = source.Mes
                    WHEN NOT MATCHED THEN
                        INSERT (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, MetaVinculados, PctVinculados)
                        VALUES (source.IdOficina, source.Oficina, source.IdMes, source.Mes, source.Anio, source.TipoMetaId, source.MetaVinculados, source.PctVinculados);
                `;
            } else if (rubro.codigo === 'GLOB_COLOC') {
                mergeMetasQuery = `
                    MERGE INTO dbo.Metas_BuscadoresDeTrabajo AS target
                    USING (VALUES
                        ${valuesStr}
                    ) AS source (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, MetaColocados, PctColocados)
                    ON (target.IdOficina = source.IdOficina 
                        AND target.IdMes = source.IdMes 
                        AND target.Anio = source.Anio 
                        AND target.TipoMetaId = source.TipoMetaId)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            MetaColocados = source.MetaColocados,
                            PctColocados = source.PctColocados,
                            Oficina = source.Oficina,
                            Mes = source.Mes
                    WHEN NOT MATCHED THEN
                        INSERT (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, MetaColocados, PctColocados)
                        VALUES (source.IdOficina, source.Oficina, source.IdMes, source.Mes, source.Anio, source.TipoMetaId, source.MetaColocados, source.PctColocados);
                `;
            } else if (rubro.codigo === 'GLOB_VAC') {
                mergeMetasQuery = `
                    MERGE INTO dbo.Metas_BuscadoresDeTrabajo AS target
                    USING (VALUES
                        ${valuesStr}
                    ) AS source (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, MetaPlazasVacantesDummy, PctPlazasVacantes)
                    ON (target.IdOficina = source.IdOficina 
                        AND target.IdMes = source.IdMes 
                        AND target.Anio = source.Anio 
                        AND target.TipoMetaId = source.TipoMetaId)
                    WHEN MATCHED THEN
                        UPDATE SET 
                            PctPlazasVacantes = source.PctPlazasVacantes,
                            Oficina = source.Oficina,
                            Mes = source.Mes
                    WHEN NOT MATCHED THEN
                        INSERT (IdOficina, Oficina, IdMes, Mes, Anio, TipoMetaId, PctPlazasVacantes)
                        VALUES (source.IdOficina, source.Oficina, source.IdMes, source.Mes, source.Anio, source.TipoMetaId, source.PctPlazasVacantes);
                `;
            }

            if (mergeMetasQuery) {
                await pool.request().query(mergeMetasQuery);
            }
        }
    }
}

async function guardarAsignacionGlobalMetas(req, res) {
    try {
        const pool = await poolPromise;
        const { anio, parsedRubros } = await parseAsignacionGlobalPayload(req.body, pool);

        await saveAsignacionGlobalMetas(pool, anio, parsedRubros);
        res.json({ message: 'Asignación global guardada correctamente.' });
    } catch (error) {
        console.error('Error al guardar asignación global:', error);
        res.status(500).json({ message: error.message || 'No fue posible guardar la asignación global.' });
    }
}

function buildWorkbook(rubros) {
    const workbook = new ExcelJS.Workbook();
    workbook.calcProperties = {
        calcMode: 'auto',
        fullCalcOnLoad: true,
        forceFullCalc: true,
    };

    const summary = workbook.addWorksheet('Resumen');
    summary.columns = [
        { header: 'Rubro', key: 'rubro', width: 24 },
        { header: 'Oficina', key: 'oficina', width: 32 },
        { header: 'CveUnOperativa', key: 'cat', width: 16 },
        { header: 'Participación %', key: 'participacion', width: 16 },
        { header: 'Meta anual', key: 'anual', width: 16 },
        ...MONTHS.map((month) => ({ header: month, key: month.toLowerCase(), width: 12 }))
    ];
    styleHeader(summary, 1, 'FF1B3E74');

    const grandMonthTotals = Array.from({ length: 12 }, () => 0);
    let grandTotal = 0;

    rubros.forEach((rubro, rubroIndex) => {
        const sheet = workbook.addWorksheet(safeSheetName(rubro.nombre, rubroIndex));
        sheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 5 }];

        sheet.mergeCells('A1:O1');
        sheet.getCell('A1').value = rubro.nombre;
        sheet.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rubroIndex % 2 === 0 ? 'FF2A73B6' : 'FF46647B' } };
        sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

        sheet.getCell('A2').value = 'Total anual';
        sheet.getCell('B2').value = round2(rubro.total);
        sheet.getCell('A2').font = { bold: true };
        sheet.getCell('B2').font = { bold: true };
        sheet.getCell('B2').numFmt = '0.00';

        sheet.getCell('A3').value = 'Distribución mensual';
        sheet.getCell('A3').font = { bold: true };
        MONTHS.forEach((month, index) => {
            const cell = sheet.getCell(3, 2 + index);
            const monthlySource = rubro.distribucionMensual || rubro.mensual || [];
            cell.value = round2(monthlySource[index] || 0);
            cell.numFmt = '0.00';
            cell.font = { bold: true };
        });

        const headerRowIndex = 5;
        const header = sheet.getRow(headerRowIndex);
        header.values = ['Oficina', 'Meta anual', 'Participación %', ...MONTHS];
        styleHeader(sheet, headerRowIndex, rubroIndex % 2 === 0 ? 'FF2A73B6' : 'FF46647B');

        sheet.getColumn(1).width = 32;
        sheet.getColumn(2).width = 16;
        sheet.getColumn(3).width = 16;
        MONTHS.forEach((month, index) => {
            sheet.getColumn(4 + index).width = 12;
        });

        const officeRows = rubro.oficinas;
        const rubroMonthTotals = Array.from({ length: 12 }, () => 0);
        let assigned = 0;
        const firstOfficeRow = headerRowIndex + 1;

        officeRows.forEach((officeRow, officeIndex) => {
            const rowNumber = firstOfficeRow + officeIndex;
            const annual = officeIndex === officeRows.length - 1
                ? round2(rubro.total - assigned)
                : round2(rubro.total * officeRow.participacion);
            assigned = round2(assigned + annual);

            const monthly = distributeAcrossMonths(annual, rubro.distribucionMensual || rubro.mensual || []);
            monthly.forEach((value, index) => {
                rubroMonthTotals[index] = round2(rubroMonthTotals[index] + value);
                grandMonthTotals[index] = round2(grandMonthTotals[index] + value);
            });

            grandTotal = round2(grandTotal + annual);

            const row = sheet.getRow(rowNumber);
            row.getCell(1).value = officeRow.oficina;
            row.getCell(2).value = annual;
            row.getCell(2).numFmt = '0.00';
            row.getCell(3).value = round2(officeRow.participacion * 100);
            row.getCell(3).numFmt = '0.00';

            MONTHS.forEach((month, index) => {
                const columnIndex = 4 + index;
                row.getCell(columnIndex).value = monthly[index];
                row.getCell(columnIndex).numFmt = '0.00';
            });

            summary.addRow({
                rubro: rubro.nombre,
                oficina: officeRow.oficina,
                cat: officeRow.cveUnOperativa || '',
                participacion: round2(officeRow.participacion * 100),
                anual: annual,
                enero: monthly[0],
                febrero: monthly[1],
                marzo: monthly[2],
                abril: monthly[3],
                mayo: monthly[4],
                junio: monthly[5],
                julio: monthly[6],
                agosto: monthly[7],
                septiembre: monthly[8],
                octubre: monthly[9],
                noviembre: monthly[10],
                diciembre: monthly[11],
            });
        });

        const totalRowNumber = firstOfficeRow + officeRows.length;
        const totalRow = sheet.getRow(totalRowNumber);
        totalRow.getCell(1).value = 'TOTAL';
        totalRow.getCell(2).value = round2(rubro.total);
        totalRow.getCell(3).value = 100;
        totalRow.getCell(2).numFmt = '0.00';
        totalRow.getCell(3).numFmt = '0.00';
        MONTHS.forEach((month, index) => {
            const columnIndex = 4 + index;
            totalRow.getCell(columnIndex).value = rubroMonthTotals[index];
            totalRow.getCell(columnIndex).numFmt = '0.00';
        });
        styleHeader(sheet, totalRowNumber, 'FFEAF2F8');
        sheet.getRow(totalRowNumber).font = { bold: true, color: { argb: 'FF000000' } };

        summary.addRow({
            rubro: `${rubro.nombre} TOTAL`,
            anual: round2(rubro.total),
            enero: rubroMonthTotals[0],
            febrero: rubroMonthTotals[1],
            marzo: rubroMonthTotals[2],
            abril: rubroMonthTotals[3],
            mayo: rubroMonthTotals[4],
            junio: rubroMonthTotals[5],
            julio: rubroMonthTotals[6],
            agosto: rubroMonthTotals[7],
            septiembre: rubroMonthTotals[8],
            octubre: rubroMonthTotals[9],
            noviembre: rubroMonthTotals[10],
            diciembre: rubroMonthTotals[11],
        });
        styleHeader(summary, summary.lastRow.number, 'FFEAF2F8');
        summary.getRow(summary.lastRow.number).font = { bold: true, color: { argb: 'FF000000' } };
    });

    summary.addRow({
        rubro: 'TOTAL GENERAL',
        anual: round2(grandTotal),
        enero: grandMonthTotals[0],
        febrero: grandMonthTotals[1],
        marzo: grandMonthTotals[2],
        abril: grandMonthTotals[3],
        mayo: grandMonthTotals[4],
        junio: grandMonthTotals[5],
        julio: grandMonthTotals[6],
        agosto: grandMonthTotals[7],
        septiembre: grandMonthTotals[8],
        octubre: grandMonthTotals[9],
        noviembre: grandMonthTotals[10],
        diciembre: grandMonthTotals[11],
    });
    styleHeader(summary, summary.lastRow.number, 'FF1B3E74');

    return workbook;
}

async function generarAsignacionGlobalMetasExcel(req, res) {
    try {
        const pool = await poolPromise;
        const anio = Number(req.body?.anio ?? req.query?.anio ?? new Date().getFullYear());

        let rubros = [];
        try {
            rubros = await getSavedAsignacionGlobalRubros(pool, anio);
        } catch (lookupError) {
            console.warn('No se pudo leer la asignación global guardada, usando payload:', lookupError.message);
        }

        if (!rubros.length) {
            const parsed = await parseAsignacionGlobalPayload(req.body, pool);
            rubros = parsed.parsedRubros;
        }

        if (!rubros.length) {
            return res.status(404).json({ message: `No hay información guardada para el año ${anio}.` });
        }

        const outputWorkbook = buildWorkbook(rubros);
        const fileName = `Asignacion_Global_Metas_${anio}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        await outputWorkbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generando asignación global:', error);
        res.status(500).json({ message: error.message || 'No fue posible generar la asignación global.' });
    }
}

module.exports = {
    generarAsignacionGlobalMetasExcel,
    guardarAsignacionGlobalMetas,
    getResumenGlobalMetas,
};
