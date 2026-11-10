import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Configuracion = () => {
    const [config, setConfig] = useState({
        appName: '',
        dependencyName: '',
        logo1: '',
        logo2: '',
        fontFamily: 'Patria',
        titleFontSize: 'text-2xl',
        bodyFontSize: 'text-base'
    });
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(true);

    const apiUrl = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '/indicadores/api') : 'http://localhost:5000/api';

    useEffect(() => {
        cargarConfig();
    }, []);

    const cargarConfig = async () => {
        try {
            const res = await axios.get(`${apiUrl}/config`);
            setConfig({
                appName: res.data.appName || '',
                dependencyName: res.data.dependencyName || '',
                logo1: res.data.logo1 || '',
                logo2: res.data.logo2 || '',
                fontFamily: res.data.fontFamily || 'Patria',
                titleFontSize: res.data.titleFontSize || 'text-2xl',
                bodyFontSize: res.data.bodyFontSize || 'text-base'
            });
        } catch (error) {
            console.error('Error al cargar config:', error);
            setStatus({ type: 'error', msg: 'No se pudo cargar la configuración actual.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e, logoField) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Redimensionar a máximo 400px de altura (suficiente para un logo)
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;
                    
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Comprimir a formato WebP reduciendo dramáticamente el peso
                    const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
                    setConfig({ ...config, [logoField]: compressedBase64 });
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'info', msg: 'Guardando...' });
        try {
            const res = await axios.post(`${apiUrl}/config`, config);
            setStatus({ type: 'success', msg: 'Configuración guardada exitosamente. Se recargará para aplicar los cambios.' });
            
            // Forzar recarga leve para impactar toda la app
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Error guardando config:', error);
            setStatus({ type: 'error', msg: 'Ocurrió un error al guardar los cambios.' });
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-[#9D2449]">Configuración Institucional</h2>
            <p className="text-gray-500 text-sm">
                Cambia el nombre del sistema, la dependencia, y actualiza los escudos institucionales.
                <br/><i>* Se recomiendan imágenes PNG con fondo transparente.</i>
            </p>

            {status.msg && (
                <div className={`p-4 rounded-lg ${status.type === 'error' ? 'bg-red-100 text-red-700' : status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {status.msg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#B38E5D]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Aplicación</label>
                        <input type="text" name="appName" value={config.appName} onChange={handleChange} required
                            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-[#9D2449] outline-none" 
                            placeholder="Ej: Tablero de Indicadores SNE" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Dependencia</label>
                        <input type="text" name="dependencyName" value={config.dependencyName} onChange={handleChange} required
                            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-[#9D2449] outline-none" 
                            placeholder="Ej: Secretaría de Economía y del Trabajo" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Logo 1 */}
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">Escudo Principal (Logo 1)</label>
                        {config.logo1 && (
                            <img src={config.logo1} alt="Logo 1 Preview" className="mx-auto h-24 mb-4 object-contain" />
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo1')} 
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 w-full" />
                    </div>

                    {/* Logo 2 */}
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">Escudo Secundario (Logo 2)</label>
                        {config.logo2 && (
                            <img src={config.logo2} alt="Logo 2 Preview" className="mx-auto h-24 mb-4 object-contain" />
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo2')} 
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 w-full" />
                    </div>
                </div>

                {/* Sección Tipografía */}
                <h3 className="text-xl font-bold text-[#9D2449] mb-4 mt-8 border-b pb-2">Tipografía y Diseño</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Letra Global</label>
                        <select name="fontFamily" value={config.fontFamily} onChange={handleChange}
                            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-[#9D2449] outline-none">
                            <option value="Patria">Familia Patria</option>
                            <option value="Noto Sans">Familia Noto Sans</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tamaño Títulos</label>
                        <select name="titleFontSize" value={config.titleFontSize} onChange={handleChange}
                            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-[#9D2449] outline-none">
                            <option value="text-xl">Pequeño</option>
                            <option value="text-2xl">Normal</option>
                            <option value="text-3xl">Grande</option>
                            <option value="text-4xl">Muy Grande</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tamaño Cuerpo</label>
                        <select name="bodyFontSize" value={config.bodyFontSize} onChange={handleChange}
                            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-[#9D2449] outline-none">
                            <option value="text-sm">Pequeño</option>
                            <option value="text-base">Normal</option>
                            <option value="text-lg">Grande</option>
                            <option value="text-xl">Muy Grande</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={() => { setConfig({...config, logo1:'', logo2:''}) }} className="mr-4 text-gray-500 hover:text-red-500 text-sm font-semibold">
                        Limpiar Logos
                    </button>
                    <button type="submit" className="bg-[#9D2449] text-white px-6 py-2 rounded font-bold hover:bg-[#7a1c38] transition">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Configuracion;