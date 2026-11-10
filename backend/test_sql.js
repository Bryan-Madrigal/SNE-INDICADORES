const { poolPromise } = require('./src/db/dbConnect');
async function test() {
  const pool = await poolPromise;
  const res = await pool.request().query(\
            WITH Vin AS (
                SELECT mun.Nombre AS municipio, COUNT(*) as vinculaciones
                FROM EnvioSeguimiento es
                JOIN Vacantes v ON es.CveVacante = v.CveVacante
                JOIN CatMunicipio mun ON v.CveMunicipio = mun.CveMunicipio
                WHERE es.Status != 3
                GROUP BY mun.Nombre
            ),
            Col AS (
                SELECT mun.Nombre AS municipio, COUNT(*) as colocaciones
                FROM EnvioSeguimiento es
                JOIN Vacantes v ON es.CveVacante = v.CveVacante
                JOIN CatMunicipio mun ON v.CveMunicipio = mun.CveMunicipio
                WHERE es.Status = 4
                GROUP BY mun.Nombre
            )
            SELECT TOP 5 ISNULL(Vin.municipio, Col.municipio) AS municipio,
                   ISNULL(Vin.vinculaciones, 0) AS vinculaciones,
                   ISNULL(Col.colocaciones, 0) AS colocaciones
            FROM Vin
            FULL OUTER JOIN Col ON Vin.municipio = Col.municipio
            ORDER BY vinculaciones DESC, colocaciones DESC
  \);
  console.log(res.recordset);
  process.exit();
}
test();
