const VectorOperation = require('../models/VectorOperation');

exports.getHistory = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const user_id = req.session.user.id;
    const message = req.query.message || null;
    const operations = await VectorOperation.findByUserId(user_id);

    res.render('history', {
      title: 'Historial de Operaciones',
      user: req.session.user,
      operations,
      message
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al cargar el historial'
    });
  }
};

exports.deleteOperation = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { id } = req.params;
    const user_id = req.session.user.id;
    await VectorOperation.deleteById(id, user_id);

    res.redirect('/history?message=Operación eliminada correctamente');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al eliminar la operación'
    });
  }
};

exports.downloadPDF = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { id } = req.params;
    const user_id = req.session.user.id;
    const operation = await VectorOperation.findById(id);

    if (!operation || operation.user_id !== user_id) {
      return res.status(404).render('error', {
        title: 'Error',
        message: 'Operación no encontrada'
      });
    }

    // Aquí deberías generar el PDF real
    res.redirect('/history?message=PDF generado correctamente');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al generar el PDF'
    });
  }
};
