// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Importar rutas legacy (Autenticación, etc.)
const authRoutes = require('./routes/auth');
const vectorRoutes = require('./routes/vectors'); 
const historyRoutes = require('./routes/history');

// Librería matemática
const { evaluate } = require('mathjs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuración ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Middlewares ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'clave_secreta_super_segura',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ===============================
//  USUARIO GLOBAL (SIN AUTOLOGIN)
// ===============================
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ===============================
//  MIDDLEWARE DE PROTECCIÓN
// ===============================
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// ==========================================
//    RUTAS PRINCIPALES
// ==========================================

// Raíz → Login
app.get('/', (req, res) => res.redirect('/login'));

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { title: 'Dashboard', user: req.session.user });
});

// ==========================================
//    HISTORIAL (MODO DISEÑO)
// ==========================================
app.get('/history', requireAuth, (req, res) => {
  const datosFalsos = [
    {
      id: 1,
      operation_type: 'gradiente', 
      vector_a: 'x^2 + y^2',
      vector_b: '(1, 2, 0)',
      vector_c: '',
      result: '2.00i + 4.00j + 0.00k',
      created_at: new Date()
    },
    {
      id: 2,
      operation_type: 'triple_integral',
      vector_a: 'x*y*z',
      vector_b: 'Caja[0,1]',
      vector_c: '',
      result: '0.1250',
      created_at: new Date(Date.now() - 3600000)
    },
    {
      id: 3,
      operation_type: 'suma', 
      vector_a: '5, 5, 5',
      vector_b: '1, 2, 3',
      vector_c: '',
      result: '6.00i + 7.00j + 8.00k',
      created_at: new Date(Date.now() - 86400000)
    }
  ];

  res.render('history', {
    user: req.session.user,
    operations: datosFalsos,
    message: null
  });
});

// ==========================================
//    1. CÁLCULO DIFERENCIAL (NABLA)
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

    res.render('gradient', {
      funcion, x0, y0, z0,
      resultado: resVec,
      magnitud: Math.sqrt(fx**2 + fy**2 + fz**2).toFixed(4)
    });
  } catch (e) {
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

    res.render('divergence', {
      P, Q, R, x0, y0, z0,
      resultado: (dP_dx + dQ_dy + dR_dz).toFixed(4)
    });
  } catch (e) {
    res.render('divergence', { error: 'Error en funciones', P, Q, R, x0, y0, z0 });
  }
});

// Rotacional
app.get('/rotacional', requireAuth, (req, res) => res.render('rotacional'));
app.post('/rotacional', requireAuth, (req, res) => {
  const { P, Q, R, x0, y0, z0 } = req.body;
  const x = parseFloat(x0), y = parseFloat(y0), z = parseFloat(z0), h = 0.00001;

  try {
    const dR_dy = (evaluate(R, { x, y: y+h, z }) - evaluate(R, { x, y: y-h, z })) / (2*h);
    const dQ_dz = (evaluate(Q, { x, y, z: z+h }) - evaluate(Q, { x, y, z: z-h })) / (2*h);
    const i = dR_dy - dQ_dz;

    const dP_dz = (evaluate(P, { x, y, z: z+h }) - evaluate(P, { x, y, z: z-h })) / (2*h);
    const dR_dx = (evaluate(R, { x: x+h, y, z }) - evaluate(R, { x: x-h, y, z })) / (2*h);
    const j = dP_dz - dR_dx;

    const dQ_dx = (evaluate(Q, { x: x+h, y, z }) - evaluate(Q, { x: x-h, y, z })) / (2*h);
    const dP_dy = (evaluate(P, { x, y: y+h, z }) - evaluate(P, { x, y: y-h, z })) / (2*h);
    const k = dQ_dx - dP_dy;

    const resVec = `${i.toFixed(2)}\\hat{i} + ${j.toFixed(2)}\\hat{j} + ${k.toFixed(2)}\\hat{k}`;

    res.render('rotacional', {
      P, Q, R, x0, y0, z0,
      resultado: resVec,
      magnitud: Math.sqrt(i**2 + j**2 + k**2).toFixed(4)
    });
  } catch (e) {
    res.render('rotacional', { error: 'Error en funciones', P, Q, R, x0, y0, z0 });
  }
});

// ==========================================
//    2. INTEGRACIÓN Y GRÁFICAS
// ==========================================

// Visualizador de Campos
app.get('/visualizer', requireAuth, (req, res) => {
  res.render('visualizer', { 
    type: 'scalar',
    funcZ: null, funcP: null, funcQ: null, funcR: null,
    range: null,
    xData: null, yData: null, zData: null,
    uData: null, vData: null, wData: null 
  });
});

