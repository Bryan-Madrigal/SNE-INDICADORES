const express = require('express');
const router = express.Router();
const { login, me, logout } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verificarToken, me);

module.exports = router;