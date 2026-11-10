const { sql, poolPromise } = require('../db/dbConnect');

const SEGMENTOS_FALLBACK = [
    'General', 'JCF', 'Profesionistas', 'Mujeres', 'Salario Alto', 
    'J�venes', 'Adultos Mayores', 'Personas con discapacidad', 'Hombres 30-49',
];

const getAvancesBT = async (req, res) => {
    try {
        const { mes, anio = 2026, segmento = 'General' } = req.query;
        const pool = await poolPromise;
        let segmentosDisponibles = SEGMENTOS_FALLBACK;
        try {
            const segRes = await pool.request().query('SELECT Nombre FROM dbo.TipoMeta ORDER BY TipoMetaId');
            if (segRes && segRes.recordset && segRes.recordset.length > 0) {
                segmentosDisponibles = segRes.recordset.map(r => r.Nombre);
            }
        } catch (err) { }

        if (!segmentosDisponibles.includes(segmento) && segmento !== 'General') {
            return res.status(400).json({ message: `Segmento invalido. Valores permitidos: General, ${segmentosDisponibles.join(', ')}` });
        }

        let tipoMetaId = 0;
        if (segmento !== 'General') {
            try {
                const poolRes = await pool.request().query('SELECT TipoMetaId, Nombre FROM dbo.TipoMeta');
                const match = poolRes.recordset.find(r => r.Nombre === segmento);
                if (match) {
                    tipoMetaId = match.TipoMetaId;
                } else {
                    const idx = SEGMENTOS_FALLBACK.indexOf(segmento);
                    if(idx > 0) tipoMetaId = idx; 
                }
            } catch (err) {
                const idx = SEGMENTOS_FALLBACK.indexOf(segmento);
                if(idx > 0) tipoMetaId = idx;
            }
        }

        let data = [];
        try {
            const request = pool.request();
            request.input('anio',       sql.Int, parseInt(anio));
            request.input('tipoMetaId', sql.Int, tipoMetaId);

            if (mes !== undefined && mes !== null && mes !== '') {
                request.input('mes', sql.Int, parseInt(mes));
            } else {
                request.input('mes', sql.Int, null);
            }

            const result = await request.execute('sp_GetAvancesBT');
            data = result.recordset;
        } catch (dbError) {
            console.error('Advertencia DB al ejecutar query crudo:', dbError.message);
            return res.status(500).json({ message: 'Error de BD', error: dbError.message });
        }

        res.json({
            segmento,
            anio: parseInt(anio),
            mes: mes ? parseInt(mes) : null,
            data: data,
        });

    } catch (error) {
        console.error('Error en getAvancesBT:', error);
        res.status(500).json({ message: 'Error al obtener avances', error: error.message });
    }
};

const getSegmentos = async (_req, res) => {
    try {
        const pool = await poolPromise;
        const segRes = await pool.request().query('SELECT Nombre, Codigo, TipoMetaId FROM dbo.TipoMeta ORDER BY TipoMetaId');
        if (segRes && segRes.recordset) {
            return res.json(segRes.recordset);
        }
    } catch (err) { }
    return res.json(SEGMENTOS_FALLBACK.map((s, i) => ({ Nombre: s, Codigo: null, TipoMetaId: i + 1 })));
};

const getOficinas = async (_req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT CveUnOperativa AS id, Nombre AS label FROM dbo.CatUnOperativa ORDER BY CveUnOperativa');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener oficinas de CatUnOperativa' });
    }
};

module.exports = { getAvancesBT, getSegmentos, getOficinas };
