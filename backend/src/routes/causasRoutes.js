const express = require('express');
const router = express.Router();
const { getCausasColocacion, getCausasRechazo } = require('../controllers/causasController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/colocaciones/causas', getCausasColocacion);
router.get('/rechazos/causas', getCausasRechazo);

module.exports = router;