const { poolPromise } = require('./src/db/dbConnect');
poolPromise.then(async pool => {
    try {
        const e = 'noellopez24@gmail.com';
        const ur = await pool.request().query(`SELECT CorreoElectronico, CveUnOperativa, Rol FROM Users WHERE CorreoElectronico = '${e}'`);
        console.log('Users:', ur.recordset);
        const wr = await pool.request().query(`SELECT Email, Rol FROM Usuarios_Web WHERE Email = '${e}'`);
        console.log('Usuarios_Web:', wr.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});