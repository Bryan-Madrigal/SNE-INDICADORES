import React from "react";
import {
  Building2,
  MapPin,
  Eye,
} from "lucide-react";

export default function CompanyList({
  empresas = [],
  onVerEmpresa,
}) {
  return (
    <div className="company-list-wrapper">
      <div className="company-list">

        {empresas.length === 0 ? (
          <div className="tabla-vacia">
            No hay empresas para mostrar.
          </div>
        ) : (
          empresas.map((empresa) => (
            <div key={empresa.id} className="company-item">

              {/* INFORMACIÓN PRINCIPAL */}
              <div className="company-item-info">
                <div className="celda-avatar">
                  <div className="celda-avatar-icono blue">
                    <Building2 size={16} />
                  </div>
                  <div className="celda-principal">
                    <strong>{empresa.nombre}</strong>
                    <small>
                      <MapPin size={11} />
                      {empresa.municipio} · {empresa.sector}
                    </small>
                  </div>
                </div>
              </div>

              {/* ESTADÍSTICAS */}
              <div className="company-item-stats">

                <div className="stat-block">
                  <span className="numero-blue">
                    {Number(empresa.vacantes || 0).toLocaleString("es-MX")}
                  </span>
                  <small>Vacantes</small>
                </div>

                <div className="stat-block">
                  <span className="numero-purple">
                    {Number(empresa.vinculaciones || 0).toLocaleString("es-MX")}
                  </span>
                  <small>Vinculaciones</small>
                </div>

                <div className="stat-block">
                  <span className="numero-green">
                    {Number(empresa.colocaciones || 0).toLocaleString("es-MX")}
                  </span>
                  <small>Colocaciones</small>
                </div>

                <div className="stat-block stat-block-action">
                  <button
                    type="button"
                    className="btn-ver"
                    onClick={() => onVerEmpresa?.(empresa)}
                    title="Ver detalle"
                  >
                    <Eye size={14} />
                    Ver
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}