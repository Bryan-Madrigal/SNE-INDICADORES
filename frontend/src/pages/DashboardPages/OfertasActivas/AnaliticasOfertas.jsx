import React, { useState } from "react";
import { GraduationCap, ChevronDown, ChevronUp } from "lucide-react";


// =====================================================
// OBTENER NOMBRE Y VALOR
// =====================================================

function obtenerNombre(item) {

  if (Array.isArray(item)) {
    return item[0] ?? "Sin información";
  }

  return (
    item?.nombre ??
    item?.municipio ??
    item?.categoria ??
    item?.escolaridad ??
    "Sin información"
  );
}


function obtenerValor(item) {

  if (Array.isArray(item)) {
    return Number(item[1]) || 0;
  }

  return Number(
    item?.cantidad ??
    item?.valor ??
    0
  ) || 0;
}


// =====================================================
// PORCENTAJE
// =====================================================

function calcularPorcentaje(valor, maximo) {

  const numero =
    Number(valor) || 0;

  if (!maximo || maximo <= 0) {
    return 0;
  }

  return Math.min(
    (numero / maximo) * 100,
    100
  );
}


// =====================================================
// COMPONENTE
// =====================================================

export default function AnaliticasOfertas({

  ofertasPorCategoria = [],

  ofertasPorMunicipio = [],

  ofertasPorEscolaridad = [],

}) {

  // ===================================================
  // ESTADOS PARA EXPANDIR CADA TARJETA
  // ===================================================

  const [mostrarTodasCategorias, setMostrarTodasCategorias] =
    useState(false);

  const [mostrarTodosMunicipios, setMostrarTodosMunicipios] =
    useState(false);

  const [mostrarTodasEscolaridades, setMostrarTodasEscolaridades] =
    useState(false);


  // ===================================================
  // MÁXIMOS
  // ===================================================

  const maxCategoria =
    ofertasPorCategoria.length > 0
      ? Math.max(
          ...ofertasPorCategoria.map(
            (item) => obtenerValor(item)
          )
        )
      : 0;


  const maxMunicipio =
    ofertasPorMunicipio.length > 0
      ? Math.max(
          ...ofertasPorMunicipio.map(
            (item) => obtenerValor(item)
          )
        )
      : 0;


  // ===================================================
  // DATOS VISIBLES
  // ===================================================

  const categoriasVisibles =
    mostrarTodasCategorias
      ? ofertasPorCategoria
      : ofertasPorCategoria.slice(0, 10);


  const municipiosVisibles =
    mostrarTodosMunicipios
      ? ofertasPorMunicipio
      : ofertasPorMunicipio.slice(0, 10);


  const escolaridadesVisibles =
    mostrarTodasEscolaridades
      ? ofertasPorEscolaridad
      : ofertasPorEscolaridad.slice(0, 10);


  return (

    <div className="analytics-grid">


      {/* =================================================
          OFERTAS POR CATEGORÍA
      ================================================= */}

      <div className="analytics-card">

        <h3 className="analytics-title">
          Ofertas por categoría
        </h3>


        <div className="analytics-list">

          {categoriasVisibles.length === 0 ? (

            <div className="tabla-vacia">
              No hay información disponible.
            </div>

          ) : (

            categoriasVisibles.map(
              (item) => {

                const nombre =
                  obtenerNombre(item);

                const numero =
                  obtenerValor(item);

                const porcentaje =
                  calcularPorcentaje(
                    numero,
                    maxCategoria
                  );


                return (

                  <div
                    key={nombre}
                    className="analytics-item"
                  >

                    <div className="analytics-row">

                      <span>
                        {nombre}
                      </span>

                      <strong>
                        {numero}
                      </strong>

                    </div>


                    <div className="progress-bar">

                      <div
                        className="progress-fill progress-blue"
                        style={{
                          width:
                            `${porcentaje}%`,
                        }}
                      />

                    </div>

                  </div>

                );

              }
            )

          )}

        </div>


        {/* ===============================================
            VER MÁS
        =============================================== */}

        {ofertasPorCategoria.length > 10 && (

          <button
            type="button"
            className="btn-ver-mas-analitica"
            onClick={() =>
              setMostrarTodasCategorias(
                !mostrarTodasCategorias
              )
            }
          >

            {mostrarTodasCategorias ? (
              <>
                Ver menos
                <ChevronUp size={15} />
              </>
            ) : (
              <>
                Ver más
                <ChevronDown size={15} />
              </>
            )}

          </button>

        )}

      </div>


      {/* =================================================
          OFERTAS POR MUNICIPIO
      ================================================= */}

      <div className="analytics-card">

        <h3 className="analytics-title">
          Ofertas por municipio
        </h3>


        <div className="analytics-list">

          {municipiosVisibles.length === 0 ? (

            <div className="tabla-vacia">
              No hay información disponible.
            </div>

          ) : (

            municipiosVisibles.map(
              (item) => {

                const nombre =
                  obtenerNombre(item);

                const numero =
                  obtenerValor(item);

                const porcentaje =
                  calcularPorcentaje(
                    numero,
                    maxMunicipio
                  );


                return (

                  <div
                    key={nombre}
                    className="analytics-item"
                  >

                    <div className="analytics-row">

                      <span>
                        {nombre}
                      </span>

                      <strong>
                        {numero}
                      </strong>

                    </div>


                    <div className="progress-bar">

                      <div
                        className="progress-fill progress-emerald"
                        style={{
                          width:
                            `${porcentaje}%`,
                        }}
                      />

                    </div>

                  </div>

                );

              }
            )

          )}

        </div>


        {/* ===============================================
            VER MÁS
        =============================================== */}

        {ofertasPorMunicipio.length > 10 && (

          <button
            type="button"
            className="btn-ver-mas-analitica"
            onClick={() =>
              setMostrarTodosMunicipios(
                !mostrarTodosMunicipios
              )
            }
          >

            {mostrarTodosMunicipios ? (
              <>
                Ver menos
                <ChevronUp size={15} />
              </>
            ) : (
              <>
                Ver más
                <ChevronDown size={15} />
              </>
            )}

          </button>

        )}

      </div>


      {/* =================================================
          OFERTAS POR ESCOLARIDAD
      ================================================= */}

      <div className="analytics-card">

        <h3 className="analytics-title">
          Ofertas por escolaridad
        </h3>


        <div className="escolaridad-stats">

          {escolaridadesVisibles.length === 0 ? (

            <div className="tabla-vacia">
              No hay información disponible.
            </div>

          ) : (

            escolaridadesVisibles.map(
              (item) => {

                const nombre =
                  obtenerNombre(item);

                const numero =
                  obtenerValor(item);


                return (

                  <div
                    key={nombre}
                    className="escolaridad-item"
                  >

                    <div className="escolaridad-icon-text">

                      <GraduationCap
                        size={16}
                      />

                      <span>
                        {nombre}
                      </span>

                    </div>


                    <strong>
                      {numero}
                    </strong>

                  </div>

                );

              }
            )

          )}

        </div>


        {/* ===============================================
            VER MÁS
        =============================================== */}

        {ofertasPorEscolaridad.length > 10 && (

          <button
            type="button"
            className="btn-ver-mas-analitica"
            onClick={() =>
              setMostrarTodasEscolaridades(
                !mostrarTodasEscolaridades
              )
            }
          >

            {mostrarTodasEscolaridades ? (
              <>
                Ver menos
                <ChevronUp size={15} />
              </>
            ) : (
              <>
                Ver más
                <ChevronDown size={15} />
              </>
            )}

          </button>

        )}

      </div>


    </div>

  );

}