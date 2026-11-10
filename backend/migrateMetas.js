require('dotenv').config();
const sql = require('mssql');
const xlsx = require('xlsx');
const path = require('path');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: false, trustServerCertificate: true }
};

const BLOQUES = [
    { dataStart:2,  cols: [{segmento:'JCF',indicador:'Atendidos',colOfi:0,colVal:1},{segmento:'JCF',indicador:'Vinculados',colOfi:3,colVal:4},{segmento:'JCF',indicador:'Colocados',colOfi:6,colVal:7}]},
    { dataStart:11, cols: [{segmento:'Profesionistas',indicador:'Atendidos',colOfi:0,colVal:1},{segmento:'Profesionistas',indicador:'Vinculados',colOfi:3,colVal:4},{segmento:'Profesionistas',indicador:'Colocados',colOfi:6,colVal:7}]},
    { dataStart:20, cols: [{segmento:'Mujeres',indicador:'Atendidos',colOfi:0,colVal:1},{segmento:'Salario Alto',indicador:'Vinculados',colOfi:3,colVal:4},{segmento:'Salario Alto',indicador:'Colocados',colOfi:6,colVal:7}]},
    { dataStart:29, cols: [{segmento:'Jóvenes',indicador:'Atendidos',colOfi:0,colVal:1},{segmento:'Mujeres',indicador:'Vinculados',colOfi:3,colVal:4},{segmento:'Mujeres',indicador:'Colocados',colOfi:6,colVal:7}]},
    { dataStart:38, cols: [{segmento:'Adultos Mayores',indicador:'Atendidos',colOfi:0,colVal:1},{segmento:'Jóvenes',indicador:'Vinculados',colOfi:3,colVal:4},{segmento:'Jóvenes',indicador:'Colocados',colOfi:6,colVal:7}]},
    { dataStart:47, cols: [{segmento:'Personas con discapacidad',indicador:'Atendidos',colOfi:0,colVal:1},{segmento:'Adultos Mayores',indicador:'Vinculados',colOfi:3,colVal:4},{segmento:'Adultos Mayores',indicador:'Colocados',colOfi:6,colVal:7}]},
    { dataStart:56, cols: [{segmento:'Hombres 30-49',indicador:'Atendidos',colOfi:0,colVal:1},{segmento:'Personas con discapacidad',indicador:'Vinculados',colOfi:3,colVal:4},{segmento:'Personas con discapacidad',indicador:'Colocados',colOfi:6,colVal:7}]},
    { dataStart:65, cols: [{segmento:'Hombres 30-49',indicador:'Vinculados',colOfi:0,colVal:1},{segmento:'Hombres 30-49',indicador:'Colocados',colOfi:3,colVal:4}]},
    { dataStart:74, cols: [{segmento:'General',indicador:'Atendidos',colOfi:0,colVal:1},{segmento:'General',indicador:'Vinculados',colOfi:3,colVal:4},{segmento:'General',indicador:'Colocados',colOfi:6,colVal:7}]},
];
const OFICINAS = {'Comitán':1,'Palenque':2,'San Cristóbal de las Casas':3,'Tapachula':4,'Tuxtla Gtz':5};
const MESES = {'Enero':1,'Febrero':2,'Marzo':3,'Abril':4};

async function migrateData() {
    console.log('Iniciando migración de Metas BT...');
    const filePath = path.join(__dirname, 'file', 'metas por indicadores 2026_Copia.xlsx');
    const workbook = xlsx.readFile(filePath);
    const entries = [];
    for (const mes of Object.keys(MESES)) {
        const sheet = workbook.Sheets[mes];
        if (!sheet) { console.warn('Hoja ' + mes + ' no encontrada'); continue; }
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const idMes = MESES[mes];
        for (const bloque of BLOQUES) {
            for (const col of bloque.cols) {
                for (let i = bloque.dataStart; i < bloque.dataStart + 6; i++) {
                    const row = data[i]; if (!row) continue;
                    const oficina = (row[col.colOfi] || '').toString().trim();
                    if (!oficina || oficina.toLowerCase() === 'totales') continue;
                    const metaRaw = parseFloat(row[col.colVal]); if (isNaN(metaRaw)) continue;
                    entries.push({ idOficina: OFICINAS[oficina]||99, oficina, idMes, mes, segmento: col.segmento, indicador: col.indicador, valor: Math.round(metaRaw*100)/100 });
                }
            }
        }
    }
    console.log('Registros extraídos: ' + entries.length);
    try {
        await sql.connect(config);
        console.log('Conexion OK');
        await sql.query("IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Metas_BuscadoresDeTrabajo' AND xtype='U') CREATE TABLE Metas_BuscadoresDeTrabajo (Id INT IDENTITY(1,1) PRIMARY KEY, IdOficina INT, Oficina NVARCHAR(150), IdMes INT, Mes NVARCHAR(20), Segmento NVARCHAR(100), Indicador NVARCHAR(50), MetaRequerida DECIMAL(10,2), MetaAtendidos DECIMAL(10,2) NULL, MetaVinculados DECIMAL(10,2) NULL, MetaColocados DECIMAL(10,2) NULL, Anio INT DEFAULT 2026);");
        await sql.query('TRUNCATE TABLE Metas_BuscadoresDeTrabajo;');
        let n = 0;
        for (const e of entries) {
            const r = new sql.Request();
            r.input('a',sql.Int,e.idOficina); r.input('b',sql.NVarChar(150),e.oficina);
            r.input('c',sql.Int,e.idMes); r.input('d',sql.NVarChar(20),e.mes);
            r.input('e',sql.NVarChar(100),e.segmento); r.input('f',sql.NVarChar(50),e.indicador);
            // Normalizar en columnas por rubro: Atendidos, Vinculados, Colocados
            const indicador = (e.indicador || '').toUpperCase();
            const metaAt = indicador.includes('ATEND') ? e.valor : null;
            const metaVin = indicador.includes('VINC') ? e.valor : null;
            const metaCol = indicador.includes('COLOC') ? e.valor : null;
            r.input('g',sql.Decimal(10,2),e.valor); // MetaRequerida (legado)
            r.input('h',sql.Decimal(10,2),metaAt);
            r.input('i',sql.Decimal(10,2),metaVin);
            r.input('j',sql.Decimal(10,2),metaCol);
            await r.query('INSERT INTO Metas_BuscadoresDeTrabajo (IdOficina,Oficina,IdMes,Mes,Segmento,Indicador,MetaRequerida,MetaAtendidos,MetaVinculados,MetaColocados) VALUES (@a,@b,@c,@d,@e,@f,@g,@h,@i,@j)');
            n++;
        }
        console.log('Migracion completada: ' + n + ' registros.');
    } catch(err) { console.error('Error:', err.message); }
    finally { await sql.close(); }
}
migrateData();