app.post('/visualizer', requireAuth, (req, res) => {
  const { type, funcZ, funcP, funcQ, funcR, range } = req.body;
  const rng = parseInt(range) || 5;
  const steps = 15;
  const stepSize = (rng * 2) / steps;

  let xData=[], yData=[], zData=[], uData=[], vData=[], wData=[];

  try {
    if (type === 'scalar') {
      let axis = [];
      for (let i = -rng; i <= rng; i += stepSize) axis.push(i);
      xData = axis;
      yData = axis;

      for (let y of axis) {
        let row = [];
        for (let x of axis) {
          row.push(evaluate(funcZ, { x, y }));
        }
        zData.push(row);
      }
    } else {
      for (let x = -rng; x <= rng; x += stepSize*1.5) {
        for (let y = -rng; y <= rng; y += stepSize*1.5) {
          for (let z = -rng; z <= rng; z += stepSize*1.5) {
            xData.push(x); yData.push(y); zData.push(z);
            uData.push(evaluate(funcP, {x,y,z}));
            vData.push(evaluate(funcQ, {x,y,z}));
            wData.push(evaluate(funcR, {x,y,z}));
          }
        }
      }
    }

    res.render('visualizer', {
      type, funcZ, funcP, funcQ, funcR, range,
      xData, yData, zData, uData, vData, wData
    });
  } catch (e) {
    res.render('visualizer', { error: 'Error en función' });
  }
});

// ==========================================
//    INTEGRALES
// ==========================================

// Integral doble
app.get('/double-integral', requireAuth, (req, res) => {
  res.render('integrals', {
    func: null, xmin: null, xmax: null,
    ymin: null, ymax: null,
    result: null,
    xData: null, yData: null, zData: null
  });
});

app.post('/double-integral', requireAuth, (req, res) => {
  const { func, xmin, xmax, ymin, ymax } = req.body;
  const x1 = parseFloat(xmin), x2 = parseFloat(xmax);
  const y1 = parseFloat(ymin), y2 = parseFloat(ymax);

  const steps = 25;
  const dx = (x2 - x1) / steps;
  const dy = (y2 - y1) / steps;

  let volume = 0;
  let xData=[], yData=[], zData=[];

  try {
    for (let j = 0; j <= steps; j++) {
      const y = y1 + j * dy;
      yData.push(y);
      let row = [];

      for (let i = 0; i <= steps; i++) {
        const x = x1 + i * dx;
        const z = evaluate(func, { x, y });
        row.push(z);
        if (i < steps && j < steps) volume += z * dx * dy;
      }
      zData.push(row);
    }

    res.render('integrals', {
      func, xmin, xmax, ymin, ymax,
      result: volume.toFixed(4),
      xData, yData, zData
    });
  } catch (e) {
    res.render('integrals', { error: 'Error de cálculo' });
  }
});

// Integral de línea
app.get('/line-integral', requireAuth, (req, res) => {
  res.render('line_integral', {
    P:null,Q:null,R:null,
    xt:null,yt:null,zt:null,
    t_start:null,t_end:null,
    result:null,
    pathX:null,pathY:null,pathZ:null
  });
});

app.post('/line-integral', requireAuth, (req, res) => {
  const { P, Q, R, xt, yt, zt, t_start, t_end } = req.body;

  let t1, t2;
  try {
    t1 = evaluate(t_start);
    t2 = evaluate(t_end);
  } catch {
    t1 = 0; t2 = 1;
  }

  const steps = 100;
  const dt = (t2 - t1) / steps;

  let work = 0;
  let pathX=[], pathY=[], pathZ=[];

  try {
    for (let i = 0; i <= steps; i++) {
      const t = t1 + i * dt;
      const x = evaluate(xt, { t });
      const y = evaluate(yt, { t });
      const z = evaluate(zt, { t });

      pathX.push(x);
      pathY.push(y);
      pathZ.push(z);

      if (i < steps) {
        const tn = t + dt;
        const dx = evaluate(xt, { t: tn }) - x;
        const dy = evaluate(yt, { t: tn }) - y;
        const dz = evaluate(zt, { t: tn }) - z;

        work += evaluate(P, { x, y, z }) * dx
              + evaluate(Q, { x, y, z }) * dy
              + evaluate(R, { x, y, z }) * dz;
      }
    }

    res.render('line_integral', {
      P,Q,R,xt,yt,zt,t_start,t_end,
      result: work.toFixed(4),
      pathX,pathY,pathZ
    });
  } catch (e) {
    res.render('line_integral', { error: 'Error sintaxis' });
  }
});

