const { sql, poolPromise } = require("../db/dbConnect");

const obtenerCitas = async (req, res) => {
    try {
        const { periodo, fechaInicio, fechaFin, tipo, municipio, busqueda, inicio, fin } = req.query;

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

        // whereBase.push("s.CveEstado = 7"); // opcional

        const whereBaseSQL = whereBase.length
            ? whereBase.join(" AND ")
            : "1=1";

        console.log("========================================");
        console.log("PERIODO     :", periodo);
        console.log("DATE INICIO :", dateInicio);
        console.log("DATE FIN    :", dateFin);
        console.log("WHERE BASE  :", whereBaseSQL);
        console.log("========================================");

        const bindInputs = (request) => {
            if (dateInicio) request.input('fechaInicio', sql.Date, dateInicio);
            if (dateFin) request.input('fechaFin', sql.Date, dateFin);
            Object.entries(params).forEach(([key, value]) => {
                request.input(key, value);
            });
        };

        // =============================================
        // LISTA (todos los estatus)
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
            LEFT JOIN dbo.Solicitante s ON s.CveSolicitante = a.CveSolicitante
            LEFT JOIN dbo.CatTipoCita tc ON tc.CveTipoCita = a.CveTipoCita
            LEFT JOIN dbo.CatEstatusCita ec ON ec.CveEstatusCita = a.CveEstatusCita
            LEFT JOIN dbo.CatMunicipios m ON m.CveMunicipios = s.CveMunicipio
            WHERE ${whereBaseSQL}
            ORDER BY a.Fecha DESC, a.CveAtencion DESC
        `;

        const requestLista = pool.request();
        bindInputs(requestLista);

        const resultLista = await requestLista.query(queryLista);
        console.log(">>> REGISTROS LISTA:", resultLista.recordset.length);

        const citas = resultLista.recordset.map((row) => ({
            id: row.id,
            folio: String(row.Folio || row.id || ""),
            fecha: row.fecha || "",
            hora: row.hora || "",
            nombre: row.nombre || "",
            curp: row.curp || "",
            tipo: row.tipo || "Sin tipo",
            municipio: row.municipio || "Sin municipio",
            consejero: "",
            estado: row.estado || "Sin estatus",
            cveSolicitante: row.CveSolicitante,
            cveEstatusCita: row.CveEstatusCita,
            cveTipoCita: row.CveTipoCita
        }));

        // =============================================
        // CONTEOS (sin filtro extra de estatus)
        // =============================================
        const queryConteos = `
            SELECT
                a.CveEstatusCita AS Status,
                COUNT(DISTINCT a.CveAtencion) AS Total
            FROM dbo.AtencionSolicitante a
            LEFT JOIN dbo.Solicitante s ON s.CveSolicitante = a.CveSolicitante
            LEFT JOIN dbo.CatTipoCita tc ON tc.CveTipoCita = a.CveTipoCita
            LEFT JOIN dbo.CatMunicipios m ON m.CveMunicipios = s.CveMunicipio
            WHERE ${whereBaseSQL}
            GROUP BY a.CveEstatusCita
        `;

        const requestConteos = pool.request();
        bindInputs(requestConteos);

        const resultConteos = await requestConteos.query(queryConteos);
        console.log(">>> RAW CONTEOS:", resultConteos.recordset);

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
            conteos.total += total;

            switch (row.Status) {
                case 1:
                case 4:
                    conteos.enEspera += total;
                    break;
                case 2:
                    conteos.atendidas = total;
                    break;
                case 3:
                case 6:
                    conteos.canceladas += total;
                    conteos.noContesto += total;
                    break;
                case 5:
                    conteos.noSePresento = total;
                    break;
                default:
                    break;
            }
        });

        console.log(">>> CONTEOS FINALES:", conteos);

        const municipios = ["Todos", ...new Set(citas.map(c => c.municipio).filter(Boolean))];
        const tipos = ["Todos", ...new Set(citas.map(c => c.tipo).filter(Boolean))];

        res.json({
            success: true,
            data: { citas, conteos, municipios, tipos }
        });

    } catch (error) {
        console.error("ERROR AL OBTENER CITAS:", error);
        res.status(500).json({
            success: false,
            message: "Error al consultar las citas.",
            error: error.message
        });
    }
};

module.exports = { obtenerCitas };