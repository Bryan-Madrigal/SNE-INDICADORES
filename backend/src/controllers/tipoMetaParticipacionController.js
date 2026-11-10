const { sql, poolPromise } = require('../db/dbConnect');

function normalizePct(value) {
    if (value === null || value === undefined || value === '') return 0;
    const numeric = Number(String(value).replace('%', '').replace(',', '.').trim());
    return Number.isFinite(numeric) ? numeric : 0;
}

function round2(value) {
    return Math.round(value * 100) / 100;
}

async function getTipoMetaParticipacion(req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT
                tm.TipoMetaId,
                tm.Codigo,
                tm.Nombre,
                ISNULL(tp.PctAtendidos, 0) AS PctAtendidos,
                ISNULL(tp.PctVinculados, 0) AS PctVinculados,
                ISNULL(tp.PctColocados, 0) AS PctColocados,
                ISNULL(tp.PctPlazasVacantes, 0) AS PctPlazasVacantes
            FROM dbo.TipoMeta tm
            LEFT JOIN dbo.TipoMetaParticipacion tp
                ON tp.TipoMetaId = tm.TipoMetaId
            ORDER BY tm.TipoMetaId;
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener la participación de TipoMeta:', error);
        res.status(500).json({ message: error.message || 'No fue posible obtener la participación de TipoMeta.' });
    }
}

async function guardarTipoMetaParticipacion(req, res) {
    try {
        const items = Array.isArray(req.body?.items) ? req.body.items : [];

        if (items.length === 0) {
            return res.status(400).json({ message: 'Debes enviar una lista de participaciones.' });
        }

        const pool = await poolPromise;
        const tiposMetaRes = await pool.request().query('SELECT TipoMetaId FROM dbo.TipoMeta');
        const tiposMetaIds = new Set(tiposMetaRes.recordset.map((row) => Number(row.TipoMetaId)));

        const normalizedRows = items.map((item, index) => {
            const tipoMetaId = Number(item.TipoMetaId);
            if (!Number.isInteger(tipoMetaId) || !tiposMetaIds.has(tipoMetaId)) {
                throw new Error(`TipoMetaId inválido en el registro ${index + 1}.`);
            }

            return {
                TipoMetaId: tipoMetaId,
                PctAtendidos: round2(normalizePct(item.PctAtendidos)),
                PctVinculados: round2(normalizePct(item.PctVinculados)),
                PctColocados: round2(normalizePct(item.PctColocados)),
                PctPlazasVacantes: round2(normalizePct(item.PctPlazasVacantes)),
            };
        });

        const totals = {
            PctAtendidos: round2(normalizedRows.reduce((sum, row) => sum + row.PctAtendidos, 0)),
            PctVinculados: round2(normalizedRows.reduce((sum, row) => sum + row.PctVinculados, 0)),
            PctColocados: round2(normalizedRows.reduce((sum, row) => sum + row.PctColocados, 0)),
            PctPlazasVacantes: round2(normalizedRows.reduce((sum, row) => sum + row.PctPlazasVacantes, 0)),
        };

        for (const [field, total] of Object.entries(totals)) {
            if (Math.abs(total - 100) > 0.01) {
                return res.status(400).json({
                    message: `La suma de ${field.replace('Pct', '% ')} debe ser 100%. Actualmente suma ${total.toFixed(2)}%.`
                });
            }
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const deleteRequest = new sql.Request(transaction);
            await deleteRequest.query('DELETE FROM dbo.TipoMetaParticipacion');

            for (const row of normalizedRows) {
                const request = new sql.Request(transaction);
                request.input('TipoMetaId', sql.Int, row.TipoMetaId);
                request.input('PctAtendidos', sql.Decimal(10, 4), row.PctAtendidos);
                request.input('PctVinculados', sql.Decimal(10, 4), row.PctVinculados);
                request.input('PctColocados', sql.Decimal(10, 4), row.PctColocados);
                request.input('PctPlazasVacantes', sql.Decimal(10, 4), row.PctPlazasVacantes);

                await request.query(`
                    INSERT INTO dbo.TipoMetaParticipacion (
                        TipoMetaId,
                        PctAtendidos,
                        PctVinculados,
                        PctColocados,
                        PctPlazasVacantes
                    ) VALUES (
                        @TipoMetaId,
                        @PctAtendidos,
                        @PctVinculados,
                        @PctColocados,
                        @PctPlazasVacantes
                    )
                `);
            }

            await transaction.commit();
            res.json({ message: 'Participación de TipoMeta guardada correctamente.' });
        } catch (innerError) {
            await transaction.rollback();
            throw innerError;
        }
    } catch (error) {
        console.error('Error al guardar la participación de TipoMeta:', error);
        res.status(500).json({ message: error.message || 'No fue posible guardar la participación de TipoMeta.' });
    }
}

module.exports = {
    getTipoMetaParticipacion,
    guardarTipoMetaParticipacion,
};
