const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar configuraciones y middlewares
const { dbConfig, pool } = require('./config/database');
const corsConfig = require('./config/cors');
const { loggingMiddleware, errorHandler, notFoundHandler } = require('./middleware/general');

// Importar rutas
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const beehiveRoutes = require('./routes/beehives');
const nodeRoutes = require('./routes/nodes');
const nodeTypeRoutes = require('./routes/node-types');
const dashboardRoutes = require('./routes/dashboard');
const debugRoutes = require('./routes/debug');
const diagnosticRoutes = require('./routes/diagnostic');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');
const stationRoutes = require('./routes/stations');
const alertasRoutes = require('./routes/alertas');

const app = express();
const PORT = process.env.PORT || 3004;

// Middlewares globales
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// =============================================
// RUTAS BÁSICAS Y DE SALUD
// =============================================
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'SmartBee API funcionando correctamente',
        timestamp: new Date().toISOString(),
        database: 'MySQL Local'
    });
});

app.get('/api/test-connection', async (req, res) => {
    let connection;
    try {
        console.log('🔗 Probando conexión...');
        connection = await pool.getConnection();
        console.log('✅ Conexión obtenida');
        
        const [result] = await connection.execute('SELECT 1 as test, NOW() as time');
        console.log('✅ Query ejecutada:', result[0]);
        
        res.json({ 
            success: true, 
            result: result[0],
            message: 'Conexión exitosa'
        });
        
    } catch (error) {
        console.error('💥 Error de conexión:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            code: error.code 
        });
    } finally {
        if (connection) {
            connection.release();
            console.log('🔓 Conexión liberada');
        }
    }
});

// =============================================
// REGISTRAR TODAS LAS RUTAS
// =============================================
app.use('/api/usuarios', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/colmenas', beehiveRoutes);
app.use('/api/nodos', nodeRoutes);
app.use('/api/nodo-tipos', nodeTypeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mensajes', messageRoutes);
app.use('/api/nodo-mensajes', messageRoutes);
app.use('/api/estaciones', stationRoutes);
app.use('/api/alertas', alertasRoutes);

// Rutas de compatibilidad
app.get('/api/revisiones', (req, res) => {
    console.log('📝 Obteniendo revisiones...');
    res.json([]);
});

app.post('/api/revisiones', (req, res) => {
    res.json({ 
        message: 'Funcionalidad de revisiones pendiente de implementación',
        id: Date.now()
    });
});

app.get('/api/select/usuarios', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT id, nombre, apellido FROM usuario ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo usuarios para select:', error);
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/colmenas/activas', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(`
            SELECT id, CONCAT('Colmena #', id) as nombre FROM colmena ORDER BY id
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo colmenas activas:', error);
        res.status(500).json({ error: 'Error obteniendo colmenas activas' });
    } finally {
        if (connection) connection.release();
    }
});

// =============================================
// MIDDLEWARES DE MANEJO DE ERRORES PARA API
// =============================================
app.use(errorHandler);

// =============================================
// SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND (PRODUCCIÓN)
// =============================================
// Servir archivos estáticos desde la carpeta build de React
app.use(express.static(path.join(__dirname, '../build')));

// Para cualquier ruta que no sea /api/*, servir index.html del frontend
app.get('*', (req, res) => {
    // Si es una petición a la API que llegó hasta aquí, es un 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint no encontrado' });
    }
    // Para todo lo demás, servir el frontend
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// =============================================
// INICIAR SERVIDOR
// =============================================
const startServer = async () => {
    try {
        console.log('🔄 Probando conexión a MySQL local...');
        const connection = await pool.getConnection();
        console.log('✅ Conexión exitosa a MySQL local (127.0.0.1:3306)');
        connection.release();
        
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(60));
            console.log('🐝 SmartBee - Servidor Unificado');
            console.log('='.repeat(60));
            console.log(`🚀 Servidor ejecutándose en puerto: ${PORT}`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`📡 API Backend: http://localhost:${PORT}/api`);
            console.log(`🗄️  Base de Datos: MySQL (127.0.0.1:3306)`);
            console.log('='.repeat(60));
            console.log('📋 Endpoints API principales:');
            console.log(`   ✅ GET  /api/health - Estado del servidor`);
            console.log(`   ✅ POST /api/usuarios/login - Autenticación`);
            console.log(`   ✅ GET  /api/dashboard/stats - Dashboard`);
            console.log(`   ✅ GET  /api/colmenas - Lista de colmenas`);
            console.log(`   ✅ GET  /api/alertas/usuario/:id - Alertas`);
            console.log('='.repeat(60));
            console.log('💡 Modo: PRODUCCIÓN (Sirviendo frontend y backend)');
            console.log('💡 Tip: Para desarrollo, usa: npm run dev');
            console.log('='.repeat(60) + '\n');
        });
    } catch (error) {
        console.error('\n❌ Error conectando a MySQL local:', error.message);
        console.error('⚠️  El servidor continuará pero sin acceso a base de datos\n');
        
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(60));
            console.log('⚠️  SmartBee - Servidor sin DB');
            console.log('='.repeat(60));
            console.log(`🚀 Servidor ejecutándose en puerto: ${PORT}`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`📡 API Backend: http://localhost:${PORT}/api`);
            console.log(`❌ Base de Datos: NO CONECTADA`);
            console.log('='.repeat(60));
            console.log('💡 Asegúrate de que MySQL esté corriendo en puerto 3306');
            console.log('💡 Verifica las credenciales en el archivo .env');
            console.log('='.repeat(60) + '\n');
        });
    }
};

startServer();

process.on('SIGINT', async () => {
    console.log('\n🔄 Cerrando servidor...');
    await pool.end();
    console.log('✅ Pool de conexiones cerrado');
    process.exit(0);
});

module.exports = app;