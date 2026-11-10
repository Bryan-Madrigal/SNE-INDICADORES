@echo off
echo Inciando los servidores de Desarrollo (Backend y Frontend)...

echo Iniciando Backend...
start "Backend SNE" cmd /k "cd backend && npm run dev"

echo Iniciando Frontend...
start "Frontend SNE" cmd /k "cd frontend && npm run dev"

echo Servidores iniciados en ventanas separadas.
