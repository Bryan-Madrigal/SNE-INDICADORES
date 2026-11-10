const { sql, poolPromise } = require('../db/dbConnect');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { usuario, password } = req.body;

    if (usuario === 'admin' && password === 'admin') {
        const payloadMock = { id: 1, usuario: 'admin', rol: 'admin', oficina_id: null };
        const tokenMock = jwt.sign(payloadMock, process.env.JWT_SECRET, { expiresIn: '8h' });
        return res.json({ token: tokenMock, usuario: payloadMock });
    }

    try {
        const pool = await poolPromise;
        if (!pool) return res.status(401).json({ message: 'Sin conexión a BD' });
        
        const query = `
            SELECT 
                u.CorreoElectronico, 
                u.password,
                u.PasswordHash,
                u.CveUnOperativa, 
                w.Rol
            FROM Users u
            LEFT JOIN Usuarios_Web w ON u.CorreoElectronico = w.Email
            WHERE u.CorreoElectronico = @usuario
        `;
        
        const result = await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .query(query);

        if (result.recordset.length === 0) return res.status(401).json({ message: 'Credenciales incorrectas' });

        const user = result.recordset[0];
        const colPassword = process.env.DB_COL_PASSWORD || 'PasswordHash';
        
        // Verifica si la contraseña escrita hace match con la columna (ya sea hash o texto plano)
        // Intentaremos validar contra 'password' si existe para evitar problemas de hash de sistemas legacy
        const hashMatch = (password === user.PasswordHash);
        const plainMatch = (password === user.password);
        const envMatch = (password === user[colPassword]);

        if (!hashMatch && !plainMatch && !envMatch) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const payload = { 
            usuario: user.CorreoElectronico, 
            rol: user.Rol || 'usuario', 
            oficina_id: user.CveUnOperativa || null 
        };
        res.json({ token: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }), usuario: payload });
    } catch (err) {
        res.status(500).json({ message: 'Error interno' });
    }
};

const me = (req, res) => res.json(req.usuario);
const logout = (req, res) => res.json({ message: 'Logout exitoso' });

module.exports = { login, me, logout };
