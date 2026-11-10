const { poolPromise } = require('./src/db/dbConnect');
poolPromise.then(async pool => {
    const res = await pool.request().query("SELECT CorreoElectronico, password, PasswordHash, PasswordSalt FROM Users WHERE CorreoElectronico = 'noellopez24@gmail.com'");
    console.log(res.recordset);
    process.exit(0);
});