// backend/routes/alertas.js - VERSIÓN MEJORADA
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// =============================================
// OBTENER TODAS LAS ALERTAS DEFINIDAS
// =============================================
router.get('/', async (req, res) => {
  try {
    const [alertas] = await pool.execute(`
      SELECT * FROM alerta 
      ORDER BY id
    `);
    
    res.json({
      success: true,
      data: alertas,
      message: 'Alertas obtenidas exitosamente'
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

// =============================================
// FUNCIÓN HELPER PARA VERIFICAR Y GUARDAR ALERTAS
// =============================================
const verificarYGuardarAlerta = async (nodo_id, alerta_id, valorActual = null, metadatos = {}) => {
  try {
    // Verificar si ya existe una alerta similar en las últimas 6 horas para evitar spam
    const hace6h = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const [alertaExistente] = await pool.execute(`
      SELECT id, fecha FROM nodo_alerta 
      WHERE nodo_id = ? AND alerta_id = ? AND fecha >= ?
      ORDER BY fecha DESC LIMIT 1
    `, [nodo_id, alerta_id, hace6h]);

    if (alertaExistente.length === 0) {
      // Insertar nueva alerta con metadatos opcionales
      const metadatosJson = JSON.stringify({
        valor_detectado: valorActual,
        timestamp_evaluacion: new Date().toISOString(),
        ...metadatos
      });

      const [result] = await pool.execute(`
        INSERT INTO nodo_alerta (nodo_id, alerta_id, fecha)
        VALUES (?, ?, NOW(3))
      `, [nodo_id, alerta_id]);
      
      console.log(`✅ Nueva alerta ${alerta_id} registrada para nodo ${nodo_id} (ID: ${result.insertId})`);
      
      return {
        insertada: true,
        alerta_id: result.insertId,
        es_nueva: true
      };
    } else {
      console.log(`ℹ️ Alerta ${alerta_id} ya existe para nodo ${nodo_id} (última: ${alertaExistente[0].fecha})`);
      return {
        insertada: false,
        alerta_id: alertaExistente[0].id,
        es_nueva: false,
        ultima_fecha: alertaExistente[0].fecha
      };
    }
  } catch (error) {
    console.error(`❌ Error guardando alerta ${alerta_id} para nodo ${nodo_id}:`, error);
    return { insertada: false, error: error.message };
  }
};

// =============================================
// FUNCIÓN MEJORADA PARA EVALUAR CONDICIONES DE ALERTAS
// =============================================
const evaluarCondicionMejorada = async (alertaId, alertaDefinida, datos, nodo_id) => {
  if (!datos || datos.length === 0) return null;
  
  const ahora = new Date();
  const ultimaLectura = datos[0];
  
  // Períodos de tiempo para evaluación
  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  const hace48h = new Date(ahora.getTime() - 48 * 60 * 60 * 1000);
  const hace6h = new Date(ahora.getTime() - 6 * 60 * 60 * 1000);
  const hace30dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Filtrar datos por períodos
  const datos24h = datos.filter(d => new Date(d.fecha_hora) >= hace24h);
  const datos48h = datos.filter(d => new Date(d.fecha_hora) >= hace48h);
  const datos6h = datos.filter(d => new Date(d.fecha_hora) >= hace6h);
  const datos30dias = datos.filter(d => new Date(d.fecha_hora) >= hace30dias);
  
  // Determinar período estacional
  const mes = ahora.getMonth() + 1;
  const esInvernada = mes >= 3 && mes <= 7;
  const esPrimaveraVerano = mes >= 8 || mes <= 2;
  const esEnjarbrazon = (mes >= 8 && mes <= 12) || mes === 1;
  const esCosecha = mes >= 11 || mes <= 3;

  let resultado = null;

  switch (alertaId) {
    // ========== ALERTAS DE TEMPERATURA INTERNA ==========
    case 'ALERT001': {
      // Temperatura Alta Crítica >38°C, 8 eventos en 24h
      const eventosAltos = datos24h.filter(d => 
        d.temperatura && parseFloat(d.temperatura) > 38
      );
      
      if (eventosAltos.length >= 8) {
        const temperaturaPromedio = eventosAltos.reduce((sum, d) => sum + parseFloat(d.temperatura), 0) / eventosAltos.length;
        const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, ultimaLectura.temperatura, {
          eventos_detectados: eventosAltos.length,
          temperatura_promedio: temperaturaPromedio.toFixed(1),
          periodo_evaluacion: '24h'
        });
        
        resultado = {
          activada: true,
          valor: ultimaLectura.temperatura,
          eventos: eventosAltos.length,
          temperatura_promedio: temperaturaPromedio.toFixed(1),
          prioridad: 'CRÍTICA',
          nodo_id: nodo_id,
          guardado: resultadoGuardado
        };
      }
      break;
    }

    case 'ALERT002': {
      // Temperatura Alta Preventiva 36-37°C, 8 eventos en 24h
      const eventosPreventivos = datos24h.filter(d => {
        if (!d.temperatura) return false;
        const temp = parseFloat(d.temperatura);
        return temp >= 36 && temp <= 37;
      });
      
      if (eventosPreventivos.length >= 8) {
        const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, ultimaLectura.temperatura, {
          eventos_detectados: eventosPreventivos.length,
          rango_temperatura: '36-37°C',
          periodo_evaluacion: '24h'
        });
        
        resultado = {
          activada: true,
          valor: ultimaLectura.temperatura,
          eventos: eventosPreventivos.length,
          prioridad: 'PREVENTIVA',
          nodo_id: nodo_id,
          guardado: resultadoGuardado
        };
      }
      break;
    }

    case 'ALERT003': {
      // Temperatura Baja Crítica Invernada <12°C, 8 eventos en 24h
      if (!esInvernada) break;
      
      const eventosBajos = datos24h.filter(d => 
        d.temperatura && parseFloat(d.temperatura) < 12
      );
      
      if (eventosBajos.length >= 8) {
        const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, ultimaLectura.temperatura, {
          eventos_detectados: eventosBajos.length,
          periodo_invernada: true,
          temperatura_minima: Math.min(...eventosBajos.map(d => parseFloat(d.temperatura)))
        });
        
        resultado = {
          activada: true,
          valor: ultimaLectura.temperatura,
          eventos: eventosBajos.length,
          prioridad: 'CRÍTICA',
          nodo_id: nodo_id,
          guardado: resultadoGuardado
        };
      }
      break;
    }

    case 'ALERT004': {
      // Temperatura Baja Preventiva Invernada 13-15°C, 8 eventos en 24h
      if (!esInvernada) break;
      
      const eventosPreventivos = datos24h.filter(d => {
        if (!d.temperatura) return false;
        const temp = parseFloat(d.temperatura);
        return temp >= 13 && temp <= 15;
      });
      
      if (eventosPreventivos.length >= 8) {
        const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, ultimaLectura.temperatura, {
          eventos_detectados: eventosPreventivos.length,
          periodo_invernada: true,
          rango_temperatura: '13-15°C'
        });
        
        resultado = {
          activada: true,
          valor: ultimaLectura.temperatura,
          eventos: eventosPreventivos.length,
          prioridad: 'PREVENTIVA',
          nodo_id: nodo_id,
          guardado: resultadoGuardado
        };
      }
      break;
    }

    // ========== ALERTAS DE HUMEDAD ==========
    case 'ALERT007': {
      // Humedad Alta Crítica Invernada >70%
      if (!esInvernada) break;
      
      if (ultimaLectura.humedad && parseFloat(ultimaLectura.humedad) > 70) {
        const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, ultimaLectura.humedad, {
          periodo_invernada: true,
          humedad_detectada: parseFloat(ultimaLectura.humedad)
        });
        
        resultado = {
          activada: true,
          valor: ultimaLectura.humedad,
          prioridad: 'CRÍTICA',
          nodo_id: nodo_id,
          guardado: resultadoGuardado
        };
      }
      break;
    }

    case 'ALERT008': {
      // Humedad Alta Preventiva Invernada >60%
      if (!esInvernada) break;
      
      if (ultimaLectura.humedad) {
        const humedad = parseFloat(ultimaLectura.humedad);
        if (humedad > 60 && humedad <= 70) {
          const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, ultimaLectura.humedad, {
            periodo_invernada: true,
            humedad_detectada: humedad
          });
          
          resultado = {
            activada: true,
            valor: ultimaLectura.humedad,
            prioridad: 'PREVENTIVA',
            nodo_id: nodo_id,
            guardado: resultadoGuardado
          };
        }
      }
      break;
    }

    case 'ALERT009': {
      // Humedad Baja Crítica Primavera-Verano <40%
      if (!esPrimaveraVerano) break;
      
      if (ultimaLectura.humedad && parseFloat(ultimaLectura.humedad) < 40) {
        const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, ultimaLectura.humedad, {
          periodo_primavera_verano: true,
          humedad_detectada: parseFloat(ultimaLectura.humedad)
        });
        
        resultado = {
          activada: true,
          valor: ultimaLectura.humedad,
          prioridad: 'CRÍTICA',
          nodo_id: nodo_id,
          guardado: resultadoGuardado
        };
      }
      break;
    }

    case 'ALERT010': {
      // Humedad Baja Preventiva Primavera-Verano <50%
      if (!esPrimaveraVerano) break;
      
      if (ultimaLectura.humedad) {
        const humedad = parseFloat(ultimaLectura.humedad);
        if (humedad < 50 && humedad >= 40) {
          const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, ultimaLectura.humedad, {
            periodo_primavera_verano: true,
            humedad_detectada: humedad
          });
          
          resultado = {
            activada: true,
            valor: ultimaLectura.humedad,
            prioridad: 'PREVENTIVA',
            nodo_id: nodo_id,
            guardado: resultadoGuardado
          };
        }
      }
      break;
    }

    // ========== ALERTAS DE PESO ==========
    case 'ALERT011': {
      // Alerta de Enjambre - Disminución 500g en 2 mediciones consecutivas
      if (!esEnjarbrazon) break;
      
      const pesosRecientes = datos.filter(d => d.peso !== null && d.peso !== undefined)
                                 .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
                                 .slice(0, 2);
      
      if (pesosRecientes.length === 2) {
        const pesoAnterior = parseFloat(pesosRecientes[1].peso);
        const pesoActual = parseFloat(pesosRecientes[0].peso);
        const diferencia = pesoAnterior - pesoActual; // Diferencia positiva = pérdida
        
        if (diferencia >= 500) {
          const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, pesoActual, {
            peso_anterior: pesoAnterior,
            peso_actual: pesoActual,
            diferencia_gramos: diferencia,
            periodo_enjambrazon: true
          });
          
          resultado = {
            activada: true,
            valor: pesoActual,
            diferencia: diferencia,
            peso_anterior: pesoAnterior,
            prioridad: 'ALTA',
            nodo_id: nodo_id,
            guardado: resultadoGuardado
          };
        }
      }
      break;
    }

    case 'ALERT012': {
      // Incremento de Peso Cosecha >20kg en 20 días
      if (!esCosecha) break;
      
      const datosOrdenados = datos.filter(d => d.peso !== null && d.peso !== undefined)
                                 .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
      
      if (datosOrdenados.length >= 20) {
        // Tomar el primer peso de los últimos 20 días y el más reciente
        const pesoInicial = parseFloat(datosOrdenados[Math.max(0, datosOrdenados.length - 20)].peso);
        const pesoFinal = parseFloat(datosOrdenados[datosOrdenados.length - 1].peso);
        const incrementoKg = (pesoFinal - pesoInicial) / 1000;
        
        if (incrementoKg > 20) {
          const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, pesoFinal, {
            peso_inicial: pesoInicial,
            peso_final: pesoFinal,
            incremento_kg: incrementoKg,
            periodo_cosecha: true,
            dias_evaluados: 20
          });
          
          resultado = {
            activada: true,
            valor: pesoFinal,
            incremento: incrementoKg,
            peso_inicial: pesoInicial,
            prioridad: 'INFORMATIVA',
            nodo_id: nodo_id,
            guardado: resultadoGuardado
          };
        }
      }
      break;
    }

    case 'ALERT013': {
      // Disminución de Peso Período Invernada - 3Kg en un mes
      if (!esInvernada) break;
      
      const pesosUltimoMes = datos30dias.filter(d => d.peso !== null && d.peso !== undefined)
                                        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
      
      if (pesosUltimoMes.length >= 10) { // Al menos 10 mediciones en el mes
        const pesoInicialMes = parseFloat(pesosUltimoMes[0].peso);
        const pesoFinalMes = parseFloat(pesosUltimoMes[pesosUltimoMes.length - 1].peso);
        const perdidaKg = (pesoInicialMes - pesoFinalMes) / 1000;
        
        if (perdidaKg >= 3) {
          const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, pesoFinalMes, {
            peso_inicial_mes: pesoInicialMes,
            peso_final_mes: pesoFinalMes,
            perdida_kg: perdidaKg,
            periodo_invernada: true,
            mediciones_evaluadas: pesosUltimoMes.length
          });
          
          resultado = {
            activada: true,
            valor: pesoFinalMes,
            perdida: perdidaKg,
            peso_inicial: pesoInicialMes,
            prioridad: 'ALTA',
            nodo_id: nodo_id,
            guardado: resultadoGuardado
          };
        }
      }
      break;
    }

    case 'ALERT014': {
      // Disminución Abrupta de Peso - Más del 10% en menos de 24h
      const pesosRecientes24h = datos24h.filter(d => d.peso !== null && d.peso !== undefined)
                                        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
      
      if (pesosRecientes24h.length >= 2) {
        const pesoInicial24h = parseFloat(pesosRecientes24h[0].peso);
        const pesoFinal24h = parseFloat(pesosRecientes24h[pesosRecientes24h.length - 1].peso);
        const porcentajePerdida = ((pesoInicial24h - pesoFinal24h) / pesoInicial24h) * 100;
        
        if (porcentajePerdida >= 10) {
          const resultadoGuardado = await verificarYGuardarAlerta(nodo_id, alertaId, pesoFinal24h, {
            peso_inicial_24h: pesoInicial24h,
            peso_final_24h: pesoFinal24h,
            porcentaje_perdida: porcentajePerdida,
            perdida_kg: (pesoInicial24h - pesoFinal24h) / 1000
          });
          
          resultado = {
            activada: true,
            valor: pesoFinal24h,
            porcentaje_perdida: porcentajePerdida,
            peso_inicial: pesoInicial24h,
            prioridad: 'CRÍTICA',
            nodo_id: nodo_id,
            guardado: resultadoGuardado
          };
        }
      }
      break;
    }

    default:
      break;
  }

  return resultado;
};

