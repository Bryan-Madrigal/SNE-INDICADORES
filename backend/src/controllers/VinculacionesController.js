const { sql, poolPromise } = require("../db/dbConnect");

// =========================================================
// OBTENER VINCULACIONES CON FILTROS
// =========================================================
const obtenerVinculaciones = async (req, res) => {
    try {
        const {
            periodo,
            fechaInicio,
            fechaFin,
            inicio,
            fin,
            empresa,
            municipio,
            puesto,
            consejero,
            busqueda
        } = req.query;

        const pool = await poolPromise;
        if (!pool) {
            return res.status(500).json({
                mensaje: "No se pudo establecer conexión con SQL Server"
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
        // CONSTRUIR FILTROS BASE (sin status ni estado)
        // =============================================
        const whereBase = [];
        const params = {};

        if (dateInicio) {
            whereBase.push("es.FechaEnvio >= @fechaInicio");
        }
        if (dateFin) {
            whereBase.push("es.FechaEnvio <= @fechaFin");
        }
        if (empresa && empresa !== "Todos") {
            whereBase.push("ce.Nombre = @empresa");
            params.empresa = empresa;
        }
        if (municipio && municipio !== "Todos") {
            whereBase.push("m.Nombre = @municipio");
            params.municipio = municipio;
        }
        if (puesto && puesto !== "Todos") {
            whereBase.push("v.PuestoOfrecido = @puesto");
            params.puesto = puesto;
        }
        if (consejero && consejero !== "Todos") {
            whereBase.push("es.CveConsejeroEnvio = @consejero");
            params.consejero = consejero;
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

        // Filtro fijo Chiapas (comentado para ver todos los registros como en el Dashboard)
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
        // CONSULTA DE LA LISTA (todos los estatus)
        // =============================================
        const queryLista = `
            SELECT
                es.CveEnvio AS id,
                es.CveSolicitante,
                es.CveVacante,
                es.FechaEnvio AS fecha,
                es.Status AS cveEstadoVinculacion,
                es.CveConsejeroEnvio,

                s.Folio AS folioSolicitante,
                LTRIM(RTRIM(
                    ISNULL(s.Nombre,'') + ' ' +
                    ISNULL(s.Paterno,'') + ' ' +
                    ISNULL(s.Materno,'')
                )) AS nombre,
                s.Curp AS curp,

                v.PuestoOfrecido AS puesto,
                ce.Nombre AS empresa,
                m.Nombre AS municipio,

                COALESCE(cc.Nombre, es.CveConsejeroEnvio, 'Sin consejero') AS consejero,

                ec.Descripcion AS estado,
                ec.Descripcion AS resultado

            FROM dbo.EnvioSeguimiento es
            LEFT JOIN dbo.Solicitante s
                ON s.CveSolicitante = es.CveSolicitante
            LEFT JOIN dbo.Vacantes v
                ON v.CveVacante = es.CveVacante
            LEFT JOIN dbo.CatEmpresa ce
                ON ce.CveEmpresa = v.CveEmpresa
            LEFT JOIN dbo.CatMunicipios m
                ON m.CveMunicipios = v.CveMunicipio
            LEFT JOIN dbo.CatConsejero cc
                ON cc.CveConsejero = TRY_CAST(es.CveConsejeroEnvio AS INT)
            LEFT JOIN dbo.CatEstatusCita ec
                ON ec.CveEstatusCita = es.Status
            WHERE ${whereBaseSQL}
            ORDER BY es.FechaEnvio DESC, es.CveEnvio DESC
        `;

        const requestLista = pool.request();
        bindInputs(requestLista);

        const resultLista = await requestLista.query(queryLista);

        const vinculaciones = resultLista.recordset.map((row) => ({
            id: row.id,
            folio: String(row.folioSolicitante || row.id || ""),
            fecha: row.fecha || null,
            nombre: row.nombre || "",
            curp: row.curp || "",
            empresa: row.empresa || "",
            puesto: row.puesto || "",
            municipio: row.municipio || "",
            consejero: row.consejero || "",
            estado: row.estado || "Atendida",
            resultado: row.resultado || "Atendida",
            cveSolicitante: row.CveSolicitante,
            cveVacante: row.CveVacante,
            cveEstatusCita: row.cveEstadoVinculacion
        }));

        // =============================================
        // CONTEOS POR ESTATUS
        // =============================================
        const queryConteos = `
            SELECT
                es.Status,
                COUNT(*) AS Total
            FROM dbo.EnvioSeguimiento es
            LEFT JOIN dbo.Solicitante s
                ON s.CveSolicitante = es.CveSolicitante
            LEFT JOIN dbo.Vacantes v
                ON v.CveVacante = es.CveVacante
            LEFT JOIN dbo.CatEmpresa ce
                ON ce.CveEmpresa = v.CveEmpresa
            LEFT JOIN dbo.CatMunicipios m
                ON m.CveMunicipios = v.CveMunicipio
            WHERE ${whereBaseSQL}
            GROUP BY es.Status
        `;

        const requestConteos = pool.request();
        bindInputs(requestConteos);

        const resultConteos = await requestConteos.query(queryConteos);

        const conteos = {
            total: 0,
            atendidas: 0,
            canceladas: 0,
            enEspera: 0,
            noSePresento: 0
        };

        resultConteos.recordset.forEach((row) => {
            const total = Number(row.Total) || 0;
            conteos.total += total;
            if (row.Status === 2) conteos.atendidas = total;
            if (row.Status === 3) conteos.canceladas = total;
            if (row.Status === 4) conteos.enEspera = total;
            if (row.Status === 5) conteos.noSePresento = total;
        });

        // =============================================
        // OPCIONES PARA FILTROS
        // =============================================
        const empresas = ["Todos", ...new Set(vinculaciones.map(v => v.empresa).filter(Boolean))];
        const municipios = ["Todos", ...new Set(vinculaciones.map(v => v.municipio).filter(Boolean))];
        const puestos = ["Todos", ...new Set(vinculaciones.map(v => v.puesto).filter(Boolean))];
        const consejeros = ["Todos", ...new Set(vinculaciones.map(v => v.consejero).filter(Boolean))];

        // =============================================
        // RESPUESTA
        // =============================================
        res.status(200).json({
            success: true,
            data: {
                vinculaciones,
                conteos,
                empresas,
                municipios,
                puestos,
                consejeros
            }
        });

    } catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({
            mensaje: "Error al obtener las vinculaciones",
            error: error.message
        });
    }
};

// =========================================================
// OBTENER UNA VINCULACIÓN POR ID
// =========================================================
const obtenerVinculacionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        if (!pool) {
            return res.status(500).json({
                mensaje: "No se pudo establecer conexión con SQL Server"
            });
        }

        const result = await pool.request()
            .input("id", id)
            .query(`
                SELECT
                    es.CveEnvio AS id,
                    es.CveSolicitante,
                    es.CveVacante,
                    es.FechaEnvio AS fecha,
                    es.Status AS cveEstadoVinculacion,
                    es.CveConsejeroEnvio,
                    s.Folio AS folioSolicitante,
                    LTRIM(RTRIM(
                        ISNULL(s.Nombre,'') + ' ' +
                        ISNULL(s.Paterno,'') + ' ' +
                        ISNULL(s.Materno,'')
                    )) AS nombre,
                    s.Curp AS curp,
                    v.PuestoOfrecido AS puesto,
                    ce.Nombre AS empresa,
                    m.Nombre AS municipio,
                    COALESCE(cc.Nombre, es.CveConsejeroEnvio, 'Sin consejero') AS consejero,
                    ec.Descripcion AS estado,
                    ec.Descripcion AS resultado
                FROM dbo.EnvioSeguimiento es
                LEFT JOIN dbo.Solicitante s
                    ON s.CveSolicitante = es.CveSolicitante
                LEFT JOIN dbo.Vacantes v
                    ON v.CveVacante = es.CveVacante
                LEFT JOIN dbo.CatEmpresa ce
                    ON ce.CveEmpresa = v.CveEmpresa
                LEFT JOIN dbo.CatMunicipios m
                    ON m.CveMunicipios = v.CveMunicipio
                LEFT JOIN dbo.CatConsejero cc
                    ON cc.CveConsejero = TRY_CAST(es.CveConsejeroEnvio AS INT)
                LEFT JOIN dbo.CatEstatusCita ec
                    ON ec.CveEstatusCita = es.Status
                WHERE es.CveEnvio = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: "Vinculación no encontrada" });
        }

        const row = result.recordset[0];
        res.status(200).json({
            success: true,
            data: {
                id: row.id,
                folio: String(row.folioSolicitante || row.id || ""),
                fecha: row.fecha || null,
                nombre: row.nombre || "",
                curp: row.curp || "",
                empresa: row.empresa || "",
                puesto: row.puesto || "",
                municipio: row.municipio || "",
                consejero: row.consejero || "",
                estado: row.estado || "Atendida",
                resultado: row.resultado || "Atendida",
                cveSolicitante: row.CveSolicitante,
                cveVacante: row.CveVacante,
                cveEstatusCita: row.cveEstadoVinculacion
            }
        });

    } catch (error) {
        console.error("❌ Error al obtener vinculación:", error);
        res.status(500).json({
            mensaje: "Error al obtener la vinculación",
            error: error.message
        });
    }
};

module.exports = {
    obtenerVinculaciones,
    obtenerVinculacionPorId
};