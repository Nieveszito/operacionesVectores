const mysql = require('mysql2');
require('dotenv').config();

let connection;

if (process.env.MYSQL_URL) {
  // Railway: usa la URL completa
  connection = mysql.createConnection(process.env.MYSQL_URL);
} else {
  // Local: usa tus variables
  connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vector_db'
  });
}

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL: ' + err.stack);
    return;
  }
  console.log('Conectado a la base de datos exitosamente');
});

module.exports = connection;