// =============================================
// EVALUAR ALERTAS COMBINADAS (TEMPERATURA Y HUMEDAD)
// =============================================
const evaluarAlertasCombinadas = async (mensajesInternos, mensajesExternos, colmenaId) => {
  const alertasActivadas = [];
  
  if (mensajesInternos.length > 0 && mensajesExternos.length > 0) {
    const ultimoInterno = mensajesInternos[0];
    const ultimoExterno = mensajesExternos[0];
    const ahora = new Date();
    const hace6h = new Date(ahora.getTime() - 6 * 60 * 60 * 1000);
    
    // Verificar que ambas mediciones sean recientes
    if (new Date(ultimoInterno.fecha_hora) >= hace6h && new Date(ultimoExterno.fecha_hora) >= hace6h) {
      
      // ALERT015 - Temperatura Anormal (diferencia 0-2°C por 6h)
      if (ultimoInterno.temperatura && ultimoExterno.temperatura) {
        const difTemp = Math.abs(parseFloat(ultimoInterno.temperatura) - parseFloat(ultimoExterno.temperatura));
        
        if (difTemp <= 2) {
          // Verificar si la condición se mantiene por 6 horas
          const datos6hInternos = mensajesInternos.filter(d => new Date(d.fecha_hora) >= hace6h && d.temperatura);
          const datos6hExternos = mensajesExternos.filter(d => new Date(d.fecha_hora) >= hace6h && d.temperatura);
          
          let mantieneDiferencia = true;
          const muestrasMinimas = Math.min(datos6hInternos.length, datos6hExternos.length, 6);
          
          for (let i = 0; i < muestrasMinimas; i++) {
            const diffMuestra = Math.abs(
              parseFloat(datos6hInternos[i].temperatura) - parseFloat(datos6hExternos[i].temperatura)
            );
            if (diffMuestra > 2) {
              mantieneDiferencia = false;
              break;
            }
          }
          
          if (mantieneDiferencia && muestrasMinimas >= 3) {
            const resultadoGuardado = await verificarYGuardarAlerta(ultimoInterno.nodo_id, 'ALERT015', 
              `${ultimoInterno.temperatura}°C ≈ ${ultimoExterno.temperatura}°C`, {
                diferencia_temperatura: difTemp,
                temperatura_interna: parseFloat(ultimoInterno.temperatura),
                temperatura_externa: parseFloat(ultimoExterno.temperatura),
                muestras_evaluadas: muestrasMinimas,
                condicion_6h: true
              });
            
            alertasActivadas.push({
              id: 'ALERT015',
              nombre: 'Temperatura Anormal en Colmena',
              descripcion: 'Diferencia de temperatura externa e Interna está entre 0° y 2° por 6 horas seguidas',
              indicador: 'Temperatura Interna y Externa',
              activada: true,
              valor: `${ultimoInterno.temperatura}°C ≈ ${ultimoExterno.temperatura}°C`,
              diferencia: difTemp,
              prioridad: 'CRÍTICA',
              fecha: ahora,
              colmena_id: colmenaId,
              nodo_id: ultimoInterno.nodo_id,
              guardado: resultadoGuardado
            });
          }
        }
      }

      // ALERT016 - Humedad Anormal (diferencia 0-2% por 6h)
      if (ultimoInterno.humedad && ultimoExterno.humedad) {
        const difHum = Math.abs(parseFloat(ultimoInterno.humedad) - parseFloat(ultimoExterno.humedad));
        
        if (difHum <= 2) {
          // Verificar si la condición se mantiene por 6 horas
          const datos6hInternos = mensajesInternos.filter(d => new Date(d.fecha_hora) >= hace6h && d.humedad);
          const datos6hExternos = mensajesExternos.filter(d => new Date(d.fecha_hora) >= hace6h && d.humedad);
          
          let mantieneDiferencia = true;
          const muestrasMinimas = Math.min(datos6hInternos.length, datos6hExternos.length, 6);
          
          for (let i = 0; i < muestrasMinimas; i++) {
            const diffMuestra = Math.abs(
              parseFloat(datos6hInternos[i].humedad) - parseFloat(datos6hExternos[i].humedad)
            );
            if (diffMuestra > 2) {
              mantieneDiferencia = false;
              break;
            }
          }
          
          if (mantieneDiferencia && muestrasMinimas >= 3) {
            const resultadoGuardado = await verificarYGuardarAlerta(ultimoInterno.nodo_id, 'ALERT016', 
              `${ultimoInterno.humedad}% ≈ ${ultimoExterno.humedad}%`, {
                diferencia_humedad: difHum,
                humedad_interna: parseFloat(ultimoInterno.humedad),
                humedad_externa: parseFloat(ultimoExterno.humedad),
                muestras_evaluadas: muestrasMinimas,
                condicion_6h: true
              });
            
            alertasActivadas.push({
              id: 'ALERT016',
              nombre: 'Humedad Anormal en Colmena',
              descripcion: 'Diferencia de humedad externa e Interna está entre 0 y 2 puntos por 6 horas seguidas',
              indicador: 'Temperatura Interna y Externa',
              activada: true,
              valor: `${ultimoInterno.humedad}% ≈ ${ultimoExterno.humedad}%`,
              diferencia: difHum,
              prioridad: 'CRÍTICA',
              fecha: ahora,
              colmena_id: colmenaId,
              nodo_id: ultimoInterno.nodo_id,
              guardado: resultadoGuardado
            });
          }
        }
      }
    }
  }
  
  return alertasActivadas;
};

