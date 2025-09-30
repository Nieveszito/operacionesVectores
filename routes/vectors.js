const express = require('express');
const router = express.Router();
const vectorController = require('../controllers/vectorController');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

router.get('/vectors', requireAuth, vectorController.getVectors);
router.post('/calculate', requireAuth, vectorController.calculateVector);
router.get('/download-pdf/:id', requireAuth, vectorController.generatePDF);

module.exports = router;