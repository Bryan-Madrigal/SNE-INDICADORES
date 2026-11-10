const { sql, poolPromise } = require("../db/dbConnect");

// =========================================================
// OBTENER ATENCIONES CON FILTROS
// =========================================================
const obtenerAtenciones = async (req, res) => {
    try {
        const {
            periodo,
            fechaInicio,
            fechaFin,
            inicio,
            fin,
            tipo,
            municipio,
            busqueda
        } = req.query;

        const pool = await poolPromise;
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: "No se pudo conectar con SQL Server"
            });
        }

        let dateInicio = null;
        let dateFin = null;

        const fInicio = fechaInicio || inicio;
        const fFin = fechaFin || fin;

        // Misma lógica de fechas que en kpiController (Dashboard)
        if (periodo === 'personalizado' && fInicio && fFin) {
            dateInicio = new Date(fInicio + 'T00:00:00');
            dateFin = new Date(fFin + 'T23:59:59');
        } else if (periodo && periodo !== 'todos') {
            const hoy = new Date();
            dateFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
            dateInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);

            if (periodo === 'semanal') {
                dateInicio.setDate(hoy.getDate() - 7);
            } else if (periodo === 'mensual') {
                dateInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            } else if (periodo === 'anual') {
                dateInicio = new Date(hoy.getFullYear(), 0, 1);
            }
        } else if (fInicio && fFin) {
            dateInicio = new Date(fInicio + 'T00:00:00');
            dateFin = new Date(fFin + 'T23:59:59');
        } else if (fInicio) {
            dateInicio = new Date(fInicio + 'T00:00:00');
        } else if (fFin) {
            dateFin = new Date(fFin + 'T23:59:59');
        }

        // =============================================
        // CONSTRUIR FILTROS BASE
        // =============================================
        const whereBase = [];
        const params = {};

        if (dateInicio) {
            whereBase.push("a.Fecha >= @fechaInicio");
        }
        if (dateFin) {
            whereBase.push("a.Fecha <= @fechaFin");
        }
        if (tipo && tipo !== "Todos") {
            whereBase.push("tc.Descripcion = @tipo");
            params.tipo = tipo;
        }
        if (municipio && municipio !== "Todos") {
            whereBase.push("m.Nombre = @municipio");
            params.municipio = municipio;
        }
        if (busqueda) {
            whereBase.push(`
                (s.Nombre LIKE @busqueda
                 OR s.Paterno LIKE @busqueda
                 OR s.Materno LIKE @busqueda
                 OR s.Curp LIKE @busqueda
                 OR s.Folio LIKE @busqueda)
            `);
            params.busqueda = `%${busqueda}%`;
        }

        // Filtro por estado comentado para ver todos los registros como en el Dashboard
        // whereBase.push("s.CveEstado = 7");

        const whereBaseSQL = whereBase.length
            ? whereBase.join(" AND ")
            : "1=1";

        const bindInputs = (request) => {
            if (dateInicio) request.input('fechaInicio', sql.Date, dateInicio);
            if (dateFin) request.input('fechaFin', sql.Date, dateFin);
            Object.entries(params).forEach(([key, value]) => {
                request.input(key, value);
            });
        };

        // =============================================
        // CONSULTA DE LA LISTA (solo Atendidas = 2)
        // =============================================
        const queryLista = `
            SELECT
                a.CveAtencion AS id,
                a.CveSolicitante,
                CONVERT(VARCHAR(10), a.Fecha, 120) AS fecha,
                a.Hora AS hora,
                a.CveEstatusCita,
                a.CveTipoCita,

                s.Folio,
                LTRIM(RTRIM(
                    ISNULL(s.Nombre,'') + ' ' +
                    ISNULL(s.Paterno,'') + ' ' +
                    ISNULL(s.Materno,'')
                )) AS nombre,
                s.Curp AS curp,

                m.Nombre AS municipio,

                tc.Descripcion AS tipo,
                ec.Descripcion AS estado

            FROM dbo.AtencionSolicitante a

            LEFT JOIN dbo.Solicitante s
                ON s.CveSolicitante = a.CveSolicitante

            LEFT JOIN dbo.CatTipoCita tc
                ON tc.CveTipoCita = a.CveTipoCita

            LEFT JOIN dbo.CatEstatusCita ec
                ON ec.CveEstatusCita = a.CveEstatusCita

            LEFT JOIN dbo.CatMunicipios m
                ON m.CveMunicipios = s.CveMunicipio

            WHERE ${whereBaseSQL}
              AND a.CveEstatusCita = 2

            ORDER BY a.Fecha DESC, a.CveAtencion DESC
        `;

        const requestLista = pool.request();
        bindInputs(requestLista);

        const resultLista = await requestLista.query(queryLista);

        const atenciones = resultLista.recordset.map((row) => ({
            id: row.id,
            folio: String(row.Folio || row.id || ""),
            fecha: row.fecha || "",
            hora: row.hora || "",
            nombre: row.nombre || "",
            curp: row.curp || "",
            tipo: row.tipo || "Sin tipo",
            municipio: row.municipio || "Sin municipio",
            estado: row.estado || "Atendida",
            cveSolicitante: row.CveSolicitante,
            cveEstatusCita: row.CveEstatusCita,
            cveTipoCita: row.CveTipoCita
        }));

        // =============================================
        // CONTEOS POR ESTATUS (1, 2, 3, 4, 5, 6)
        // =============================================
        const queryConteos = `
            SELECT
                a.CveEstatusCita AS Status,
                COUNT(*) AS Total
            FROM dbo.AtencionSolicitante a
            LEFT JOIN dbo.Solicitante s
                ON s.CveSolicitante = a.CveSolicitante
            LEFT JOIN dbo.CatTipoCita tc
                ON tc.CveTipoCita = a.CveTipoCita
            LEFT JOIN dbo.CatMunicipios m
                ON m.CveMunicipios = s.CveMunicipio
            WHERE ${whereBaseSQL}
              AND a.CveEstatusCita IN (1, 2, 3, 4, 5, 6)
            GROUP BY a.CveEstatusCita
        `;

        const requestConteos = pool.request();
        bindInputs(requestConteos);

        const resultConteos = await requestConteos.query(queryConteos);

        const conteos = {
            total: 0,
            atendidas: 0,
            enEspera: 0,
            noSePresento: 0,
            noContesto: 0,
            canceladas: 0,
        };

        resultConteos.recordset.forEach((row) => {
            const total = Number(row.Total) || 0;
            if (row.Status === 2) {
                conteos.atendidas = total;
                conteos.total = total;
            }
            if (row.Status === 1 || row.Status === 4) {
                conteos.enEspera += total;
            }
            if (row.Status === 3) {
                conteos.canceladas += total;
            }
            if (row.Status === 5) {
                conteos.noSePresento += total;
            }
            if (row.Status === 6) {
                conteos.noContesto += total;
            }
        });

        // =============================================
        // OPCIONES PARA FILTROS
        // =============================================
        const municipios = ["Todos", ...new Set(atenciones.map(a => a.municipio).filter(Boolean))];
        const tipos = ["Todos", ...new Set(atenciones.map(a => a.tipo).filter(Boolean))];

        // =============================================
        // RESPUESTA
        // =============================================
        res.json({
            success: true,
            data: {
                atenciones,
                conteos,
                municipios,
                tipos
            }
        });

    } catch (error) {
        console.error("ERROR AL OBTENER ATENCIONES:", error);
        res.status(500).json({
            success: false,
            message: "Error al consultar las atenciones.",
            error: error.message
        });
    }
};

// =========================================================
// EXPORTAR
// =========================================================

module.exports = {
    obtenerAtenciones
};