const VectorOperation = require('../models/VectorOperation');
const PDFDocument = require('pdfkit');

// Definición de operaciones con vectores
const vectorOperations = {
  suma: (a, b) => a.map((val, i) => val + b[i]),
  angulo: (a, b) => {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    // Verificar si algún vector es nulo
    if (magnitudeA === 0 || magnitudeB === 0) {
      throw new Error('Ángulo indeterminado');
    }
    
    const cosTheta = dotProduct / (magnitudeA * magnitudeB);
    const clamped = Math.max(-1, Math.min(1, cosTheta));
    return Math.acos(clamped) * (180 / Math.PI);
  },
  productoPunto: (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0),
  productoCruz: (a, b) => {
    if (a.length !== 3 || b.length !== 3) {
      throw new Error('El producto cruz requiere vectores de 3 dimensiones');
    }
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  },
  tripleProductoEscalar: (a, b, c) => {
    const crossBC = vectorOperations.productoCruz(b, c);
    return vectorOperations.productoPunto(a, crossBC);
  },
  tripleProductoVectorialAXBXC: (a, b, c) => {
    const crossAB = vectorOperations.productoCruz(a, b);
    return vectorOperations.productoCruz(crossAB, c);
  },
  tripleProductoVectorialAXBXC2: (a, b, c) => {
    const crossBC = vectorOperations.productoCruz(b, c);
    return vectorOperations.productoCruz(a, crossBC);
  }
};

exports.getVectors = (req, res) => {
  res.render('vectors', {
    title: 'Operaciones con Vectores',
    user: req.session.user,
    result: null,
    operation: null,
    tripleType: null,
    formData: {},
    error: null
  });
};

exports.calculateVector = async (req, res) => {
  const { vectorA, vectorB, vectorC, operation, tripleType } = req.body;
  const user_id = req.session.user.id;

  const a = vectorA.split(',').map(Number);
  const b = vectorB.split(',').map(Number);
  let c = [0, 0, 0];

  const requires3D = ['productoCruz', 'tripleProductoEscalar', 'tripleProductoVectorial'];
  const tripleOps = ['tripleProductoEscalar', 'tripleProductoVectorial'];

  // Validaciones
  if (a.some(isNaN) || b.some(isNaN)) {
    return res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      error: 'Los vectores deben contener solo números separados por comas',
      formData: req.body,
      result: null,
      operation: null,
      tripleType: null
    });
  }

  // Verificar si algún vector es nulo para ángulo
  if (operation === 'angulo') {
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) {
      return res.render('vectors', {
        title: 'Operaciones con Vectores',
        user: req.session.user,
        error: 'Ángulo indeterminado - no se puede calcular con vectores nulos',
        formData: req.body,
        result: null,
        operation: null,
        tripleType: null
      });
    }
  }

  if (requires3D.includes(operation) && (a.length !== 3 || b.length !== 3)) {
    return res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      error: 'Esta operación requiere vectores de 3 dimensiones',
      formData: req.body,
      result: null,
      operation: null,
      tripleType: null
    });
  }

  if (tripleOps.includes(operation)) {
    if (!vectorC) {
      return res.render('vectors', {
        title: 'Operaciones con Vectores',
        user: req.session.user,
        error: 'Esta operación requiere un tercer vector C',
        formData: req.body,
        result: null,
        operation: null,
        tripleType: null
      });
    }
    c = vectorC.split(',').map(Number);
    if (c.some(isNaN) || c.length !== 3) {
      return res.render('vectors', {
        title: 'Operaciones con Vectores',
        user: req.session.user,
        error: 'El vector C debe contener solo 3 números separados por comas',
        formData: req.body,
        result: null,
        operation: null,
        tripleType: null
      });
    }
  }

  if (a.length !== b.length && !tripleOps.includes(operation)) {
    return res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      error: 'Los vectores A y B deben tener la misma dimensión',
      formData: req.body,
      result: null,
      operation: null,
      tripleType: null
    });
  }

  let result, resultText;

  try {
    switch (operation) {
      case 'suma':
        result = vectorOperations.suma(a, b);
        resultText = `Resultado: [${result.join(', ')}]`;
        break;
      case 'angulo':
        result = vectorOperations.angulo(a, b);
        resultText = `Ángulo: ${result.toFixed(2)}°`;
        break;
      case 'productoPunto':
        result = vectorOperations.productoPunto(a, b);
        resultText = `Producto Punto: ${result}`;
        break;
      case 'productoCruz':
        result = vectorOperations.productoCruz(a, b);
        resultText = `Producto Cruz: [${result.join(', ')}]`;
        break;
      case 'tripleProductoEscalar':
        result = vectorOperations.tripleProductoEscalar(a, b, c);
        resultText = `Triple Producto Escalar (A·(B×C)): ${result}`;
        break;
      case 'tripleProductoVectorial':
        if (tripleType === 'axbxc') {
          result = vectorOperations.tripleProductoVectorialAXBXC(a, b, c);
          resultText = `Triple Producto Vectorial ((A×B)×C): [${result.join(', ')}]`;
        } else {
          result = vectorOperations.tripleProductoVectorialAXBXC2(a, b, c);
          resultText = `Triple Producto Vectorial (A×(B×C)): [${result.join(', ')}]`;
        }
        break;
      default:
        return res.render('vectors', {
          title: 'Operaciones con Vectores',
          user: req.session.user,
          error: 'Operación no válida',
          formData: req.body,
          result: null,
          operation: null,
          tripleType: null
        });
    }
  } catch (err) {
    return res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      error: err.message,
      formData: req.body,
      result: null,
      operation: null,
      tripleType: null
    });
  }

  const operationData = {
    user_id,
    operation_type: operation,
    vector_a: vectorA,
    vector_b: vectorB,
    result: resultText
  };
  if (tripleOps.includes(operation)) {
    operationData.vector_c = vectorC;
    if (operation === 'tripleProductoVectorial') {
      operationData.triple_type = tripleType;
    }
  }

  try {
    await VectorOperation.create(operationData);

    res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      result: resultText,
      operation,
      tripleType: tripleType || null,
      formData: { 
        vectorA, 
        vectorB, 
        vectorC: vectorC || '', 
        operation,
        tripleType: tripleType || ''
      },
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al guardar la operación'
    });
  }
};

