const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const vectorRoutes = require('./routes/vectors');
const historyRoutes = require('./routes/history');

const app = express();

// ⚡ Usa el puerto que asigna Railway o 3000 en local
const PORT = process.env.PORT || 3000;

// Configuración de la aplicación
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'mi_clave_secreta_muy_segura',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Middleware para que "user" esté disponible en todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Rutas
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('dashboard', { title: 'Dashboard', user: req.session.user });
});

app.use('/', authRoutes);
app.use('/', vectorRoutes);
app.use('/', historyRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
});
