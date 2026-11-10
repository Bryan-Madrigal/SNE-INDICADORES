import React from "react";
import {
  TrendingUp,
  ChevronRight,
} from "lucide-react";

export default function RankingList({
  empresas = [],
  titulo = "Empresas con mayor actividad",
  descripcion = "Según colocaciones registradas",
  limite = 5,
  maximo = 27,
  campo = "colocaciones",
  etiqueta = "colocaciones",
  onVerCompleto,
}) {

  // =====================================================
  // CREAR RANKING
  // =====================================================

  const ranking = empresas
    .slice()
    .sort(
      (a, b) =>
        Number(b[campo] || 0) -
        Number(a[campo] || 0)
    )
    .slice(0, limite);


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="ranking">

      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <div className="ranking-header">

        <div className="ranking-icono">

          <TrendingUp
            size={20}
          />

        </div>


        <div>

          <h2 className="ranking-titulo">
            {titulo}
          </h2>

          <p className="ranking-sub">
            {descripcion}
          </p>

        </div>

      </div>


      {/* =================================================
          LISTA
      ================================================= */}

      <div className="ranking-lista">

        {ranking.length > 0 ? (

          ranking.map((empresa, index) => {

            const valor =
              Number(
                empresa[campo] || 0
              );

            const porcentaje =
              maximo > 0
                ? Math.min(
                    (valor / maximo) * 100,
                    100
                  )
                : 0;


            return (

              <div
                key={
                  empresa.id ??
                  `${empresa.nombre}-${index}`
                }
                className="ranking-item"
              >

                <div className="ranking-item-row">


                  {/* =====================================
                      EMPRESA
                  ===================================== */}

                  <div className="ranking-item-info">

                    <div className="ranking-posicion">
                      {index + 1}
                    </div>


                    <div>

                      <p className="ranking-item-nombre">
                        {empresa.nombre}
                      </p>

                      <p className="ranking-item-municipio">
                        {empresa.municipio}
                      </p>

                    </div>

                  </div>


                  {/* =====================================
                      VALOR
                  ===================================== */}

                  <span className="ranking-item-colocaciones">

                    {valor}

                    {etiqueta && (
                      <small>
                        {" "}
                        {etiqueta}
                      </small>
                    )}

                  </span>

                </div>


                {/* =======================================
                    BARRA
                ======================================= */}

                <div className="ranking-barra">

                  <div
                    className="ranking-barra-lleno"
                    style={{
                      width: `${porcentaje}%`,
                    }}
                  />

                </div>

              </div>

            );

          })

        ) : (

          <div className="ranking-vacio">

            No hay información disponible.

          </div>

        )}

      </div>


      {/* =================================================
          BOTÓN
      ================================================= */}

      <button
        type="button"
        className="btn-ranking-ver"
        onClick={onVerCompleto}
      >

        Ver ranking completo

        <ChevronRight
          size={16}
        />

      </button>

    </div>
  );
}