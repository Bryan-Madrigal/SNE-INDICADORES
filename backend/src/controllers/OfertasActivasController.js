const { sql, poolPromise } = require("../db/dbConnect");

const obtenerOfertasActivas = async (req, res) => {
    try {
        const {
            fechaInicio,
            fechaFin,
            municipio,
            categoria,
            escolaridad,
            licencia,
            busqueda
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
            whereClauses.push("v.Fecha >= @fechaInicio");
            params.fechaInicio = fechaInicio;
        }
        if (fechaFin) {
            whereClauses.push("v.Fecha < DATEADD(DAY, 1, @fechaFin)");
            params.fechaFin = fechaFin;
        }
        if (municipio && municipio !== "Todos") {
            whereClauses.push("m.Nombre = @municipio");
            params.municipio = municipio;
        }
        if (categoria && categoria !== "Todas") {
            whereClauses.push("v.NombreCategoria = @categoria");
            params.categoria = categoria;
        }
        if (escolaridad && escolaridad !== "Todas") {
            whereClauses.push("es.Descripcion = @escolaridad");
            params.escolaridad = escolaridad;
        }
        if (licencia && licencia !== "Todos") {
            if (licencia === "Requerida") {
                whereClauses.push("v.CveLicenciaManejo IS NOT NULL AND v.CveLicenciaManejo <> 0");
            } else if (licencia === "No requerida") {
                whereClauses.push("(v.CveLicenciaManejo IS NULL OR v.CveLicenciaManejo = 0)");
            }
        }
        if (busqueda) {
            whereClauses.push(`
                (v.PuestoOfrecido LIKE @busqueda OR
                 e.Nombre LIKE @busqueda OR
                 m.Nombre LIKE @busqueda)
            `);
            params.busqueda = `%${busqueda}%`;
        }

        // =============================================
        // ⚠️ OPCIÓN 1: SIN filtros de Estatus ni CveEstado
        // =============================================
        // whereClauses.push("v.Estatus = 1 AND v.CveEstado = 7");

        // ✅ Si quieres volver al comportamiento anterior,
        //    descomenta la línea de arriba y comenta esta:
        // whereClauses.push("v.Estatus = 1 AND v.CveEstado = 7");

        const whereSQL = whereClauses.length
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        console.log("========================================");
        console.log("OFERTAS - FECHA INICIO:", fechaInicio);
        console.log("OFERTAS - FECHA FIN   :", fechaFin);
        console.log("OFERTAS - WHERE       :", whereSQL);
        console.log("OFERTAS - PARAMS      :", params);
        console.log("========================================");

        // =============================================
        // LISTA
        // =============================================
        const query = `
            SELECT
                v.CveVacante,
                v.PuestoOfrecido,
                v.Fecha,
                v.NoPlazas,
                v.Salario,
                v.CveEscolaridadMin,
                es.Descripcion AS Escolaridad,
                v.CveLicenciaManejo,
                v.CveMunicipio,
                v.CveEstado,
                m.Nombre AS Municipio,
                v.CveCategoria,
                v.NombreCategoria,
                v.CveEmpresa,
                e.Nombre AS Empresa,
                v.Estatus,
                v.Vigencia
            FROM dbo.Vacantes v
            LEFT JOIN dbo.CatEmpresa e ON e.CveEmpresa = v.CveEmpresa
            LEFT JOIN dbo.CatMunicipios m ON m.CveMunicipios = v.CveMunicipio AND m.CveEstados = v.CveEstado
            LEFT JOIN dbo.CatEscolaridad es ON es.CveEscolaridad = v.CveEscolaridadMin
            ${whereSQL}
            ORDER BY v.Fecha DESC, v.CveVacante DESC
        `;

        const request = pool.request();
        Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
        });

        const result = await request.query(query);
        console.log(">>> OFERTAS - REGISTROS LISTA:", result.recordset.length);

        const ofertas = result.recordset.map((row, index) => ({
            id: row.CveVacante || index + 1,
            cveVacante: row.CveVacante,
            cveEmpresa: row.CveEmpresa,
            iniciales: obtenerIniciales(row.Empresa),
            puesto: row.PuestoOfrecido || "Sin puesto",
            empresa: row.Empresa || "Sin empresa",
            municipio: row.Municipio || "Sin municipio",
            categoria: row.NombreCategoria || "Sin categoría",
            escolaridad: row.Escolaridad || "Sin escolaridad",
            vacantes: Number(row.NoPlazas || 0),
            salario: Number(row.Salario || 0),
            licencia: convertirLicencia(row.CveLicenciaManejo),
            estatus: "Activa",
            fecha: row.Fecha || null,
            vigencia: row.Vigencia || null
        }));

        // =============================================
        // CONTEOS
        // =============================================
        const queryConteos = `
            SELECT
                COUNT(DISTINCT v.CveVacante) AS TotalOfertas,
                ISNULL(SUM(v.NoPlazas), 0) AS TotalVacantes,
                COUNT(DISTINCT v.CveEmpresa) AS TotalEmpresas,
                COUNT(DISTINCT v.CveMunicipio) AS TotalMunicipios,
                ISNULL(AVG(NULLIF(v.Salario, 0)), 0) AS SalarioPromedio
            FROM dbo.Vacantes v
            LEFT JOIN dbo.CatEmpresa e ON e.CveEmpresa = v.CveEmpresa
            LEFT JOIN dbo.CatMunicipios m ON m.CveMunicipios = v.CveMunicipio AND m.CveEstados = v.CveEstado
            LEFT JOIN dbo.CatEscolaridad es ON es.CveEscolaridad = v.CveEscolaridadMin
            ${whereSQL}
        `;

        const requestConteos = pool.request();
        Object.entries(params).forEach(([key, value]) => {
            requestConteos.input(key, value);
        });

        const resultConteos = await requestConteos.query(queryConteos);
        const c = resultConteos.recordset[0] || {};

        console.log(">>> OFERTAS - CONTEOS SQL:", c);

        const salarioPromedio = Number(c.SalarioPromedio || 0);
        const salarioFormateado = salarioPromedio > 0
            ? `$${Math.round(salarioPromedio).toLocaleString("es-MX")}`
            : "$0";

        const indicadores = [
            {
                id: "total-ofertas",
                titulo: "Total Ofertas",
                valor: Number(c.TotalOfertas || 0),
                descripcion: "Ofertas disponibles actualmente",
                tipoIcono: "ofertas",
                color: "blue"
            },
            {
                id: "vacantes-disponibles",
                titulo: "Vacantes Disponibles",
                valor: Number(c.TotalVacantes || 0),
                descripcion: "Plazas disponibles",
                tipoIcono: "vacantes",
                color: "green"
            },
            {
                id: "empresas-participantes",
                titulo: "Empresas Participantes",
                valor: Number(c.TotalEmpresas || 0),
                descripcion: "Empresas con ofertas activas",
                tipoIcono: "empresas",
                color: "purple"
            },
            {
                id: "municipios",
                titulo: "Municipios",
                valor: Number(c.TotalMunicipios || 0),
                descripcion: "Municipios con ofertas",
                tipoIcono: "municipios",
                color: "orange"
            },
            {
                id: "salario-promedio",
                titulo: "Salario Promedio",
                valor: salarioFormateado,
                descripcion: "Promedio de las ofertas",
                tipoIcono: "salario",
                color: "yellow"
            }
        ];

        const ofertasPorCategoria = agruparOfertas(ofertas, "categoria");
        const ofertasPorMunicipio = agruparOfertas(ofertas, "municipio");
        const ofertasPorEscolaridad = agruparOfertas(ofertas, "escolaridad");

        const municipios = ["Todos", ...new Set(ofertas.map(o => o.municipio).filter(Boolean))];
        const categorias = ["Todas", ...new Set(ofertas.map(o => o.categoria).filter(Boolean))];
        const escolaridades = ["Todas", ...new Set(ofertas.map(o => o.escolaridad).filter(Boolean))];

        return res.json({
            success: true,
            data: {
                ofertas,
                indicadores,
                ofertasPorCategoria,
                ofertasPorMunicipio,
                ofertasPorEscolaridad,
                municipios,
                categorias,
                escolaridades
            }
        });

    } catch (error) {
        console.error("Error al obtener ofertas activas:", error);
        return res.status(500).json({
            success: false,
            message: "Error al obtener ofertas activas",
            error: error.message
        });
    }
};

// =====================================================
// AGRUPAR OFERTAS
// =====================================================
const agruparOfertas = (ofertas, propiedad) => {
    const mapa = {};
    ofertas.forEach(o => {
        const valor = o[propiedad] || "Sin información";
        mapa[valor] = (mapa[valor] || 0) + 1;
    });
    return Object.entries(mapa)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
};

// =====================================================
// UTILIDADES
// =====================================================
const obtenerIniciales = (nombre = "") => {
    const palabras = String(nombre).trim().split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return "NA";
    if (palabras.length === 1) return palabras[0].substring(0, 2).toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
};

const convertirLicencia = (valor) => {
    if (valor === null || valor === undefined || Number(valor) === 0) return "No";
    return "Sí";
};

module.exports = {
    obtenerOfertasActivas
};