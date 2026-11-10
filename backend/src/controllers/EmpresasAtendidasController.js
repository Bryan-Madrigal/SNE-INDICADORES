const { poolPromise } = require('../db/dbConnect');

// =========================================================
// OBTENER EMPRESAS CON FILTROS
// GET /api/empresas?fechaInicio=...&fechaFin=...&municipio=...&busqueda=...
// =========================================================
async function obtenerEmpresas(req, res) {
    try {
        const { fechaInicio, fechaFin, municipio, busqueda } = req.query;

        const pool = await poolPromise;
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo conectar con SQL Server'
            });
        }

        // Construir cláusulas WHERE dinámicas (solo con columnas que existen)
        const whereClauses = [];
        const params = {};

        // Filtro por fecha (asumimos que existe FechaRegistro en CatEmpresa)
        if (fechaInicio) {
            whereClauses.push('e.FechaRegistro >= @fechaInicio');
            params.fechaInicio = fechaInicio;
        }
        if (fechaFin) {
            whereClauses.push('e.FechaRegistro <= @fechaFin');
            params.fechaFin = fechaFin;
        }

        // Filtro por municipio (solo si existe la columna CveMunicipio en CatEmpresa)
        // Si no existe, simplemente no se usa este filtro.
        // Para saber si existe, podemos intentar usar LEFT JOIN y filtrar por m.Nombre
        // Si falla, se captura el error y se ignora.
        if (municipio && municipio !== 'Todos') {
            // Intentamos unir con CatMunicipios; si la tabla no existe o la columna no existe,
            // la consulta fallará. Por ahora asumimos que sí existe.
            whereClauses.push('m.Nombre = @municipio');
            params.municipio = municipio;
        }

        // Búsqueda por nombre de empresa
        if (busqueda) {
            whereClauses.push('e.Nombre LIKE @busqueda');
            params.busqueda = `%${busqueda}%`;
        }

        const whereSQL = whereClauses.length
            ? `WHERE ${whereClauses.join(' AND ')}`
            : '';

        // Construcción de la consulta principal
        // Incluimos LEFT JOIN a CatMunicipios solo si es necesario (si se filtra por municipio o se necesita mostrar)
        // Si no se usa, podemos omitirlo para evitar errores.
        const joinMunicipios = (municipio && municipio !== 'Todos') 
            ? `LEFT JOIN dbo.CatMunicipios m ON m.CveMunicipios = e.CveMunicipio` 
            : '';

        const query = `
            SELECT
                e.CveEmpresa,
                e.Nombre AS NombreEmpresa,
                e.FechaRegistro,
                ${joinMunicipios ? 'm.Nombre AS Municipio' : "'' AS Municipio"},
                '' AS Sector,        -- Si no existe, lo dejamos vacío
                '' AS Contacto,      -- Si no existe, vacío
                '' AS Telefono,      -- Si no existe, vacío

                COUNT(DISTINCT v.CveVacante) AS CuentaOfertas,

                COUNT(DISTINCT CASE
                    WHEN v.Estatus = 1 THEN v.CveVacante
                END) AS CuentaOfertasActivas,

                COUNT(DISTINCT CASE
                    WHEN v.Estatus <> 1 OR v.Estatus IS NULL THEN v.CveVacante
                END) AS CuentaOfertasInactivas,

                COUNT(DISTINCT CASE
                    WHEN es.Status IN (1, 2) THEN es.CveEnvio
                END) AS CuentaOfertasPostulaciones,

                COUNT(DISTINCT CASE
                    WHEN es.Status = 3 THEN es.CveEnvio
                END) AS CuentaOfertasRechazos,

                COUNT(DISTINCT CASE
                    WHEN es.Status = 4 THEN es.CveEnvio
                END) AS CuentaOfertasColocados

            FROM dbo.CatEmpresa e

            LEFT JOIN dbo.Vacantes v
                ON v.CveEmpresa = e.CveEmpresa

            LEFT JOIN dbo.EnvioSeguimiento es
                ON es.CveVacante = v.CveVacante

            ${joinMunicipios}

            ${whereSQL}

            GROUP BY
                e.CveEmpresa,
                e.Nombre,
                e.FechaRegistro
                ${joinMunicipios ? ', m.Nombre' : ''}
            ORDER BY e.Nombre;
        `;

        const request = pool.request();
        Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
        });

        const result = await request.query(query);

        // Adaptar resultado al formato esperado por el frontend
        const empresas = result.recordset.map(row => ({
            id: row.CveEmpresa,
            nombre: row.NombreEmpresa,
            municipio: row.Municipio || 'Sin municipio',
            sector: row.Sector || 'Sin sector',
            contacto: row.Contacto || row.Telefono || 'Sin contacto',
            fechaRegistro: row.FechaRegistro ? new Date(row.FechaRegistro).toLocaleDateString('es-MX') : '',
            vacantes: Number(row.CuentaOfertas) || 0,
            vacantesActivas: Number(row.CuentaOfertasActivas) || 0,
            vacantesInactivas: Number(row.CuentaOfertasInactivas) || 0,
            vinculaciones: Number(row.CuentaOfertasPostulaciones) || 0,
            rechazos: Number(row.CuentaOfertasRechazos) || 0,
            colocaciones: Number(row.CuentaOfertasColocados) || 0,
            estado: 'Activa' // o puedes calcularlo según actividad reciente
        }));

        console.log(`Empresas encontradas: ${empresas.length}`);
        res.json({
            success: true,
            total: empresas.length,
            data: empresas
        });

    } catch (error) {
        console.error('ERROR AL OBTENER EMPRESAS:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las empresas',
            error: error.message
        });
    }
}

// =========================================================
// OBTENER UNA EMPRESA POR ID
// =========================================================
async function obtenerEmpresaPorId(req, res) {
    try {
        const { cveEmpresa } = req.params;
        if (!cveEmpresa || isNaN(cveEmpresa)) {
            return res.status(400).json({ mensaje: 'CveEmpresa inválida' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('CveEmpresa', cveEmpresa)
            .query(`
                SELECT
                    e.CveEmpresa,
                    e.Nombre AS NombreEmpresa,
                    e.FechaRegistro,
                    '' AS Municipio,
                    '' AS Sector,
                    '' AS Contacto,
                    '' AS Telefono,
                    COUNT(DISTINCT v.CveVacante) AS CuentaOfertas,
                    COUNT(DISTINCT CASE WHEN v.Estatus = 1 THEN v.CveVacante END) AS CuentaOfertasActivas,
                    COUNT(DISTINCT CASE WHEN v.Estatus <> 1 OR v.Estatus IS NULL THEN v.CveVacante END) AS CuentaOfertasInactivas,
                    COUNT(DISTINCT CASE WHEN es.Status IN (1, 2) THEN es.CveEnvio END) AS CuentaOfertasPostulaciones,
                    COUNT(DISTINCT CASE WHEN es.Status = 3 THEN es.CveEnvio END) AS CuentaOfertasRechazos,
                    COUNT(DISTINCT CASE WHEN es.Status = 4 THEN es.CveEnvio END) AS CuentaOfertasColocados
                FROM dbo.CatEmpresa e
                LEFT JOIN dbo.Vacantes v ON v.CveEmpresa = e.CveEmpresa
                LEFT JOIN dbo.EnvioSeguimiento es ON es.CveVacante = v.CveVacante
                WHERE e.CveEmpresa = @CveEmpresa
                GROUP BY e.CveEmpresa, e.Nombre, e.FechaRegistro;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Empresa no encontrada' });
        }

        const row = result.recordset[0];
        res.json({
            success: true,
            data: {
                id: row.CveEmpresa,
                nombre: row.NombreEmpresa,
                municipio: row.Municipio || 'Sin municipio',
                sector: row.Sector || 'Sin sector',
                contacto: row.Contacto || row.Telefono || 'Sin contacto',
                fechaRegistro: row.FechaRegistro ? new Date(row.FechaRegistro).toLocaleDateString('es-MX') : '',
                vacantes: Number(row.CuentaOfertas) || 0,
                vacantesActivas: Number(row.CuentaOfertasActivas) || 0,
                vacantesInactivas: Number(row.CuentaOfertasInactivas) || 0,
                vinculaciones: Number(row.CuentaOfertasPostulaciones) || 0,
                rechazos: Number(row.CuentaOfertasRechazos) || 0,
                colocaciones: Number(row.CuentaOfertasColocados) || 0
            }
        });

    } catch (error) {
        console.error('Error obteniendo detalle de empresa:', error);
        res.status(500).json({
            mensaje: 'Error al obtener el detalle de la empresa',
            error: error.message
        });
    }
}

module.exports = {
    obtenerEmpresas,
    obtenerEmpresaPorId
};