exports.generatePDF = async (req, res) => {
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

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=operacion_${id}.pdf`);
    doc.pipe(res);

    doc.fillColor('#2c3e50')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('OPERACIÓN CON VECTORES', 50, 50, { align: 'center' });
    
  
    doc.strokeColor('#3498db')
       .lineWidth(3)
       .moveTo(50, 85)
       .lineTo(545, 85)
       .stroke();

    let yPosition = 120;

    doc.fillColor('#7f8c8d')
       .fontSize(10)
       .font('Helvetica')
       .text(`Generado: ${new Date().toLocaleString()}`, 50, yPosition);
    
    yPosition += 30;

    doc.fillColor('#ffffff')
       .roundedRect(50, yPosition, 495, 30, 5)
       .fill()
       .strokeColor('#3498db')
       .lineWidth(1)
       .roundedRect(50, yPosition, 495, 30, 5)
       .stroke();
    
    
    doc.fillColor('#2c3e50')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('TIPO DE OPERACIÓN:', 60, yPosition + 10)
       .fillColor('#e74c3c')
       .text(operation.operation_type.toUpperCase(),270, yPosition + 10); 
    
    yPosition += 50;

    // Vectores en cajas con colores
    const vectors = [
      { label: 'VECTOR A', value: operation.vector_a, color: '#3498db' },
      { label: 'VECTOR B', value: operation.vector_b, color: '#e74c3c' }
    ];

    if (operation.vector_c) {
      vectors.push({ label: 'VECTOR C', value: operation.vector_c, color: '#2ecc71' });
    }

    vectors.forEach((vector, index) => {
      doc.fillColor('#ffffff')
         .roundedRect(50, yPosition, 495, 40, 5)
         .fill()
         .strokeColor(vector.color)
         .lineWidth(2)
         .roundedRect(50, yPosition, 495, 40, 5)
         .stroke();
      
      doc.fillColor(vector.color)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(vector.label, 60, yPosition + 12)
         .fillColor('#2c3e50')
         .font('Helvetica')
         .text(vector.value, 60, yPosition + 28);
      
      yPosition += 60;
    });

    // Resultado destacado
    doc.fillColor('#f39c12')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('RESULTADO:', 50, yPosition);
    
    yPosition += 25;
    
    doc.fillColor('#2c3e50')
       .roundedRect(50, yPosition, 495, 50, 5)
       .fill()
       .strokeColor('#f39c12')
       .lineWidth(2)
       .roundedRect(50, yPosition, 495, 50, 5)
       .stroke();
    
    doc.fillColor('#ffffff')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(operation.result, 60, yPosition + 18, { 
         width: 475,
         align: 'center'
       });

    yPosition += 80;

    // Información adicional si es triple producto
    if (operation.triple_type) {
      const tripleTypeText = operation.triple_type === 'axbxc' ? '(A×B)×C' : 'A×(B×C)';
      doc.fillColor('#9b59b6')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(`Variante: ${tripleTypeText}`, 50, yPosition);
      
      yPosition += 30;
    }

    // Pie de página
    doc.fillColor('#7f8c8d')
       .fontSize(10)
       .font('Helvetica-Oblique')
       .text('Sistema de Operaciones Vectoriales - Generado automáticamente', 
             50, 750, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al generar el PDF'
    });
  }
};