const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear el Pool de conexiones a MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vector_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Inicializar Tablas automáticamente
async function initializeDB() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado a la base de datos MySQL local.');
        
        // Tabla de usuarios
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla del historial de operaciones vectoriales
        await connection.query(`
            CREATE TABLE IF NOT EXISTS vector_operations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                operation_type VARCHAR(50) NOT NULL,
                vector_a TEXT,
                vector_b TEXT,
                vector_c TEXT,
                result TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        connection.release();
        console.log('✅ Tablas MySQL verificadas/creadas correctamente.');
    } catch (err) {
        console.error('❌ Error al conectar o inicializar MySQL:', err.message);
        console.error('👉 Asegúrate de tener XAMPP/WAMP encendido, MySQL corriendo, y haber creado la base de datos:', process.env.DB_NAME || 'vector_db');
    }
}

initializeDB();

module.exports = pool;
