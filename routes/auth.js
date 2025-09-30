const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// Validaciones
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const registerValidation = [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

// Rutas
router.get('/login', authController.getLogin);
router.post('/login', loginValidation, authController.postLogin);
router.get('/register', authController.getRegister);
router.post('/register', registerValidation, authController.postRegister);
router.get('/logout', authController.logout);

module.exports = router;