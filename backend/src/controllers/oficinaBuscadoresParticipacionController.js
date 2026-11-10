const { sql, poolPromise } = require('../db/dbConnect');
const fs = require('fs');
const path = require('path');

const localFilePath = path.join(__dirname, '../../oficina_participacion.json');

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

// Funciones auxiliares para almacenamiento local fallback
const readLocalParticipacion = () => {
    try {
        if (fs.existsSync(localFilePath)) {
            const raw = fs.readFileSync(localFilePath, 'utf8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Error al leer archivo local de participación:', err);
    }
    return {};
};

const writeLocalParticipacion = (data) => {
    try {
        fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error al escribir archivo local de participación:', err);
    }
};

/**
 * GET /api/oficina-buscadores-participacion
 * Obtiene la participación por oficina para un año específico
 * Query params: ?anio=2026
 */
const getOficinaBuscadoresParticipacion = async (req, res) => {
    try {
        const { anio } = req.query;
        if (!anio) {
            return res.status(400).json({ message: 'El parámetro "anio" es requerido' });
        }

        const pool = await poolPromise;
        if (pool) {
            try {
                const query = `
                    SELECT
                        ob.CveUnOperativa AS OficinaBuscadoresId,
                        ob.Nombre,
                        obp.PorcentajeParticipacion
                    FROM dbo.CatUnOperativa ob
                    LEFT JOIN dbo.OficinaBuscadoresParticipacion obp
                        ON ob.CveUnOperativa = obp.OficinaBuscadoresId
                        AND obp.Anio = @anio
                    ORDER BY ob.Nombre
                `;

                const result = await pool.request()
                    .input('anio', sql.Int, parseInt(anio))
                    .query(query);

                const data = result.recordset.map(row => ({
                    OficinaBuscadoresId: row.OficinaBuscadoresId,
                    Nombre: row.Nombre,
                    PorcentajeParticipacion: row.PorcentajeParticipacion || 0,
                }));
                return res.json(data);
            } catch (dbQueryError) {
                console.warn('Advertencia: No se pudo leer de la BD (posiblemente la tabla no existe). Usando fallback local.', dbQueryError.message);
            }
        }

        // Fallback local (si pool es null o si la query falló)
        let oficinas = [];
        if (pool) {
            try {
                const result = await pool.request().query('SELECT CveUnOperativa AS id, Nombre AS label FROM dbo.CatUnOperativa ORDER BY Nombre');
                oficinas = result.recordset.map(r => ({ OficinaBuscadoresId: r.id, Nombre: r.label }));
            } catch (err) {
                console.error('Error al obtener catálogo de oficinas para fallback:', err);
            }
        }

        // Si no pudimos obtener oficinas de la BD, usamos mock
        if (oficinas.length === 0) {
            oficinas = [
                { OficinaBuscadoresId: 1, Nombre: 'TUXTLA GUTIERREZ' },
                { OficinaBuscadoresId: 2, Nombre: 'TAPACHULA' },
                { OficinaBuscadoresId: 3, Nombre: 'SAN CRISTOBAL' },
                { OficinaBuscadoresId: 4, Nombre: 'COMITAN DE DOMINGUEZ' },
                { OficinaBuscadoresId: 5, Nombre: 'PALENQUE' }
            ];
        }

        const localData = readLocalParticipacion();
        const yearData = localData[anio] || {};

        const responseData = oficinas.map(oficina => {
            const idStr = String(oficina.OficinaBuscadoresId);
            return {
                OficinaBuscadoresId: oficina.OficinaBuscadoresId,
                Nombre: oficina.Nombre,
                PorcentajeParticipacion: yearData[idStr] !== undefined ? yearData[idStr] : 0
            };
        });

        res.json(responseData);
    } catch (error) {
        console.error('Error al obtener participación de oficinas', error);
        res.status(500).json({ message: 'Error al obtener participación de oficinas' });
    }
};

/**
 * POST /api/oficina-buscadores-participacion
 * Guarda o actualiza la participación por oficina
 * Body: { participaciones: [{ OficinaBuscadoresId, PorcentajeParticipacion }, ...], anio }
 */
const guardarOficinaBuscadoresParticipacion = async (req, res) => {
    try {
        const { participaciones, anio } = req.body;

        if (!participaciones || !Array.isArray(participaciones) || participaciones.length === 0) {
            return res.status(400).json({ message: 'participaciones debe ser un array no vacío' });
        }
        if (!anio) {
            return res.status(400).json({ message: 'anio es requerido' });
        }

        const validParticipaciones = participaciones.map(p => ({
            OficinaBuscadoresId: p.OficinaBuscadoresId,
            PorcentajeParticipacion: round2(Number(p.PorcentajeParticipacion) || 0),
        }));

        const pool = await poolPromise;
        if (pool) {
            try {
                const request = pool.request();
                
                let mergeQuery = 'MERGE INTO dbo.OficinaBuscadoresParticipacion AS target\n';
                mergeQuery += 'USING (VALUES\n';

                validParticipaciones.forEach((p, idx) => {
                    request.input(`OficinaBuscadoresId${idx}`, p.OficinaBuscadoresId);
                    request.input(`PorcentajeParticipacion${idx}`, p.PorcentajeParticipacion);

                    if (idx > 0) mergeQuery += ',\n';
                    mergeQuery += `(@OficinaBuscadoresId${idx}, @anio, @PorcentajeParticipacion${idx})`;
                });
                request.input('anio', sql.Int, parseInt(anio));

                mergeQuery += `
) AS source (OficinaBuscadoresId, Anio, PorcentajeParticipacion)
ON target.OficinaBuscadoresId = source.OficinaBuscadoresId
   AND target.Anio = source.Anio
WHEN MATCHED THEN
    UPDATE SET
        PorcentajeParticipacion = source.PorcentajeParticipacion,
        UpdatedAt = SYSDATETIME()
WHEN NOT MATCHED THEN
    INSERT (OficinaBuscadoresId, Anio, PorcentajeParticipacion)
    VALUES (source.OficinaBuscadoresId, source.Anio, source.PorcentajeParticipacion);
`;

                await request.query(mergeQuery);

                return res.json({
                    message: 'Participación de oficinas guardada correctamente en base de datos',
                    count: validParticipaciones.length,
                });
            } catch (dbWriteError) {
                console.warn('Advertencia: No se pudo escribir en la BD. Usando fallback local.', dbWriteError.message);
            }
        }

        // Fallback local (si pool es null o si la escritura en BD falló)
        const localData = readLocalParticipacion();
        if (!localData[anio]) {
            localData[anio] = {};
        }

        validParticipaciones.forEach(p => {
            localData[anio][String(p.OficinaBuscadoresId)] = p.PorcentajeParticipacion;
        });

        writeLocalParticipacion(localData);

        res.json({
            message: 'Participación de oficinas guardada localmente (modo offline)',
            count: validParticipaciones.length,
        });
    } catch (error) {
        console.error('Error al guardar participación de oficinas', error);
        res.status(500).json({ message: 'Error al guardar participación de oficinas' });
    }
};

module.exports = {
    getOficinaBuscadoresParticipacion,
    guardarOficinaBuscadoresParticipacion,
};
