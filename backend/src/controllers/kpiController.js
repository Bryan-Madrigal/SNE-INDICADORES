const { sql, poolPromise } = require('../db/dbConnect');

const getResumenKPIs = async (req, res) => {
    try {
        const { periodo, inicio, fin } = req.query; // Ejemplo: 'diario', 'semanal', 'mensual', 'anual', 'personalizado'
        
        let fechaInicio = null;
        let fechaFin = null;

        // Si mandan un periodo, calculamos el rango de fechas
        if (periodo === 'personalizado' && inicio && fin) {
            fechaInicio = new Date(inicio + 'T00:00:00');
            fechaFin = new Date(fin + 'T23:59:59');
        } else if (periodo && periodo !== 'todos') {
            const hoy = new Date();
            fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59); // Fin de hoy
            fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0); // Inicio de hoy

            if (periodo === 'semanal') {
                fechaInicio.setDate(hoy.getDate() - 7); // Últimos 7 días
            } else if (periodo === 'mensual') {
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // Día 1 de este mes
            } else if (periodo === 'anual') {
                fechaInicio = new Date(hoy.getFullYear(), 0, 1); // 1 de Enero
            }
        }

        const pool = await poolPromise;
        
        // Si no hay conexión (modo mock), retornamos datos de ejemplo fijos
        if (!pool) {
            return res.json({
                empresas: 1250,
                ofertas: 340,
                buscadores: 2850,
                citas: 890,
                vinculaciones: 650,
                colocaciones: 420,
                rechazos: 115
            });
        }

        const { rol } = req.usuario;
        
        // Preparar la llamada al Procedimiento Almacenado
        const request = pool.request();

        if (fechaInicio) {
            request.input('fecha_inicio', sql.Date, fechaInicio);
            request.input('fecha_fin', sql.Date, fechaFin);
        }

        // Ejecutar el procedimiento
        const result = await request.execute('sp_GetResumenKPIs');

        // El SP devuelve una sola fila con todas las columnas
        if (result.recordset && result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.json({ empresas:0, ofertas:0, buscadores:0, citas:0, vinculaciones:0, colocaciones:0, rechazos:0 });
        }

    } catch (error) {
        console.error("Error ejecutando SP sp_GetResumenKPIs:", error);
        res.status(500).json({ message: 'Error interno del servidor al obtener resúmenes', error: error.message });
    }
};

module.exports = {
    getResumenKPIs
};