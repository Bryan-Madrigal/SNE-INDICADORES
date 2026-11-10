const { poolPromise } = require('./src/db/dbConnect');
poolPromise.then(pool => 
    pool.request().query('EXEC sp_helptext sp_GetAvancesBT')
    .then(r => { 
        console.log(r.recordset.map(x => x.Text).join('')); 
        process.exit(); 
    })
).catch(e => console.error(e));
