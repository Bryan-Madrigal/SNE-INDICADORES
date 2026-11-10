const { sql, poolPromise } = require("../db/dbConnect");

const obtenerBuscadores = async (req, res) => {
    try {
        const {
            fechaInicio,
            fechaFin,
            municipio,
            escolaridad,
            estado,
            busqueda,
            cveUnOperativa
        } = req.query;

        const pool = await poolPromise;
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con SQL Server"
            });
        }

        const whereClauses = [];
        const params = {};

        if (fechaInicio) {
            whereClauses.push("s.FechaRegistro >= @fechaInicio");
            params.fechaInicio = fechaInicio;
        }
        // ✅ Incluye todo el día final
        if (fechaFin) {
            whereClauses.push("s.FechaRegistro < DATEADD(DAY, 1, @fechaFin)");
            params.fechaFin = fechaFin;
        }

        if (municipio && municipio !== "Todos") {
            whereClauses.push("m.Nombre = @municipio");
            params.municipio = municipio;
        }

        if (escolaridad && escolaridad !== "Todas") {
            whereClauses.push("es.Descripcion = @escolaridad");
            params.escolaridad = escolaridad;
        }

        if (estado && estado !== "Todos") {
            whereClauses.push("s.Estatus = @estado");
            params.estado = estado;
        }

        if (busqueda) {
            whereClauses.push(`
                (LTRIM(RTRIM(ISNULL(s.Nombre,'') + ' ' + ISNULL(s.Paterno,'') + ' ' + ISNULL(s.Materno,''))) LIKE @busqueda
                OR s.Curp LIKE @busqueda)
            `);
            params.busqueda = `%${busqueda}%`;
        }

        const unidadOperativa = cveUnOperativa && !isNaN(parseInt(cveUnOperativa, 10))
            ? parseInt(cveUnOperativa, 10)
            : 0;
        if (unidadOperativa > 0) {
            whereClauses.push("s.CveUnOperativa = @cveUnOperativa");
            params.cveUnOperativa = unidadOperativa;
        }

        // ⚠️ Filtro por estado (7 = Chiapas).
        // Comentado para que veas TODOS los registros.
        // Si quieres solo Chiapas, descomenta la línea.
        // whereClauses.push("s.CveEstado = 7");

        const whereSQL = whereClauses.length
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        // =============================================
        // LOG DE DIAGNÓSTICO
        // =============================================
        console.log("========================================");
        console.log("BUSCADORES - FECHA INICIO:", fechaInicio);
        console.log("BUSCADORES - FECHA FIN   :", fechaFin);
        console.log("BUSCADORES - WHERE       :", whereSQL);
        console.log("BUSCADORES - PARAMS      :", params);
        console.log("========================================");

        // =============================================
        // LISTA
        // =============================================
        const query = `
            SELECT 
                s.CveSolicitante,
                s.Folio,
                LTRIM(RTRIM(ISNULL(s.Nombre,'') + ' ' + ISNULL(s.Paterno,'') + ' ' + ISNULL(s.Materno,''))) AS NombreCompleto,
                s.Curp,
                s.FechaRegistro,
                s.Fechanac,
                s.Edad,
                s.CveEstado,
                s.CveMunicipio,
                m.Nombre AS Municipio,
                s.CveSexo,
                sx.Descripcion AS Genero,
                s.CveEscolaridad,
                es.Descripcion AS Escolaridad,
                s.Sitrabaja,
                s.CveNoTrabaja,
                nt.Descripcion AS MotivoNoTrabaja,
                CASE
                    WHEN s.Sitrabaja = 1 THEN 'Trabaja'
                    WHEN s.Sitrabaja = 0 THEN 'No trabaja'
                    ELSE 'No especificado'
                END AS SituacionLaboral,
                s.Estatus,
                s.CveUnOperativa,
                uo.Nombre AS UnidadOperativa
            FROM dbo.Solicitante s
            LEFT JOIN dbo.CatSexo sx ON sx.CveSexo = s.CveSexo
            LEFT JOIN dbo.CatEscolaridad es ON es.CveEscolaridad = s.CveEscolaridad
            LEFT JOIN dbo.CatNoTrabaja nt ON nt.CveNoTrabaja = s.CveNoTrabaja
            LEFT JOIN dbo.CatUnOperativa uo ON uo.CveUnOperativa = s.CveUnOperativa
            LEFT JOIN dbo.CatMunicipios m ON m.CveMunicipios = s.CveMunicipio
            ${whereSQL}
            ORDER BY s.FechaRegistro DESC
        `;

        const request = pool.request();
        Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
        });

        const resultado = await request.query(query);
        console.log(">>> BUSCADORES - REGISTROS LISTA:", resultado.recordset.length);

        const buscadores = resultado.recordset.map((row, index) => ({
            id: index + 1,
            cveSolicitante: row.CveSolicitante,
            folio: row.Folio || "",
            nombre: row.NombreCompleto || "",
            curp: row.Curp || "",
            fechaRegistro: row.FechaRegistro || null,
            fechaNacimiento: row.Fechanac || null,
            edad: row.Edad !== null && row.Edad !== undefined ? Number(row.Edad) : null,
            municipio: row.Municipio ? String(row.Municipio).trim() : "",
            genero: row.Genero ? String(row.Genero).trim() : "",
            escolaridad: row.Escolaridad ? String(row.Escolaridad).trim() : "",
            situacionLaboral: row.SituacionLaboral || "No especificado",
            motivoNoTrabaja: row.MotivoNoTrabaja ? String(row.MotivoNoTrabaja).trim() : "",
            estado: row.Estatus !== null && row.Estatus !== undefined ? String(row.Estatus).trim() : "No especificado",
            cveEstado: row.CveEstado,
            cveMunicipio: row.CveMunicipio,
            cveSexo: row.CveSexo,
            cveEscolaridad: row.CveEscolaridad,
            cveNoTrabaja: row.CveNoTrabaja,
            cveUnOperativa: row.CveUnOperativa,
            unidadOperativa: row.UnidadOperativa ? String(row.UnidadOperativa).trim() : ""
        }));

        // =============================================
        // CONTEOS REALES EN SQL
        // =============================================
        const queryConteos = `
            SELECT
                COUNT(DISTINCT s.CveSolicitante) AS TotalBuscadores,
                COUNT(DISTINCT CASE WHEN s.Sitrabaja = 1 THEN s.CveSolicitante END) AS Trabajadores,
                COUNT(DISTINCT CASE WHEN s.Sitrabaja = 0 THEN s.CveSolicitante END) AS NoTrabajadores,
                COUNT(DISTINCT CASE WHEN s.Sitrabaja IS NULL THEN s.CveSolicitante END) AS NoEspecificados
            FROM dbo.Solicitante s
            LEFT JOIN dbo.CatSexo sx ON sx.CveSexo = s.CveSexo
            LEFT JOIN dbo.CatEscolaridad es ON es.CveEscolaridad = s.CveEscolaridad
            LEFT JOIN dbo.CatNoTrabaja nt ON nt.CveNoTrabaja = s.CveNoTrabaja
            LEFT JOIN dbo.CatUnOperativa uo ON uo.CveUnOperativa = s.CveUnOperativa
            LEFT JOIN dbo.CatMunicipios m ON m.CveMunicipios = s.CveMunicipio
            ${whereSQL}
        `;

        const requestConteos = pool.request();
        Object.entries(params).forEach(([key, value]) => {
            requestConteos.input(key, value);
        });

        const resultConteos = await requestConteos.query(queryConteos);
        const c = resultConteos.recordset[0] || {};

        console.log(">>> BUSCADORES - CONTEOS SQL:", c);

        const indicadores = {
            totalBuscadores: Number(c.TotalBuscadores || 0),
            trabajadores: Number(c.Trabajadores || 0),
            noTrabajadores: Number(c.NoTrabajadores || 0),
            noEspecificados: Number(c.NoEspecificados || 0)
        };

        // =============================================
        // AGRUPACIONES PARA GRÁFICOS
        // =============================================
        const totalParaPorcentaje = buscadores.length || 1;

        const conteoEscolaridad = {};
        buscadores.forEach(b => {
            const nivel = b.escolaridad || "No especificado";
            conteoEscolaridad[nivel] = (conteoEscolaridad[nivel] || 0) + 1;
        });
        const escolaridadData = Object.entries(conteoEscolaridad)
            .map(([nivel, total]) => ({
                nivel,
                total,
                porcentaje: `${Math.round((total / totalParaPorcentaje) * 100)}%`
            }))
            .sort((a, b) => b.total - a.total);

        const conteoSituacion = {};
        buscadores.forEach(b => {
            const situacion = b.situacionLaboral || "No especificado";
            conteoSituacion[situacion] = (conteoSituacion[situacion] || 0) + 1;
        });
        const situacionData = Object.entries(conteoSituacion)
            .map(([situacion, total]) => ({
                situacion,
                total,
                porcentaje: `${Math.round((total / totalParaPorcentaje) * 100)}%`
            }))
            .sort((a, b) => b.total - a.total);

        const conteoEstado = {};
        buscadores.forEach(b => {
            const estado = b.estado || "No especificado";
            conteoEstado[estado] = (conteoEstado[estado] || 0) + 1;
        });
        const estadoData = Object.entries(conteoEstado)
            .map(([nombre, valor]) => ({
                nombre,
                valor,
                fondo: nombre === "No especificado" ? "estado-resumen-gris" : "estado-resumen-blue",
                texto: nombre === "No especificado" ? "text-gray-500" : "text-blue-600"
            }))
            .sort((a, b) => b.valor - a.valor);

        // =============================================
        // LISTAS PARA FILTROS
        // =============================================
        const municipios = ["Todos", ...new Set(buscadores.map(b => b.municipio).filter(Boolean))];
        const escolaridades = ["Todas", ...new Set(buscadores.map(b => b.escolaridad).filter(Boolean))];
        const estados = ["Todos", ...new Set(buscadores.map(b => b.estado).filter(Boolean))];

        return res.json({
            success: true,
            data: {
                buscadores,
                indicadores,
                escolaridadData,
                situacionData,
                estadoData,
                municipios,
                escolaridades,
                estados
            }
        });

    } catch (error) {
        console.error("Error al obtener buscadores:", error);
        return res.status(500).json({
            success: false,
            message: "Error al obtener buscadores de empleo",
            error: error.message
        });
    }
};

module.exports = {
    obtenerBuscadores
};