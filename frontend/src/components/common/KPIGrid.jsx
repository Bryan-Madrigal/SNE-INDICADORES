import React from "react";

import {
  BriefcaseBusiness,
  Building2,
  Users,
  MapPin,
  CircleDollarSign,
  UserCheck,
  TrendingUp,
  CalendarDays,
  Activity,
  CheckCircle2,
  Plus,
} from "lucide-react";

import KPICard from "./KPICard";


// =====================================================
// ICONOS DISPONIBLES
// =====================================================

const ICONOS = {
  ofertas: BriefcaseBusiness,
  vacantes: Users,
  empresas: Building2,
  municipios: MapPin,
  salario: CircleDollarSign,

  atendidas: Building2,
  nuevas: Plus,
  vinculaciones: Users,
  colocaciones: UserCheck,
  citas: CalendarDays,
  rechazos: Activity,
  buscadores: Users,
  atenciones: Activity,
  avance: TrendingUp,
  completado: CheckCircle2,
};


// =====================================================
// COMPONENTE KPI GRID
// =====================================================

export default function KPIGrid({
  indicadores = [],
}) {

  return (

    <div className="kpi-grid">

      {indicadores.map(
        (indicador, index) => {

          // -------------------------------------------
          // Si el controller manda un icono directamente
          // también lo acepta.
          // -------------------------------------------

          const Icon =
            indicador.icono ||
            ICONOS[indicador.tipoIcono];


          return (

            <KPICard

              key={
                indicador.id ??
                index
              }

              titulo={
                indicador.titulo
              }

              valor={
                indicador.valor
              }

              descripcion={
                indicador.descripcion
              }

              icono={
                Icon
              }

              color={
                indicador.color
              }

            />

          );
        }
      )}

    </div>

  );
}