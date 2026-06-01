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

const PDFDocument = require('pdfkit');

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

    // Configurar el documento PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `Reporte_${operation.operation_type.replace(/\s+/g, '_')}_${id}.pdf`;
    
    // Configurar los headers de respuesta para descargar el PDF
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    // Conectar el stream del PDF a la respuesta
    doc.pipe(res);

    // Diseño del PDF
    // Encabezado
    doc.fillColor('#a855f7')
       .fontSize(28)
       .text('VectorSys', { align: 'center' });
       
    doc.moveDown(0.5);
    doc.fillColor('#94a3b8')
       .fontSize(12)
       .text('Reporte Oficial de Operación', { align: 'center' });

    doc.moveDown(2);
    
    // Línea separadora
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .strokeColor('#e2e8f0')
       .stroke();
       
    doc.moveDown(2);

    // Detalles del reporte
    doc.fillColor('#0f172a').fontSize(16).text('Detalles de la Operación', { underline: true });
    doc.moveDown(1);
    
    const startX = 50;
    let currentY = doc.y;

    // Función para dibujar filas
    const drawRow = (label, value, y) => {
      doc.fillColor('#64748b').fontSize(12).text(label, startX, y, { width: 150 });
      doc.fillColor('#0f172a').fontSize(12).text(value || 'N/A', startX + 160, y);
      return y + 25;
    };

    currentY = drawRow('Tipo de Operación:', operation.operation_type, currentY);
    currentY = drawRow('Vector / Función A:', operation.vector_a, currentY);
    currentY = drawRow('Vector / Rango B:', operation.vector_b, currentY);
    if (operation.vector_c) {
      currentY = drawRow('Vector / Param C:', operation.vector_c, currentY);
    }
    
    doc.moveDown(1);
    currentY = doc.y;

    // Caja de resultado
    doc.rect(50, currentY, 500, 80)
       .fillAndStroke('#f8fafc', '#cbd5e1');
       
    doc.fillColor('#3b82f6').fontSize(14).text('Resultado:', 70, currentY + 15);
    doc.fillColor('#0f172a').fontSize(16).text(operation.result, 70, currentY + 40);

    doc.moveDown(4);

    // Pie de página
    doc.fontSize(10)
       .fillColor('#94a3b8')
       .text(`Generado el: ${new Date().toLocaleString()}`, 50, 700, { align: 'center' })
       .text(`Usuario: ${req.session.user.username}`, { align: 'center' });

    // Finalizar el PDF
    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al generar el PDF'
    });
  }
};
