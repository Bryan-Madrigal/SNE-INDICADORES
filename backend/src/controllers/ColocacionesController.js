const { sql, poolPromise } = require("../db/dbConnect");

const obtenerColocaciones = async (req, res) => {
    try {
        const {
            fechaInicio,
            fechaFin,
            municipio,
            empresa,
            puesto,
            consejero,
            unidad,
            busqueda
        } = req.query;

        const pool = await poolPromise;
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con SQL Server"
            });
        }

        console.log("📥 PARÁMETROS RECIBIDOS:", { fechaInicio, fechaFin, municipio, empresa, puesto, consejero, unidad, busqueda });

        // =============================================
        // CONSTRUIR FILTROS DINÁMICOS
        // =============================================
        const condiciones = [];
        const params = {};

        // Fechas (para colocaciones usamos FechaCol, para vinculaciones FechaEnvio)
        if (fechaInicio) {
            condiciones.push("fecha >= @fechaInicio");
            params.fechaInicio = fechaInicio;
        }
        if (fechaFin) {
            condiciones.push("fecha <= @fechaFin");
            params.fechaFin = fechaFin;
        }

        if (municipio && municipio !== "Todos") {
            condiciones.push("m.Nombre = @municipio");
            params.municipio = municipio;
        }
        if (empresa && empresa !== "Todos") {
            condiciones.push("ce.Nombre = @empresa");
            params.empresa = empresa;
        }
        if (puesto && puesto !== "Todos") {
            condiciones.push("v.PuestoOfrecido = @puesto");
            params.puesto = puesto;
        }
        if (consejero && consejero !== "Todos") {
            // Usamos es.CveConsejeroEnvio directamente, que contiene el nombre del consejero
            condiciones.push("es.CveConsejeroEnvio = @consejero");
            params.consejero = consejero;
        }
        if (unidad && unidad !== "Todos") {
            condiciones.push("uo.Nombre = @unidad");
            params.unidad = unidad;
        }
        if (busqueda) {
            condiciones.push(`
                (s.Nombre LIKE @busqueda OR
                 s.Curp LIKE @busqueda OR
                 ce.Nombre LIKE @busqueda OR
                 v.PuestoOfrecido LIKE @busqueda)
            `);
            params.busqueda = `%${busqueda}%`;
        }

        // Siempre Chiapas
        condiciones.push("s.CveEstado = 7");

        const whereSQL = condiciones.length
            ? `WHERE ${condiciones.join(" AND ")}`
            : "";

        console.log("🔍 WHERE SQL GENERADO:", whereSQL);
        console.log("📦 PARÁMETROS:", params);

        // =============================================
        // CONSULTA DE COLOCACIONES (Status = 4)
        // =============================================
        const colocacionesQuery = `
            SELECT
                es.CveEnvio,
                es.CveSolicitante,
                es.CveVacante,
                es.FechaCol AS FechaColocacion,
                es.FechaEnvio,
                es.Observacion,

                s.Nombre AS Buscador,
                s.Curp,
                s.Folio AS FolioSolicitante,
                s.Edad,

                v.PuestoOfrecido,
                v.Salario,

                ce.Nombre AS Empresa,
                m.Nombre AS Municipio,
                es.CveConsejeroEnvio AS Consejero,  -- Directamente el nombre
                uo.Nombre AS Unidad

            FROM dbo.EnvioSeguimiento es

            INNER JOIN dbo.Solicitante s
                ON s.CveSolicitante = es.CveSolicitante

            INNER JOIN dbo.Vacantes v
                ON v.CveVacante = es.CveVacante

            LEFT JOIN dbo.CatEmpresa ce
                ON ce.CveEmpresa = v.CveEmpresa

            LEFT JOIN dbo.CatMunicipios m
                ON m.CveMunicipios = v.CveMunicipio

            LEFT JOIN dbo.CatUnOperativa uo
                ON uo.CveUnOperativa = s.CveUnOperativa

            ${whereSQL}
            AND es.Status = 4

            ORDER BY es.FechaCol DESC, es.CveEnvio DESC
        `;

        const colocacionesQueryFinal = colocacionesQuery
            .replace(/fecha >= @fechaInicio/g, "es.FechaCol >= @fechaInicio")
            .replace(/fecha <= @fechaFin/g, "es.FechaCol <= @fechaFin");

        console.log("🔍 CONSULTA COLOCACIONES:", colocacionesQueryFinal);

        const requestColocaciones = pool.request();
        Object.entries(params).forEach(([key, value]) => {
            if (key === 'fechaInicio' || key === 'fechaFin') {
                requestColocaciones.input(key, sql.Date, value);
            } else {
                requestColocaciones.input(key, sql.VarChar, value);
            }
        });

        const resultColocaciones = await requestColocaciones.query(colocacionesQueryFinal);
        const colocaciones = resultColocaciones.recordset.map((row, index) => ({
            id: index + 1,
            cveEnvio: row.CveEnvio,
            cveSolicitante: row.CveSolicitante,
            cveVacante: row.CveVacante,
            fechaColocacion: row.FechaColocacion || null,
            fechaEnvio: row.FechaEnvio || null,
            nombre: row.Buscador || "",
            curp: row.Curp || "",
            empresa: row.Empresa || "",
            puesto: row.PuestoOfrecido || "",
            municipio: row.Municipio || "",
            consejero: row.Consejero || "",
            unidad: row.Unidad || "",
            salario: Number(row.Salario || 0),
            folio: row.FolioSolicitante || "",
            edad: row.Edad || null,
            estado: "Colocado",
            observacion: row.Observacion || ""
        }));

        const totalColocaciones = colocaciones.length;

        // =============================================
        // CONSULTA DE VINCULACIONES (Status IN (1,2))
        // =============================================
        const vinculacionesQuery = `
            SELECT COUNT(*) AS Total
            FROM dbo.EnvioSeguimiento es
            INNER JOIN dbo.Solicitante s ON s.CveSolicitante = es.CveSolicitante
            INNER JOIN dbo.Vacantes v ON v.CveVacante = es.CveVacante
            LEFT JOIN dbo.CatEmpresa ce ON ce.CveEmpresa = v.CveEmpresa
            LEFT JOIN dbo.CatMunicipios m ON m.CveMunicipios = v.CveMunicipio
            LEFT JOIN dbo.CatUnOperativa uo ON uo.CveUnOperativa = s.CveUnOperativa
            ${whereSQL}
            AND es.Status IN (1, 2)
        `;

        const vinculacionesQueryFinal = vinculacionesQuery
            .replace(/fecha >= @fechaInicio/g, "es.FechaEnvio >= @fechaInicio")
            .replace(/fecha <= @fechaFin/g, "es.FechaEnvio <= @fechaFin");

        console.log("🔍 CONSULTA VINCULACIONES:", vinculacionesQueryFinal);

        const requestVinculaciones = pool.request();
        Object.entries(params).forEach(([key, value]) => {
            if (key === 'fechaInicio' || key === 'fechaFin') {
                requestVinculaciones.input(key, sql.Date, value);
            } else {
                requestVinculaciones.input(key, sql.VarChar, value);
            }
        });

        const resultVinculaciones = await requestVinculaciones.query(vinculacionesQueryFinal);
        const totalVinculados = Number(resultVinculaciones.recordset[0]?.Total || 0);

        const tasaColocacion = totalVinculados > 0
            ? (totalColocaciones / totalVinculados) * 100
            : 0;

        // =============================================
        // OPCIONES PARA FILTROS (basadas en datos filtrados)
        // =============================================
        const empresas = ["Todos", ...new Set(colocaciones.map(c => c.empresa).filter(Boolean))];
        const municipios = ["Todos", ...new Set(colocaciones.map(c => c.municipio).filter(Boolean))];
        const puestos = ["Todos", ...new Set(colocaciones.map(c => c.puesto).filter(Boolean))];
        const consejeros = ["Todos", ...new Set(colocaciones.map(c => c.consejero).filter(Boolean))];
        const unidades = ["Todos", ...new Set(colocaciones.map(c => c.unidad).filter(Boolean))];

        // =============================================
        // RESPUESTA
        // =============================================
        res.json({
            success: true,
            data: {
                colocaciones,
                indicadores: {
                    vinculaciones: totalVinculados,
                    colocaciones: totalColocaciones,
                    colocadosVacantes: totalColocaciones,
                    totalVacantes: 0,
                    tasaColocacion: Number(tasaColocacion.toFixed(2))
                },
                empresas,
                municipios,
                puestos,
                consejeros,
                unidades
            }
        });
    } catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener colocaciones",
            error: error.message,
            stack: error.stack
        });
    }
};

module.exports = {
    obtenerColocaciones
};