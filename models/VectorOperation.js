const db = require('../config/database');

class VectorOperation {
  static create(operationData, callback) {
    const { user_id, operation_type, vector_a, vector_b, vector_c, result } = operationData;
    
    const query = 'INSERT INTO vector_operations (user_id, operation_type, vector_a, vector_b, vector_c, result) VALUES (?, ?, ?, ?, ?, ?)';
    db.execute(query, [user_id, operation_type, vector_a, vector_b, vector_c || null, result], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }

  static findByUserId(user_id, callback) {
    const query = 'SELECT * FROM vector_operations WHERE user_id = ? ORDER BY created_at DESC';
    db.execute(query, [user_id], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }

  static findById(id, callback) {
    const query = 'SELECT * FROM vector_operations WHERE id = ?';
    db.execute(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }

  static deleteById(id, userId, callback) {
    const query = 'DELETE FROM vector_operations WHERE id = ? AND user_id = ?';
    db.execute(query, [id, userId], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }
}

module.exports = VectorOperation;