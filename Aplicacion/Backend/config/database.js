const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración para MySQL local
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',      // tu usuario local
    password: process.env.DB_PASSWORD || '',  // tu contraseña local
    database: process.env.DB_NAME || 'smartbee', // tu DB local
    // No SSL para conexión local
};

const pool = mysql.createPool(dbConfig);

// Wrapper para manejar errores de base de datos
const safeDbQuery = async (queryFn, fallbackValue = []) => {
    try {
        return await queryFn();
    } catch (error) {
        console.error('💥 Database Error:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sql: error.sql
        });
        return fallbackValue;
    }
};

module.exports = {
    dbConfig,
    pool,
    safeDbQuery
};
