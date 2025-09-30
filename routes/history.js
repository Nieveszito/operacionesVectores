const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Aplicar el middleware a todas las rutas de history
router.use(requireAuth);

// Rutas
router.get('/history', historyController.getHistory);
router.post('/history/delete/:id', historyController.deleteOperation);
router.get('/download-pdf/:id', historyController.downloadPDF);

module.exports = router;