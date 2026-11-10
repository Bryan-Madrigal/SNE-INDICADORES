const { sql, poolPromise } = require('../db/dbConnect');

const getCausasAgrupadas = async (req, res, targetStatus, campoFecha) => {
    try {
        const pool = await poolPromise;
        const { periodo, inicio, fin } = req.query;

        let filtroFecha = "";
        const request = pool.request();

        if (periodo === 'personalizado' && inicio && fin) {
            filtroFecha = `AND E.${campoFecha} >= @inicio AND E.${campoFecha} <= @fin`;
            request.input('inicio', sql.Date, new Date(inicio + 'T00:00:00'));
            request.input('fin', sql.Date, new Date(fin + 'T23:59:59'));
        } else if (periodo && periodo !== 'todos') {
            const hoy = new Date();
            let fechaInicio;
            let fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

            if (periodo === 'diario' || periodo === 'semanal') {
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7, 0, 0, 0);
            } else if (periodo === 'mensual') {
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            } else if (periodo === 'anual') {
                fechaInicio = new Date(hoy.getFullYear(), 0, 1);
            }
            
            if (fechaInicio) {
                filtroFecha = `AND E.${campoFecha} >= @inicio AND E.${campoFecha} <= @fin`;
                request.input('inicio', sql.Date, fechaInicio);
                request.input('fin', sql.Date, fechaFin);
            }
        }

        const query = `
            SELECT TOP 10 
                CC.Descripcion AS causa, 
                COUNT(*) AS total
            FROM EnvioSeguimiento E
            INNER JOIN CausasEnvio CE ON E.CveEnvio = CE.CveEnvio
            INNER JOIN CatCausa CC ON CE.CveCausa = CC.CveCausa
            WHERE E.Status = ${targetStatus}
            ${filtroFecha}
            GROUP BY CC.Descripcion
            ORDER BY total DESC
        `;

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('Error al obtener causas:', error);
        res.status(500).json({ error: 'Error interno o tabla sin datos' });
    }
};

const getCausasColocacion = (req, res) => getCausasAgrupadas(req, res, 4, 'FechaCol');
const getCausasRechazo = (req, res) => getCausasAgrupadas(req, res, 3, 'FechaRechazo');

module.exports = {
    getCausasColocacion,
    getCausasRechazo
};