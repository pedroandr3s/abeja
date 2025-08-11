import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../../context/ApiContext';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import AlertasButton from './AlertasButton'; 
import * as Chart from 'chart.js';

// Registrar todos los componentes necesarios de Chart.js
Chart.Chart.register(
  Chart.CategoryScale,
  Chart.LinearScale,
  Chart.PointElement,
  Chart.LineElement,
  Chart.LineController,
  Chart.Title,
  Chart.Tooltip,
  Chart.Legend,
  Chart.Filler
);

const DashboardComplete = () => {
  const { dashboard, mensajes, colmenas, usuarios, isConnected } = useApi();
  const [currentUser, setCurrentUser] = useState(null);
  const [userColmenas, setUserColmenas] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [processedData, setProcessedData] = useState({ temperatura: [], humedad: [], peso: [] });
  const [alertMessage, setAlertMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [dataHash, setDataHash] = useState('');
  const [previousDataLength, setPreviousDataLength] = useState(0);
  
  // Estados para filtros de tiempo - CAMBIO: Por defecto '1dia' en lugar de '1semana'
  const [timeFilter, setTimeFilter] = useState('1dia');
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null
  });

  const API_BASE = 'https://backend-production-eb26.up.railway.app/api';

  // Referencias para los gráficos de Chart.js
  const temperaturaChartRef = useRef(null);
  const humedadChartRef = useRef(null);
  const pesoChartRef = useRef(null);
  const chartInstances = useRef({});

  // Definir los filtros de tiempo disponibles con agrupación dinámica
  const timeFilters = [
    { 
      key: '1dia', 
      label: '📅 Último Día (30 min)', 
      hours: 24,
      grouping: 'media_hora',
      description: 'Un dato cada 30 minutos'
    },
    { 
      key: '1semana', 
      label: '📆 Última Semana (Diario)', 
      hours: 168,
      grouping: 'diario',
      description: 'Un dato por día'
    },
    { 
      key: '1mes', 
      label: '🗓️ Último Mes (Semanal)', 
      hours: 720,
      grouping: 'semanal',
      description: 'Semana 1, 2, 3, 4'
    },
    { 
      key: '1año', 
      label: '📊 Último Año (Mensual)', 
      hours: 8760,
      grouping: 'mensual',
      description: 'Mes a mes'
    }
  ];

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  // Aplicar filtro cuando cambien los datos o el filtro seleccionado
  useEffect(() => {
    if (sensorData.length > 0) {
      applyTimeFilter();
    }
  }, [sensorData, timeFilter, customDateRange]);

  // Auto-actualizar datos cada 10 segundos
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-actualización cada 10 segundos...');
        loadSensorData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Limpiar gráficos al desmontar el componente
  useEffect(() => {
    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) {
          chart.destroy();
        }
      });
    };
  }, []);

  // Hook para crear/actualizar gráficos cuando cambien los datos FILTRADOS
  useEffect(() => {
    if (filteredData.length > 0) {
      const isInitialLoad = !chartInstances.current.temperatura && !chartInstances.current.humedad && !chartInstances.current.peso;
      const hasNewData = filteredData.length !== previousDataLength;

      if (isInitialLoad || hasNewData) {
        console.log('🎨 Recreando gráficos con datos agrupados dinámicamente...');
        processDataByFilter();
        createInitialCharts();
      }

      setPreviousDataLength(filteredData.length);
    } else {
      // Si no hay datos filtrados, destruir gráficos
      Object.keys(chartInstances.current).forEach(key => {
        if (chartInstances.current[key]) {
          try {
            chartInstances.current[key].destroy();
          } catch (error) {
            console.warn('Error destruyendo gráfico:', error);
          }
          chartInstances.current[key] = null;
        }
      });
    }
  }, [filteredData]);

  // NUEVA: Función para procesar datos según el filtro seleccionado
  const processDataByFilter = () => {
    if (!filteredData || filteredData.length === 0) {
      setProcessedData({ temperatura: [], humedad: [], peso: [] });
      return;
    }

    const selectedFilter = timeFilters.find(f => f.key === timeFilter);
    const groupingType = selectedFilter ? selectedFilter.grouping : 'diario';

    console.log(`📊 Procesando datos con agrupación: ${groupingType}`);

    let processedTemp = [];
    let processedHum = [];
    let processedPeso = [];

    switch (groupingType) {
      case 'media_hora':
        processedTemp = groupByHalfHour(filteredData, 'temperatura');
        processedHum = groupByHalfHour(filteredData, 'humedad');
        processedPeso = groupByHalfHour(filteredData.filter(d => d.tipo === 'interno' && d.peso !== null), 'peso');
        break;
        
      case 'diario':
        processedTemp = groupByDay(filteredData, 'temperatura');
        processedHum = groupByDay(filteredData, 'humedad');
        processedPeso = groupByDay(filteredData.filter(d => d.tipo === 'interno' && d.peso !== null), 'peso');
        break;
        
      case 'semanal':
        processedTemp = groupByWeek(filteredData, 'temperatura');
        processedHum = groupByWeek(filteredData, 'humedad');
        processedPeso = groupByWeek(filteredData.filter(d => d.tipo === 'interno' && d.peso !== null), 'peso');
        break;
        
      case 'mensual':
        processedTemp = groupByMonth(filteredData, 'temperatura');
        processedHum = groupByMonth(filteredData, 'humedad');
        processedPeso = groupByMonth(filteredData.filter(d => d.tipo === 'interno' && d.peso !== null), 'peso');
        break;
        
      default:
        // Fallback a agrupación por hora
        processedTemp = groupByHour(filteredData, 'temperatura');
        processedHum = groupByHour(filteredData, 'humedad');
        processedPeso = groupByHour(filteredData.filter(d => d.tipo === 'interno' && d.peso !== null), 'peso');
    }

    console.log('📊 Datos procesados:', {
      agrupacion: groupingType,
      temperatura: processedTemp.length,
      humedad: processedHum.length,
      peso: processedPeso.length
    });

    setProcessedData({
      temperatura: processedTemp,
      humedad: processedHum,
      peso: processedPeso
    });
  };

  // Función para agrupar por media hora (30 minutos)
  const groupByHalfHour = (data, field) => {
    const grouped = {};
    
    data.forEach(item => {
      if (item[field] !== null && item[field] !== undefined) {
        const date = ensureDate(item.fecha);
        const minutes = date.getMinutes();
        const halfHourMark = minutes < 30 ? 0 : 30;
        const halfHourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(halfHourMark).padStart(2, '0')}`;
        
        if (!grouped[halfHourKey]) {
          grouped[halfHourKey] = {
            fecha: halfHourKey,
            valores: [],
            tipos: {}
          };
        }
        
        grouped[halfHourKey].valores.push(item[field]);
        
        if (!grouped[halfHourKey].tipos[item.tipo]) {
          grouped[halfHourKey].tipos[item.tipo] = [];
        }
        grouped[halfHourKey].tipos[item.tipo].push(item[field]);
      }
    });

    return processGroupedData(grouped, '30 minutos');
  };

  // Función para agrupar por día
  const groupByDay = (data, field) => {
    const grouped = {};
    
    data.forEach(item => {
      if (item[field] !== null && item[field] !== undefined) {
        const date = ensureDate(item.fecha);
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (!grouped[dayKey]) {
          grouped[dayKey] = {
            fecha: dayKey,
            valores: [],
            tipos: {}
          };
        }
        
        grouped[dayKey].valores.push(item[field]);
        
        if (!grouped[dayKey].tipos[item.tipo]) {
          grouped[dayKey].tipos[item.tipo] = [];
        }
        grouped[dayKey].tipos[item.tipo].push(item[field]);
      }
    });

    return processGroupedData(grouped, 'día');
  };

  // Función para agrupar por semana
  const groupByWeek = (data, field) => {
    const grouped = {};
    
    data.forEach(item => {
      if (item[field] !== null && item[field] !== undefined) {
        const date = ensureDate(item.fecha);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const weekOfMonth = Math.ceil((date.getDate() + startOfMonth.getDay()) / 7);
        const weekKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-Semana-${weekOfMonth}`;
        
        if (!grouped[weekKey]) {
          grouped[weekKey] = {
            fecha: weekKey,
            valores: [],
            tipos: {}
          };
        }
        
        grouped[weekKey].valores.push(item[field]);
        
        if (!grouped[weekKey].tipos[item.tipo]) {
          grouped[weekKey].tipos[item.tipo] = [];
        }
        grouped[weekKey].tipos[item.tipo].push(item[field]);
      }
    });

    return processGroupedData(grouped, 'semana');
  };

  // Función para agrupar por mes
  const groupByMonth = (data, field) => {
    const grouped = {};
    
    data.forEach(item => {
      if (item[field] !== null && item[field] !== undefined) {
        const date = ensureDate(item.fecha);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            fecha: monthKey,
            valores: [],
            tipos: {}
          };
        }
        
        grouped[monthKey].valores.push(item[field]);
        
        if (!grouped[monthKey].tipos[item.tipo]) {
          grouped[monthKey].tipos[item.tipo] = [];
        }
        grouped[monthKey].tipos[item.tipo].push(item[field]);
      }
    });

    return processGroupedData(grouped, 'mes');
  };

  // Función para agrupar por hora (fallback)
  const groupByHour = (data, field) => {
    const grouped = {};
    
    data.forEach(item => {
      if (item[field] !== null && item[field] !== undefined) {
        const date = ensureDate(item.fecha);
        const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        
        if (!grouped[hourKey]) {
          grouped[hourKey] = {
            fecha: hourKey,
            valores: [],
            tipos: {}
          };
        }
        
        grouped[hourKey].valores.push(item[field]);
        
        if (!grouped[hourKey].tipos[item.tipo]) {
          grouped[hourKey].tipos[item.tipo] = [];
        }
        grouped[hourKey].tipos[item.tipo].push(item[field]);
      }
    });

    return processGroupedData(grouped, 'hora');
  };

  // Función auxiliar para procesar datos agrupados
  const processGroupedData = (grouped, periodType) => {
    return Object.keys(grouped)
      .sort()
      .map(key => {
        const group = grouped[key];
        const result = {
          fecha: new Date(key.includes('Semana') ? key.split('-Semana')[0] + '-01' : key + (key.length === 7 ? '-01' : '')),
          fechaStr: key,
          promedio: group.valores.reduce((sum, val) => sum + val, 0) / group.valores.length,
          cantidad: group.valores.length,
          periodo: periodType
        };

        // Para temperatura y humedad, calcular promedios por tipo
        Object.keys(group.tipos).forEach(tipo => {
          const valores = group.tipos[tipo];
          result[`promedio_${tipo}`] = valores.reduce((sum, val) => sum + val, 0) / valores.length;
          result[`cantidad_${tipo}`] = valores.length;
        });

        return result;
      });
  };

  // Función para aplicar filtros de tiempo
  const applyTimeFilter = () => {
    console.log(`🔍 Aplicando filtro: ${timeFilter}`);
    
    if (!sensorData || sensorData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...sensorData];
    const now = new Date();
    
    if (timeFilter !== 'personalizado') {
      const selectedFilter = timeFilters.find(f => f.key === timeFilter);
      if (selectedFilter) {
        const cutoffTime = new Date(now.getTime() - (selectedFilter.hours * 60 * 60 * 1000));
        filtered = sensorData.filter(item => {
          const itemDate = ensureDate(item.fecha);
          return itemDate >= cutoffTime;
        });
        
        console.log(`📊 Filtro ${selectedFilter.label}: ${filtered.length} registros de ${sensorData.length} totales`);
      }
    } else if (customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = sensorData.filter(item => {
        const itemDate = ensureDate(item.fecha);
        return itemDate >= startDate && itemDate <= endDate;
      });
      
      console.log(`📊 Filtro personalizado: ${filtered.length} registros entre ${startDate.toLocaleDateString()} y ${endDate.toLocaleDateString()}`);
    }

    // Ordenar por fecha
    filtered.sort((a, b) => ensureDate(a.fecha).getTime() - ensureDate(b.fecha).getTime());
    
    setFilteredData(filtered);
  };

  // Función para cambiar filtro de tiempo
  const handleTimeFilterChange = (filterKey) => {
    console.log(`🔄 Cambiando filtro a: ${filterKey}`);
    setTimeFilter(filterKey);
  };

  // Función para aplicar rango personalizado
  const handleCustomDateRange = (start, end) => {
    setCustomDateRange({ start, end });
    setTimeFilter('personalizado');
  };

  const createInitialCharts = () => {
    // Destruir gráficos existentes si los hay
    Object.keys(chartInstances.current).forEach(key => {
      if (chartInstances.current[key]) {
        try {
          chartInstances.current[key].destroy();
        } catch (error) {
          console.warn('Error destruyendo gráfico:', error);
        }
        chartInstances.current[key] = null;
      }
    });

    // Crear nuevos gráficos con datos procesados dinámicamente
    setTimeout(() => {
      try {
        if (temperaturaChartRef.current && processedData.temperatura.length > 0) {
          const existingChart = Chart.Chart.getChart(temperaturaChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          const ctx = temperaturaChartRef.current.getContext('2d');
          chartInstances.current.temperatura = createChartJSInstance(ctx, processedData.temperatura, 'temperatura');
        }
        
        if (humedadChartRef.current && processedData.humedad.length > 0) {
          const existingChart = Chart.Chart.getChart(humedadChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          const ctx = humedadChartRef.current.getContext('2d');
          chartInstances.current.humedad = createChartJSInstance(ctx, processedData.humedad, 'humedad');
        }
        
        if (pesoChartRef.current && processedData.peso.length > 0) {
          const existingChart = Chart.Chart.getChart(pesoChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          const ctx = pesoChartRef.current.getContext('2d');
          chartInstances.current.peso = createChartJSInstance(ctx, processedData.peso, 'peso');
        }
      } catch (error) {
        console.error('Error creando gráficos:', error);
      }
    }, 100);
  };

  const checkAuthentication = () => {
    try {
      const token = localStorage.getItem('smartbee_token');
      const userData = localStorage.getItem('smartbee_user');
      
      if (!token || !userData) {
        console.log('❌ Usuario no autenticado');
        setAlertMessage({
          type: 'error',
          message: 'Sesión no válida. Por favor, inicie sesión nuevamente.'
        });
        return;
      }

      const user = JSON.parse(userData);
      setCurrentUser(user);
      console.log('✅ Usuario autenticado:', user.nombre, user.apellido, '- Rol:', user.rol);
      
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setAlertMessage({
        type: 'error',
        message: 'Error verificando la sesión.'
      });
    }
  };

  // Función auxiliar para asegurar que las fechas sean objetos Date válidos
  const ensureDate = (dateValue) => {
    if (!dateValue) return new Date();
    
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? new Date() : dateValue;
    }
    
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const parsedDate = new Date(dateValue);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    
    return new Date();
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Cargando datos para usuario:', currentUser.nombre, currentUser.apellido);

      // Cargar colmenas reales del usuario
      try {
        const colmenasResponse = await colmenas.getByDueno(currentUser.id);
        console.log('✅ Colmenas del usuario cargadas:', colmenasResponse);
        setUserColmenas(colmenasResponse.data || []);
        
        if (!colmenasResponse.data || colmenasResponse.data.length === 0) {
          setAlertMessage({
            type: 'warning',
            message: 'No tienes colmenas registradas en el sistema.'
          });
        }
      } catch (error) {
        console.error('❌ Error cargando colmenas:', error);
        setUserColmenas([]);
        setAlertMessage({
          type: 'error',
          message: 'Error cargando colmenas del usuario. Verifica la conexión.'
        });
      }

      // Cargar datos de sensores
      await loadSensorData();

    } catch (err) {
      console.error('❌ Error cargando dashboard:', err);
      setAlertMessage({
        type: 'error',
        message: 'Error cargando los datos del dashboard'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función MEJORADA para cargar TODOS los datos reales disponibles
  const loadSensorData = async () => {
    setIsLoadingData(true);
    
    try {
      const startTime = new Date();
      console.log('📡 [' + startTime.toLocaleTimeString() + '] Cargando TODOS los datos disponibles...');
      
      // Intentar primero con el endpoint específico del dashboard
      try {
        const dashboardResponse = await dashboard.getSensorData(8760); // 8760 horas = 1 año completo
        console.log('📊 Respuesta dashboard:', {
          timestamp: new Date().toLocaleTimeString(),
          data: dashboardResponse
        });
        
        if (dashboardResponse && dashboardResponse.combinados && dashboardResponse.combinados.length > 0) {
          // Tomar TODOS los datos disponibles
          const datosReales = dashboardResponse.combinados
            .map(item => ({
              ...item,
              fecha: ensureDate(item.fecha)
            }))
            .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
          
          // Crear un hash de los datos para detectar cambios reales
          const newDataHash = JSON.stringify(datosReales.map(d => ({ id: d.id, fecha: d.fecha.getTime() })));
          
          console.log('🔍 Comparando datos:', {
            timestamp: new Date().toLocaleTimeString(),
            totalRegistros: datosReales.length,
            hashAnterior: dataHash.substring(0, 50) + '...',
            hashNuevo: newDataHash.substring(0, 50) + '...',
            hashIgual: dataHash === newDataHash
          });
          
          if (dataHash !== newDataHash) {
            console.log('✅ DATOS NUEVOS DETECTADOS - Actualizando dashboard');
            
            setSensorData(datosReales);
            setDataHash(newDataHash);
            setLastUpdateTime(new Date());
            setDataSourceInfo(`Dashboard API - ${datosReales.length} registros totales`);
          } else {
            console.log('⏸️ Mismos datos - Sin cambios detectados');
          }
          
          return;
        } else {
          console.warn('⚠️ Dashboard API no devolvió datos válidos');
        }
      } catch (dashboardError) {
        console.warn('⚠️ Error en dashboard API:', dashboardError.message);
      }
      
      // Fallback: endpoint de mensajes
      try {
        console.log('🔄 Fallback: Intentando con endpoint de mensajes...');
        const mensajesResponse = await mensajes.getRecientes(8760);
        console.log('📊 Respuesta mensajes:', {
          timestamp: new Date().toLocaleTimeString(),
          totalMensajes: mensajesResponse?.data?.length || 0
        });
        
        if (mensajesResponse && mensajesResponse.data && mensajesResponse.data.length > 0) {
          const processedData = processSensorMessages(mensajesResponse.data);
          
          if (processedData.length > 0) {
            const todosLosDatos = processedData
              .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
            
            const newDataHash = JSON.stringify(todosLosDatos.map(d => ({ id: d.id, fecha: d.fecha.getTime() })));
            
            if (dataHash !== newDataHash) {
              console.log('✅ DATOS NUEVOS desde mensajes - Actualizando dashboard');
              
              setSensorData(todosLosDatos);
              setDataHash(newDataHash);
              setLastUpdateTime(new Date());
              setDataSourceInfo(`Mensajes API - ${todosLosDatos.length} registros totales`);
            } else {
              console.log('⏸️ Mismos datos desde mensajes - Sin cambios');
            }
            
            return;
          }
        }
      } catch (mensajesError) {
        console.warn('⚠️ Error en mensajes API:', mensajesError.message);
      }
      
      console.log('❌ No se encontraron datos en ningún endpoint');
      if (sensorData.length === 0) {
        setSensorData([]);
        setDataSourceInfo('Sin datos');
        setAlertMessage({
          type: 'error',
          message: '❌ No se encontraron datos de sensores'
        });
      }

    } catch (err) {
      console.error('❌ Error general cargando datos:', err);
      setAlertMessage({
        type: 'error',
        message: 'Error de conexión cargando datos de sensores'
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Función para procesar mensajes
  const processSensorMessages = (messages) => {
    if (!messages || !Array.isArray(messages)) {
      console.warn('⚠️ Mensajes inválidos:', messages);
      return [];
    }

    console.log('🔄 Procesando', messages.length, 'mensajes para obtener TODOS los datos...');
    
    const nodoInterno = 'NODO-BEF8C985-0FF3-4874-935B-40AA8A235FF7';
    const nodoExterno = 'NODO-B5B3ABC4-E0CE-4662-ACB3-7A631C12394A';
    const nodoReal = 'NODO-7881883A-97A5-47E0-869C-753E99E1B168';
    
    const nodosUnicos = [...new Set(messages.map(m => m.nodo_id))];
    console.log('📋 Nodos únicos en mensajes:', nodosUnicos);
    
    const sensorMessages = messages
      .filter(msg => {
        const hasPayload = msg.payload && typeof msg.payload === 'object';
        
        const hasSensorData = hasPayload && (
          msg.payload.temperatura !== undefined || 
          msg.payload.humedad !== undefined ||
          msg.payload.peso !== undefined ||
          msg.payload.temperature !== undefined ||
          msg.payload.humidity !== undefined ||
          msg.payload.weight !== undefined
        );
        
        return hasPayload && hasSensorData;
      })
      .map(msg => {
        const payload = msg.payload;
        const temperatura = payload.temperatura || payload.temperature || null;
        const humedad = payload.humedad || payload.humidity || null;
        const peso = payload.peso || payload.weight || null;
        
        let tipo = 'sensor';
        if (msg.nodo_id === nodoInterno) {
          tipo = 'interno';
        } else if (msg.nodo_id === nodoExterno) {
          tipo = 'externo';
        } else if (msg.nodo_id === nodoReal) {
          tipo = 'real';
        } else {
          tipo = peso !== null ? 'interno' : 'externo';
        }
        
        const fechaOriginal = msg.fecha_recepcion || msg.fecha;
        const fechaValida = ensureDate(fechaOriginal);
        
        return {
          id: msg.id,
          fecha: fechaValida,
          temperatura: temperatura ? parseFloat(temperatura) : null,
          humedad: humedad ? parseFloat(humedad) : null,
          peso: peso ? parseFloat(peso) : null,
          nodo_id: msg.nodo_id,
          topico: msg.topico,
          tipo: tipo
        };
      })
      .filter(item => {
        return item.temperatura !== null || item.humedad !== null || item.peso !== null;
      })
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    console.log('✅ Mensajes procesados (TODOS los datos):', sensorMessages.length);
    console.log('📊 Desglose por tipo:', {
      internos: sensorMessages.filter(m => m.tipo === 'interno').length,
      externos: sensorMessages.filter(m => m.tipo === 'externo').length,
      otros: sensorMessages.filter(m => m.tipo === 'sensor').length
    });
    
    return sensorMessages;
  };

  const handleRefresh = () => {
    console.log('🔄 Refresh manual iniciado...');
    loadDashboardData();
  };

  // Función para crear gráficos con Chart.js - MODIFICADA PARA DATOS DINÁMICOS
  const createSpecificChart = (data, chartType, title, chartId) => {
    if (!data || data.length < 2) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}>
          <h3 style={{ margin: 0, color: '#6b7280' }}>📊 {title}</h3>
          <p style={{ color: '#9ca3af', margin: '16px 0 0 0' }}>
            No hay suficientes datos para mostrar el gráfico en el período seleccionado
          </p>
        </div>
      );
    }

    const isMobile = window.innerWidth <= 768;

    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
        flex: '1',
        minWidth: isMobile ? '100%' : '320px',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header del gráfico */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
            letterSpacing: '0.025em'
          }}>
            📊 {title}
          </h3>
        </div>
        
        {/* Canvas para Chart.js */}
        <div style={{ 
          width: '100%', 
          height: '400px',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          position: 'relative'
        }}>
          <canvas
            ref={chartType === 'temperatura' ? temperaturaChartRef : 
                 chartType === 'humedad' ? humedadChartRef : pesoChartRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </div>
        
        {/* Información del filtro aplicado */}
        <div style={{ 
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '16px',
          background: 'rgba(249, 250, 251, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(229, 231, 235, 0.5)'
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {data.length} períodos con datos
          </span>
        </div>
      </div>
    );
  };

  // Función auxiliar para crear instancias de Chart.js - MODIFICADA PARA AGRUPACIÓN DINÁMICA
  const createChartJSInstance = (ctx, data, chartType) => {
    if (!data || data.length < 2) return null;

    let datasets = [];
    let labels = [];
    let yAxisLabel = '';
    const selectedFilter = timeFilters.find(f => f.key === timeFilter);
    const groupingType = selectedFilter ? selectedFilter.grouping : 'diario';
    
    // Formatear labels según el tipo de agrupación
    const formatLabel = (fechaStr, grouping) => {
      switch (grouping) {
        case 'media_hora':
          return fechaStr; // Ya viene formateado como "YYYY-MM-DD HH:mm"
        case 'diario':
          const [year, month, day] = fechaStr.split('-');
          return `${day}/${month}`;
        case 'semanal':
          return fechaStr.replace('-Semana-', ' S'); // "2024-01-Semana-1" -> "2024-01 S1"
        case 'mensual':
          const [yr, mn] = fechaStr.split('-');
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          return `${months[parseInt(mn) - 1]} ${yr}`;
        default:
          return fechaStr;
      }
    };

    labels = data.map(d => formatLabel(d.fechaStr, groupingType));
    
    switch (chartType) {
      case 'temperatura':
        yAxisLabel = `Temperatura Promedio por ${data[0]?.periodo || 'período'} (°C)`;
        
        // Separar datos internos y externos
        const hasInterno = data.some(d => d.promedio_interno !== undefined);
        const hasExterno = data.some(d => d.promedio_externo !== undefined);
        
        datasets = [];
        
        if (hasInterno) {
          datasets.push({
            label: `Temperatura Interna (${data[0]?.periodo || 'período'})`,
            data: data.map(d => d.promedio_interno || null),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: false
          });
        }
        
        if (hasExterno) {
          datasets.push({
            label: `Temperatura Externa (${data[0]?.periodo || 'período'})`,
            data: data.map(d => d.promedio_externo || null),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: false
          });
        }
        break;
        
      case 'humedad':
        yAxisLabel = `Humedad Promedio por ${data[0]?.periodo || 'período'} (%)`;
        
        const hasInternoHum = data.some(d => d.promedio_interno !== undefined);
        const hasExternoHum = data.some(d => d.promedio_externo !== undefined);
        
        datasets = [];
        
        if (hasInternoHum) {
          datasets.push({
            label: `Humedad Interna (${data[0]?.periodo || 'período'})`,
            data: data.map(d => d.promedio_interno || null),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: false
          });
        }
        
        if (hasExternoHum) {
          datasets.push({
            label: `Humedad Externa (${data[0]?.periodo || 'período'})`,
            data: data.map(d => d.promedio_externo || null),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: false
          });
        }
        break;
        
      case 'peso':
        yAxisLabel = `Peso Promedio por ${data[0]?.periodo || 'período'} (kg)`;
        
        datasets = [
          {
            label: `Peso de la Colmena (kg/${data[0]?.periodo || 'período'})`,
            data: data.map(d => d.promedio ? (d.promedio / 1000).toFixed(3) : null), // CONVERSIÓN A KG
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: true
          }
        ];
        break;
    }

    if (labels.length < 2) return null;

    const config = {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: {
          duration: 300
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            callbacks: {
              title: function(context) {
                const originalData = data[context[0].dataIndex];
                return `${context[0].label} (${originalData.cantidad} lecturas)`;
              },
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  if (chartType === 'peso') {
                    label += context.parsed.y + 'kg';
                  } else if (chartType === 'temperatura') {
                    label += context.parsed.y.toFixed(1) + '°C';
                  } else {
                    label += context.parsed.y.toFixed(1) + '%';
                  }
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            title: { 
              display: true, 
              text: selectedFilter ? selectedFilter.description : 'Período' 
            },
            ticks: { 
              maxRotation: 45, 
              minRotation: 45,
              maxTicksLimit: 20
            }
          },
          y: {
            title: { display: true, text: yAxisLabel }
          }
        }
      }
    };

    return new Chart.Chart(ctx, config);
  };

  // Función para crear tabla de datos - MODIFICADA PARA AGRUPACIÓN DINÁMICA
  const createDataTable = (data, tableType, title) => {
    if (!data || data.length === 0) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          marginTop: '16px',
          textAlign: 'center'
        }}>
          <h4 style={{
            margin: '0 0 8px 0',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            📊 {title}
          </h4>
          <p style={{ color: '#6b7280', margin: 0 }}>
            No hay datos disponibles para el período seleccionado
          </p>
        </div>
      );
    }
    
    let datosTabla = [];
    let columnas = [];
    
    // Tomar los últimos 20 períodos para la tabla
    datosTabla = data.slice(-20);
    
    switch (tableType) {
      case 'temperatura':
        columnas = [
          { key: 'fechaStr', title: 'Período', format: (d) => d.fechaStr },
          { key: 'promedio_interno', title: 'Temp. Interna (°C)', format: (d) => d.promedio_interno ? `${d.promedio_interno.toFixed(1)}°C` : 'N/A' },
          { key: 'promedio_externo', title: 'Temp. Externa (°C)', format: (d) => d.promedio_externo ? `${d.promedio_externo.toFixed(1)}°C` : 'N/A' },
          { key: 'cantidad', title: 'Lecturas', format: (d) => d.cantidad }
        ];
        break;
        
      case 'humedad':
        columnas = [
          { key: 'fechaStr', title: 'Período', format: (d) => d.fechaStr },
          { key: 'promedio_interno', title: 'Hum. Interna (%)', format: (d) => d.promedio_interno ? `${d.promedio_interno.toFixed(1)}%` : 'N/A' },
          { key: 'promedio_externo', title: 'Hum. Externa (%)', format: (d) => d.promedio_externo ? `${d.promedio_externo.toFixed(1)}%` : 'N/A' },
          { key: 'cantidad', title: 'Lecturas', format: (d) => d.cantidad }
        ];
        break;
        
      case 'peso':
        columnas = [
          { key: 'fechaStr', title: 'Período', format: (d) => d.fechaStr },
          { key: 'promedio', title: 'Peso (kg)', format: (d) => d.promedio ? `${(d.promedio / 1000).toFixed(3)}kg` : 'N/A' },
          { key: 'cantidad', title: 'Lecturas', format: (d) => d.cantidad }
        ];
        break;
    }
    
    if (datosTabla.length === 0) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          marginTop: '16px',
          textAlign: 'center'
        }}>
          <h4 style={{
            margin: '0 0 8px 0',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            📊 {title}
          </h4>
          <p style={{ color: '#6b7280', margin: 0 }}>
            No hay datos de {tableType} para el período seleccionado
          </p>
        </div>
      );
    }
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        marginTop: '16px'
      }}>
        <h4 style={{
          margin: '0 0 16px 0',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📊 {title}
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '500',
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {datosTabla.length} períodos
          </span>
        </h4>
        
        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem'
          }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
              <tr>
                {columnas.map((col, index) => (
                  <th key={index} style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datosTabla.map((row, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                }}>
                  {columnas.map((col, colIndex) => (
                    <td key={colIndex} style={{
                      padding: '10px 8px',
                      color: '#6b7280'
                    }}>
                      {col.format(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Componente de filtros de tiempo - SIMPLIFICADO
  const TimeFiltersComponent = () => {
    const isMobile = window.innerWidth <= 768;
    const selectedFilter = timeFilters.find(f => f.key === timeFilter);
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '24px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '20px' : '24px'
        }}>
          <div style={{ flex: '0 0 auto' }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🔍 Filtros de Tiempo (Agrupación Dinámica)
            </h3>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {filteredData.length} registros → {Math.max(processedData.temperatura.length, processedData.humedad.length, processedData.peso.length)} períodos ({selectedFilter?.description || 'agrupación'})
            </p>
          </div>

          {/* Botones de filtros predefinidos */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            flex: 1,
            flexWrap: 'wrap'
          }}>
            {timeFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleTimeFilterChange(filter.key)}
                style={{
                  padding: isMobile ? '12px 16px' : '10px 16px',
                  background: timeFilter === filter.key 
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  color: timeFilter === filter.key ? 'white' : '#4b5563',
                  border: timeFilter === filter.key ? 'none' : '2px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  fontSize: isMobile ? '0.9rem' : '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease',
                  transform: timeFilter === filter.key ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: timeFilter === filter.key 
                    ? '0 6px 20px rgba(99, 102, 241, 0.4)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  letterSpacing: '0.025em'
                }}
                onMouseOver={(e) => {
                  if (timeFilter !== filter.key) {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
                  }
                }}
                onMouseOut={(e) => {
                  if (timeFilter !== filter.key) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                  }
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Selector de rango personalizado */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            alignItems: isMobile ? 'stretch' : 'center',
            flex: '0 0 auto'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '8px',
              alignItems: isMobile ? 'stretch' : 'center'
            }}>
              <label style={{ 
                fontSize: '0.8rem', 
                fontWeight: '600', 
                color: '#6b7280',
                whiteSpace: 'nowrap'
              }}>
                📅 Rango:
              </label>
              <input
                type="date"
                value={customDateRange.start || ''}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '2px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  color: '#4b5563',
                  background: '#ffffff',
                  minWidth: '140px'
                }}
              />
              <span style={{ color: '#9ca3af', fontWeight: '500' }}>a</span>
              <input
                type="date"
                value={customDateRange.end || ''}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '2px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  color: '#4b5563',
                  background: '#ffffff',
                  minWidth: '140px'
                }}
              />
            </div>
            <button
              onClick={() => handleCustomDateRange(customDateRange.start, customDateRange.end)}
              disabled={!customDateRange.start || !customDateRange.end}
              style={{
                padding: '8px 16px',
                background: (!customDateRange.start || !customDateRange.end)
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: (!customDateRange.start || !customDateRange.end) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
                boxShadow: (!customDateRange.start || !customDateRange.end)
                  ? 'none'
                  : '0 4px 12px rgba(245, 158, 11, 0.4)'
              }}
            >
              🔍 Aplicar
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading || !currentUser) {
    return <Loading message="Cargando dashboard..." />;
  }

  const latestData = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ 
      padding: isMobile ? '16px' : '24px',
      maxWidth: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh'
    }}>
      {/* Header simplificado */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: '32px',
        gap: isMobile ? '20px' : '0',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '24px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.2',
            letterSpacing: '-0.025em'
          }}>
            SmartBee Dashboard
          </h1>
        </div>
        <button 
          style={{
            padding: isMobile ? '12px 20px' : '16px 24px',
            background: isLoading || isLoadingData 
              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: isLoading || isLoadingData ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.3s ease',
            transform: isLoading || isLoadingData ? 'scale(0.95)' : 'scale(1)',
            letterSpacing: '0.025em'
          }}
          onClick={handleRefresh}
          disabled={isLoading || isLoadingData}
        >
          {isLoadingData ? '⏳ Actualizando...' : '🔄 Actualizar Datos'}
        </button>
      {/* Nuevo botón de Alertas */}
    <AlertasButton 
      sensorData={sensorData}
      filteredData={filteredData}
    />
  </div>

      {/* Componente de Filtros de Tiempo */}
      <TimeFiltersComponent />
      
      {/* Grid de estadísticas mejorado */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: isMobile ? '16px' : '20px',
        marginBottom: '32px'
      }}>
        {[
          { 
            title: 'Mis Colmenas', 
            value: userColmenas.length, 
            icon: '🏠', 
            color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            bgColor: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
          },
          { 
            title: userColmenas.length > 0 ? (userColmenas[0].descripcion || 'Sin descripción') : 'Sin colmenas',
            value: userColmenas.length > 0 ? `ID: ${userColmenas[0].id.toString().substring(0, 8)}...` : 'N/A',
            icon: '📋', 
            color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            bgColor: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
            small: true
          },
          { 
            title: '⚖️ Peso ÚLTIMO (KG)', 
            value: latestData && latestData.peso !== null ? 
              `${(latestData.peso / 1000).toFixed(3)}kg [${latestData.fecha.toLocaleTimeString()}]` : 
              'Sin datos en período', 
            icon: '⚖️', 
            color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            bgColor: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            span: isMobile ? 2 : 1
          },
          { 
            title: '💧 Humedad ÚLTIMO', 
            value: latestData && latestData.humedad !== null ? 
              `${latestData.humedad.toFixed(1)}% [${latestData.fecha.toLocaleTimeString()}]` : 
              'Sin datos en período', 
            icon: '💧', 
            color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            bgColor: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
          },
          { 
            title: '🌡️ Temperatura ÚLTIMO', 
            value: latestData && latestData.temperatura !== null ? 
              `${latestData.temperatura.toFixed(1)}°C [${latestData.fecha.toLocaleTimeString()}]` : 
              'Sin datos en período', 
            icon: '🌡️', 
            color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            bgColor: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
          }
        ].map((stat, index) => (
          <div key={index} style={{
            background: stat.bgColor,
            padding: isMobile ? '20px' : '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            gridColumn: stat.span ? `span ${stat.span}` : 'span 1',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              fontSize: isMobile ? '2rem' : '2.5rem', 
              marginBottom: '12px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>
              {stat.icon}
            </div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: stat.small ? (isMobile ? '0.9rem' : '1rem') : (isMobile ? '1.5rem' : '2rem'),
              fontWeight: '800',
              background: stat.color,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1.2'
            }}>
              {stat.value}
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              color: '#6b7280',
              fontWeight: '600',
              letterSpacing: '0.025em'
            }}>
              {stat.title}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficos con agrupación dinámica */}
      {filteredData.length === 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: isMobile ? '32px 20px' : '40px 32px',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
          marginBottom: '24px',
          textAlign: 'center',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}>
          <div style={{ 
            fontSize: isMobile ? '4rem' : '5rem', 
            marginBottom: '24px',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
          }}>
            📊
          </div>
          <h3 style={{ 
            fontSize: isMobile ? '1.25rem' : '1.5rem', 
            marginBottom: '12px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Sin Datos para el Período Seleccionado
          </h3>
          <p style={{ 
            fontSize: isMobile ? '1rem' : '1.1rem', 
            color: '#6b7280',
            margin: '0 0 16px 0',
            fontWeight: '500'
          }}>
            No se encontraron datos de sensores para el filtro de tiempo aplicado.
          </p>
          <p style={{ 
            fontSize: '0.9rem', 
            color: '#9ca3af',
            margin: 0,
            fontWeight: '400'
          }}>
            Prueba seleccionar un período de tiempo diferente o verifica que haya datos disponibles.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          marginBottom: '32px'
        }}>
          {/* Gráfico de Temperatura */}
          <div>
            {createSpecificChart(processedData.temperatura, 'temperatura', 'Temperatura Interna vs Externa', 'temp-chart')}
            {createDataTable(processedData.temperatura, 'temperatura', 'Temperaturas por Período')}
          </div>

          {/* Gráfico de Humedad */}
          <div>
            {createSpecificChart(processedData.humedad, 'humedad', 'Humedad Interna vs Externa', 'hum-chart')}
            {createDataTable(processedData.humedad, 'humedad', 'Humedad por Período')}
          </div>

          {/* Gráfico de Peso */}
          <div>
            {createSpecificChart(processedData.peso, 'peso', 'Monitoreo de Peso (en KG)', 'peso-chart')}
            {createDataTable(processedData.peso, 'peso', 'Peso por Período (en KG)')}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardComplete;