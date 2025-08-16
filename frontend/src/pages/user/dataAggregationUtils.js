// dataAggregationUtils.js
// Utilidades para agregar y promediar datos según filtros de tiempo

/**
 * Función principal para agregar datos según el tipo de filtro
 * @param {Array} data - Datos sin procesar
 * @param {string} filterType - Tipo de filtro ('1dia', '1semana', '1mes', '1año', 'personalizado')
 * @param {Object} customRange - Rango personalizado {start: string, end: string}
 * @returns {Array} Datos agregados/promediados
 */
export const aggregateDataByTimeFilter = (data, filterType, customRange = null) => {
  if (!data || data.length === 0) return [];

  console.log(`🔄 Agregando datos para filtro: ${filterType}`, {
    originalCount: data.length,
    filterType,
    customRange
  });

  switch (filterType) {
    case '1dia':
      // Diario: Mostrar datos individuales tal cual
      return data.map(item => ({
        ...item,
        groupKey: formatIndividualDateTime(item.fecha),
        isAggregated: false,
        aggregationType: 'individual'
      }));

    case '1semana':
      // Semanal: Promediar por día
      return aggregateByDay(data);

    case '1mes':
      // Mensual: Agrupar por semanas del mes
      return aggregateByWeekOfMonth(data);

    case '1año':
      // Anual: Promediar por mes
      return aggregateByMonth(data);

    case 'personalizado':
      // Personalizado: Determinar agrupación según el rango
      return aggregateByCustomRange(data, customRange);

    default:
      return data.map(item => ({
        ...item,
        groupKey: formatIndividualDateTime(item.fecha),
        isAggregated: false,
        aggregationType: 'individual'
      }));
  }
};

/**
 * Agregar datos por día de la semana
 */
const aggregateByDay = (data) => {
  const groupedData = {};

  data.forEach(item => {
    const date = new Date(item.fecha);
    const dayKey = `${getDayName(date)} ${date.getDate()}/${date.getMonth() + 1}`;
    
    if (!groupedData[dayKey]) {
      groupedData[dayKey] = {
        groupKey: dayKey,
        fecha: date,
        tipo: item.tipo,
        items: [],
        temperatura: [],
        humedad: [],
        peso: [],
        isAggregated: true,
        aggregationType: 'daily'
      };
    }
    
    groupedData[dayKey].items.push(item);
    if (item.temperatura !== null && item.temperatura !== undefined) {
      groupedData[dayKey].temperatura.push(item.temperatura);
    }
    if (item.humedad !== null && item.humedad !== undefined) {
      groupedData[dayKey].humedad.push(item.humedad);
    }
    if (item.peso !== null && item.peso !== undefined) {
      groupedData[dayKey].peso.push(item.peso);
    }
  });

  return calculateAverages(groupedData, 'daily');
};

/**
 * Agregar datos por semanas del mes
 */
const aggregateByWeekOfMonth = (data) => {
  const groupedData = {};

  data.forEach(item => {
    const date = new Date(item.fecha);
    const weekKey = `${getWeekOfMonth(date)} ${getMonthName(date)}`;
    
    if (!groupedData[weekKey]) {
      groupedData[weekKey] = {
        groupKey: weekKey,
        fecha: date,
        tipo: item.tipo,
        items: [],
        temperatura: [],
        humedad: [],
        peso: [],
        isAggregated: true,
        aggregationType: 'weekly'
      };
    }
    
    groupedData[weekKey].items.push(item);
    if (item.temperatura !== null && item.temperatura !== undefined) {
      groupedData[weekKey].temperatura.push(item.temperatura);
    }
    if (item.humedad !== null && item.humedad !== undefined) {
      groupedData[weekKey].humedad.push(item.humedad);
    }
    if (item.peso !== null && item.peso !== undefined) {
      groupedData[weekKey].peso.push(item.peso);
    }
  });

  return calculateAverages(groupedData, 'weekly');
};

/**
 * Agregar datos por mes
 */
const aggregateByMonth = (data) => {
  const groupedData = {};

  data.forEach(item => {
    const date = new Date(item.fecha);
    const monthKey = `${getMonthName(date)} ${date.getFullYear()}`;
    
    if (!groupedData[monthKey]) {
      groupedData[monthKey] = {
        groupKey: monthKey,
        fecha: date,
        tipo: item.tipo,
        items: [],
        temperatura: [],
        humedad: [],
        peso: [],
        isAggregated: true,
        aggregationType: 'monthly'
      };
    }
    
    groupedData[monthKey].items.push(item);
    if (item.temperatura !== null && item.temperatura !== undefined) {
      groupedData[monthKey].temperatura.push(item.temperatura);
    }
    if (item.humedad !== null && item.humedad !== undefined) {
      groupedData[monthKey].humedad.push(item.humedad);
    }
    if (item.peso !== null && item.peso !== undefined) {
      groupedData[monthKey].peso.push(item.peso);
    }
  });

  return calculateAverages(groupedData, 'monthly');
};

/**
 * Agregar datos por rango personalizado
 */
const aggregateByCustomRange = (data, customRange) => {
  if (!customRange || !customRange.start || !customRange.end) {
    return data.map(item => ({
      ...item,
      groupKey: formatIndividualDateTime(item.fecha),
      isAggregated: false,
      aggregationType: 'individual'
    }));
  }

  const startDate = new Date(customRange.start);
  const endDate = new Date(customRange.end);
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  console.log(`📅 Rango personalizado: ${daysDiff} días`, { startDate, endDate });

  if (daysDiff <= 1) {
    // Menos de 1 día: Sin agrupación
    return data.map(item => ({
      ...item,
      groupKey: formatIndividualDateTime(item.fecha),
      isAggregated: false,
      aggregationType: 'individual'
    }));
  } else if (daysDiff <= 7) {
    // 1-7 días: Agrupar por día
    return aggregateByDay(data);
  } else if (daysDiff <= 60) {
    // 7-60 días: Agrupar por semana
    return aggregateByWeek(data);
  } else {
    // Más de 60 días: Agrupar por mes
    return aggregateByMonth(data);
  }
};

