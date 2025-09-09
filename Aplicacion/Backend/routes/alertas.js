// =====================================================
// RUTAS DE ALERTAS CORREGIDAS - ENDPOINT GENERALIZADO
// Archivo: backend/routes/alertas.js - VERSIÓN GENERALIZADA
// =====================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// =====================================================
// ENDPOINT CORREGIDO: GET /api/alertas/evaluarUsuario/:usuarioId
// Ahora muestra alertas guardadas Y evalúa nuevas
// =====================================================
router.get('/evaluarUsuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { hours = 168 } = req.query;
        
    console.log(`🔍 Evaluando alertas para usuario ${usuarioId} (incluye alertas guardadas)`);
        
    // Obtener colmenas del usuario
    const [colmenas] = await pool.execute(`
      SELECT id, descripcion FROM colmena WHERE dueno = ?
    `, [usuarioId]);

    if (colmenas.length === 0) {
      return res.json({
        success: true,
        data: {
          alertas_por_colmena: [],
          resumen_general: {
            total_colmenas: 0,
            colmenas_con_alertas: 0,
            total_alertas_guardadas: 0,
            total_alertas_nuevas: 0
          }
        },
        message: 'Usuario no tiene colmenas registradas'
      });
    }

    const resultadosPorColmena = [];
    let totalAlertasGuardadas = 0;
    let totalAlertasNuevas = 0;

    // Evaluar cada colmena del usuario
    for (const colmena of colmenas) {
      try {
        console.log(`📋 Procesando colmena: ${colmena.id} (${colmena.descripcion})`);
                
        // **PASO 1: Obtener alertas YA GUARDADAS de la BD para esta colmena**
        const fechaLimiteAlertas = new Date(Date.now() - hours * 60 * 60 * 1000);
                
        const [alertasGuardadas] = await pool.execute(`
          SELECT 
            na.id as registro_id,
            na.nodo_id,
            na.alerta_id,
            na.fecha,
            a.nombre,
            a.indicador,
            a.descripcion,
            asu.sugerencia,
            n.descripcion as nodo_descripcion
          FROM nodo_alerta na
          JOIN alerta a ON na.alerta_id = a.id
          LEFT JOIN alerta_sugerencia asu ON a.id = asu.id
          LEFT JOIN nodo n ON na.nodo_id = n.id
          WHERE na.fecha >= ?
            AND na.nodo_id IN (
              SELECT nc.nodo_id FROM nodo_colmena nc WHERE nc.colmena_id = ?
              UNION
              SELECT ne.nodo_id FROM nodo_estacion ne 
               JOIN estacion e ON ne.estacion_id = e.id 
               WHERE e.dueno = ?
            )
          ORDER BY na.fecha DESC
        `, [fechaLimiteAlertas, colmena.id, usuarioId]);

        console.log(`📊 Encontradas ${alertasGuardadas.length} alertas guardadas para colmena ${colmena.id}`);

        // **PASO 2: Convertir alertas guardadas al formato esperado**
        const alertasFormateadas = alertasGuardadas.map(alertaGuardada => {
          // Determinar prioridad por ID de alerta
          const getPrioridadPorId = (id) => {
            const prioridadesMap = {
              'TI-TAC': 'CRÍTICA',
              'TI-TAP': 'PREVENTIVA',
              'TI-TBC-PI': 'CRÍTICA',
              'TE-TA': 'ALTA',
              'TE-TB': 'ALTA',
              'HI-HAC-PI': 'CRÍTICA',
              'HI-HAP-PI': 'PREVENTIVA',
              'HI-HBC-PV': 'CRÍTICA',
              'HI-HBP-PV': 'PREVENTIVA',
              'PE-E': 'ALTA',
              'PE-CPA': 'INFORMATIVA',
              'PE-DP-PI': 'ALTA',
              'TIE-TAC': 'CRÍTICA',
              'HIE-HAC': 'CRÍTICA'
            };
            return prioridadesMap[id] || 'MEDIA';
          };
          
          return {
            id: alertaGuardada.alerta_id,
            nombre: alertaGuardada.nombre,
            descripcion: alertaGuardada.descripcion,
            prioridad: getPrioridadPorId(alertaGuardada.alerta_id),
            indicador: alertaGuardada.indicador,
            valor: 'Alerta Registrada', // Placeholder ya que no tenemos el valor específico
            eventos: null,
            sugerencia: alertaGuardada.sugerencia,
            fecha: new Date(alertaGuardada.fecha),
            nodo_id: alertaGuardada.nodo_id,
            registro_id: alertaGuardada.registro_id,
            es_guardada: true, // Flag para identificar que viene de BD
            origen: 'base_datos'
          };
        });

        totalAlertasGuardadas += alertasGuardadas.length;

        // **PASO 3: Evaluar nuevas alertas en tiempo real (opcional)**
        // Puedes activar esto si quieres evaluar también nuevas alertas
        const evaluarNuevasAlertas = false; // Cambiar a true si quieres evaluación en tiempo real

        let alertasNuevas = [];
        if (evaluarNuevasAlertas) {
          const fechaLimiteMensajes = new Date(Date.now() - 24 * 60 * 60 * 1000); // Últimas 24h para nuevas evaluaciones
                    
          const [mensajes] = await pool.execute(`
            SELECT 
              nm.*,
              CASE 
                WHEN nm.topico LIKE '%interno%' THEN 'interno'
                WHEN nm.topico LIKE '%externo%' THEN 'externo'
                ELSE 'otro'
              END as tipo_sensor
            FROM nodo_mensaje nm
            WHERE nm.fecha >= ?
              AND nm.nodo_id IN (
                SELECT nc.nodo_id FROM nodo_colmena nc WHERE nc.colmena_id = ?
              )
              AND (nm.payload IS NOT NULL)
            ORDER BY nm.fecha DESC
          `, [fechaLimiteMensajes, colmena.id]);
          
          if (mensajes.length > 0) {
            // Procesar mensajes y evaluar alertas...
            // (Código de evaluación en tiempo real aquí si es necesario)
            console.log(`📊 ${mensajes.length} mensajes disponibles para evaluación en tiempo real`);
          }
        }

        // **PASO 4: Agregar resultado para esta colmena**
        if (alertasFormateadas.length > 0 || alertasNuevas.length > 0) {
          resultadosPorColmena.push({
            colmena: {
              id: colmena.id,
              nombre: colmena.descripcion || `Colmena #${colmena.id}`
            },
            alertas: [...alertasFormateadas, ...alertasNuevas],
            total_alertas_guardadas: alertasFormateadas.length,
            total_alertas_nuevas: alertasNuevas.length
          });
        }
       } catch (colmenaError) {
        console.error(`❌ Error procesando colmena ${colmena.id}:`, colmenaError);
      }
    }

    console.log(`✅ Procesamiento completado: ${totalAlertasGuardadas} alertas guardadas encontradas`);

    res.json({
      success: true,
      data: {
        alertas_por_colmena: resultadosPorColmena,
        resumen_general: {
          total_colmenas: colmenas.length,
          colmenas_con_alertas: resultadosPorColmena.length,
          total_alertas_guardadas: totalAlertasGuardadas,
          total_alertas_nuevas: totalAlertasNuevas,
          periodo_evaluado_horas: hours
        }
      },
      message: `Evaluación completada: ${totalAlertasGuardadas} alertas guardadas encontradas para ${colmenas.length} colmenas de ${usuarioId}`
    });
   } catch (error) {
    console.error('❌ Error en evaluación de usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// =====================================================
// ENDPOINT ESPECÍFICO: Obtener alertas guardadas por usuario
// =====================================================
router.get('/guardadas/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { hours = 168 } = req.query;
        
    console.log(`📋 Obteniendo alertas guardadas para usuario: ${usuarioId}`);
        
    const fechaLimite = new Date(Date.now() - hours * 60 * 60 * 1000);
        
    // Obtener todas las alertas guardadas del usuario
    const [alertasGuardadas] = await pool.execute(`
      SELECT 
        na.id as registro_id,
        na.nodo_id,
        na.alerta_id,
        na.fecha,
        a.nombre as alerta_nombre,
        a.indicador,
        a.descripcion as alerta_descripcion,
        asu.sugerencia,
        n.descripcion as nodo_descripcion,
        CASE 
          WHEN nc.colmena_id IS NOT NULL THEN CONCAT('Colmena: ', c.descripcion)
          WHEN ne.estacion_id IS NOT NULL THEN CONCAT('Estación: ', e.descripcion)
          ELSE 'Ubicación desconocida'
        END as ubicacion,
        COALESCE(c.id, e.id) as equipo_id
      FROM nodo_alerta na
      JOIN alerta a ON na.alerta_id = a.id
      LEFT JOIN alerta_sugerencia asu ON a.id = asu.id
      LEFT JOIN nodo n ON na.nodo_id = n.id
      LEFT JOIN nodo_colmena nc ON n.id = nc.nodo_id
      LEFT JOIN colmena c ON nc.colmena_id = c.id
      LEFT JOIN nodo_estacion ne ON n.id = ne.nodo_id
      LEFT JOIN estacion e ON ne.estacion_id = e.id
      WHERE na.fecha >= ?
        AND (c.dueno = ? OR e.dueno = ?)
      ORDER BY na.fecha DESC
    `, [fechaLimite, usuarioId, usuarioId]);

    console.log(`✅ Encontradas ${alertasGuardadas.length} alertas guardadas`);

    const alertasFormateadas = alertasGuardadas.map(alerta => ({
      id: alerta.alerta_id,
      registro_id: alerta.registro_id,
      nombre: alerta.alerta_nombre,
      descripcion: alerta.alerta_descripcion,
      indicador: alerta.indicador,
      nodo_id: alerta.nodo_id,
      nodo_descripcion: alerta.nodo_descripcion,
      ubicacion: alerta.ubicacion,
      equipo_id: alerta.equipo_id,
      fecha: alerta.fecha,
      sugerencia: alerta.sugerencia,
      es_guardada: true
    }));

    res.json({
      success: true,
      data: {
        alertas: alertasFormateadas,
        total: alertasGuardadas.length,
        usuario_id: usuarioId,
        periodo_horas: hours
      },
      message: `${alertasGuardadas.length} alertas guardadas obtenidas exitosamente`
    });
   } catch (error) {
    console.error('❌ Error obteniendo alertas guardadas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// =====================================================
// ENDPOINT GENERALIZADO: Prueba de alertas guardadas para cualquier usuario
// =====================================================
router.get('/test/:usuarioId/guardadas', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    
    console.log(`🧪 Probando alertas guardadas para usuario: ${usuarioId}...`);

    // **PASO 1: Obtener nodos del usuario (colmenas y estaciones)**
    const [nodosUsuario] = await pool.execute(`
      SELECT DISTINCT
        n.id as nodo_id,
        n.descripcion as nodo_descripcion,
        CASE 
          WHEN nc.colmena_id IS NOT NULL THEN CONCAT('Colmena: ', c.descripcion)
          WHEN ne.estacion_id IS NOT NULL THEN CONCAT('Estación: ', e.descripcion)
          ELSE 'Tipo desconocido'
        END as tipo_equipo,
        COALESCE(c.id, e.id) as equipo_id
      FROM nodo n
      LEFT JOIN nodo_colmena nc ON n.id = nc.nodo_id
      LEFT JOIN colmena c ON nc.colmena_id = c.id AND c.dueno = ?
      LEFT JOIN nodo_estacion ne ON n.id = ne.nodo_id
      LEFT JOIN estacion e ON ne.estacion_id = e.id AND e.dueno = ?
      WHERE (c.dueno = ? OR e.dueno = ?)
    `, [usuarioId, usuarioId, usuarioId, usuarioId]);

    console.log(`📋 Encontrados ${nodosUsuario.length} nodos para el usuario ${usuarioId}`);

    if (nodosUsuario.length === 0) {
      return res.json({
        success: true,
        data: {
          usuario: usuarioId,
          mensaje: 'Usuario no tiene nodos registrados (colmenas o estaciones)',
          nodos_encontrados: [],
          alertas_guardadas: [],
          estadisticas: {
            nodos_totales: 0,
            alertas_guardadas_total: 0,
            alertas_por_tipo: {}
          }
        }
      });
    }

    // **PASO 2: Obtener alertas guardadas para esos nodos**
    const nodosIds = nodosUsuario.map(n => n.nodo_id);
    const placeholders = nodosIds.map(() => '?').join(',');

    const [alertasUsuario] = await pool.execute(`
      SELECT 
        na.id,
        na.nodo_id,
        na.alerta_id,
        na.fecha,
        a.nombre,
        a.descripcion,
        asu.sugerencia,
        n.descripcion as nodo_descripcion
      FROM nodo_alerta na
      JOIN alerta a ON na.alerta_id = a.id
      LEFT JOIN alerta_sugerencia asu ON a.id = asu.id
      LEFT JOIN nodo n ON na.nodo_id = n.id
      WHERE na.nodo_id IN (${placeholders})
      ORDER BY na.fecha DESC
    `, nodosIds);

    // **PASO 3: Verificar colmenas del usuario**
    const [colmenasUsuario] = await pool.execute(`
      SELECT * FROM colmena WHERE dueno = ?
    `, [usuarioId]);

    // **PASO 4: Verificar estaciones del usuario**
    const [estacionesUsuario] = await pool.execute(`
      SELECT * FROM estacion WHERE dueno = ?
    `, [usuarioId]);

    // **PASO 5: Calcular estadísticas**
    const stats = {
      nodos_totales: nodosUsuario.length,
      colmenas_registradas: colmenasUsuario.length,
      estaciones_registradas: estacionesUsuario.length,
      alertas_guardadas_total: alertasUsuario.length,
      alertas_por_tipo: {},
      alertas_por_nodo: {}
    };

    // Contar alertas por tipo
    alertasUsuario.forEach(alerta => {
      stats.alertas_por_tipo[alerta.alerta_id] = 
        (stats.alertas_por_tipo[alerta.alerta_id] || 0) + 1;
      
      stats.alertas_por_nodo[alerta.nodo_id] = 
        (stats.alertas_por_nodo[alerta.nodo_id] || 0) + 1;
    });

    // **PASO 6: Preparar respuesta detallada**
    const nodosList = nodosUsuario.map(nodo => ({
      id: nodo.nodo_id,
      descripcion: nodo.nodo_descripcion,
      tipo: nodo.tipo_equipo,
      alertas_count: stats.alertas_por_nodo[nodo.nodo_id] || 0
    }));

    res.json({
      success: true,
      data: {
        usuario: usuarioId,
        estadisticas: stats,
        nodos_usuario: nodosList,
        alertas_guardadas: alertasUsuario,
        colmenas: colmenasUsuario,
        estaciones: estacionesUsuario,
        resumen: {
          mensaje: `Usuario ${usuarioId} tiene ${nodosUsuario.length} nodos monitoreados`,
          equipos: `${colmenasUsuario.length} colmenas + ${estacionesUsuario.length} estaciones`,
          alertas_encontradas: alertasUsuario.length
        }
      },
      message: `Prueba completada: ${alertasUsuario.length} alertas guardadas encontradas para ${usuarioId}`
    });
   } catch (error) {
    console.error(`❌ Error en prueba de alertas para usuario ${req.params.usuarioId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error ejecutando prueba',
      details: error.message
    });
  }
});

// =====================================================
// ENDPOINT: Obtener todas las alertas definidas
// =====================================================
router.get('/', async (req, res) => {
  try {
    console.log('📋 Obteniendo todas las alertas definidas...');
        
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.indicador,
        a.descripcion,
        asu.sugerencia
      FROM alerta a
      LEFT JOIN alerta_sugerencia asu ON a.id = asu.id
      ORDER BY a.id
    `;
        
    const [alertas] = await pool.execute(query);
        
    console.log(`✅ Encontradas ${alertas.length} alertas definidas`);
        
    res.json({
      success: true,
      data: alertas,
      message: `${alertas.length} alertas definidas obtenidas exitosamente`
    });
       } catch (error) {
    console.error('❌ Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// =====================================================
// ENDPOINT: Obtener sugerencias de una alerta
// =====================================================
router.get('/sugerencias/:alertaId', async (req, res) => {
  try {
    const { alertaId } = req.params;
        
    const [sugerencia] = await pool.execute(`
      SELECT a.id, a.nombre, a.descripcion, asu.sugerencia
      FROM alerta a
      LEFT JOIN alerta_sugerencia asu ON a.id = asu.id
      WHERE a.id = ?
    `, [alertaId]);

    if (sugerencia.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alerta no encontrada'
      });
    }

    // Procesar sugerencias en formato lista
    const sugerenciasArray = sugerencia[0].sugerencia 
      ? sugerencia[0].sugerencia.split(/\d+\./).filter(s => s.trim().length > 0)
      : [];

    res.json({
      success: true,
      data: {
        alerta: {
          id: sugerencia[0].id,
          nombre: sugerencia[0].nombre,
          descripcion: sugerencia[0].descripcion
        },
        sugerencias: sugerenciasArray,
        total_sugerencias: sugerenciasArray.length
      },
      message: 'Sugerencias obtenidas exitosamente'
    });
   } catch (error) {
    console.error('❌ Error obteniendo sugerencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// =====================================================
// ENDPOINT: Registrar nueva alerta manualmente
// =====================================================
router.post('/registrar', async (req, res) => {
  try {
    const { nodo_id, alerta_id } = req.body;

    if (!nodo_id || !alerta_id) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere nodo_id y alerta_id'
      });
    }

    // Insertar alerta
    const [result] = await pool.execute(`
      INSERT INTO nodo_alerta (nodo_id, alerta_id, fecha)
      VALUES (?, ?, NOW())
    `, [nodo_id, alerta_id]);

    console.log(`✅ Alerta ${alerta_id} registrada para nodo ${nodo_id} (ID: ${result.insertId})`);

    res.json({
      success: true,
      data: {
        alerta_id: result.insertId,
        nodo_id: nodo_id,
        tipo_alerta: alerta_id,
        fecha: new Date()
      },
      message: 'Alerta registrada exitosamente'
    });
   } catch (error) {
    console.error('❌ Error registrando alerta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;