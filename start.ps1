Write-Host "Iniciando los servidores de Desarrollo (Backend y Frontend)..." -ForegroundColor Green

# Iniciar Backend en una nueva ventana
Start-Process powershell -ArgumentList "-NoExit -Title 'Backend SNE' -Command `"cd backend; npm run dev`""

# Iniciar Frontend en una nueva ventana
Start-Process powershell -ArgumentList "-NoExit -Title 'Frontend SNE' -Command `"cd frontend; npm run dev`""

Write-Host "Servidores iniciados en ventanas separadas." -ForegroundColor Cyan
