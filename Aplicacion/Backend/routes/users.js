const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const router = express.Router();

// =============================================
// RUTA DE LOGIN - ENDPOINT PRINCIPAL
// =============================================
router.post('/login', async (req, res) => {
    let connection;
    try {
        const { ID, password, nombre, apellido } = req.body || {};
        console.log('🔐 Intento de login:', req.body);

        // Validaciones básicas
        if (!password || password.trim() === '') {
            console.log('❌ Password faltante o vacío');
            return res.status(400).json({ error: 'La contraseña es requerida' });
        }

        if ((!ID || ID.trim() === '') && (!nombre || !apellido)) {
            console.log('❌ Faltan credenciales de identificación');
            return res.status(400).json({ error: 'Se requiere ID o nombre y apellido' });
        }

        // Conexión a BD
        connection = await pool.getConnection();

        let usuario = null;

        // Buscar por ID
        if (ID && ID.trim()) {
            const [rows] = await connection.execute(`
                SELECT u.id, u.clave, u.nombre, u.apellido, u.comuna, u.rol, u.activo,
                       r.descripcion as rol_descripcion
                FROM usuario u
                LEFT JOIN rol r ON u.rol = r.rol
                WHERE u.id = ? AND u.activo = 1
            `, [ID.trim()]);

            if (rows.length > 0) usuario = rows[0];
        }

        // Buscar por nombre y apellido
        if (!usuario && nombre && apellido) {
            const [rows] = await connection.execute(`
                SELECT u.id, u.clave, u.nombre, u.apellido, u.comuna, u.rol, u.activo,
                       r.descripcion as rol_descripcion
                FROM usuario u
                LEFT JOIN rol r ON u.rol = r.rol
                WHERE LOWER(TRIM(u.nombre)) = LOWER(TRIM(?))
                  AND LOWER(TRIM(u.apellido)) = LOWER(TRIM(?))
                  AND u.activo = 1
            `, [nombre.trim(), apellido.trim()]);

            if (rows.length > 0) usuario = rows[0];
        }

        if (!usuario) {
            console.log('❌ Usuario no encontrado');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Validar que la contraseña exista
        if (!usuario.clave || typeof usuario.clave !== 'string') {
            console.log('❌ Usuario no tiene contraseña válida');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        let validPassword = false;
        try {
            if (usuario.clave.startsWith('$2a$') || usuario.clave.startsWith('$2b$')) {
                validPassword = await bcrypt.compare(password, usuario.clave);
            } else {
                validPassword = usuario.clave === password;
            }
        } catch (err) {
            console.error('💥 Error comparando contraseña:', err);
            return res.status(500).json({ error: 'Error interno al verificar contraseña' });
        }

        if (!validPassword) {
            console.log('❌ Contraseña inválida para usuario:', usuario.id);
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        console.log('✅ Login exitoso:', usuario.id);

        // Generar token simple (reemplazar por JWT en producción)
        const token = `smartbee_${usuario.id}_${Date.now()}`;

        res.json({
            data: {
                token,
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    ID: usuario.id,
                    comuna: usuario.comuna,
                    rol: usuario.rol,
                    rol_nombre: usuario.rol_descripcion || 'Usuario'
                }
            },
            message: 'Login exitoso'
        });

    } catch (error) {
        console.error('💥 Error en login GENERAL:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    } finally {
        if (connection) connection.release();
    }
});


// =============================================
// OBTENER TODOS LOS USUARIOS
// =============================================
router.get('/', async (req, res) => {
    let connection;
    try {
        console.log('📋 Obteniendo lista de usuarios...');
        
        connection = await pool.getConnection();
        
        const [rows] = await connection.execute(`
            SELECT u.id, u.nombre, u.apellido, u.comuna, u.rol, u.activo,
                r.descripcion as rol_nombre
            FROM usuario u 
            LEFT JOIN rol r ON u.rol = r.rol 
            WHERE u.activo = 1
            ORDER BY u.apellido ASC, u.nombre ASC
        `);
        
        // Formatear para compatibilidad con frontend
        const usuarios = rows.map(user => ({
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            comuna: user.comuna,
            ID: user.id, // Compatibilidad
            telefono: '', // Campo requerido por frontend
            fecha_registro: new Date().toISOString(), // Campo requerido por frontend
            rol: user.rol,
            rol_nombre: user.rol_nombre || 'Usuario',
            activo: user.activo
        }));
        
        console.log('✅ Usuarios obtenidos:', usuarios.length);
        res.json(usuarios);
        
    } catch (error) {
        console.error('💥 Error obteniendo usuarios:', error);
        res.status(500).json({ 
            error: 'Error obteniendo usuarios',
            details: error.message 
        });
    } finally {
        if (connection) connection.release();
    }
});

// =============================================
// OBTENER USUARIO POR ID
// =============================================
router.get('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        console.log(`🔍 Obteniendo usuario: ${id}`);
        
        connection = await pool.getConnection();
        
        const [rows] = await connection.execute(`
            SELECT u.id, u.nombre, u.apellido, u.comuna, u.rol, u.activo,
                r.descripcion as rol_nombre
            FROM usuario u
            LEFT JOIN rol r ON u.rol = r.rol
            WHERE u.id = ? AND u.activo = 1
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = rows[0];
        
        // Formatear respuesta
        const usuarioFormateado = {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            comuna: usuario.comuna,
            ID: usuario.id,
            telefono: '',
            fecha_registro: new Date().toISOString(),
            rol: usuario.rol,
            rol_nombre: usuario.rol_nombre || 'Usuario',
            activo: usuario.activo
        };
        
        console.log('✅ Usuario obtenido:', usuario.id);
        res.json(usuarioFormateado);
        
    } catch (error) {
        console.error('💥 Error obteniendo usuario por ID:', error);
        res.status(500).json({ 
            error: 'Error obteniendo usuario',
            details: error.message 
        });
    } finally {
        if (connection) connection.release();
    }
});

// =============================================
// CREAR NUEVO USUARIO
// =============================================
router.post('/', async (req, res) => {
    let connection;
    try {
        console.log('➕ Creando nuevo usuario...');
        console.log('📋 Datos recibidos:', req.body);
        
        connection = await pool.getConnection();
        
        // Extraer y validar datos
        const { id, nombre, apellido, comuna, clave, rol, activo } = req.body;
        
        console.log('📝 Datos procesados:', { 
            id: id ? `"${id}"` : '[AUTO-GENERADO]', 
            nombre: `"${nombre}"`, 
            apellido: `"${apellido}"`, 
            comuna: `"${comuna}"`,
            rol: `"${rol}"`,
            activo: activo
        });
        
        // VALIDACIONES
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }
        
        if (!apellido || apellido.trim() === '') {
            return res.status(400).json({ error: 'El apellido es obligatorio' });
        }

        if (!comuna || comuna.trim() === '') {
            return res.status(400).json({ error: 'La comuna es obligatoria' });
        }
        
        if (!clave || clave.trim() === '') {
            return res.status(400).json({ error: 'La clave es obligatoria' });
        }
        
        if (!rol || rol.trim() === '') {
            return res.status(400).json({ error: 'El rol es obligatorio' });
        }
        
        // Generar ID si no se proporciona
        const userId = id && id.trim() ? id.trim() : `USR_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        console.log('🆔 ID a usar:', userId);
        
        // Verificar que el ID no exista
        const [existingUser] = await connection.execute('SELECT id FROM usuario WHERE id = ?', [userId]);
        if (existingUser.length > 0) {
            return res.status(400).json({ 
                error: `Ya existe un usuario con el ID: ${userId}` 
            });
        }
        
        // Verificar que el rol existe
        const [rolExists] = await connection.execute('SELECT rol FROM rol WHERE rol = ?', [rol.trim()]);
        if (rolExists.length === 0) {
            return res.status(400).json({ 
                error: `El rol '${rol}' no existe. Roles válidos: ADM, API` 
            });
        }
        
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(clave.trim(), 12);
        console.log('🔐 Contraseña hasheada exitosamente');
        
        // Insertar usuario
        const insertQuery = `
            INSERT INTO usuario (id, clave, nombre, apellido, comuna, rol, activo) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
            userId, 
            hashedPassword,
            nombre.trim(), 
            apellido.trim(), 
            comuna.trim(),
            rol.trim(), 
            activo !== undefined ? (activo ? 1 : 0) : 1
        ];
        
        console.log('💾 Ejecutando INSERT...');
        const [result] = await connection.execute(insertQuery, insertParams);
        
        console.log('✅ Usuario creado exitosamente con ID:', userId);
        
        // Respuesta exitosa
        res.status(201).json({ 
            success: true,
            message: 'Usuario creado exitosamente',
            usuario: {
                id: userId,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                comuna: comuna.trim(),
                ID: userId,
                telefono: '',
                fecha_registro: new Date().toISOString(),
                rol: rol.trim(),
                rol_nombre: 'Usuario',
                activo: activo !== undefined ? (activo ? 1 : 0) : 1
            }
        });
        
    } catch (error) {
        console.error('💥 Error creando usuario:', error);
        
        // Manejo específico de errores
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                error: 'Ya existe un usuario con ese ID'
            });
        }
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ 
                error: 'El rol especificado no existe'
            });
        }
        
        res.status(500).json({ 
            error: 'Error creando usuario',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    } finally {
        if (connection) connection.release();
    }
});

// =============================================
// ACTUALIZAR USUARIO
// =============================================
router.put('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nombre, apellido, comuna, clave, rol, activo } = req.body;
        
        console.log(`✏️ Actualizando usuario ${id}:`, req.body);
        
        connection = await pool.getConnection();
        
        // Verificar que el usuario existe
        const [userExists] = await connection.execute('SELECT id FROM usuario WHERE id = ? AND activo = 1', [id]);
        if (userExists.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Validar campos requeridos
        if (!nombre || !apellido || !comuna || !rol) {
            return res.status(400).json({ 
                error: 'Nombre, apellido, comuna y rol son obligatorios' 
            });
        }
        
        // Verificar que el rol existe
        const [rolExists] = await connection.execute('SELECT rol FROM rol WHERE rol = ?', [rol]);
        if (rolExists.length === 0) {
            return res.status(400).json({ 
                error: `El rol '${rol}' no existe. Roles válidos: ADM, API` 
            });
        }
        
        // Preparar consulta de actualización
        let updateQuery;
        let updateParams;
        
        if (clave && clave.trim()) {
            // Actualizar con nueva clave
            const hashedPassword = await bcrypt.hash(clave.trim(), 12);
            console.log('🔐 Nueva contraseña hasheada');
            
            updateQuery = `
                UPDATE usuario 
                SET nombre = ?, apellido = ?, comuna = ?, clave = ?, rol = ?, activo = ?
                WHERE id = ?
            `;
            updateParams = [
                nombre.trim(), 
                apellido.trim(), 
                comuna.trim(), 
                hashedPassword, 
                rol, 
                activo !== undefined ? (activo ? 1 : 0) : 1,
                id
            ];
        } else {
            // Actualizar sin cambiar la clave
            updateQuery = `
                UPDATE usuario 
                SET nombre = ?, apellido = ?, comuna = ?, rol = ?, activo = ?
                WHERE id = ?
            `;
            updateParams = [
                nombre.trim(), 
                apellido.trim(), 
                comuna.trim(), 
                rol, 
                activo !== undefined ? (activo ? 1 : 0) : 1,
                id
            ];
        }
        
        // Ejecutar actualización
        await connection.execute(updateQuery, updateParams);
        
        console.log('✅ Usuario actualizado:', id);
        
        // Obtener usuario actualizado
        const [updatedUser] = await connection.execute(`
            SELECT u.id, u.nombre, u.apellido, u.comuna, u.rol, u.activo,
                r.descripcion as rol_nombre
            FROM usuario u
            LEFT JOIN rol r ON u.rol = r.rol
            WHERE u.id = ?
        `, [id]);
        
        const usuario = updatedUser[0];
        
        res.json({ 
            message: 'Usuario actualizado correctamente',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                comuna: usuario.comuna,
                ID: usuario.id,
                telefono: '',
                fecha_registro: new Date().toISOString(),
                rol: usuario.rol,
                rol_nombre: usuario.rol_nombre || 'Usuario',
                activo: usuario.activo
            }
        });
        
    } catch (error) {
        console.error('💥 Error actualizando usuario:', error);
        res.status(500).json({ 
            error: 'Error actualizando usuario',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    } finally {
        if (connection) connection.release();
    }
});

// =============================================
// ELIMINAR USUARIO (SOFT DELETE)
// =============================================
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        
        console.log(`🗑️ Eliminando usuario ${id}`);
        
        connection = await pool.getConnection();
        
        // Verificar que el usuario existe
        const [userExists] = await connection.execute('SELECT id, nombre, apellido FROM usuario WHERE id = ? AND activo = 1', [id]);
        if (userExists.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = userExists[0];
        
        // Verificar si el usuario tiene colmenas asociadas
        const [colmenasAsociadas] = await connection.execute('SELECT COUNT(*) as count FROM colmena WHERE dueno = ?', [id]);
        
        if (colmenasAsociadas[0].count > 0) {
            return res.status(400).json({ 
                error: `No se puede eliminar el usuario porque tiene ${colmenasAsociadas[0].count} colmena(s) asociada(s). Primero transfiere o elimina las colmenas.`
            });
        }
        
        // Soft delete - marcar como inactivo
        await connection.execute('UPDATE usuario SET activo = 0 WHERE id = ?', [id]);
        
        console.log('✅ Usuario marcado como inactivo:', id);
        res.json({ 
            message: `Usuario "${usuario.nombre} ${usuario.apellido}" eliminado correctamente`,
            id: id
        });
        
    } catch (error) {
        console.error('💥 Error eliminando usuario:', error);
        
        // Error específico para foreign key constraint
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ 
                error: 'No se puede eliminar el usuario porque tiene registros asociados (colmenas, estaciones, etc.)'
            });
        }
        
        res.status(500).json({ 
            error: 'Error eliminando usuario',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;