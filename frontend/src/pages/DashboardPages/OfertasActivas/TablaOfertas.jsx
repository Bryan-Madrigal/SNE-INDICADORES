import { Eye, GraduationCap, Building2, MapPin, BriefcaseBusiness } from "lucide-react";

export default function TablaOfertas({
  ofertas = [],
  onVerOferta,
}) {

  const formatearSalario = (salario) => {
    if (salario === null || salario === undefined || salario === "") {
      return "$0";
    }
    const numero = Number(salario);
    if (Number.isNaN(numero)) return salario;
    return `$${numero.toLocaleString("es-MX", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="table-wrapper">
      <div className="table-scroll">
        <table className="ofertas-table">

          <thead className="table-head">
            <tr>
              <th>Puesto</th>
              <th>Empresa</th>
              <th>Municipio</th>
              <th>Escolaridad</th>
              <th className="text-center">Vacantes</th>
              <th className="text-center">Salario</th>
              <th className="text-center">Estatus</th>
              <th className="text-center">Acción</th>
            </tr>
          </thead>

          <tbody>
            {ofertas.length === 0 ? (
              <tr>
                <td colSpan="8" className="tabla-vacia">
                  No se encontraron ofertas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              ofertas.map((oferta, index) => (
                <tr key={oferta.id ?? oferta.cveVacante ?? index}>

                  {/* PUESTO */}
                  <td>
                    <div className="celda-avatar">
                      <div className="celda-avatar-icono purple">
                        <BriefcaseBusiness size={15} />
                      </div>
                      <span>{oferta.puesto || "Sin puesto"}</span>
                    </div>
                  </td>

                  {/* EMPRESA */}
                  <td>
                    <div className="celda-icono">
                      <Building2 size={15} />
                      {oferta.empresa || "Sin empresa"}
                    </div>
                  </td>

                  {/* MUNICIPIO */}
                  <td>
                    <div className="celda-icono">
                      <MapPin size={15} />
                      {oferta.municipio || "Sin municipio"}
                    </div>
                  </td>

                  {/* ESCOLARIDAD */}
                  <td>
                    <div className="celda-icono">
                      <GraduationCap size={15} />
                      {oferta.escolaridad || "Sin escolaridad"}
                    </div>
                  </td>

                  {/* VACANTES */}
                  <td className="text-center">
                    <span className="numero-blue">
                      {Number(oferta.vacantes || 0).toLocaleString("es-MX")}
                    </span>
                  </td>

                  {/* SALARIO */}
                  <td className="text-center">
                    <span className="numero-green">
                      {formatearSalario(oferta.salario)}
                    </span>
                  </td>

                  {/* ESTATUS */}
                  <td className="text-center">
                    <span className="badge-estatus">
                      {oferta.estatus || "Activa"}
                    </span>
                  </td>

                  {/* ACCIÓN */}
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn-ver"
                      onClick={() => onVerOferta?.(oferta)}
                      title="Ver oferta"
                    >
                      <Eye size={14} />
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}