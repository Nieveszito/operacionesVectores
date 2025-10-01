const User = require('../models/User');
const { validationResult } = require('express-validator');

exports.getLogin = (req, res) => {
  res.render('login', { title: 'Iniciar Sesión', errors: [], formData: {} });
};

exports.postLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('login', {
      title: 'Iniciar Sesión',
      errors: errors.array(),
      formData: req.body
    });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.render('login', {
        title: 'Iniciar Sesión',
        errors: [{ msg: 'Credenciales inválidas' }],
        formData: req.body
      });
    }

    const isMatch = await User.comparePassword(password, user.password);
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
  } catch (err) {
    console.error(err);
    res.render('login', {
      title: 'Iniciar Sesión',
      errors: [{ msg: 'Error del servidor' }],
      formData: req.body
    });
  }
};

exports.getRegister = (req, res) => {
  res.render('register', { title: 'Registrarse', errors: [], formData: {} });
};

exports.postRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('register', {
      title: 'Registrarse',
      errors: errors.array(),
      formData: req.body
    });
  }

  try {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('register', {
        title: 'Registrarse',
        errors: [{ msg: 'Las contraseñas no coinciden' }],
        formData: req.body
      });
    }

    await User.create({ username, email, password });
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.render('register', {
        title: 'Registrarse',
        errors: [{ msg: 'El usuario o email ya existe' }],
        formData: req.body
      });
    }
    res.render('register', {
      title: 'Registrarse',
      errors: [{ msg: 'Error del servidor' }],
      formData: req.body
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect('/login');
  });
};