// =============================================
// EVALUAR ALERTAS PARA UNA COLMENA ESPECÍFICA (MEJORADO)
// =============================================
router.get('/evaluar/:colmenaId', async (req, res) => {
  try {
    const { colmenaId } = req.params;
    const { hours = 168 } = req.query; // Por defecto últimas 168 horas (7 días)
    
    console.log(`🔍 Iniciando evaluación de alertas para colmena ${colmenaId} (${hours}h)`);
    
    const fechaLimite = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Obtener datos de sensores de la colmena
    const [mensajes] = await pool.execute(`
      SELECT 
        m.*,
        n.tipo as nodo_tipo,
        n.nombre as nodo_nombre,
        nt.nombre as tipo_nombre,
        n.id as nodo_id
      FROM mensaje m
      JOIN nodo n ON m.nodo_id = n.id
      JOIN nodo_tipo nt ON n.tipo_nodo_id = nt.id
      JOIN colmena_nodo cn ON n.id = cn.nodo_id
      WHERE cn.colmena_id = ? 
        AND m.fecha_hora >= ?
        AND (m.temperatura IS NOT NULL OR m.humedad IS NOT NULL OR m.peso IS NOT NULL)
      ORDER BY m.fecha_hora DESC
    `, [colmenaId, fechaLimite]);

    console.log(`📊 Encontrados ${mensajes.length} mensajes para evaluación`);

    // Obtener todas las alertas definidas
    const [alertasDefinidas] = await pool.execute(`
      SELECT * FROM alerta ORDER BY id
    `);

    // Separar mensajes por tipo de nodo
    const mensajesInternos = mensajes.filter(m => 
      m.tipo_nombre?.toLowerCase().includes('interior') || 
      m.tipo_nombre?.toLowerCase().includes('interno') ||
      m.nodo_nombre?.toLowerCase().includes('interno') ||
      m.topico?.toLowerCase().includes('interno')
    );
    
    const mensajesExternos = mensajes.filter(m => 
      m.tipo_nombre?.toLowerCase().includes('exterior') || 
      m.tipo_nombre?.toLowerCase().includes('externo') ||
      m.nodo_nombre?.toLowerCase().includes('externo') ||
      m.topico?.toLowerCase().includes('externo')
    );

    console.log(`📊 Separación: ${mensajesInternos.length} internos, ${mensajesExternos.length} externos`);

    const alertasActivadas = [];
    const resumenEvaluacion = {
      total_alertas_evaluadas: 0,
      alertas_nuevas_guardadas: 0,
      alertas_existentes: 0
    };

    // Evaluar alertas para cada tipo
    for (const alerta of alertasDefinidas) {
      let datos = [];
      let nodo_id = null;

      // Determinar qué datos usar según el indicador
      if (alerta.indicador === 'Temperatura Interna' || alerta.indicador === 'Humedad Interna') {
        datos = mensajesInternos;
        nodo_id = mensajesInternos.length > 0 ? mensajesInternos[0].nodo_id : null;
      } else if (alerta.indicador === 'Temperatura Externa') {
        datos = mensajesExternos.length > 0 ? mensajesExternos : mensajesInternos;
        nodo_id = (mensajesExternos.length > 0 ? mensajesExternos : mensajesInternos)[0]?.nodo_id;
      } else if (alerta.indicador === 'Peso') {
        datos = mensajes.filter(m => m.peso !== null && m.peso !== undefined);
        nodo_id = datos.length > 0 ? datos[0].nodo_id : null;
      }

      if (datos.length > 0 && nodo_id) {
        resumenEvaluacion.total_alertas_evaluadas++;
        
        const resultado = await evaluarCondicionMejorada(alerta.id, alerta, datos, nodo_id);
        
        if (resultado && resultado.activada) {
          // Contar si la alerta fue guardada o ya existía
          if (resultado.guardado?.insertada) {
            resumenEvaluacion.alertas_nuevas_guardadas++;
          } else if (!resultado.guardado?.insertada && !resultado.guardado?.error) {
            resumenEvaluacion.alertas_existentes++;
          }

          alertasActivadas.push({
            id: alerta.id,
            nombre: alerta.nombre,
            descripcion: alerta.descripcion,
            indicador: alerta.indicador,
            ...resultado,
            fecha: new Date(),
            colmena_id: colmenaId
          });
        }
      }
    }

    // Evaluar alertas combinadas (ALERT015 y ALERT016)
    const alertasCombinadas = await evaluarAlertasCombinadas(mensajesInternos, mensajesExternos, colmenaId);
    alertasActivadas.push(...alertasCombinadas);

    // Actualizar resumen con alertas combinadas
    alertasCombinadas.forEach(alerta => {
      if (alerta.guardado?.insertada) {
        resumenEvaluacion.alertas_nuevas_guardadas++;
      } else if (!alerta.guardado?.insertada && !alerta.guardado?.error) {
        resumenEvaluacion.alertas_existentes++;
      }
    });

    console.log(`✅ Evaluación completada: ${alertasActivadas.length} alertas activadas`);
    console.log(`📝 Resumen: ${resumenEvaluacion.alertas_nuevas_guardadas} nuevas, ${resumenEvaluacion.alertas_existentes} existentes`);

    res.json({
      success: true,
      data: {
        alertas_activadas: alertasActivadas,
        total_mensajes: mensajes.length,
        mensajes_internos: mensajesInternos.length,
        mensajes_externos: mensajesExternos.length,
        resumen_evaluacion: resumenEvaluacion,
        periodo: {
          esInvernada: (() => {
            const mes = new Date().getMonth() + 1;
            return mes >= 3 && mes <= 7;
          })(),
          esPrimaveraVerano: (() => {
            const mes = new Date().getMonth() + 1;
            return mes >= 8 || mes <= 2;
          })(),
          esEnjarbrazon: (() => {
            const mes = new Date().getMonth() + 1;
            return (mes >= 8 && mes <= 12) || mes === 1;
          })(),
          esCosecha: (() => {
            const mes = new Date().getMonth() + 1;
            return mes >= 11 || mes <= 3;
          })()
        }
      },
      message: `Evaluación completada: ${alertasActivadas.length} alertas activadas (${resumenEvaluacion.alertas_nuevas_guardadas} nuevas guardadas)`
    });

  } catch (error) {
    console.error('❌ Error evaluando alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// =============================================
// NUEVO ENDPOINT: EVALUACIÓN MASIVA PARA USUARIO
// =============================================
router.get('/evaluarUsuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { hours = 168 } = req.query;
    
    console.log(`🔍 Evaluando alertas para usuario ${usuarioId}`);
    
    // Obtener colmenas del usuario
    const [colmenas] = await pool.execute(`
      SELECT id, nombre FROM colmena WHERE dueno_usuario_id = ?
    `, [usuarioId]);

    const resultadosPorColmena = [];
    let totalAlertasNuevas = 0;
    let totalAlertasExistentes = 0;

    // Evaluar cada colmena
    for (const colmena of colmenas) {
      try {
        // Simular llamada interna al endpoint de evaluación
        const fechaLimite = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        const [mensajes] = await pool.execute(`
          SELECT 
            m.*,
            n.tipo as nodo_tipo,
            n.nombre as nodo_nombre,
            nt.nombre as tipo_nombre,
            n.id as nodo_id
          FROM mensaje m
          JOIN nodo n ON m.nodo_id = n.id
          JOIN nodo_tipo nt ON n.tipo_nodo_id = nt.id
          JOIN colmena_nodo cn ON n.id = cn.nodo_id
          WHERE cn.colmena_id = ? 
            AND m.fecha_hora >= ?
            AND (m.temperatura IS NOT NULL OR m.humedad IS NOT NULL OR m.peso IS NOT NULL)
          ORDER BY m.fecha_hora DESC
        `, [colmena.id, fechaLimite]);

        if (mensajes.length > 0) {
          // Proceso de evaluación simplificado para el usuario
          const [alertasDefinidas] = await pool.execute('SELECT * FROM alerta ORDER BY id');
          
          const mensajesInternos = mensajes.filter(m => 
            m.tipo_nombre?.toLowerCase().includes('interior') || 
            m.tipo_nombre?.toLowerCase().includes('interno') ||
            m.nodo_nombre?.toLowerCase().includes('interno') ||
            m.topico?.toLowerCase().includes('interno')
          );
          
          const alertasColmena = [];
          
          // Evaluar solo algunas alertas críticas para el resumen del usuario
          for (const alerta of alertasDefinidas.slice(0, 8)) { // Primeras 8 alertas principales
            if (mensajesInternos.length > 0) {
              const resultado = await evaluarCondicionMejorada(
                alerta.id, 
                alerta, 
                mensajesInternos, 
                mensajesInternos[0].nodo_id
              );
              
              if (resultado?.activada) {
                if (resultado.guardado?.insertada) totalAlertasNuevas++;
                if (!resultado.guardado?.insertada && !resultado.guardado?.error) totalAlertasExistentes++;
                
                alertasColmena.push({
                  id: alerta.id,
                  nombre: alerta.nombre,
                  prioridad: resultado.prioridad,
                  valor: resultado.valor,
                  fecha: new Date()
                });
              }
            }
          }

          resultadosPorColmena.push({
            colmena: {
              id: colmena.id,
              nombre: colmena.nombre
            },
            alertas: alertasColmena,
            total_mensajes: mensajes.length
          });
        }
      } catch (colmenaError) {
        console.error(`❌ Error evaluando colmena ${colmena.id}:`, colmenaError);
      }
    }

    res.json({
      success: true,
      data: {
        alertas_por_colmena: resultadosPorColmena,
        resumen_general: {
          total_colmenas: colmenas.length,
          colmenas_con_alertas: resultadosPorColmena.filter(r => r.alertas.length > 0).length,
          total_alertas_nuevas: totalAlertasNuevas,
          total_alertas_existentes: totalAlertasExistentes
        }
      },
      message: `Evaluación de ${colmenas.length} colmenas completada`
    });

  } catch (error) {
    console.error('❌ Error en evaluación masiva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// =============================================
// REGISTRAR NUEVA ALERTA MANUALMENTE
// =============================================
router.post('/registrar', async (req, res) => {
  try {
    const { nodo_id, alerta_id, valor_actual, metadatos } = req.body;
    
    if (!nodo_id || !alerta_id) {
      return res.status(400).json({
        success: false,
        error: 'nodo_id y alerta_id son requeridos'
      });
    }

    const resultado = await verificarYGuardarAlerta(nodo_id, alerta_id, valor_actual, metadatos || {});

    res.json({
      success: true,
      data: {
        ...resultado,
        nodo_id,
        alerta_id,
        fecha: new Date()
      },
      message: resultado.insertada ? 'Alerta registrada exitosamente' : 'Alerta ya existía en el período'
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

// =============================================
// OBTENER HISTORIAL DE ALERTAS POR COLMENA
// =============================================
router.get('/historial/:colmenaId', async (req, res) => {
  try {
    const { colmenaId } = req.params;
    const { limit = 50, hours = 720 } = req.query; // Últimas 30 días por defecto
    
    const fechaLimite = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const [historial] = await pool.execute(`
      SELECT 
        na.id,
        na.nodo_id,
        na.alerta_id,
        na.fecha,
        a.nombre,
        a.indicador,
        a.descripcion,
        n.nombre as nodo_nombre,
        nt.nombre as tipo_nodo,
        COUNT(*) as repeticiones
      FROM nodo_alerta na
      JOIN alerta a ON na.alerta_id = a.id
      JOIN nodo n ON na.nodo_id = n.id
      JOIN nodo_tipo nt ON n.tipo_nodo_id = nt.id
      JOIN colmena_nodo cn ON n.id = cn.nodo_id
      WHERE cn.colmena_id = ?
        AND na.fecha >= ?
      GROUP BY na.alerta_id, na.nodo_id, DATE(na.fecha)
      ORDER BY na.fecha DESC
      LIMIT ?
    `, [colmenaId, fechaLimite, parseInt(limit)]);

    res.json({
      success: true,
      data: historial,
      message: 'Historial obtenido exitosamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// =============================================
// OBTENER ALERTAS ACTIVAS POR USUARIO (MEJORADO)
// =============================================
router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { hours = 24 } = req.query; // Últimas 24 horas por defecto
    
    const fechaLimite = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const [alertasUsuario] = await pool.execute(`
      SELECT 
        na.id,
        na.nodo_id,
        na.alerta_id,
        na.fecha,
        a.nombre,
        a.indicador,
        a.descripcion,
        n.nombre as nodo_nombre,
        nt.nombre as tipo_nodo,
        c.id as colmena_id,
        COALESCE(c.nombre, CONCAT('Colmena #', c.id)) as colmena_nombre,
        COUNT(*) as repeticiones_24h
      FROM nodo_alerta na
      JOIN alerta a ON na.alerta_id = a.id
      JOIN nodo n ON na.nodo_id = n.id
      JOIN nodo_tipo nt ON n.tipo_nodo_id = nt.id
      JOIN colmena_nodo cn ON n.id = cn.nodo_id
      JOIN colmena c ON cn.colmena_id = c.id
      WHERE c.dueno_usuario_id = ?
        AND na.fecha >= ?
      GROUP BY na.alerta_id, na.nodo_id, c.id
      ORDER BY na.fecha DESC, a.id
    `, [usuarioId, fechaLimite]);

    // Obtener estadísticas adicionales
    const [estadisticas] = await pool.execute(`
      SELECT 
        a.id as alerta_id,
        a.nombre,
        COUNT(na.id) as total_activaciones,
        COUNT(DISTINCT c.id) as colmenas_afectadas
      FROM alerta a
      LEFT JOIN nodo_alerta na ON a.id = na.alerta_id
      LEFT JOIN nodo n ON na.nodo_id = n.id
      LEFT JOIN colmena_nodo cn ON n.id = cn.nodo_id
      LEFT JOIN colmena c ON cn.colmena_id = c.id
      WHERE c.dueno_usuario_id = ? AND na.fecha >= ?
      GROUP BY a.id, a.nombre
      HAVING total_activaciones > 0
      ORDER BY total_activaciones DESC
    `, [usuarioId, fechaLimite]);

    res.json({
      success: true,
      data: {
        alertas_usuario: alertasUsuario,
        estadisticas_periodo: estadisticas,
        resumen: {
          total_alertas: alertasUsuario.length,
          colmenas_con_alertas: [...new Set(alertasUsuario.map(a => a.colmena_id))].length,
          alertas_criticas: alertasUsuario.filter(a => 
            ['ALERT001', 'ALERT003', 'ALERT007', 'ALERT009', 'ALERT015', 'ALERT016'].includes(a.alerta_id)
          ).length
        }
      },
      message: 'Alertas del usuario obtenidas exitosamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo alertas del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// =============================================
// OBTENER ESTADÍSTICAS AVANZADAS DE ALERTAS
// =============================================
router.get('/estadisticas/:colmenaId', async (req, res) => {
  try {
    const { colmenaId } = req.params;
    const { days = 30 } = req.query;
    
    const fechaLimite = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Estadísticas por tipo de alerta
    const [estadisticasPorAlerta] = await pool.execute(`
      SELECT 
        a.id,
        a.nombre,
        a.indicador,
        COUNT(na.id) as total_activaciones,
        MAX(na.fecha) as ultima_activacion,
        MIN(na.fecha) as primera_activacion,
        COUNT(DISTINCT DATE(na.fecha)) as dias_con_alertas
      FROM alerta a
      LEFT JOIN nodo_alerta na ON a.id = na.alerta_id
      LEFT JOIN nodo n ON na.nodo_id = n.id
      LEFT JOIN colmena_nodo cn ON n.id = cn.nodo_id
      WHERE cn.colmena_id = ? AND (na.fecha >= ? OR na.fecha IS NULL)
      GROUP BY a.id, a.nombre, a.indicador
      ORDER BY total_activaciones DESC
    `, [colmenaId, fechaLimite]);

    // Tendencia por días
    const [tendenciaDiaria] = await pool.execute(`
      SELECT 
        DATE(na.fecha) as fecha,
        COUNT(*) as total_alertas,
        COUNT(DISTINCT na.alerta_id) as tipos_diferentes
      FROM nodo_alerta na
      JOIN nodo n ON na.nodo_id = n.id
      JOIN colmena_nodo cn ON n.id = cn.nodo_id
      WHERE cn.colmena_id = ? AND na.fecha >= ?
      GROUP BY DATE(na.fecha)
      ORDER BY fecha DESC
    `, [colmenaId, fechaLimite]);

    // Alertas por nodo
    const [alertasPorNodo] = await pool.execute(`
      SELECT 
        n.id as nodo_id,
        n.nombre as nodo_nombre,
        nt.nombre as tipo_nodo,
        COUNT(na.id) as total_alertas,
        COUNT(DISTINCT na.alerta_id) as tipos_alertas
      FROM nodo n
      JOIN nodo_tipo nt ON n.tipo_nodo_id = nt.id
      JOIN colmena_nodo cn ON n.id = cn.nodo_id
      LEFT JOIN nodo_alerta na ON n.id = na.nodo_id AND na.fecha >= ?
      WHERE cn.colmena_id = ?
      GROUP BY n.id, n.nombre, nt.nombre
      ORDER BY total_alertas DESC
    `, [fechaLimite, colmenaId]);

    res.json({
      success: true,
      data: {
        estadisticas_por_alerta: estadisticasPorAlerta,
        tendencia_diaria: tendenciaDiaria,
        alertas_por_nodo: alertasPorNodo,
        resumen_periodo: {
          total_alertas: estadisticasPorAlerta.reduce((sum, e) => sum + e.total_activaciones, 0),
          tipos_alertas_activos: estadisticasPorAlerta.filter(e => e.total_activaciones > 0).length,
          dias_evaluados: days,
          dias_con_alertas: tendenciaDiaria.length
        }
      },
      message: 'Estadísticas obtenidas exitosamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// =============================================
// ENDPOINT PARA LIMPIAR ALERTAS ANTIGUAS
// =============================================
router.delete('/limpiar/:colmenaId', async (req, res) => {
  try {
    const { colmenaId } = req.params;
    const { days = 90 } = req.query; // Eliminar alertas más antiguas de 90 días por defecto
    
    const fechaLimite = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const [result] = await pool.execute(`
      DELETE na FROM nodo_alerta na
      JOIN nodo n ON na.nodo_id = n.id
      JOIN colmena_nodo cn ON n.id = cn.nodo_id
      WHERE cn.colmena_id = ? AND na.fecha < ?
    `, [colmenaId, fechaLimite]);

    res.json({
      success: true,
      data: {
        alertas_eliminadas: result.affectedRows,
        fecha_limite: fechaLimite
      },
      message: `${result.affectedRows} alertas antiguas eliminadas`
    });
  } catch (error) {
    console.error('❌ Error limpiando alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;