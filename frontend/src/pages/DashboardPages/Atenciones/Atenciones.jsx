import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ClipboardList,
  Users,
  MapPin,
  Eye,
  UserRound,
  FileText,
  XCircle,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import CommonModule from "../../../components/common/CommonModule";
import EstadoBadge from "../../../components/common/EstadoBadge";
import ListaMunicipios from "../../../components/common/ListaMunicipios";

import api from "../../../services/api";
import "./Atenciones.css";

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

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return "-";
  const partes = String(fechaStr).split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaStr;
};

export default function Atenciones() {
  // =================================================
  // ESTADOS
  // =================================================
  const [atenciones, setAtenciones] = useState([]);
  const [conteos, setConteos] = useState({
    total: 0,
    atendidas: 0,
    enEspera: 0,
    noSePresento: 0,
    noContesto: 0,
    canceladas: 0,
  });
  const [atencionSeleccionada, setAtencionSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();
  const statePeriodo = location.state?.periodo;
  const stateInicio = location.state?.inicio;
  const stateFin = location.state?.fin;

  // Fechas
  const [fechaInicial, setFechaInicial] = useState(() => {
    if (statePeriodo === "todos") return "";
    if (statePeriodo === "personalizado" && stateInicio) return stateInicio;
    return obtenerPrimerDiaMes();
  });
  const [fechaFinal, setFechaFinal] = useState(() => {
    if (statePeriodo === "todos") return "";
    if (statePeriodo === "personalizado" && stateFin) return stateFin;
    return obtenerUltimoDiaMes();
  });
  const [periodo, setPeriodo] = useState(() => statePeriodo || "mensual");

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroMunicipio, setFiltroMunicipio] = useState("Todos");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const REGISTROS_POR_PAGINA = 10;

  // Opciones
  const [municipiosOptions, setMunicipiosOptions] = useState(["Todos"]);
  const [tiposOptions, setTiposOptions] = useState(["Todos"]);

  // =================================================
  // TIPOS DE ATENCIÓN
  // =================================================
  const tiposAtencionDisponibles = [
    "Todos",
    "BOLSA DE TRABAJO",
    "DÍA POR EL EMPLEO",
    "FERIAS DE EMPLEO",
    "ATENCIÓN CIUDADANA",
    "ABRIENDO ESPACIOS",
    "PERFILAMIENTO COLABORATIVO (PPC)",
    "JÓVENES CONSTRUYENDO EL FUTURO",
    "CALL CENTER",
  ];

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
  // CARGAR ATENCIONES
  // =================================================
  const cargarAtenciones = async () => {
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
      if (filtroTipo && filtroTipo !== "Todos") params.append("tipo", filtroTipo);
      if (filtroMunicipio && filtroMunicipio !== "Todos") params.append("municipio", filtroMunicipio);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());

      const url = `/atenciones?${params.toString()}`;
      const response = await api.get(url);

      const data = response.data?.data || {};

      setAtenciones(Array.isArray(data.atenciones) ? data.atenciones : []);
      setConteos(data.conteos || {
        total: 0,
        atendidas: 0,
        enEspera: 0,
        noSePresento: 0,
        noContesto: 0,
        canceladas: 0,
      });
      setMunicipiosOptions(data.municipios || ["Todos"]);
      setTiposOptions(data.tipos || ["Todos"]);

      setPaginaActual(1);
    } catch (err) {
      console.error("Error al cargar atenciones:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        err.message ||
        "No fue posible conectar con el servidor."
      );
      setAtenciones([]);
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // CARGAR AL ENTRAR Y CUANDO CAMBIAN FILTROS
  // =================================================
  useEffect(() => {
    cargarAtenciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicial, fechaFinal, filtroTipo, filtroMunicipio, busqueda]);

  // =================================================
  // LIMPIAR FILTROS
  // =================================================
  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("Todos");
    setFiltroMunicipio("Todos");
    setPeriodo("mensual");
    setFechaInicial(obtenerPrimerDiaMes());
    setFechaFinal(obtenerUltimoDiaMes());
    setPaginaActual(1);
  };

  // =================================================
  // KPIs (4 tarjetas por estatus)
  // =================================================
  const indicadores = [
    {
      id: "atendidas",
      titulo: "Atendidas",
      valor: conteos.atendidas,
      descripcion: "Atenciones completadas",
      icono: CheckCircle2,
      color: "green",
    },
    {
      id: "en-espera",
      titulo: "En Espera",
      valor: conteos.enEspera,
      descripcion: "Pendientes de atención",
      icono: Clock3,
      color: "orange",
    },
    {
      id: "no-se-presento",
      titulo: "No se presentó",
      valor: conteos.noSePresento,
      descripcion: "Sin asistencia",
      icono: XCircle,
      color: "cyan",
    },
    {
      id: "no-contesto",
      titulo: "No contestó",
      valor: conteos.noContesto,
      descripcion: "Llamada no atendida",
      icono: AlertCircle,
      color: "purple",
    },
  ];

  // =================================================
  // MUNICIPIOS Y TIPOS (para gráficos)
  // =================================================
  const municipios = useMemo(() => {
    const contador = {};
    atenciones.forEach((a) => {
      const mun = a.municipio || "Sin municipio";
      contador[mun] = (contador[mun] || 0) + 1;
    });
    return Object.entries(contador)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [atenciones]);

  const tiposAtencion = useMemo(() => {
    const contador = {};
    atenciones.forEach((a) => {
      const tipo = a.tipo || "Sin tipo";
      contador[tipo] = (contador[tipo] || 0) + 1;
    });
    return Object.entries(contador)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [atenciones]);

  // =================================================
  // COLUMNAS
  // =================================================
  const columnas = [
    { key: "fecha", label: "Fecha" },
    { key: "buscador", label: "Buscador" },
    { key: "tipo", label: "Tipo" },
    { key: "municipio", label: "Municipio" },
    { key: "estado", label: "Estado" },
    { key: "accion", label: "Acción" },
  ];

  const renderCelda = (atencion, claveColumna) => {
    switch (claveColumna) {
      case "fecha":
        return (
          <div className="celda-principal">
            <strong>{formatearFecha(atencion.fecha)}</strong>
            <small>{atencion.hora || "-"}</small>
          </div>
        );

      case "buscador":
        return (
          <div className="celda-avatar">
            <div className="celda-avatar-icono blue">
              <UserRound size={15} />
            </div>
            <div className="celda-principal">
              <strong>{atencion.nombre || "-"}</strong>
              <small>{atencion.curp || "-"}</small>
            </div>
          </div>
        );

      case "tipo":
        return (
          <div className="celda-icono">
            <FileText size={15} />
            {atencion.tipo || "-"}
          </div>
        );

      case "municipio":
        return (
          <div className="celda-icono">
            <MapPin size={15} />
            {atencion.municipio || "-"}
          </div>
        );

      case "estado":
        return <EstadoBadge estado={atencion.estado || "Atendida"} />;

      case "accion":
        return (
          <button
            type="button"
            className="btn-ver"
            onClick={() => setAtencionSeleccionada(atencion)}
            title="Ver detalle"
          >
            <Eye size={14} />
            Ver
          </button>
        );

      default:
        return "-";
    }
  };

  // =================================================
  // EXPORTAR
  // =================================================
  const exportarDatos = () => {
    if (!atenciones.length) return;

    const encabezados = [
      "Folio", "Fecha", "Hora", "Nombre", "CURP",
      "Tipo", "Municipio", "Estado"
    ];

    const filas = atenciones.map((a) =>
      [
        a.folio, a.fecha, a.hora, a.nombre, a.curp,
        a.tipo, a.municipio, a.estado
      ]
        .map((valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`)
        .join(",")
    );

    const csv = [encabezados.join(","), ...filas].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "atenciones.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  };

  // =================================================
  // RENDER
  // =================================================
  return (
    <>
      <CommonModule
        titulo="Atenciones"
        descripcion="Consulta la actividad y seguimiento de las atenciones realizadas a personas buscadoras de empleo."
        icono={ClipboardList}

        datos={atenciones}
        cargando={loading}
        error={error}
        onRecargar={cargarAtenciones}
        onExportar={exportarDatos}

        indicadores={indicadores}

        columnas={columnas}
        renderCelda={renderCelda}
        filaKey={(atencion) => atencion.id}
        mensajeVacio="No se encontraron atenciones."

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
          cargarAtenciones();
        }}

        busqueda={busqueda}
        onBusqueda={setBusqueda}
        filtrosPersonalizados={
          <>
            <div>
              <label>Tipo de atención</label>
              <select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {tiposOptions.length > 1
                  ? tiposOptions.map((opcion) => (
                      <option key={opcion} value={opcion}>{opcion}</option>
                    ))
                  : tiposAtencionDisponibles.map((opcion) => (
                      <option key={opcion} value={opcion}>{opcion}</option>
                    ))
                }
              </select>
            </div>

            <div>
              <label>Municipio</label>
              <select
                value={filtroMunicipio}
                onChange={(e) => {
                  setFiltroMunicipio(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {municipiosOptions.map((mun) => (
                  <option key={mun} value={mun}>{mun}</option>
                ))}
              </select>
            </div>
          </>
        }
        onLimpiarFiltros={limpiarFiltros}
        onAplicarFiltros={() => {
          setPaginaActual(1);
          cargarAtenciones();
        }}

        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        registrosPorPagina={REGISTROS_POR_PAGINA}

        seccionesExtra={
          <div className="segunda-seccion">
            <ListaMunicipios
              datos={municipios.map(([nombre, cantidad]) => ({
                municipio: nombre,
                cantidad: cantidad,
              }))}
              titulo="Atenciones por municipio"
              descripcion="Distribución de personas atendidas"
              maximo={Math.max(
                ...municipios.map(([, cantidad]) => Number(cantidad || 0)),
                1
              )}
            />

            <ListaMunicipios
              datos={tiposAtencion.map(([tipo, cantidad]) => ({
                municipio: tipo,
                cantidad: cantidad,
              }))}
              titulo="Tipos de atención"
              descripcion="Distribución de atenciones por tipo."
              maximo={Math.max(
                ...tiposAtencion.map(([, cantidad]) => Number(cantidad || 0)),
                1
              )}
            />
          </div>
        }
      />

      {/* MODAL */}
      {atencionSeleccionada && (
        <div
          className="atenciones-modal-overlay"
          onClick={() => setAtencionSeleccionada(null)}
        >
          <div
            className="atenciones-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="atenciones-modal-header">
              <div className="atenciones-modal-header-info">
                <div className="atenciones-modal-icon">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h2>Detalle de atención</h2>
                  <p>Folio #{atencionSeleccionada.folio || "-"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAtencionSeleccionada(null)}
                className="atenciones-modal-close"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="atenciones-modal-grid">
              <div>
                <p>Buscador</p>
                <strong>{atencionSeleccionada.nombre || "-"}</strong>
              </div>
              <div>
                <p>CURP</p>
                <strong>{atencionSeleccionada.curp || "-"}</strong>
              </div>
              <div>
                <p>Fecha</p>
                <strong>{formatearFecha(atencionSeleccionada.fecha)}</strong>
              </div>
              <div>
                <p>Hora</p>
                <strong>{atencionSeleccionada.hora || "-"}</strong>
              </div>
              <div>
                <p>Tipo</p>
                <strong>{atencionSeleccionada.tipo || "-"}</strong>
              </div>
              <div>
                <p>Municipio</p>
                <strong>{atencionSeleccionada.municipio || "-"}</strong>
              </div>
              <div>
                <p>Estado</p>
                <EstadoBadge estado={atencionSeleccionada.estado || "Atendida"} />
              </div>
            </div>

            <div className="atenciones-modal-footer">
              <button
                type="button"
                onClick={() => setAtencionSeleccionada(null)}
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

