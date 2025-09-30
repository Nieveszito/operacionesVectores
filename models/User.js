const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static create(userData, callback) {
    const { username, email, password } = userData;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return callback(err);
      
      const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      db.execute(query, [username, email, hashedPassword], (err, results) => {
        if (err) return callback(err);
        callback(null, results);
      });
    });
  }

  static findByEmail(email, callback) {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.execute(query, [email], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }

  static findById(id, callback) {
    const query = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
    db.execute(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }

  static comparePassword(password, hashedPassword, callback) {
    bcrypt.compare(password, hashedPassword, callback);
  }
}

module.exports = User;