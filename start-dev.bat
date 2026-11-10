@echo off
echo ====================================================
echo Iniciando Entorno de Desarrollo - Indicadores SNE
echo ====================================================

echo [1/2] Levantando Backend (Node.js)...
start "Backend SNE" cmd /k "cd backend && npm start"

echo [2/2] Levantando Frontend (React Vite)...
start "Frontend SNE" cmd /k "cd frontend && npm run dev"

echo.
echo Los servicios se ejecutarán en ventanas separadas.
echo Cierra las ventanas para detener los servicios.
pause