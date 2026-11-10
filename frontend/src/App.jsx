import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import Avances from './pages/Avances';
import ReportesGenerales from './pages/ReportesGenerales';
import MetasCRUD from './pages/MetasCRUD';
import TipoMetaParticipacion from './pages/TipoMetaParticipacion';
import OficinaBuscadoresParticipacion from './pages/OficinaBuscadoresParticipacion';
import AsignacionMetasGlobales from './pages/AsignacionMetasGlobales';
import Configuracion from './pages/Configuracion';
import ProtectedRoute from './components/ProtectedRoute';


import EmpresasAtendidas from "./pages/DashboardPages/EmpresasAtendidas/EmpresasAtendidas";
import OfertasActivas from "./pages/DashboardPages/OfertasActivas/OfertasActivas";
import BuscadoresEmpleo from "./pages/DashboardPages/BuscadoresEmpleo/BuscadoresEmpleo";
import Citas from "./pages/DashboardPages/Citas/Citas";
import Vinculaciones from "./pages/DashboardPages/Vinculaciones/Vinculaciones";
import Colocaciones from './pages/DashboardPages/Colocaciones/Colocaciones';
import Atenciones from './pages/DashboardPages/Atenciones/Atenciones';
import "./styles/CommonModule.css";

const PaginaGenerica = ({ titulo }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">{titulo}</h1>
    <p className="mt-4 text-gray-600">Contenido en construcción para {titulo}</p>
  </div>
);

function App() {
  const [fontFamily, setFontFamily] = useState('Patria');

  useEffect(() => {
    const fetchConfigAndApplyFont = async () => {
      try {
        const apiUrl = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '/indicadores/api') : 'http://localhost:5000/api';
        const res = await axios.get(`${apiUrl}/config`);
        
        if (res.data) {
            const family = res.data.fontFamily || 'Patria';
            setFontFamily(family);
            
            const fontString = family === 'Noto Sans' ? "'Noto Sans', sans-serif" : "'Patria', serif";
            
            let styleEl = document.getElementById('dynamic-global-font');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'dynamic-global-font';
                document.head.appendChild(styleEl);
            }
            
            styleEl.innerHTML = `
              :root {
                --global-font: ${fontString};
              }
              body, html, #root {
                font-family: var(--global-font) !important;
              }
              h1, h2, h3, h4, p, span, div, a, button, input, select, label {
                font-family: var(--global-font) !important;
              }
            `;
        }
      } catch (error) {
        console.error('Error al cargar config de fuente:', error);
      }
    };
    
    fetchConfigAndApplyFont();
  }, []);

  return (
    <div className="min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            {/* Ruta por defecto */}
            <Route index element={<DashboardHome />} />
            <Route path="avances" element={<Avances />} />
            <Route path="metas" element={<MetasCRUD />} />
            <Route path="tipo-meta-participacion" element={<TipoMetaParticipacion />} />
            <Route path="oficina-buscadores-participacion" element={<OficinaBuscadoresParticipacion />} />
            <Route path="asignacion-global" element={<AsignacionMetasGlobales />} />
            <Route path="reportes-generales" element={<ReportesGenerales />} />
            <Route path="configuracion" element={<Configuracion />} />

            <Route path="empresasatendidas" element={<EmpresasAtendidas />} />
            <Route path="ofertas" element={<OfertasActivas />} />
            <Route path="buscadores" element={<BuscadoresEmpleo />} />
            <Route path="citas" element={<Citas />} />
            <Route path="vinculaciones" element={<Vinculaciones />} />
            <Route path="colocaciones" element={<Colocaciones />} />
            <Route path="atenciones" element={<Atenciones />} />
            




          </Route>

          {/* Catch-all: redirige a dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </div>
  );
}

export default App;