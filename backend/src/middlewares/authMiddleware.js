const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ message: 'No se proporcionó un token.' });
    }

    const token = authHeader.split(' ')[1]; // Formato: Bearer <token>
    
    if (!token) {
        return res.status(403).json({ message: 'Formato de token no válido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // { id, nombre, rol, oficina_id }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

module.exports = {
    verificarToken
};