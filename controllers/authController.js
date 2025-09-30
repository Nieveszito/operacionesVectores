const User = require('../models/User');
const { validationResult } = require('express-validator');

exports.getLogin = (req, res) => {
  res.render('login', { title: 'Iniciar Sesión', errors: [], formData: {} });
};

exports.postLogin = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('login', { 
      title: 'Iniciar Sesión', 
      errors: errors.array(),
      formData: req.body
    });
  }

  const { email, password } = req.body;
  
  User.findByEmail(email, (err, user) => {
    if (err) {
      console.error(err);
      return res.render('login', { 
        title: 'Iniciar Sesión', 
        errors: [{ msg: 'Error del servidor' }],
        formData: req.body
      });
    }
    
    if (!user) {
      return res.render('login', { 
        title: 'Iniciar Sesión', 
        errors: [{ msg: 'Credenciales inválidas' }],
        formData: req.body
      });
    }
    console.log(`Usuario encontrado: ${user.email}`);
    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res.render('login', { 
          title: 'Iniciar Sesión', 
          errors: [{ msg: 'Error del servidor' }],
          formData: req.body
        });
      }
      
      if (!isMatch) {
        return res.render('login', { 
          title: 'Iniciar Sesión', 
          errors: [{ msg: 'Credenciales inválidas' }],
          formData: req.body
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      res.redirect('/dashboard');
    });
  });
};

exports.getRegister = (req, res) => {
  res.render('register', { title: 'Registrarse', errors: [], formData: {} });
};

exports.postRegister = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('register', { 
      title: 'Registrarse', 
      errors: errors.array(),
      formData: req.body
    });
  }

  const { username, email, password, confirmPassword } = req.body;
  
  if (password !== confirmPassword) {
    return res.render('register', { 
      title: 'Registrarse', 
      errors: [{ msg: 'Las contraseñas no coinciden' }],
      formData: req.body
    });
  }

  User.create({ username, email, password }, (err, results) => {
    if (err) {
      console.error(err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.render('register', { 
          title: 'Registrarse', 
          errors: [{ msg: 'El usuario o email ya existe' }],
          formData: req.body
        });
      }
      return res.render('register', { 
        title: 'Registrarse', 
        errors: [{ msg: 'Error del servidor' }],
        formData: req.body
      });
    }
    
    res.redirect('/login');
  });
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
};