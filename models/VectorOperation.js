const pool = require('../config/database');

class VectorOperation {
  static async create(operationData) {
    const { user_id, operation_type, vector_a, vector_b, vector_c, result } = operationData;

    const query = `
      INSERT INTO vector_operations 
      (user_id, operation_type, vector_a, vector_b, vector_c, result) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [results] = await pool.execute(query, [
      user_id,
      operation_type,
      vector_a,
      vector_b,
      vector_c || null,
      result
    ]);
    return results;
  }

  static async findByUserId(user_id) {
    const query = 'SELECT * FROM vector_operations WHERE user_id = ? ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, [user_id]);
    return rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM vector_operations WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async deleteById(id, userId) {
    const query = 'DELETE FROM vector_operations WHERE id = ? AND user_id = ?';
    const [results] = await pool.execute(query, [id, userId]);
    return results;
  }
}

module.exports = VectorOperation;
