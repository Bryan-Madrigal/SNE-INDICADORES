import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Star,
  BadgeCheck,
  XCircle,
} from "lucide-react";

// =====================================================
// COMPONENTES COMUNES
// =====================================================
import CommonModule from "../../../components/common/CommonModule";
import RankingList from "../../../components/common/RankingList";
import ResumenResultados from "../../../components/common/ResumenResultados";

// =====================================================
// COMPONENTE LOCAL
// =====================================================
import CompanyList from "./CompanyList";

// =====================================================
// API
// =====================================================
import api from "../../../services/api";

import "./EmpresasAtendidas.css";

// =====================================================
// HELPERS DE FECHA
// =====================================================
const obtenerPrimerDiaMes = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
};

const obtenerUltimoDiaMes = () => {
  const hoy = new Date();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return fecha;
  return fechaObj.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function EmpresasAtendidas() {
  // =================================================
  // ESTADOS
  // =================================================
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Modal
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

  // Fechas (mes actual por defecto)
  const [fechaInicial, setFechaInicial] = useState(obtenerPrimerDiaMes());
  const [fechaFinal, setFechaFinal] = useState(obtenerUltimoDiaMes());
  const [periodo, setPeriodo] = useState("mensual");

  // Filtros
  const [filtroMunicipio, setFiltroMunicipio] = useState("Todos");
  const [filtroSector, setFiltroSector] = useState("Todos");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const REGISTROS_POR_PAGINA = 10;

  // =================================================
  // ACTUALIZAR FECHAS SEGÚN PERÍODO
  // =================================================
  const actualizarFechasPorPeriodo = (nuevoPeriodo) => {
    if (nuevoPeriodo === "todos") {
      setFechaInicial("");
      setFechaFinal("");
      setPeriodo(nuevoPeriodo);
      return;
    }

    const hoy = new Date();
    let inicio, fin;

    switch (nuevoPeriodo) {
      case "diario":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        break;
      case "semanal":
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 6);
        fin = new Date(hoy);
        break;
      case "mensual":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
      case "anual":
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = new Date(hoy.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    if (inicio && fin) {
      setFechaInicial(inicio.toISOString().split("T")[0]);
      setFechaFinal(fin.toISOString().split("T")[0]);
    }
    setPeriodo(nuevoPeriodo);
  };

  // =================================================
  // CARGAR EMPRESAS
  // =================================================
  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No existe un token de sesión. Inicia sesión nuevamente.");
      }

      const params = new URLSearchParams();
      if (fechaInicial) params.append("fechaInicio", fechaInicial);
      if (fechaFinal) params.append("fechaFin", fechaFinal);
      if (filtroMunicipio && filtroMunicipio !== "Todos") params.append("municipio", filtroMunicipio);
      if (filtroSector && filtroSector !== "Todos") params.append("sector", filtroSector);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());

      const url = `/empresas?${params.toString()}`;
      const response = await api.get(url);

      let datos = [];
      if (Array.isArray(response.data)) {
        datos = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        if (response.data.success === false) {
          throw new Error(response.data.message || "El servidor indicó un error.");
        }
        datos = response.data.data;
      } else {
        throw new Error("El servidor no devolvió una lista de empresas.");
      }

      const empresasAdaptadas = datos.map((empresa) => ({
        id: empresa.id ?? empresa.CveEmpresa,
        nombre: empresa.nombre ?? empresa.NombreEmpresa ?? "Sin nombre",
        municipio: empresa.municipio ?? "Sin municipio",
        sector: empresa.sector ?? "Sin sector",
        contacto: empresa.contacto ?? "Sin contacto",
        telefono: empresa.telefono ?? "",
        correo: empresa.correo ?? "",
        fechaRegistro: empresa.fechaRegistro || "",
        vacantes: Number(empresa.vacantes ?? empresa.CuentaOfertas ?? 0),
        vacantesActivas: Number(empresa.vacantesActivas ?? empresa.CuentaOfertasActivas ?? 0),
        vacantesInactivas: Number(empresa.vacantesInactivas ?? empresa.CuentaOfertasInactivas ?? 0),
        vinculaciones: Number(empresa.vinculaciones ?? empresa.CuentaOfertasPostulaciones ?? 0),
        rechazos: Number(empresa.rechazos ?? empresa.CuentaOfertasRechazos ?? 0),
        colocaciones: Number(empresa.colocaciones ?? empresa.CuentaOfertasColocados ?? 0),
        estado: empresa.estado || "Activa",
      }));

      setEmpresas(empresasAdaptadas);
      setPaginaActual(1);
    } catch (err) {
      console.error("Error al cargar empresas:", err);
      setError(
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        err.message ||
        "No fue posible conectar con el servidor."
      );
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // CARGAR AL ENTRAR Y CUANDO CAMBIAN FILTROS
  // =================================================
  useEffect(() => {
    cargarEmpresas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicial, fechaFinal, filtroMunicipio, filtroSector, busqueda]);

  // =================================================
  // LIMPIAR FILTROS
  // =================================================
  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroMunicipio("Todos");
    setFiltroSector("Todos");
    setPeriodo("mensual");
    setFechaInicial(obtenerPrimerDiaMes());
    setFechaFinal(obtenerUltimoDiaMes());
    setPaginaActual(1);
  };

  // =================================================
  // OPCIONES DE FILTROS
  // =================================================
  const municipiosDisponibles = useMemo(() => {
    const munis = empresas.map((e) => e.municipio).filter(Boolean);
    return ["Todos", ...Array.from(new Set(munis)).sort((a, b) => a.localeCompare(b, "es"))];
  }, [empresas]);

  const sectoresDisponibles = useMemo(() => {
    const sect = empresas.map((e) => e.sector).filter(Boolean);
    return ["Todos", ...Array.from(new Set(sect)).sort((a, b) => a.localeCompare(b, "es"))];
  }, [empresas]);

  // =================================================
  // KPIs
  // =================================================
  const totalEmpresas = empresas.length;
  const empresasConVacantes = empresas.filter((e) => Number(e.vacantes || 0) > 0).length;
  const empresasConVinculaciones = empresas.filter((e) => Number(e.vinculaciones || 0) > 0).length;
  const empresasConColocaciones = empresas.filter((e) => Number(e.colocaciones || 0) > 0).length;

  const indicadores = [
    {
      id: "empresas-atendidas",
      titulo: "Empresas Atendidas",
      valor: totalEmpresas,
      descripcion: "Total durante el periodo",
      icono: Building2,
      color: "blue",
    },
    {
      id: "vacantes-activas",
      titulo: "Con Vacantes Activas",
      valor: empresasConVacantes,
      descripcion: "Solicitando personal",
      icono: Plus,
      color: "orange",
    },
    {
      id: "vinculaciones",
      titulo: "Con Vinculaciones",
      valor: empresasConVinculaciones,
      descripcion: "Procesos activos",
      icono: Star,
      color: "purple",
    },
    {
      id: "colocaciones",
      titulo: "Con Colocaciones",
      valor: empresasConColocaciones,
      descripcion: "Empresas que contrataron",
      icono: BadgeCheck,
      color: "green",
    },
  ];

  // =================================================
  // RESULTADOS
  // =================================================
  const totalVacantes = empresas.reduce((s, e) => s + Number(e.vacantes || 0), 0);
  const totalVinculaciones = empresas.reduce((s, e) => s + Number(e.vinculaciones || 0), 0);
  const totalColocaciones = empresas.reduce((s, e) => s + Number(e.colocaciones || 0), 0);
  const tasaColocacion = totalVinculaciones > 0 ? (totalColocaciones / totalVinculaciones) * 100 : 0;

  const resultados = {
    vacantes: totalVacantes,
    vinculaciones: totalVinculaciones,
    colocaciones: totalColocaciones,
    tasaColocacion: `${tasaColocacion.toFixed(1)}%`,
    descripcionVacantes: "Vacantes registradas",
    descripcionVinculaciones: "Personas vinculadas a empresas",
    descripcionColocaciones: "Contrataciones concretadas",
    descripcionTasa: "Tasa de colocación",
  };

  // =================================================
  // RENDER
  // =================================================
  return (
    <>
      <CommonModule
        // CABECERA
        titulo="Empresas atendidas"
        descripcion="Consulta la actividad, seguimiento y resultados obtenidos con las empresas atendidas."
        icono={Building2}

        // DATOS
        datos={empresas}
        cargando={loading}
        error={error}
        onRecargar={cargarEmpresas}

        // KPIs
        indicadores={indicadores}

        // TABLA PERSONALIZADA (CompanyList)
        tablaPersonalizada={
          <CompanyList
            empresas={empresas.slice(
              (paginaActual - 1) * REGISTROS_POR_PAGINA,
              paginaActual * REGISTROS_POR_PAGINA
            )}
            onVerEmpresa={(empresa) => setEmpresaSeleccionada(empresa)}
          />
        }

        // FECHAS
        fechaInicial={fechaInicial}
        setFechaInicial={(v) => {
          setFechaInicial(v);
          setPeriodo("personalizado");
        }}
        fechaFinal={fechaFinal}
        setFechaFinal={(v) => {
          setFechaFinal(v);
          setPeriodo("personalizado");
        }}
        periodo={periodo}
        setPeriodo={(v) => {
          if (v === "personalizado") {
            setPeriodo(v);
          } else {
            actualizarFechasPorPeriodo(v);
          }
        }}
        onConsultarFechas={() => {
          setPaginaActual(1);
          cargarEmpresas();
        }}

        // BÚSQUEDA Y FILTROS
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        filtrosPersonalizados={
          <>
            <div>
              <label>Municipio</label>
              <select
                value={filtroMunicipio}
                onChange={(e) => {
                  setFiltroMunicipio(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {municipiosDisponibles.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Sector</label>
              <select
                value={filtroSector}
                onChange={(e) => {
                  setFiltroSector(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {sectoresDisponibles.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </>
        }
        onLimpiarFiltros={limpiarFiltros}
        onAplicarFiltros={() => {
          setPaginaActual(1);
          cargarEmpresas();
        }}

        // PAGINACIÓN
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        registrosPorPagina={REGISTROS_POR_PAGINA}

        // SECCIONES EXTRA
        seccionesExtra={
          <>
            {/* Ranking de empresas */}
            <div style={{ marginBottom: 20 }}>
              <RankingList
                empresas={empresas}
                titulo="Empresas con mayor actividad"
                descripcion="Según colocaciones registradas"
                limite={5}
                maximo={Math.max(...empresas.map((e) => Number(e.colocaciones || 0)), 1)}
              />
            </div>

            {/* Resumen de resultados */}
            <ResumenResultados
              resultados={resultados}
              titulo="Resultados de las empresas atendidas"
              descripcion="Resumen general de la actividad generada por las empresas."
            />
          </>
        }
      />

      {/* =================================================
          MODAL DE DETALLE DE EMPRESA
      ================================================= */}
      {empresaSeleccionada && (
        <div
          className="empresas-modal-overlay"
          onClick={() => setEmpresaSeleccionada(null)}
        >
          <div
            className="empresas-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="empresas-modal-header">
              <div className="empresas-modal-header-info">
                <div className="empresas-modal-icon">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2>Detalle de empresa</h2>
                  <p>Folio #{empresaSeleccionada.id || "-"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmpresaSeleccionada(null)}
                className="empresas-modal-close"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* BODY */}
            <div className="empresas-modal-grid">
              <div>
                <p>Nombre</p>
                <strong>{empresaSeleccionada.nombre || "-"}</strong>
              </div>

              <div>
                <p>Estado</p>
                <span className="badge-estatus">
                  {empresaSeleccionada.estado || "Activa"}
                </span>
              </div>

              <div>
                <p>Municipio</p>
                <strong>{empresaSeleccionada.municipio || "-"}</strong>
              </div>

              <div>
                <p>Sector</p>
                <strong>{empresaSeleccionada.sector || "-"}</strong>
              </div>

              <div>
                <p>Contacto</p>
                <strong>{empresaSeleccionada.contacto || "-"}</strong>
              </div>

              <div>
                <p>Fecha de registro</p>
                <strong>{formatearFecha(empresaSeleccionada.fechaRegistro)}</strong>
              </div>

              <div>
                <p>Vacantes</p>
                <strong className="numero-blue">
                  {Number(empresaSeleccionada.vacantes || 0).toLocaleString("es-MX")}
                </strong>
              </div>

              <div>
                <p>Vacantes activas</p>
                <strong className="numero-blue">
                  {Number(empresaSeleccionada.vacantesActivas || 0).toLocaleString("es-MX")}
                </strong>
              </div>

              <div>
                <p>Vinculaciones</p>
                <strong className="numero-purple">
                  {Number(empresaSeleccionada.vinculaciones || 0).toLocaleString("es-MX")}
                </strong>
              </div>

              <div>
                <p>Colocaciones</p>
                <strong className="numero-green">
                  {Number(empresaSeleccionada.colocaciones || 0).toLocaleString("es-MX")}
                </strong>
              </div>

              <div>
                <p>Rechazos</p>
                <strong className="numero-orange">
                  {Number(empresaSeleccionada.rechazos || 0).toLocaleString("es-MX")}
                </strong>
              </div>

              <div>
                <p>Vacantes inactivas</p>
                <strong>
                  {Number(empresaSeleccionada.vacantesInactivas || 0).toLocaleString("es-MX")}
                </strong>
              </div>
            </div>

            {/* FOOTER */}
            <div className="empresas-modal-footer">
              <button
                type="button"
                onClick={() => setEmpresaSeleccionada(null)}
                className="btn-modal-cerrar"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}