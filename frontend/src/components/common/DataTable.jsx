import React from "react";

export default function DataTable({
  columnas = [],
  datos = [],
  renderCelda,
  filaKey,
  mensajeVacio = "No hay información disponible.",
  className = "",
}) {
  return (
    <div className={`data-table-wrapper ${className}`}>

      <div className="data-table-scroll">

        <table className="data-table">

          {/* =====================================================
              ENCABEZADOS
          ===================================================== */}

          <thead>
            <tr>
              {columnas.map((columna) => (
                <th
                  key={columna.key}
                  className={columna.className || ""}
                >
                  {columna.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* =====================================================
              CUERPO
          ===================================================== */}

          <tbody>

            {datos.length > 0 ? (

              datos.map((fila, index) => (

                <tr
                  key={
                    filaKey
                      ? filaKey(fila, index)
                      : fila.id ?? index
                  }
                >

                  {columnas.map((columna) => (

                    <td
                      key={columna.key}
                      className={columna.className || ""}
                    >

                      {renderCelda
                        ? renderCelda(
                            fila,
                            columna.key,
                            index
                          )
                        : fila[columna.key] ?? "-"}

                    </td>

                  ))}

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan={columnas.length}
                  className="data-table-vacio"
                >
                  {mensajeVacio}
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}