const { sql, poolPromise } = require('../db/dbConnect');

const obtenerFechas = (inicioStr, finStr) => {
    let fechaInicio = null;
    let fechaFin = null;
    if (inicioStr && finStr) {
        fechaInicio = new Date(inicioStr + 'T00:00:00');
        fechaFin = new Date(finStr + 'T23:59:59');
    }
    return { fechaInicio, fechaFin };
};

const getUnidadesOperativas = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT CveUnOperativa, Nombre FROM CatUnOperativa ORDER BY Nombre');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener unidades operativas.' });
    }
};

const getReporteAtenciones = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { inicio, fin, oficina } = req.query;
        const cveUnOperativa = oficina ? parseInt(oficina, 10) : 0; 

        let fechaInicial = inicio ? inicio : '2000-01-01';
        let fechaFinal = fin ? fin : '2050-12-31';

        const request = pool.request();
        request.input('FechaInicial', sql.VarChar(50), fechaInicial);
        request.input('FechaFinal', sql.VarChar(50), fechaFinal);
        request.input('CveUnOperativa', sql.Int, cveUnOperativa);

        const result = await request.execute('SP_Citados_Modulo_Periodo');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar reporte de atenciones usando SP_Citados_Modulo_Periodo.' });
    }
};

const getReportePostulaciones = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { inicio, fin, oficina } = req.query;
        const cveUnOperativa = oficina ? parseInt(oficina, 10) : 0; 

        let fechaInicial = inicio ? inicio : '2000-01-01';
        let fechaFinal = fin ? fin : '2050-12-31';

        const request = pool.request();
        request.input('FechaInicial', sql.VarChar(50), fechaInicial);
        request.input('FechaFinal', sql.VarChar(50), fechaFinal);
        request.input('CveUnOperativa', sql.Int, cveUnOperativa);

        const result = await request.execute('SP_Postulados_Modulo_Periodo');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar reporte de postulaciones usando SP_Postulados_Modulo_Periodo.' });
    }
};

const getReporteColocaciones = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { inicio, fin, oficina } = req.query;
        const cveUnOperativa = oficina ? parseInt(oficina, 10) : 0; 

        let fechaInicial = inicio ? inicio : '2000-01-01';
        let fechaFinal = fin ? fin : '2050-12-31';

        const request = pool.request();
        request.input('FechaInicial', sql.VarChar(50), fechaInicial);
        request.input('FechaFinal', sql.VarChar(50), fechaFinal);
        request.input('CveUnOperativa', sql.Int, cveUnOperativa);

        const result = await request.execute('SP_Colodados_Modulo_Periodo');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar reporte de colocaciones usando SP_Colodados_Modulo_Periodo.' });
    }
};

const getReporteVacantes = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { inicio, fin, tipo } = req.query;
        const { fechaInicio, fechaFin } = obtenerFechas(inicio, fin);

        let condition = "1=1";
        
        // Determinar fechas a evaluar según contexto
        if (fechaInicio && fechaFin) {
            condition = `v.FechaRecepcion BETWEEN @inicio AND @fin`;
        }

        let having = "";
        let orderBy = "v.FechaRecepcion DESC";

        if (tipo === 'mas-postuladas') {
            having = "HAVING COUNT(es.CveEnvio) > 0";
            orderBy = "TotalPostulaciones DESC";
        } else if (tipo === 'sin-postulacion') {
            having = "HAVING COUNT(es.CveEnvio) = 0";
        } else if (tipo === 'proximas-vencer') {
            condition += ` AND v.FechaVigencia BETWEEN GETDATE() AND DATEADD(day, 7, GETDATE())`;
            orderBy = "v.FechaVigencia ASC";
        } else if (tipo === 'vencidas-sin-postulacion') {
            condition += ` AND v.FechaVigencia < GETDATE()`;
            having = "HAVING COUNT(es.CveEnvio) = 0";
            orderBy = "v.FechaVigencia DESC";
        } else if (tipo === 'vigentes') {
            condition += ` AND v.FechaVigencia >= CAST(GETDATE() AS DATE)`;
            orderBy = "v.FechaVigencia ASC";
        }

        const query = `
            SELECT 
                v.CveVacante AS ID,
                v.TituloVacante AS Vacante,
                v.RazonSocial AS Empresa,
                v.Salario,
                v.FechaRecepcion,
                v.FechaVigencia,
                COUNT(es.CveEnvio) AS TotalPostulaciones
            FROM Vacantes v
            LEFT JOIN EnvioSeguimiento es ON v.CveVacante = es.CveVacante
            WHERE ${condition}
            GROUP BY 
                v.CveVacante, v.TituloVacante, v.RazonSocial, v.Salario, 
                v.FechaRecepcion, v.FechaVigencia
            ${having}
            ORDER BY ${orderBy}
        `;

        const request = pool.request();
        if (fechaInicio) request.input('inicio', sql.DateTime, fechaInicio);
        if (fechaFin) request.input('fin', sql.DateTime, fechaFin);

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar reporte de vacantes.' });
    }
};

module.exports = {
    getUnidadesOperativas,
    getReporteAtenciones,
    getReportePostulaciones,
    getReporteColocaciones,
    getReporteVacantes
};