# Dashboard de Estadísticas del Servicio Nacional de Empleo

Sistema Web tipo Dashboard para la visualización de estadísticas e indicadores de empleo. Desarrollado con el stack MER/MSSQL (React, Node.js, Express, SQL Server).

## Estructura del Proyecto
- **Frontend** (`/frontend`): Aplicación React.js construida con Vite, TailwindCSS y Recharts.
- **Backend** (`/backend`): API REST en Node.js + Express con conexión a SQL Server (mssql). 

## Requisitos Previos
- Node.js v18 o superior
- SQL Server (opcional para pruebas visuales en caso de Mocks)

## Instalación y Ejecución Local

Para probar la plataforma en tu entorno local sin base de datos real (con datos de prueba *"Mocks"* habilitados), sigue estos pasos:

### 1. Iniciar el Backend (Servidor API)
```bash
cd backend
npm install
node app.js
```
El backend se iniciará en `http://localhost:5000`. Mostrará una alerta si la base de datos no está conectada, pero encenderá en modo *Mock*.

### 2. Iniciar el Frontend (Interfaz Visual)
Abre **otra pestaña** en la terminal y ejecuta:
```bash
cd frontend
npm install
npm run dev
```
El servidor Vite mostrará la URL (usualmente `http://localhost:5173`). Haz Ctrl+Click para abrirla en tu explorador.

## Credenciales de Prueba (Modo Mock)
Si la base de datos no está todavía conectada, puedes entrar al sistema con estas credenciales de prueba:
- **Usuario:** admin
- **Contraseña:** admin

## Configuración de Productivo (Base de Datos Real)
Una vez que cuentes con la conexión VPN/SQL Server o la red de la oficina, edita el archivo `backend/.env` con tus credenciales.

```env
DB_SERVER=localhost
DB_NAME=sne_database
DB_USER=sa
DB_PASSWORD=secret
DB_TABLE_USUARIOS=usuarios
DB_COL_USUARIO=usuario
DB_COL_PASSWORD=password
DB_COL_ROL=rol
DB_COL_OFICINA=oficina_id
```
Una vez configurado, el sistema leerá los datos reales sin procesar Mocks.
