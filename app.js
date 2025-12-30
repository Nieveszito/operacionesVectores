const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Importar rutas legacy
const authRoutes = require('./routes/auth');
const vectorRoutes = require('./routes/vectors'); 
const historyRoutes = require('./routes/history');

// Librería matemática
const { evaluate } = require('mathjs');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
//    CONFIGURACIÓN
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
//    MIDDLEWARES
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'clave_secreta_super_segura',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Usuario global (SIN auto-login)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ==========================================
//    MIDDLEWARE DE PROTECCIÓN
// ==========================================
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// ==========================================
//    RUTAS PRINCIPALES
// ==========================================

// Al iniciar → LOGIN
app.get('/', (req, res) => res.redirect('/login'));

// Dashboard protegido
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { title: 'Dashboard', user: req.session.user });
});

// ==========================================
//    HISTORIAL (MODO DISEÑO)
// ==========================================
app.get('/history', requireAuth, (req, res) => {
  const datosFalsos = [
    {
      id: 1, operation_type: 'gradiente', 
      vector_a: 'x^2 + y^2', vector_b: '(1, 2, 0)', vector_c: '', 
      result: '2.00i + 4.00j + 0.00k', created_at: new Date()
    },
    {
      id: 2, operation_type: 'triple_integral',
      vector_a: 'x*y*z', vector_b: 'Caja[0,1]', vector_c: '',
      result: '0.1250', created_at: new Date(Date.now() - 3600000)
    },
    {
      id: 3, operation_type: 'suma', 
      vector_a: '5, 5, 5', vector_b: '1, 2, 3', vector_c: '', 
      result: '6.00i + 7.00j + 8.00k', created_at: new Date(Date.now() - 86400000)
    }
  ];

  res.render('history', { user: req.session.user, operations: datosFalsos, message: null });
});

// ==========================================
//    1. CÁLCULO DIFERENCIAL
// ==========================================

// Gradiente
app.get('/gradient', requireAuth, (req, res) => res.render('gradient'));
app.post('/gradient', requireAuth, (req, res) => {
  const { funcion, x0, y0, z0 } = req.body;
  const x = parseFloat(x0), y = parseFloat(y0), z = parseFloat(z0), h = 0.00001;

  try {
    const fx = (evaluate(funcion, { x: x + h, y, z }) - evaluate(funcion, { x: x - h, y, z })) / (2 * h);
    const fy = (evaluate(funcion, { x, y: y + h, z }) - evaluate(funcion, { x, y: y - h, z })) / (2 * h);
    const fz = (evaluate(funcion, { x, y, z: z + h }) - evaluate(funcion, { x, y, z: z - h })) / (2 * h);

    const resVec = `${fx.toFixed(2)}\\hat{i} + ${fy.toFixed(2)}\\hat{j} + ${fz.toFixed(2)}\\hat{k}`;
    const magnitud = Math.sqrt(fx**2 + fy**2 + fz**2).toFixed(4);

    res.render('gradient', { funcion, x0, y0, z0, resultado: resVec, magnitud });
  } catch {
    res.render('gradient', { error: 'Error en función', funcion, x0, y0, z0 });
  }
});

// Divergencia
app.get('/divergence', requireAuth, (req, res) => res.render('divergence'));
app.post('/divergence', requireAuth, (req, res) => {
  const { P, Q, R, x0, y0, z0 } = req.body;
  const x = parseFloat(x0), y = parseFloat(y0), z = parseFloat(z0), h = 0.00001;

  try {
    const dP_dx = (evaluate(P, { x: x + h, y, z }) - evaluate(P, { x: x - h, y, z })) / (2 * h);
    const dQ_dy = (evaluate(Q, { x, y: y + h, z }) - evaluate(Q, { x, y: y - h, z })) / (2 * h);
    const dR_dz = (evaluate(R, { x, y, z: z + h }) - evaluate(R, { x, y, z: z - h })) / (2 * h);

    res.render('divergence', { P, Q, R, x0, y0, z0, resultado: (dP_dx + dQ_dy + dR_dz).toFixed(4) });
  } catch {
    res.render('divergence', { error: 'Error en funciones', P, Q, R, x0, y0, z0 });
  }
});

// ==========================================
//    (EL RESTO DE TUS RUTAS SIGUE IGUAL)
//    Integrales, álgebra vectorial, etc.
// ==========================================

// ================================
//    RUTAS LEGACY
// ================================
app.use('/', authRoutes);
app.use('/', vectorRoutes);
app.use('/', historyRoutes);

// ==========================================
//    SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
