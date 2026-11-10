import React from "react";

import {
  UserCheck,
  BriefcaseBusiness,
  Users,
  CheckCircle2,
} from "lucide-react";


// =====================================================
// CONFIGURACIÓN DE TARJETAS
// =====================================================

const TARJETAS = [
  {
    id: "vacantes",
    campo: "vacantes",
    titulo: "Vacantes generadas",
    descripcion: "descripcionVacantes",
    descripcionDefault:
      "+18% respecto al periodo anterior",
    icono: BriefcaseBusiness,
    clase: "resumen-card--blue",
  },

  {
    id: "vinculaciones",
    campo: "vinculaciones",
    titulo: "Vinculaciones",
    descripcion: "descripcionVinculaciones",
    descripcionDefault:
      "Personas vinculadas a empresas",
    icono: Users,
    clase: "resumen-card--purple",
  },

  {
    id: "colocaciones",
    campo: "colocaciones",
    titulo: "Colocaciones",
    descripcion: "descripcionColocaciones",
    descripcionDefault:
      "Contrataciones concretadas",
    icono: CheckCircle2,
    clase: "resumen-card--green",
  },
];


// =====================================================
// COMPONENTE
// =====================================================

export default function ResumenResultados({

  resultados = {},

  titulo =
    "Resultados de las empresas atendidas",

  descripcion =
    "Resumen general de la actividad generada por las empresas.",

  tarjetas = TARJETAS,

}) {

  return (

    <div className="resumen">


      {/* ================================================
          ENCABEZADO
      ================================================= */}

      <div className="resumen-header">

        <div className="resumen-icono">

          <UserCheck
            size={20}
          />

        </div>


        <div>

          <h2 className="resumen-titulo">
            {titulo}
          </h2>


          <p className="resumen-sub">
            {descripcion}
          </p>

        </div>

      </div>


      {/* ================================================
          TARJETAS
      ================================================= */}

      <div className="resumen-grid">

        {tarjetas.map((tarjeta) => {

          const Icon =
            tarjeta.icono;

          const valor =
            resultados[
              tarjeta.campo
            ] ?? 0;

          const descripcionTarjeta =
            resultados[
              tarjeta.descripcion
            ] ??
            tarjeta.descripcionDefault;


          return (

            <div
              key={tarjeta.id}
              className={
                `resumen-card ${tarjeta.clase}`
              }
            >


              {/* ======================================
                  ENCABEZADO DE TARJETA
              ====================================== */}

              <div className="resumen-card-row">

                <span className="resumen-card-label">

                  {tarjeta.titulo}

                </span>


                <Icon
                  size={20}
                  className="resumen-card-icon"
                />

              </div>


              {/* ======================================
                  VALOR
              ====================================== */}

              <p className="resumen-card-valor">

                {valor}

              </p>


              {/* ======================================
                  DESCRIPCIÓN
              ====================================== */}

              <p className="resumen-card-delta">

                {descripcionTarjeta}

              </p>

            </div>

          );

        })}

      </div>

    </div>

  );
}