// Integral triple
app.get('/triple-integral', requireAuth, (req, res) => {
  res.render('triple_integral', {
    func:null,
    xmin:null,xmax:null,
    ymin:null,ymax:null,
    zmin:null,zmax:null,
    result:null
  });
});

app.post('/triple-integral', requireAuth, (req, res) => {
  const { func, xmin, xmax, ymin, ymax, zmin, zmax } = req.body;

  const x1 = parseFloat(xmin), x2 = parseFloat(xmax);
  const y1 = parseFloat(ymin), y2 = parseFloat(ymax);
  const z1 = parseFloat(zmin), z2 = parseFloat(zmax);

  const steps = 15;
  const dx = (x2 - x1) / steps;
  const dy = (y2 - y1) / steps;
  const dz = (z2 - z1) / steps;

  let total = 0;

  try {
    for (let i = 0; i < steps; i++) {
      const x = x1 + (i + 0.5) * dx;
      for (let j = 0; j < steps; j++) {
        const y = y1 + (j + 0.5) * dy;
        for (let k = 0; k < steps; k++) {
          const z = z1 + (k + 0.5) * dz;
          total += evaluate(func, { x, y, z }) * dx * dy * dz;
        }
      }
    }

    res.render('triple_integral', {
      func, xmin, xmax, ymin, ymax, zmin, zmax,
      result: total.toFixed(4)
    });
  } catch (e) {
    res.render('triple_integral', { error: 'Error cálculo' });
  }
});

// ==========================================
//    ÁLGEBRA VECTORIAL
// ==========================================
const parseVec = s => s ? s.split(',').map(n => parseFloat(n) || 0) : [0,0,0];
const fmtVec = v => `${v[0].toFixed(2)}\\hat{i} ${v[1]>=0?'+':''}${v[1].toFixed(2)}\\hat{j} ${v[2]>=0?'+':''}${v[2].toFixed(2)}\\hat{k}`;

// Suma / resta
app.get('/vector-sum', requireAuth, (req, res) => res.render('vector_sum'));
app.post('/vector-sum', requireAuth, (req, res) => {
  const { vecA, vecB, operacion } = req.body;
  const A = parseVec(vecA), B = parseVec(vecB);
  const R = operacion === 'resta'
    ? A.map((v,i)=>v-B[i])
    : A.map((v,i)=>v+B[i]);

  res.render('vector_sum', {
    vecA, vecB, operacion,
    resultado: fmtVec(R),
    ax:A[0], ay:A[1], az:A[2],
    bx:B[0], by:B[1], bz:B[2],
    rx:R[0], ry:R[1], rz:R[2]
  });
});

// Punto
app.get('/vector-dot', requireAuth, (req, res) => res.render('vector_dot'));
app.post('/vector-dot', requireAuth, (req, res) => {
  const { vecA, vecB } = req.body;
  const A = parseVec(vecA), B = parseVec(vecB);

  const dot = A[0]*B[0] + A[1]*B[1] + A[2]*B[2];
  const magA = Math.sqrt(A[0]**2 + A[1]**2 + A[2]**2);
  const magB = Math.sqrt(B[0]**2 + B[1]**2 + B[2]**2);
  const angle = magA && magB
    ? (Math.acos(dot/(magA*magB))*180/Math.PI).toFixed(2)
    : 0;

  res.render('vector_dot', {
    vecA, vecB,
    resultado: dot.toFixed(4),
    angulo: angle
  });
});

// Cruz
app.get('/vector-cross', requireAuth, (req, res) => res.render('vector_cross'));
app.post('/vector-cross', requireAuth, (req, res) => {
  const { vecA, vecB } = req.body;
  const A = parseVec(vecA), B = parseVec(vecB);

  const R = [
    A[1]*B[2] - A[2]*B[1],
    A[2]*B[0] - A[0]*B[2],
    A[0]*B[1] - A[1]*B[0]
  ];

  res.render('vector_cross', {
    vecA, vecB,
    resultado: fmtVec(R),
    ax:A[0], ay:A[1], az:A[2],
    bx:B[0], by:B[1], bz:B[2],
    rx:R[0], ry:R[1], rz:R[2]
  });
});

// ==========================================
//    RUTAS LEGACY
// ==========================================
app.use('/', authRoutes);
app.use('/', vectorRoutes);
app.use('/', historyRoutes);

// ==========================================
//    SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`✅ Servidor en puerto ${PORT}`);
});
