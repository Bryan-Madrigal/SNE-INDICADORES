import React from "react";
import { MapPin } from "lucide-react";

export default function ListaMunicipios({
  datos = [],
  titulo = "Empresas por municipio",
  descripcion = "Distribución de empresas atendidas",
  maximo = 72,
}) {
  return (
    <div className="card-municipio">

      {/* ==========================================
          ENCABEZADO
      ========================================== */}

      <div className="card-municipio-header">

        <div className="card-municipio-icono">
          <MapPin size={20} />
        </div>

        <div>
          <h2 className="card-municipio-titulo">
            {titulo}
          </h2>

          <p className="card-municipio-sub">
            {descripcion}
          </p>
        </div>

      </div>


      {/* ==========================================
          LISTA
      ========================================== */}

      <div className="municipio-lista">

        {datos.length === 0 ? (

          <div className="municipio-vacio">
            No hay información disponible.
          </div>

        ) : (

          datos.map((dato, index) => {

            // ------------------------------------------
            // Permitir diferentes formatos de datos
            // ------------------------------------------

            let municipio;
            let cantidad;

            if (Array.isArray(dato)) {

              municipio = dato[0];
              cantidad = dato[1];

            } else {

              municipio =
                dato.municipio ??
                dato.nombre ??
                "Sin municipio";

              cantidad =
                dato.cantidad ??
                dato.valor ??
                dato.total ??
                0;

            }


            const valor =
              Number(cantidad) || 0;


            // ------------------------------------------
            // Calcular porcentaje
            // ------------------------------------------

            const porcentaje =
              maximo > 0
                ? Math.min(
                    (valor / maximo) * 100,
                    100
                  )
                : 0;


            return (

              <div
                key={`${municipio}-${index}`}
                className="municipio-item"
              >

                {/* ======================================
                    FILA
                ====================================== */}

                <div className="municipio-item-row">

                  <span className="municipio-nombre">
                    {municipio}
                  </span>

                  <span className="municipio-cantidad">
                    {valor}
                  </span>

                </div>


                {/* ======================================
                    BARRA
                ====================================== */}

                <div className="municipio-barra">

                  <div
                    className="municipio-barra-lleno"
                    style={{
                      width: `${porcentaje}%`,
                    }}
                  />

                </div>

              </div>

            );

          })

        )}

      </div>

    </div>
  );
}