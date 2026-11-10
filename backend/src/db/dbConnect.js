const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false, 
        trustServerCertificate: true
    }
};

let poolPromise = null;

const connectPool = () => {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config)
            .connect()
            .then((pool) => {
                console.log('Conectado a SQL Server');
                return pool;
            })
            .catch((err) => {
                console.error('Alerta: Base de Datos no configurada o inaccesible (Usando Mocks temporales).', err.message);
                poolPromise = null;
                return null;
            });
    }

    return poolPromise;
};

module.exports = {
    sql,
    get poolPromise() {
        return connectPool();
    }
};
