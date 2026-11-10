const { sql, poolPromise } = require('../db/dbConnect');

// Función única para obtener datos agrupados por periodo usando Módulo 2
const getIndicadoresPeriodo = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { periodo = 'mes', inicio, fin } = req.query; // 'dia', 'mes', 'anio', 'personalizado'
        
        let agrupacion = 'mes';
        let fechaInicio = null;
        let fechaFin = null;

        if (periodo === 'personalizado' && inicio && fin) {
            fechaInicio = new Date(inicio + 'T00:00:00');
            fechaFin = new Date(fin + 'T23:59:59');
            
            // Determinar tipo de agrupacion basada en el rango de fechas
            const diffTime = Math.abs(fechaFin - fechaInicio);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 31) agrupacion = 'dia';
            else if (diffDays <= 365) agrupacion = 'mes';
            else agrupacion = 'anio';
            
        } else if (periodo && periodo !== 'todos') {
            if (periodo === 'diario') agrupacion = 'dia';
            if (periodo === 'semanal') agrupacion = 'dia';
            if (periodo === 'mensual') agrupacion = 'mes';
            if (periodo === 'anual') agrupacion = 'anio';
            
            const hoy = new Date();
            fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

            if (periodo === 'semanal' || periodo === 'diario') { 
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7, 0, 0, 0);
                agrupacion = 'dia';
            } else if (periodo === 'mensual') {
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                agrupacion = 'dia';
            } else if (periodo === 'anual') {
                fechaInicio = new Date(hoy.getFullYear(), 0, 1);
                agrupacion = 'mes';
            }
        }

        const request = pool.request();
        
        if (fechaInicio) {
            request.input('fecha_inicio', sql.Date, fechaInicio);
            request.input('fecha_fin', sql.Date, fechaFin);
        }
        
        request.input('agrupacion', sql.VarChar(20), agrupacion);

        const result = await request.execute('sp_GetIndicadoresPeriodo');
        
        res.json(result.recordset);

    } catch (error) {
        console.error("Error Obteniendo Indicadores de Período:", error.message);
        res.status(500).json({
            message: "Error interno obteniendo indicadores periodo.",
            error: error.message
        });
    }
};

module.exports = {
    getIndicadoresPeriodo
};
