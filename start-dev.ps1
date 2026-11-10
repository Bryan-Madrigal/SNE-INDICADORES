Write-Host "====================================================" -ForegroundColor Green
Write-Host " Iniciando Entorno de Desarrollo - Indicadores SNE" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

Write-Host "`n[1/2] Levantando Backend (Node.js en el puerto 5000)..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k", "title Backend SNE && cd backend && npm start"

Write-Host "[2/2] Levantando Frontend (React Vite)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "title Frontend SNE && cd frontend && npm run dev"

Write-Host "`n¡Servicios iniciados en nuevas ventanas!" -ForegroundColor Green
Write-Host "Cierra las ventanas emergentes para detener la ejecución." -ForegroundColor Gray