/**
 * Agregar datos por semana (para rangos personalizados)
 */
const aggregateByWeek = (data) => {
  const groupedData = {};

  data.forEach(item => {
    const date = new Date(item.fecha);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = `Semana ${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    
    if (!groupedData[weekKey]) {
      groupedData[weekKey] = {
        groupKey: weekKey,
        fecha: weekStart,
        tipo: item.tipo,
        items: [],
        temperatura: [],
        humedad: [],
        peso: [],
        isAggregated: true,
        aggregationType: 'weekly'
      };
    }
    
    groupedData[weekKey].items.push(item);
    if (item.temperatura !== null && item.temperatura !== undefined) {
      groupedData[weekKey].temperatura.push(item.temperatura);
    }
    if (item.humedad !== null && item.humedad !== undefined) {
      groupedData[weekKey].humedad.push(item.humedad);
    }
    if (item.peso !== null && item.peso !== undefined) {
      groupedData[weekKey].peso.push(item.peso);
    }
  });

  return calculateAverages(groupedData, 'weekly');
};

/**
 * Calcular promedios para datos agrupados
 */
const calculateAverages = (groupedData, aggregationType) => {
  return Object.values(groupedData).map(group => {
    const avgTemp = group.temperatura.length > 0 
      ? group.temperatura.reduce((sum, val) => sum + val, 0) / group.temperatura.length 
      : null;
    
    const avgHum = group.humedad.length > 0 
      ? group.humedad.reduce((sum, val) => sum + val, 0) / group.humedad.length 
      : null;
    
    const avgPeso = group.peso.length > 0 
      ? group.peso.reduce((sum, val) => sum + val, 0) / group.peso.length 
      : null;

    // Mantener estructura base del primer item
    const baseItem = group.items[0];

    return {
      ...baseItem,
      groupKey: group.groupKey,
      fecha: group.fecha,
      temperatura: avgTemp,
      humedad: avgHum,
      peso: avgPeso,
      isAggregated: true,
      aggregationType: aggregationType,
      originalCount: group.items.length,
      tempCount: group.temperatura.length,
      humCount: group.humedad.length,
      pesoCount: group.peso.length,
      // Metadatos adicionales para debugging
      dateRange: {
        start: new Date(Math.min(...group.items.map(i => new Date(i.fecha)))),
        end: new Date(Math.max(...group.items.map(i => new Date(i.fecha))))
      }
    };
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
};

/**
 * Funciones de utilidad para fechas
 */
const getDayName = (date) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[date.getDay()];
};

const getMonthName = (date) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[date.getMonth()];
};

const getWeekOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekday = firstDay.getDay();
  const dayOfMonth = date.getDate();
  const weekNumber = Math.ceil((dayOfMonth + firstWeekday) / 7);
  return `Sem${weekNumber}`;
};

const formatIndividualDateTime = (fecha) => {
  const date = new Date(fecha);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}/${month} ${hours}:${minutes}:${seconds}`;
};

/**
 * Función para obtener información de agrupación
 */
export const getAggregationInfo = (timeFilter, aggregatedData, customRange) => {
  const count = aggregatedData?.length || 0;
  
  switch (timeFilter) {
    case '1dia':
      return `${count} registros individuales`;
    case '1semana':
      return `${count} días promediados`;
    case '1mes':
      return `${count} semanas promediadas`;
    case '1año':
      return `${count} meses promediados`;
    case 'personalizado':
      if (!customRange?.start || !customRange?.end) {
        return `${count} registros`;
      }
      
      const startDate = new Date(customRange.start);
      const endDate = new Date(customRange.end);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        return `${count} registros individuales`;
      } else if (daysDiff <= 7) {
        return `${count} días promediados`;
      } else if (daysDiff <= 60) {
        return `${count} semanas promediadas`;
      } else {
        return `${count} meses promediados`;
      }
    default:
      return `${count} registros`;
  }
};

/**
 * Función para obtener el tipo de agrupación para un rango personalizado
 */
export const getCustomRangeAggregationType = (customRange) => {
  if (!customRange?.start || !customRange?.end) {
    return 'individual';
  }
  
  const startDate = new Date(customRange.start);
  const endDate = new Date(customRange.end);
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 1) return 'individual';
  if (daysDiff <= 7) return 'daily';
  if (daysDiff <= 60) return 'weekly';
  return 'monthly';
};

/**
 * Actualizar configuración de filtros con información de agrupación
 */
export const updateTimeFiltersConfig = (baseFilters) => {
  return baseFilters.map(filter => ({
    ...filter,
    aggregationType: getAggregationTypeForFilter(filter.key)
  }));
};

const getAggregationTypeForFilter = (filterKey) => {
  switch (filterKey) {
    case '1dia':
      return 'datos individuales';
    case '1semana':
      return 'promedio por día';
    case '1mes':
      return 'promedio por semana';
    case '1año':
      return 'promedio por mes';
    default:
      return 'agrupación automática';
  }
};

// Exportar funciones principales
export {
  aggregateByDay,
  aggregateByWeekOfMonth,
  aggregateByMonth,
  aggregateByCustomRange,
  calculateAverages,
  getDayName,
  getMonthName,
  getWeekOfMonth,
  formatIndividualDateTime
};