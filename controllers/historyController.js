const VectorOperation = require('../models/VectorOperation'); // ← FALTA ESTA LÍNEA

exports.getHistory = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user_id = req.session.user.id;
  const message = req.query.message || null;
  
  VectorOperation.findByUserId(user_id, (err, operations) => {
    if (err) {
      console.error(err);
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar el historial'
      });
    }
    
    res.render('history', {
      title: 'Historial de Operaciones',
      user: req.session.user,
      operations: operations,
      message: message
    });
  });
};

exports.deleteOperation = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { id } = req.params;
  const user_id = req.session.user.id;
  
  VectorOperation.deleteById(id, user_id, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).render('error', {
        title: 'Error',
        message: 'Error al eliminar la operación'
      });
    }
    
    res.redirect('/history?message=Operación eliminada correctamente');
  });
};

exports.downloadPDF = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { id } = req.params;
  const user_id = req.session.user.id;
  
  VectorOperation.findById(id, (err, operation) => {
    if (err || !operation || operation.user_id !== user_id) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Operación no encontrada'
      });
    }

    // Tu lógica para generar PDF aquí
    res.redirect('/history?message=PDF generado correctamente');
  });
};