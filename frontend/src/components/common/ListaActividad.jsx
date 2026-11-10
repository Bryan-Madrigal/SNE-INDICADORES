import React from "react";

import {
  Users,
  BriefcaseBusiness,
  CheckCircle2,
  Activity,
} from "lucide-react";


// =====================================================
// CONFIGURACIÓN DE ICONOS
// =====================================================

const ICONOS_ACTIVIDAD = {

  vacante: {
    icono: BriefcaseBusiness,
    clase:
      "actividad-icono actividad-icono--vacante",
  },

  vinculacion: {
    icono: Users,
    clase:
      "actividad-icono actividad-icono--vinculacion",
  },

  colocacion: {
    icono: CheckCircle2,
    clase:
      "actividad-icono actividad-icono--colocacion",
  },

  atencion: {
    icono: Activity,
    clase:
      "actividad-icono actividad-icono--atencion",
  },

};


// =====================================================
// ICONO DE ACTIVIDAD
// =====================================================

function IconoActividad({
  tipo,
}) {

  const configuracion =
    ICONOS_ACTIVIDAD[tipo];

  // Si no existe el tipo,
  // utilizamos Activity como icono general.

  if (!configuracion) {

    return (
      <div className="actividad-icono actividad-icono--atencion">

        <Activity
          size={18}
        />

      </div>
    );

  }


  const Icon =
    configuracion.icono;


  return (

    <div
      className={
        configuracion.clase
      }
    >

      <Icon
        size={18}
      />

    </div>

  );

}


// =====================================================
// LISTA DE ACTIVIDADES
// =====================================================

export default function ListaActividad({

  actividades = [],

  titulo = "Actividad reciente",

  descripcion =
    "Últimos movimientos registrados",

  mostrarHistorial = true,

  onVerHistorial,

}) {


  return (

    <div className="card-actividad">


      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <div className="card-actividad-header">


        <div className="card-actividad-icono">

          <Activity
            size={20}
          />

        </div>


        <div>

          <h2 className="card-actividad-titulo">
            {titulo}
          </h2>


          <p className="card-actividad-sub">
            {descripcion}
          </p>

        </div>


        {mostrarHistorial && (

          <button
            type="button"
            className="link-ver-historial"
            onClick={
              onVerHistorial
            }
          >

            Ver historial

          </button>

        )}

      </div>


      {/* =================================================
          LISTA
      ================================================= */}

      <div className="actividad-lista">


        {actividades.length === 0 ? (

          <div className="actividad-vacia">

            No hay actividad registrada.

          </div>

        ) : (

          actividades.map(
            (actividad, index) => (

              <div
                key={
                  actividad.id ??
                  `${actividad.tipo}-${index}`
                }
                className="actividad-item"
              >


                {/* ======================================
                    ICONO
                ====================================== */}

                <IconoActividad
                  tipo={
                    actividad.tipo
                  }
                />


                {/* ======================================
                    CONTENIDO
                ====================================== */}

                <div className="actividad-item-contenido">


                  <div className="actividad-item-row">


                    <div>

                      <p className="actividad-item-accion">

                        {actividad.accion ??
                          actividad.titulo ??
                          "Actividad"}

                      </p>


                      <p className="actividad-item-empresa">

                        {actividad.empresa ??
                          actividad.nombre ??
                          ""}

                      </p>

                    </div>


                    <span className="actividad-item-fecha">

                      {actividad.fecha ??
                        actividad.fechaRegistro ??
                        ""}

                    </span>

                  </div>


                  <p className="actividad-item-detalle">

                    {actividad.detalle ??
                      actividad.descripcion ??
                      ""}

                  </p>


                </div>

              </div>

            )
          )

        )}

      </div>

    </div>

  );
}