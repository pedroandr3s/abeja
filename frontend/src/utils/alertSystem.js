// src/utils/alertSystem.js
// Sistema de Alertas SmartBee - Reglas de Restricción y Activación de Mensajes

/**
 * Determina la estación del año basada en el mes
 * @param {Date} date - Fecha a evaluar
 * @returns {string} - 'invernada' o 'primavera-verano'
 */
export const getEstacion = (date = new Date()) => {
  const mes = date.getMonth() + 1; // getMonth() retorna 0-11
  
  // Marzo a Julio = invernada (3-7)
  // Agosto a Abril = primavera-verano (8-12, 1-4)
  if (mes >= 3 && mes <= 7) {
    return 'invernada';
  }
  return 'primavera-verano';
};

/**
 * Extrae valor numérico del payload
 */
export const extractNumericValue = (payload) => {
  if (!payload) return null;
  
  // Buscar número con posibles decimales
  const match = payload.toString().match(/(-?\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
};

/**
 * Extrae unidad del payload
 */
export const extractUnit = (payload) => {
  if (!payload) return '';
  
  const units = {
    '°C': 'temperatura',
    '°': 'temperatura', 
    'C': 'temperatura',
    '%': 'humedad',
    'kg': 'peso',
    'g': 'peso',
    'hPa': 'presion'
  };
  
  for (const [unit, type] of Object.entries(units)) {
    if (payload.toString().includes(unit)) {
      return type;
    }
  }
  
  return '';
};

/**
 * Configuración de rangos de alertas por tipo de sensor
 */
export const ALERT_RANGES = {
  // Temperatura Interna
  temperatura_interna: {
    critical_high: {
      threshold: 38,
      operator: '>=',
      events_required: 8,
      time_window: 24, // horas
      season: 'todo_el_año',
      name: 'T° Alta Crítica',
      icon: '🔥',
      color: '#dc2626',
      priority: 'urgent',
      message: 'Temperatura interna crítica detectada (>38°C)',
      suggestions: [
        'Visitar apiario urgentemente',
        'Retirar listón guarda piquera',
        'Aumentar ventilación y sombra',
        'Asegurar acceso a hidratación',
        'Verificar estado de la colmena'
      ]
    },
    warning_high: {
      threshold: 36,
      max_threshold: 37,
      operator: 'between',
      events_required: 8,
      time_window: 48,
      season: 'todo_el_año',
      name: 'T° Alta Preventiva',
      icon: '⚠️',
      color: '#f59e0b',
      priority: 'high',
      message: 'Temperatura interna elevada (36-37°C)',
      suggestions: [
        'Monitorear evolución de temperatura',
        'Preparar medidas de ventilación',
        'Revisar sombra del apiario',
        'Verificar disponibilidad de agua'
      ]
    },
    critical_low_winter: {
      threshold: 12,
      operator: '<=',
      events_required: 8,
      time_window: 48,
      season: 'invernada',
      name: 'T° Baja Crítica (Invierno)',
      icon: '🥶',
      color: '#3b82f6',
      priority: 'urgent',
      message: 'Temperatura interna crítica baja (<12°C en invierno)',
      suggestions: [
        'Verificar estado de la colmena urgentemente',
        'Revisar población de abejas',
        'Asegurar protección contra viento',
        'Considerar alimentación energética',
        'Evaluar fusión de colmenas débiles'
      ]
    },
    warning_low_winter: {
      threshold: 13,
      max_threshold: 15,
      operator: 'between',
      events_required: 8,
      time_window: 48,
      season: 'invernada',
      name: 'T° Baja Preventiva (Invierno)',
      icon: '❄️',
      color: '#6366f1',
      priority: 'high',
      message: 'Temperatura interna baja (13-15°C en invierno)',
      suggestions: [
        'Monitorear temperatura regularmente',
        'Revisar protección del apiario',
        'Preparar alimentación de emergencia',
        'Verificar ventilación adecuada'
      ]
    }
  },

  // Temperatura Externa
  temperatura_externa: {
    high: {
      threshold: 34,
      operator: '>',
      events_required: 8,
      time_window: 24,
      season: 'todo_el_año',
      name: 'Temperatura Externa Alta',
      icon: '🌡️',
      color: '#dc2626',
      priority: 'high',
      message: 'Temperatura externa muy alta (>34°C)',
      suggestions: [
        'Aumentar sombra en el apiario',
        'Verificar ventilación de colmenas',
        'Asegurar fuentes de agua cercanas',
        'Monitorear temperatura interna'
      ]
    },
    low: {
      threshold: 12,
      operator: '<',
      events_required: 8,
      time_window: 48,
      season: 'todo_el_año',
      name: 'Temperatura Externa Baja',
      icon: '🌨️',
      color: '#3b82f6',
      priority: 'medium',
      message: 'Temperatura externa muy baja (<12°C)',
      suggestions: [
        'Verificar protección contra viento',
        'Monitorear temperatura interna',
        'Revisar estado de las colmenas',
        'Preparar para posibles heladas'
      ]
    }
  },

  // Humedad Interna
  humedad_interna: {
    critical_high_winter: {
      threshold: 70,
      operator: '>',
      events_required: 1, // Se activa inmediatamente en invernada
      time_window: 1,
      season: 'invernada',
      name: 'H° Alta Crítica (Invierno)',
      icon: '💧',
      color: '#dc2626',
      priority: 'urgent',
      message: 'Humedad interna crítica alta (>70% en invierno)',
      suggestions: [
        'Mejorar ventilación urgentemente',
        'Verificar entrada de agua o condensación',
        'Revisar estado del techo y tapas',
        'Considerar reducir piquera',
        'Monitorear signos de enfermedades fúngicas'
      ]
    },
    warning_high_winter: {
      threshold: 60,
      operator: '>',
      events_required: 1,
      time_window: 1,
      season: 'invernada',
      name: 'H° Alta Preventiva (Invierno)',
      icon: '💦',
      color: '#f59e0b',
      priority: 'high',
      message: 'Humedad interna elevada (>60% en invierno)',
      suggestions: [
        'Monitorear evolución de humedad',
        'Revisar ventilación de la colmena',
        'Verificar drenaje del apiario',
        'Preparar medidas correctivas'
      ]
    },
    critical_low_summer: {
      threshold: 40,
      operator: '<',
      events_required: 1,
      time_window: 1,
      season: 'primavera-verano',
      name: 'H° Baja Crítica (Primavera-Verano)',
      icon: '🏜️',
      color: '#dc2626',
      priority: 'urgent',
      message: 'Humedad interna crítica baja (<40% en primavera-verano)',
      suggestions: [
        'Asegurar fuentes de agua cercanas',
        'Verificar que las abejas puedan acceder al agua',
        'Considerar riego del área del apiario',
        'Monitorear signos de estrés en las abejas',
        'Revisar ventilación (puede estar excesiva)'
      ]
    },
    warning_low_summer: {
      threshold: 50,
      operator: '<',
      events_required: 1,
      time_window: 1,
      season: 'primavera-verano',
      name: 'H° Baja Preventiva (Primavera-Verano)',
      icon: '🌵',
      color: '#f59e0b',
      priority: 'high',
      message: 'Humedad interna baja (<50% en primavera-verano)',
      suggestions: [
        'Monitorear disponibilidad de agua',
        'Verificar humedad del entorno',
        'Preparar fuentes de agua adicionales',
        'Observar comportamiento de las abejas'
      ]
    }
  },

  // Peso
  peso: {
    enjambre_loss: {
      threshold: -0.5, // -500g
      operator: '<',
      events_required: 1, // En 2 mediciones consecutivas
      time_window: 1,
      season_months: [8, 9, 10, 11, 12], // Agosto a Diciembre
      name: 'Alerta de Enjambre',
      icon: '🐝',
      color: '#f59e0b',
      priority: 'urgent',
      message: 'Posible enjambre - Pérdida de 500g o más',
      suggestions: [
        'Revisar la colmena inmediatamente',
        'Buscar celdas reales o preparativos de enjambre',
        'Verificar si las abejas siguen en la colmena',
        'Revisar área cercana por enjambre',
        'Evaluar necesidad de división preventiva'
      ]
    },
    cosecha_gain: {
      threshold: 20, // +20kg
      operator: '>',
      events_required: 1,
      time_window: 480, // 20 días
      season_months: [11, 12, 1, 2, 3], // Noviembre a Marzo
      name: 'Incremento por Cosecha',
      icon: '🍯',
      color: '#10b981',
      priority: 'normal',
      message: 'Incremento significativo de peso (+20kg) - Posible cosecha',
      suggestions: [
        'Revisar alzas melarias',
        'Verificar madurez de la miel',
        'Planificar extracción si corresponde',
        'Monitorear espacio disponible'
      ]
    },
    winter_sustained_loss: {
      threshold: 3, // <3kg total
      operator: '<',
      events_required: 30, // Disminución continua por 1 mes
      time_window: 720, // 30 días
      season: 'invernada',
      name: 'Disminución Sostenida (Invernada)',
      icon: '📉',
      color: '#dc2626',
      priority: 'urgent',
      message: 'Peso bajo crítico (<3kg) durante invernada',
      suggestions: [
        'Alimentar urgentemente con jarabe 1:1',
        'Verificar estado de la colmena',
        'Revisar población de abejas',
        'Considerar fusión con colmena fuerte',
        'Proteger de pillaje'
      ]
    },
    winter_abrupt_loss: {
      threshold: -5, // -5kg
      operator: '<',
      events_required: 1,
      time_window: 336, // 14 días (2 semanas)
      season: 'invernada',
      name: 'Disminución Abrupta (Invernada)',
      icon: '⚠️',
      color: '#dc2626',
      priority: 'urgent',
      message: 'Pérdida abrupta de peso (>5kg en 2 semanas)',
      suggestions: [
        'Inspeccionar colmena inmediatamente',
        'Verificar signos de pillaje o robo',
        'Revisar estado sanitario',
        'Evaluar población de abejas',
        'Considerar alimentación de emergencia'
      ]
    }
  }
};

/**
 * Configuración de alertas de cruce de variables
 */
export const CROSS_VARIABLE_ALERTS = {
  temp_convergence: {
    name: 'Convergencia de Temperaturas',
    icon: '🌡️⚠️',
    color: '#dc2626',
    priority: 'urgent',
    threshold: 2, // Diferencia <= 2°C
    time_window: 6, // 6 horas seguidas
    message: 'Temperatura interna ≈ externa por más de 6 horas',
    suggestions: [
      'Verificar estado vital de la colmena URGENTE',
      'Revisar signos de mortandad',
      'Verificar ventilación y actividad de abejas',
      'Considerar problema sanitario grave',
      'Contactar especialista apícola'
    ]
  },
  humidity_convergence: {
    name: 'Convergencia de Humedad',
    icon: '💧⚠️',
    color: '#dc2626',
    priority: 'urgent',
    threshold: 2, // Diferencia <= 2%
    time_window: 6, // 6 horas seguidas
    message: 'Humedad interna ≈ externa por más de 6 horas',
    suggestions: [
      'Verificar estado vital de la colmena URGENTE',
      'Revisar signos de mortandad',
      'Verificar ventilación y regulación térmica',
      'Evaluar actividad de las abejas',
      'Inspeccionar inmediatamente'
    ]
  }
};

/**
 * Analiza específicamente cambios de peso
 * @param {Array} historialPeso - Historial de mediciones de peso
 * @param {number} pesoActual - Peso actual
 * @param {Date} fecha - Fecha actual
 * @returns {Object|null} - Alerta de peso o null si no hay alerta
 */
export const analyzePesoChanges = (historialPeso, pesoActual, fecha = new Date()) => {
  if (historialPeso.length < 2) return null;
  
  const mes = fecha.getMonth() + 1;
  const estacion = getEstacion(fecha);
  
  // Ordenar por fecha (más reciente primero)
  const historialOrdenado = historialPeso
    .map(h => ({
      ...h,
      peso: extractNumericValue(h.payload),
      fecha: new Date(h.fecha)
    }))
    .filter(h => h.peso !== null)
    .sort((a, b) => b.fecha - a.fecha);
  
  if (historialOrdenado.length < 2) return null;
  
  const pesoAnterior = historialOrdenado[1].peso;
  const diferencia = pesoActual - pesoAnterior;
  
  // 1. Alerta de enjambre (pérdida de 500g en 2 mediciones)
  if (mes >= 8 && mes <= 12) { // Agosto a Diciembre
    if (diferencia <= -0.5) {
      return {
        category: 'critical',
        priority: 'urgent',
        message: `Posible enjambre - Pérdida de ${Math.abs(diferencia).toFixed(1)}kg`,
        icon: '🐝',
        color: '#f59e0b',
        alertName: 'Alerta de Enjambre',
        suggestions: ALERT_RANGES.peso.enjambre_loss.suggestions,
        weightChange: diferencia
      };
    }
  }
  
  // 2. Incremento por cosecha (20kg en 20 días)
  if ([11, 12, 1, 2, 3].includes(mes)) { // Nov-Mar
    const hace20Dias = new Date(fecha.getTime() - 20 * 24 * 60 * 60 * 1000);
    const pesoHace20Dias = historialOrdenado.find(h => h.fecha <= hace20Dias);
    
    if (pesoHace20Dias) {
      const diferenciaVeinteDias = pesoActual - pesoHace20Dias.peso;
      if (diferenciaVeinteDias >= 20) {
        return {
          category: 'normal',
          priority: 'normal',
          message: `Incremento significativo: +${diferenciaVeinteDias.toFixed(1)}kg en 20 días`,
          icon: '🍯',
          color: '#10b981',
          alertName: 'Incremento por Cosecha',
          suggestions: ALERT_RANGES.peso.cosecha_gain.suggestions,
          weightChange: diferenciaVeinteDias
        };
      }
    }
  }
  
  // 3. Peso crítico bajo en invernada
  if (estacion === 'invernada' && pesoActual < 3) {
    return {
      category: 'critical',
      priority: 'urgent',
      message: `Peso crítico bajo: ${pesoActual.toFixed(1)}kg en invernada`,
      icon: '📉',
      color: '#dc2626',
      alertName: 'Peso Crítico Bajo',
      suggestions: ALERT_RANGES.peso.winter_sustained_loss.suggestions,
      currentWeight: pesoActual
    };
  }
  
  // 4. Pérdida abrupta en invernada (5kg en 2 semanas)
  if (estacion === 'invernada') {
    const hace2Semanas = new Date(fecha.getTime() - 14 * 24 * 60 * 60 * 1000);
    const pesoHace2Semanas = historialOrdenado.find(h => h.fecha <= hace2Semanas);
    
    if (pesoHace2Semanas) {
      const perdidaDosSemanas = pesoHace2Semanas.peso - pesoActual;
      if (perdidaDosSemanas >= 5) {
        return {
          category: 'critical',
          priority: 'urgent',
          message: `Pérdida abrupta: -${perdidaDosSemanas.toFixed(1)}kg en 2 semanas`,
          icon: '⚠️',
          color: '#dc2626',
          alertName: 'Pérdida Abrupta',
          suggestions: ALERT_RANGES.peso.winter_abrupt_loss.suggestions,
          weightChange: -perdidaDosSemanas
        };
      }
    }
  }
  
  return null;
};

/**
 * Cuenta eventos que cumplen una condición en una ventana de tiempo
 * @param {Array} historial - Mensajes históricos
 * @param {string} topico - Tipo de sensor a analizar
 * @param {Object} range - Configuración del rango de alerta
 * @param {Date} fechaActual - Fecha actual
 * @returns {number} - Cantidad de eventos que cumplen la condición
 */
export const countEventsInWindow = (historial, topico, range, fechaActual) => {
  const ventana = new Date(fechaActual.getTime() - range.time_window * 60 * 60 * 1000);
  let contador = 0;
  
  historial.forEach(mensaje => {
    const fechaMensaje = new Date(mensaje.fecha);
    if (fechaMensaje < ventana) return;
    
    // Verificar si es el mismo tipo de sensor
    if (mensaje.topico.toLowerCase() !== topico.toLowerCase()) return;
    
    const valor = extractNumericValue(mensaje.payload);
    if (valor === null) return;
    
    // Verificar si cumple la condición del rango
    if (shouldTriggerAlert(valor, range, getEstacion(fechaMensaje), fechaMensaje)) {
      contador++;
    }
  });
  
  return contador;
};

/**
 * Analiza un mensaje/payload y determina si activa alguna alerta
 * Incluye análisis de eventos múltiples en ventanas de tiempo
 * @param {string} topico - Tipo de sensor
 * @param {string} payload - Valor del sensor
 * @param {Date} fecha - Fecha del mensaje (opcional)
 * @param {Array} historial - Historial de mensajes para análisis temporal (opcional)
 * @returns {Object} - Resultado del análisis
 */
export const analyzeMessage = (topico, payload, fecha = new Date(), historial = []) => {
  const valor = extractNumericValue(payload);
  const unit = extractUnit(payload);
  const estacion = getEstacion(fecha);
  
  if (valor === null) {
    return {
      category: 'unknown',
      priority: 'normal',
      message: 'No se pudo analizar el valor',
      icon: '❓',
      color: '#6b7280',
      suggestions: []
    };
  }

  // Determinar tipo de sensor basado en tópico y unidad
  let sensorType = topico.toLowerCase();
  
  // Mapear tópicos a tipos de sensor
  const sensorMapping = {
    'temperatura': 'temperatura_interna', // Por defecto interna
    'temp': 'temperatura_interna',
    'temp_int': 'temperatura_interna',
    'temp_interna': 'temperatura_interna',
    'temperatura_interna': 'temperatura_interna',
    'temp_ext': 'temperatura_externa',
    'temp_externa': 'temperatura_externa',
    'temperatura_externa': 'temperatura_externa',
    'humedad': 'humedad_interna', // Por defecto interna
    'humidity': 'humedad_interna',
    'hum': 'humedad_interna',
    'hum_int': 'humedad_interna',
    'hum_interna': 'humedad_interna',
    'humedad_interna': 'humedad_interna',
    'hum_ext': 'humedad_externa',
    'hum_externa': 'humedad_externa',
    'humedad_externa': 'humedad_externa',
    'peso': 'peso',
    'weight': 'peso',
    'balanza': 'peso',
    'kg': 'peso',
    'kilogramos': 'peso'
  };

  const finalSensorType = sensorMapping[sensorType] || sensorType;
  
  // Análisis especial para peso
  if (finalSensorType === 'peso' && historial.length > 0) {
    const alertaPeso = analyzePesoChanges(historial, valor, fecha);
    if (alertaPeso) {
      return alertaPeso;
    }
  }
  
  const ranges = ALERT_RANGES[finalSensorType];

  if (!ranges) {
    return {
      category: 'normal',
      priority: 'normal',
      message: 'Valor normal',
      icon: '✅',
      color: '#10b981',
      suggestions: []
    };
  }

  // Verificar cada rango de alerta
  for (const [rangeKey, range] of Object.entries(ranges)) {
    if (shouldTriggerAlert(valor, range, estacion, fecha)) {
      
      // Si requiere múltiples eventos, verificar historial
      if (range.events_required > 1 && historial.length > 0) {
        const eventosEnVentana = countEventsInWindow(historial, topico, range, fecha);
        
        // Si no hay suficientes eventos, no activar alerta
        if (eventosEnVentana < range.events_required) {
          continue;
        }
        
        // Agregar información de eventos al resultado
        return {
          category: rangeKey.includes('critical') ? 'critical' : 'warning',
          priority: range.priority,
          message: `${range.message} (${eventosEnVentana}/${range.events_required} eventos en ${range.time_window}h)`,
          icon: range.icon,
          color: range.color,
          range: getRangeDescription(range),
          suggestions: range.suggestions || [],
          alertName: range.name,
          eventCount: eventosEnVentana,
          eventsRequired: range.events_required,
          timeWindow: range.time_window
        };
      }
      
      // Para alertas que no requieren múltiples eventos o sin historial
      return {
        category: rangeKey.includes('critical') ? 'critical' : 'warning',
        priority: range.priority,
        message: range.message,
        icon: range.icon,
        color: range.color,
        range: getRangeDescription(range),
        suggestions: range.suggestions || [],
        alertName: range.name
      };
    }
  }

  return {
    category: 'normal',
    priority: 'normal',
    message: 'Valor dentro de rangos normales',
    icon: '✅',
    color: '#10b981',
    suggestions: []
  };
};

/**
 * Verifica si un valor debe activar una alerta específica
 */
const shouldTriggerAlert = (valor, range, estacion, fecha) => {
  // Verificar estación
  if (range.season && range.season !== 'todo_el_año') {
    if (range.season !== estacion) {
      return false;
    }
  }

  // Verificar meses específicos (para peso principalmente)
  if (range.season_months) {
    const mes = fecha.getMonth() + 1;
    if (!range.season_months.includes(mes)) {
      return false;
    }
  }

  // Verificar umbral
  switch (range.operator) {
    case '>':
      return valor > range.threshold;
    case '<':
      return valor < range.threshold;
    case '>=':
      return valor >= range.threshold;
    case '<=':
      return valor <= range.threshold;
    case 'between':
      return valor >= range.threshold && valor <= (range.max_threshold || range.threshold);
    default:
      return false;
  }
};

/**
 * Genera descripción del rango de alerta
 */
const getRangeDescription = (range) => {
  switch (range.operator) {
    case '>':
      return `> ${range.threshold}`;
    case '<':
      return `< ${range.threshold}`;
    case '>=':
      return `≥ ${range.threshold}`;
    case '<=':
      return `≤ ${range.threshold}`;
    case 'between':
      return `${range.threshold} - ${range.max_threshold || range.threshold}`;
    default:
      return 'Rango específico';
  }
};

/**
 * Genera un reporte completo de alertas para el sistema
 * @param {Array} mensajes - Todos los mensajes
 * @param {Date} fecha - Fecha del reporte
 * @returns {Object} - Reporte completo de alertas
 */
export const generateAlertReport = (mensajes, fecha = new Date()) => {
  const reporte = {
    timestamp: fecha.toISOString(),
    estacion: getEstacion(fecha),
    resumen: {
      total_mensajes: mensajes.length,
      alertas_criticas: 0,
      alertas_preventivas: 0,
      mensajes_normales: 0
    },
    alertas_activas: [],
    alertas_cruce: [],
    estadisticas_por_sensor: {},
    recomendaciones_generales: []
  };

  // Análisis individual de mensajes
  mensajes.forEach(mensaje => {
    const analysis = analyzeMessage(
      mensaje.topico, 
      mensaje.payload, 
      new Date(mensaje.fecha), 
      mensajes
    );
    
    if (analysis.category === 'critical') {
      reporte.resumen.alertas_criticas++;
      reporte.alertas_activas.push({
        id: mensaje.id,
        nodo_id: mensaje.nodo_id,
        topico: mensaje.topico,
        payload: mensaje.payload,
        fecha: mensaje.fecha,
        analysis
      });
    } else if (analysis.category === 'warning') {
      reporte.resumen.alertas_preventivas++;
      reporte.alertas_activas.push({
        id: mensaje.id,
        nodo_id: mensaje.nodo_id,
        topico: mensaje.topico,
        payload: mensaje.payload,
        fecha: mensaje.fecha,
        analysis
      });
    } else {
      reporte.resumen.mensajes_normales++;
    }
    
    // Estadísticas por sensor
    const sensor = mensaje.topico.toLowerCase();
    if (!reporte.estadisticas_por_sensor[sensor]) {
      reporte.estadisticas_por_sensor[sensor] = {
        total: 0,
        criticas: 0,
        preventivas: 0,
        normales: 0,
        ultimo_valor: null,
        ultima_fecha: null
      };
    }
    
    const stats = reporte.estadisticas_por_sensor[sensor];
    stats.total++;
    stats.ultimo_valor = mensaje.payload;
    stats.ultima_fecha = mensaje.fecha;
    
    if (analysis.category === 'critical') stats.criticas++;
    else if (analysis.category === 'warning') stats.preventivas++;
    else stats.normales++;
  });

  // Análisis de cruce de variables
  reporte.alertas_cruce = analyzeCrossVariables(mensajes);

  // Generar recomendaciones generales
  if (reporte.resumen.alertas_criticas > 0) {
    reporte.recomendaciones_generales.push(
      '🚨 ACCIÓN INMEDIATA: Se detectaron alertas críticas que requieren atención urgente'
    );
  }
  
  if (reporte.alertas_cruce.length > 0) {
    reporte.recomendaciones_generales.push(
      '⚠️ VERIFICACIÓN VITAL: Posible problema grave - revisar estado de las colmenas inmediatamente'
    );
  }
  
  if (reporte.estacion === 'invernada') {
    reporte.recomendaciones_generales.push(
      '❄️ PERÍODO INVERNADA: Monitorear especialmente temperatura, humedad y peso'
    );
  } else {
    reporte.recomendaciones_generales.push(
      '🌸 PERÍODO ACTIVO: Vigilar enjambrazón, incrementos de peso y condiciones de cosecha'
    );
  }

  return reporte;
};

/**
 * Obtiene alertas prioritarias para notificaciones inmediatas
 * @param {Array} mensajes - Mensajes recientes
 * @returns {Array} - Lista de alertas que requieren notificación inmediata
 */
export const getUrgentAlerts = (mensajes) => {
  const alertasUrgentes = [];
  const ahoraMs = Date.now();
  const cincoMinutosAtras = ahoraMs - (5 * 60 * 1000);

  mensajes.forEach(mensaje => {
    const fechaMensaje = new Date(mensaje.fecha).getTime();
    
    // Solo alertas de los últimos 5 minutos
    if (fechaMensaje < cincoMinutosAtras) return;
    
    const analysis = analyzeMessage(
      mensaje.topico,
      mensaje.payload,
      new Date(mensaje.fecha),
      mensajes
    );
    
    // Solo alertas críticas y urgentes
    if (analysis.category === 'critical' && analysis.priority === 'urgent') {
      alertasUrgentes.push({
        ...mensaje,
        analysis,
        tiempoTranscurrido: Math.round((ahoraMs - fechaMensaje) / 1000 / 60) // minutos
      });
    }
  });

  // Ordenar por prioridad y tiempo
  return alertasUrgentes.sort((a, b) => {
    const priorityDiff = getPriorityLevel(b.analysis.priority) - getPriorityLevel(a.analysis.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return a.tiempoTranscurrido - b.tiempoTranscurrido; // Más recientes primero
  });
};

/**
 * Analiza cruce de variables (temperatura y humedad interna vs externa)
 * @param {Array} mensajesRecientes - Mensajes de las últimas horas
 * @returns {Array} - Alertas de cruce detectadas
 */
export const analyzeCrossVariables = (mensajesRecientes) => {
  const alertas = [];
  const ahora = new Date();
  const seisHorasAtras = new Date(ahora.getTime() - 6 * 60 * 60 * 1000);

  // Agrupar mensajes por tipo
  const temperaturas = {
    interna: [],
    externa: []
  };
  
  const humedades = {
    interna: [],
    externa: []
  };

  mensajesRecientes.forEach(mensaje => {
    const fecha = new Date(mensaje.fecha);
    if (fecha < seisHorasAtras) return;

    const valor = extractNumericValue(mensaje.payload);
    if (valor === null) return;

    const topico = mensaje.topico.toLowerCase();
    
    if (topico.includes('temp')) {
      if (topico.includes('ext') || topico.includes('externa')) {
        temperaturas.externa.push({ valor, fecha });
      } else {
        temperaturas.interna.push({ valor, fecha });
      }
    }
    
    if (topico.includes('hum')) {
      if (topico.includes('ext') || topico.includes('externa')) {
        humedades.externa.push({ valor, fecha });
      } else {
        humedades.interna.push({ valor, fecha });
      }
    }
  });

  // Verificar convergencia de temperaturas
  if (temperaturas.interna.length > 0 && temperaturas.externa.length > 0) {
    const convergencia = checkConvergence(
      temperaturas.interna, 
      temperaturas.externa, 
      CROSS_VARIABLE_ALERTS.temp_convergence.threshold
    );
    
    if (convergencia.isConverging) {
      alertas.push({
        type: 'temp_convergence',
        ...CROSS_VARIABLE_ALERTS.temp_convergence,
        details: convergencia,
        category: 'critical'
      });
    }
  }

  // Verificar convergencia de humedad
  if (humedades.interna.length > 0 && humedades.externa.length > 0) {
    const convergencia = checkConvergence(
      humedades.interna, 
      humedades.externa, 
      CROSS_VARIABLE_ALERTS.humidity_convergence.threshold
    );
    
    if (convergencia.isConverging) {
      alertas.push({
        type: 'humidity_convergence',
        ...CROSS_VARIABLE_ALERTS.humidity_convergence,
        details: convergencia,
        category: 'critical'
      });
    }
  }

  return alertas;
};

/**
 * Verifica si dos series de datos están convergiendo
 */
const checkConvergence = (serieInterna, serieExterna, threshold) => {
  // Tomar las últimas 12 mediciones (6 horas con mediciones cada 30 min)
  const ultimasInternas = serieInterna.slice(-12);
  const ultimasExternas = serieExterna.slice(-12);
  
  let puntosConvergentes = 0;
  const diferencias = [];

  // Comparar punto por punto
  const minLength = Math.min(ultimasInternas.length, ultimasExternas.length);
  
  for (let i = 0; i < minLength; i++) {
    const interna = ultimasInternas[ultimasInternas.length - 1 - i];
    const externa = ultimasExternas[ultimasExternas.length - 1 - i];
    
    const diferencia = Math.abs(interna.valor - externa.valor);
    diferencias.push(diferencia);
    
    if (diferencia <= threshold) {
      puntosConvergentes++;
    }
  }

  // Se considera convergencia si más del 80% de los puntos están dentro del threshold
  const isConverging = puntosConvergentes >= Math.ceil(minLength * 0.8) && minLength >= 6;

  return {
    isConverging,
    puntosConvergentes,
    totalPuntos: minLength,
    porcentajeConvergencia: (puntosConvergentes / minLength) * 100,
    diferenciaPromedio: diferencias.reduce((a, b) => a + b, 0) / diferencias.length,
    diferencias
  };
};

/**
 * Genera estadísticas de alertas
 * @param {Array} mensajes - Lista de mensajes a analizar
 * @returns {Object} - Estadísticas de alertas
 */
export const getAlertStatistics = (mensajes) => {
  const stats = {
    total: mensajes.length,
    critical: 0,
    warning: 0,
    normal: 0,
    unknown: 0,
    byType: {},
    recent: {
      lastHour: 0,
      last24Hours: 0
    }
  };

  const ahora = new Date();
  const unaHoraAtras = new Date(ahora.getTime() - 60 * 60 * 1000);
  const veinticuatroHorasAtras = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

  mensajes.forEach(mensaje => {
    const analysis = analyzeMessage(mensaje.topico, mensaje.payload, new Date(mensaje.fecha));
    const fechaMensaje = new Date(mensaje.fecha);
    
    // Contar por categoría
    stats[analysis.category]++;
    
    // Contar por tipo de sensor
    const sensorType = mensaje.topico.toLowerCase();
    if (!stats.byType[sensorType]) {
      stats.byType[sensorType] = { critical: 0, warning: 0, normal: 0, unknown: 0 };
    }
    stats.byType[sensorType][analysis.category]++;
    
    // Contar recientes
    if (fechaMensaje >= unaHoraAtras) {
      stats.recent.lastHour++;
    }
    if (fechaMensaje >= veinticuatroHorasAtras) {
      stats.recent.last24Hours++;
    }
  });

  return stats;
};

/**
 * Genera mensaje de alerta formateado
 */
export const generateAlertMessage = (nodoId, topico, analysis) => {
  const timestamp = new Date().toLocaleString('es-CL');
  
  return {
    timestamp,
    nodoId,
    topico,
    severity: analysis.category,
    title: `${analysis.icon} ${analysis.alertName || 'ALERTA'}`,
    message: analysis.message,
    suggestions: analysis.suggestions,
    priority: analysis.priority,
    color: analysis.color
  };
};

/**
 * Obtiene color basado en categoría
 */
export const getCategoryColor = (category) => {
  const colors = {
    critical: '#dc2626',
    warning: '#f59e0b', 
    normal: '#10b981',
    unknown: '#6b7280'
  };
  return colors[category] || colors.unknown;
};

/**
 * Obtiene icono basado en categoría
 */
export const getCategoryIcon = (category) => {
  const icons = {
    critical: '🚨',
    warning: '⚠️',
    normal: '✅',
    unknown: '❓'
  };
  return icons[category] || icons.unknown;
};

/**
 * Obtiene nivel de prioridad numérico
 */
export const getPriorityLevel = (priority) => {
  const levels = {
    urgent: 4,
    high: 3,
    medium: 2,
    normal: 1
  };
  return levels[priority] || 1;
};

/**
 * Constantes del sistema de alertas
 */
export const ALERT_SYSTEM = {
  VERSION: '2.0.0',
  MEASUREMENT_INTERVAL: 30, // minutos
  SUPPORTED_SENSORS: [
    'temperatura_interna',
    'temperatura_externa', 
    'humedad_interna',
    'humedad_externa',
    'peso'
  ],
  SEASONS: {
    INVERNADA: 'invernada',    // Marzo - Julio
    PRIMAVERA_VERANO: 'primavera-verano'  // Agosto - Abril
  },
  CROSS_VARIABLE_ANALYSIS: {
    ENABLED: true,
    TIME_WINDOW: 6, // horas
    CONVERGENCE_THRESHOLD: {
      TEMPERATURE: 2, // °C
      HUMIDITY: 2     // %
    }
  }
};

export default {
  analyzeMessage,
  analyzeCrossVariables,
  analyzePesoChanges,
  countEventsInWindow,
  generateAlertMessage,
  generateAlertReport,
  getUrgentAlerts,
  getCategoryColor,
  getCategoryIcon,
  getPriorityLevel,
  getAlertStatistics,
  getEstacion,
  extractNumericValue,
  extractUnit,
  ALERT_RANGES,
  CROSS_VARIABLE_ALERTS,
  ALERT_SYSTEM
};