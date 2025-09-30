const VectorOperation = require('../models/VectorOperation');
const PDFDocument = require('pdfkit');

// Operaciones con vectores
const vectorOperations = {
  suma: (a, b) => {
    return a.map((val, i) => val + b[i]);
  },
  
  angulo: (a, b) => {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) {
      throw new Error("No se puede calcular el ángulo con vectores nulos");
    }
    const cosTheta = dotProduct / (magnitudeA * magnitudeB);
    // Asegurar que cosTheta esté en el rango [-1, 1] por errores de precisión
    const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));
    return Math.acos(clampedCosTheta) * (180 / Math.PI);
  },
  
  productoPunto: (a, b) => {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  },
  
  productoCruz: (a, b) => {
    if (a.length !== 3 || b.length !== 3) {
      throw new Error("El producto cruz requiere vectores de 3 dimensiones");
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
  
  tripleProductoVectorial: (a, b, c) => {
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
    formData: {},
    error: null 
  });
};

exports.calculateVector = (req, res) => {
  const { vectorA, vectorB, vectorC, operation } = req.body;
  const user_id = req.session.user.id;
  
  // Convertir los vectores a arrays numéricos
  const a = vectorA.split(',').map(Number);
  const b = vectorB.split(',').map(Number);
  let c = [0, 0, 0];
  
  // Validaciones básicas
  if (a.some(isNaN) || b.some(isNaN)) {
    return res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      error: 'Los vectores deben contener solo números separados por comas',
      formData: req.body,
      result: null,
      operation: null
    });
  }
  
  // Validar dimensiones para operaciones que requieren 3D
  const requires3D = ['productoCruz', 'tripleProductoEscalar', 'tripleProductoVectorial'];
  if (requires3D.includes(operation) && (a.length !== 3 || b.length !== 3)) {
    return res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      error: 'Esta operación requiere vectores de 3 dimensiones',
      formData: req.body,
      result: null,
      operation: null
    });
  }
  
  // Procesar vector C para operaciones triples
  const tripleOperations = ['tripleProductoEscalar', 'tripleProductoVectorial'];
  if (tripleOperations.includes(operation)) {
    if (!vectorC) {
      return res.render('vectors', {
        title: 'Operaciones con Vectores',
        user: req.session.user,
        error: 'Esta operación requiere un tercer vector C',
        formData: req.body,
        result: null,
        operation: null
      });
    }
    
    c = vectorC.split(',').map(Number);
    if (c.some(isNaN)) {
      return res.render('vectors', {
        title: 'Operaciones con Vectores',
        user: req.session.user,
        error: 'El vector C debe contener solo números separados por comas',
        formData: req.body,
        result: null,
        operation: null
      });
    }
    
    if (c.length !== 3) {
      return res.render('vectors', {
        title: 'Operaciones con Vectores',
        user: req.session.user,
        error: 'El vector C debe tener 3 dimensiones para esta operación',
        formData: req.body,
        result: null,
        operation: null
      });
    }
  }
  
  // Validar que los vectores tengan la misma longitud para operaciones binarias
  if (a.length !== b.length && !tripleOperations.includes(operation)) {
    return res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      error: 'Los vectores A y B deben tener la misma dimensión',
      formData: req.body,
      result: null,
      operation: null
    });
  }
  
  let result;
  let resultText;
  
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
        result = vectorOperations.tripleProductoVectorial(a, b, c);
        resultText = `Triple Producto Vectorial (A×(B×C)): [${result.join(', ')}]`;
        break;
      default:
        return res.render('vectors', {
          title: 'Operaciones con Vectores',
          user: req.session.user,
          error: 'Operación no válida',
          formData: req.body,
          result: null,
          operation: null
        });
    }
  } catch (err) {
    return res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      error: err.message,
      formData: req.body,
      result: null,
      operation: null
    });
  }
  
  // Preparar datos para guardar
  const operationData = {
    user_id,
    operation_type: operation,
    vector_a: vectorA,
    vector_b: vectorB,
    result: resultText
  };
  
  // Agregar vector C si es una operación triple
  if (tripleOperations.includes(operation)) {
    operationData.vector_c = vectorC;
  }
  
  // Guardar la operación en el historial
  VectorOperation.create(operationData, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { 
        title: 'Error', 
        message: 'Error al guardar la operación' 
      });
    }
    
    // Asegurar que formData tenga todos los campos, incluso vectorC
    const completeFormData = {
      vectorA: vectorA,
      vectorB: vectorB,
      vectorC: vectorC || '', // ← Asegurar que vectorC siempre esté definido
      operation: operation
    };
    
    res.render('vectors', {
      title: 'Operaciones con Vectores',
      user: req.session.user,
      result: resultText,
      operation,
      formData: completeFormData, // ← Usar el formData completo
      error: null 
    });
  });
};

exports.generatePDF = (req, res) => {
  const { id } = req.params;
  const user_id = req.session.user.id;
  
  VectorOperation.findById(id, (err, operation) => {
    if (err || !operation || operation.user_id !== user_id) {
      return res.status(404).render('error', { 
        title: 'Error', 
        message: 'Operación no encontrada' 
      });
    }
    
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=operacion_${id}.pdf`);
    
    doc.pipe(res);
    
    // Contenido del PDF
    doc.fontSize(20).text('Operación con Vectores', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tipo de operación: ${operation.operation_type}`);
    doc.text(`Vector A: ${operation.vector_a}`);
    doc.text(`Vector B: ${operation.vector_b}`);
    if (operation.vector_c) {
      doc.text(`Vector C: ${operation.vector_c}`);
    }
    doc.text(`Resultado: ${operation.result}`);
    doc.text(`Fecha: ${new Date(operation.created_at).toLocaleString()}`);
    
    doc.end();
  });
};