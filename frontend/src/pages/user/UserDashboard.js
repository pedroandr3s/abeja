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
  
  // Estados para filtros de tiempo - Con datos individuales
  const [timeFilter, setTimeFilter] = useState('1dia');
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null
  });
  const [showRawData, setShowRawData] = useState(true); // NUEVO: Controla si mostrar datos individuales

  const API_BASE = 'https://backend-production-eb26.up.railway.app/api';

  // Referencias para los gráficos de Chart.js
  const temperaturaChartRef = useRef(null);
  const humedadChartRef = useRef(null);
  const pesoChartRef = useRef(null);
  const chartInstances = useRef({});

  const timeFilters = [
  { 
    key: '1dia', 
    label: '📅 Diario', 
    hours: 24,
    description: 'Últimas 24 horas',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    shadowColor: 'rgba(59, 130, 246, 0.3)'
  },
  { 
    key: '1semana', 
    label: '📊 Semanal', 
    hours: 168,
    description: 'Últimos 7 días',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    shadowColor: 'rgba(16, 185, 129, 0.3)'
  },
  { 
    key: '1mes', 
    label: '🗓️ Mensual', 
    hours: 720,
    description: 'Últimos 30 días',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    shadowColor: 'rgba(245, 158, 11, 0.3)'
  },
  { 
    key: '1año', 
    label: '📈 Anual', 
    hours: 8760,
    description: 'Últimos 365 días',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    shadowColor: 'rgba(139, 92, 246, 0.3)'
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
        console.log('🎨 Creando gráficos con datos individuales...');
        processIndividualData();
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
  }, [filteredData, showRawData]);

  // NUEVA: Función para procesar datos individuales (sin agrupación)
  const processIndividualData = () => {
    if (!filteredData || filteredData.length === 0) {
      setProcessedData({ 
        temperaturaInterna: [], 
        temperaturaExterna: [], 
        humedadInterna: [], 
        humedadExterna: [], 
        peso: [] 
      });
      return;
    }

    console.log(`📊 Procesando ${filteredData.length} datos individuales sin agrupación`);

    // Separar datos por tipo de sensor y medida
    const temperaturaInterna = filteredData
      .filter(item => item.temperatura !== null && item.temperatura !== undefined && item.tipo === 'interno')
      .map(item => ({
        ...item,
        fechaStr: formatIndividualDateTime(item.fecha),
        fechaCompleta: formatFullDateTime(item.fecha),
        valor: item.temperatura
      }));

    const temperaturaExterna = filteredData
      .filter(item => item.temperatura !== null && item.temperatura !== undefined && item.tipo === 'externo')
      .map(item => ({
        ...item,
        fechaStr: formatIndividualDateTime(item.fecha),
        fechaCompleta: formatFullDateTime(item.fecha),
        valor: item.temperatura
      }));

    const humedadInterna = filteredData
      .filter(item => item.humedad !== null && item.humedad !== undefined && item.tipo === 'interno')
      .map(item => ({
        ...item,
        fechaStr: formatIndividualDateTime(item.fecha),
        fechaCompleta: formatFullDateTime(item.fecha),
        valor: item.humedad
      }));

    const humedadExterna = filteredData
      .filter(item => item.humedad !== null && item.humedad !== undefined && item.tipo === 'externo')
      .map(item => ({
        ...item,
        fechaStr: formatIndividualDateTime(item.fecha),
        fechaCompleta: formatFullDateTime(item.fecha),
        valor: item.humedad
      }));

    const pesoData = filteredData
      .filter(item => item.peso !== null && item.peso !== undefined && item.tipo === 'interno')
      .map(item => ({
        ...item,
        fechaStr: formatIndividualDateTime(item.fecha),
        fechaCompleta: formatFullDateTime(item.fecha),
        valor: item.peso
      }));

    console.log('📊 Datos individuales procesados:', {
      temperaturaInterna: temperaturaInterna.length,
      temperaturaExterna: temperaturaExterna.length,
      humedadInterna: humedadInterna.length,
      humedadExterna: humedadExterna.length,
      peso: pesoData.length
    });

    setProcessedData({
      temperaturaInterna: temperaturaInterna,
      temperaturaExterna: temperaturaExterna,
      humedadInterna: humedadInterna,
      humedadExterna: humedadExterna,
      peso: pesoData
    });
  };

  // NUEVA: Función para formatear fecha y hora individual con hora correcta
  const formatIndividualDateTime = (fecha) => {
    const date = ensureDate(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month} ${hours}:${minutes}:${seconds}`;
  };

  // NUEVA: Función para formatear fecha completa para tooltips
  const formatFullDateTime = (fecha) => {
    const date = ensureDate(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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

    // Crear nuevos gráficos con datos individuales
    setTimeout(() => {
      try {
        if (temperaturaChartRef.current && (processedData.temperaturaInterna.length > 0 || processedData.temperaturaExterna.length > 0)) {
          const existingChart = Chart.Chart.getChart(temperaturaChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          const ctx = temperaturaChartRef.current.getContext('2d');
          chartInstances.current.temperatura = createIndividualChartJSInstance(ctx, [...processedData.temperaturaInterna, ...processedData.temperaturaExterna], 'temperatura');
        }
        
        if (humedadChartRef.current && (processedData.humedadInterna.length > 0 || processedData.humedadExterna.length > 0)) {
          const existingChart = Chart.Chart.getChart(humedadChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          const ctx = humedadChartRef.current.getContext('2d');
          chartInstances.current.humedad = createIndividualChartJSInstance(ctx, [...processedData.humedadInterna, ...processedData.humedadExterna], 'humedad');
        }
        
        if (pesoChartRef.current && processedData.peso.length > 0) {
          const existingChart = Chart.Chart.getChart(pesoChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          const ctx = pesoChartRef.current.getContext('2d');
          chartInstances.current.peso = createIndividualChartJSInstance(ctx, processedData.peso, 'peso');
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

  const loadSensorData = async () => {
    setIsLoadingData(true);
    
    try {
        const startTime = new Date();
        console.log('📡 [' + startTime.toLocaleTimeString() + '] Cargando datos individuales de colmenas del usuario...');
        
        if (!currentUser || !currentUser.id) {
            console.error('❌ No hay usuario autenticado');
            setAlertMessage({
                type: 'error',
                message: 'Error: Usuario no autenticado'
            });
            return;
        }
        
        try {
            // Llamar al endpoint para obtener datos individuales (sin agrupación)
            const dashboardResponse = await dashboard.getSensorData(168, currentUser.id);
            console.log('📊 Respuesta dashboard para datos individuales:', {
                timestamp: new Date().toLocaleTimeString(),
                userId: currentUser.id,
                totalRegistros: dashboardResponse.totalRegistros,
                colmenasConNodosActivos: dashboardResponse.colmenasConNodosActivos
            });
            
            if (dashboardResponse.message) {
                console.log('ℹ️ Mensaje del servidor:', dashboardResponse.message);
                
                setAlertMessage({
                    type: dashboardResponse.colmenasCount === 0 ? 'warning' : 'info',
                    message: dashboardResponse.message
                });
                
                if (dashboardResponse.colmenasConNodosActivos === 0) {
                    setSensorData([]);
                    setDataSourceInfo(`Sin datos - ${dashboardResponse.message}`);
                    return;
                }
            }
            
            if (dashboardResponse && dashboardResponse.combinados && dashboardResponse.combinados.length > 0) {
                // Procesar datos individuales sin agrupación
                const datosIndividuales = dashboardResponse.combinados
                    .map(item => ({
                        ...item,
                        fecha: ensureDate(item.fecha)
                    }))
                    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
                
                const newDataHash = JSON.stringify(datosIndividuales.map(d => ({ id: d.id, fecha: d.fecha.getTime() })));
                
                console.log('🔍 Datos individuales procesados:', {
                    timestamp: new Date().toLocaleTimeString(),
                    totalRegistros: datosIndividuales.length,
                    nodosActivos: dashboardResponse.nodosActivosCount || 0
                });
                
                if (dataHash !== newDataHash) {
                    console.log('✅ DATOS INDIVIDUALES NUEVOS - Actualizando dashboard');
                    
                    setSensorData(datosIndividuales);
                    setDataHash(newDataHash);
                    setLastUpdateTime(new Date());
                    
                    const infoDetallada = `${datosIndividuales.length} registros individuales de ${dashboardResponse.colmenasConNodosActivos} colmenas activas`;
                    setDataSourceInfo(infoDetallada);
                    
                    setAlertMessage({
                        type: 'success',
                        message: `✅ Datos individuales cargados: ${datosIndividuales.length} registros sin agrupación`
                    });
                } else {
                    console.log('⏸️ Mismos datos individuales - Sin cambios detectados');
                }
                
                return;
            } else {
                console.warn('⚠️ Dashboard API no devolvió datos válidos para el usuario');
                
                const infoMessage = dashboardResponse.colmenasCount === 0 
                    ? '❌ No tienes colmenas registradas'
                    : dashboardResponse.colmenasConNodosActivos === 0 
                    ? '⚠️ Tus colmenas no tienen nodos con datos recientes'
                    : '📭 Sin datos en el período seleccionado';
                    
                setAlertMessage({
                    type: 'warning',
                    message: infoMessage
                });
                
                if (dashboardResponse.colmenasConNodosActivos === 0) {
                    setSensorData([]);
                    setDataSourceInfo('Sin colmenas activas');
                }
            }
        } catch (dashboardError) {
            console.warn('⚠️ Error en dashboard API:', dashboardError.message);
            setAlertMessage({
                type: 'error',
                message: `Error cargando datos: ${dashboardError.message}`
            });
        }

    } catch (err) {
        console.error('❌ Error general cargando datos individuales:', err);
        setAlertMessage({
            type: 'error',
            message: 'Error de conexión cargando datos individuales de tus colmenas'
        });
    } finally {
        setIsLoadingData(false);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Refresh manual iniciado...');
    loadDashboardData();
  };

  // NUEVA: Función para crear gráficos con datos individuales
  const createIndividualChart = (data, chartType, title, chartId) => {
    if (!data || data.length < 1) {
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
            No hay datos individuales para mostrar en el período seleccionado
          </p>
        </div>
      );
    }

    const isMobile = window.innerWidth <= 768;
    
    // Determinar la referencia del canvas según el tipo
    let canvasRef;
    switch (chartType) {
      case 'temperaturaInterna':
      case 'temperaturaExterna':
      case 'temperatura':
        canvasRef = temperaturaChartRef;
        break;
      case 'humedadInterna':
      case 'humedadExterna':
      case 'humedad':
        canvasRef = humedadChartRef;
        break;
      case 'peso':
        canvasRef = pesoChartRef;
        break;
      default:
        canvasRef = temperaturaChartRef;
    }

    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffffff 0%, #f8fafc 100%)',
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
            📊 {title} (Datos Individuales)
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
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </div>
        
        {/* Información de datos individuales */}
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
            {data.length} lecturas individuales
          </span>
          {data.length > 0 && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Desde: {data[0].fechaStr} → Hasta: {data[data.length - 1].fechaStr}
            </span>
          )}
        </div>
      </div>
    );
  };

  // NUEVA: Función para crear instancias de Chart.js con datos individuales
  const createIndividualChartJSInstance = (ctx, data, chartType) => {
    if (!data || data.length < 1) return null;

    let datasets = [];
    let labels = [];
    let yAxisLabel = '';
    
    // Separar por tipo de nodo para temperatura y humedad
    const internoData = data.filter(d => d.tipo === 'interno').sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    const externoData = data.filter(d => d.tipo === 'externo').sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    const realData = data.filter(d => d.tipo === 'real').sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    
    // Crear labels únicos basados en TODOS los datos combinados
    const allTimes = [...new Set(data.map(d => d.fechaStr))].sort();
    labels = allTimes;
    
    // Limitar la cantidad de labels mostrados si hay demasiados para evitar solapamiento
    if (labels.length > 100) {
      const step = Math.ceil(labels.length / 100);
      labels = labels.filter((_, index) => index % step === 0);
    }
    
    switch (chartType) {
      case 'temperatura':
        yAxisLabel = 'Temperatura Individual (°C)';
        
        datasets = [];
        
        if (internoData.length > 0) {
          datasets.push({
            label: `Temperatura Interna (${internoData.length} lecturas)`,
            data: internoData.map(d => ({
              x: d.fechaStr,
              y: d.valor,
              fechaCompleta: d.fechaCompleta
            })),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            fill: false,
            spanGaps: false,
            showLine: true
          });
        }
        
        if (externoData.length > 0) {
          datasets.push({
            label: `Temperatura Externa (${externoData.length} lecturas)`,
            data: externoData.map(d => ({
              x: d.fechaStr,
              y: d.valor,
              fechaCompleta: d.fechaCompleta
            })),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            fill: false,
            spanGaps: false,
            showLine: true
          });
        }
        
        if (realData.length > 0) {
          datasets.push({
            label: `Sensor Real (${realData.length} lecturas)`,
            data: realData.map(d => ({
              x: d.fechaStr,
              y: d.valor,
              fechaCompleta: d.fechaCompleta
            })),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            fill: false,
            spanGaps: false,
            showLine: true
          });
        }
        break;
        
      case 'humedad':
        yAxisLabel = 'Humedad Individual (%)';
        
        datasets = [];
        
        if (internoData.length > 0) {
          datasets.push({
            label: `Humedad Interna (${internoData.length} lecturas)`,
            data: internoData.map(d => ({
              x: d.fechaStr,
              y: d.valor,
              fechaCompleta: d.fechaCompleta
            })),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            fill: false,
            spanGaps: false,
            showLine: true
          });
        }
        
        if (externoData.length > 0) {
          datasets.push({
            label: `Humedad Externa (${externoData.length} lecturas)`,
            data: externoData.map(d => ({
              x: d.fechaStr,
              y: d.valor,
              fechaCompleta: d.fechaCompleta
            })),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            fill: false,
            spanGaps: false,
            showLine: true
          });
        }
        
        if (realData.length > 0) {
          datasets.push({
            label: `Sensor Real (${realData.length} lecturas)`,
            data: realData.map(d => ({
              x: d.fechaStr,
              y: d.valor,
              fechaCompleta: d.fechaCompleta
            })),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            fill: false,
            spanGaps: false,
            showLine: true
          });
        }
        break;
        
      case 'peso':
        yAxisLabel = 'Peso Individual (kg)';
        
        datasets = [
          {
            label: `Peso de la Colmena (${data.length} lecturas)`,
            data: data.map(d => ({
              x: d.fechaStr,
              y: (d.valor / 1000).toFixed(3), // CONVERSIÓN A KG
              fechaCompleta: d.fechaCompleta
            })),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            fill: true,
            spanGaps: false,
            showLine: true
          }
        ];
        break;
    }

    if (datasets.length === 0) return null;

    const config = {
      type: 'line',
      data: { datasets }, // Solo datasets, sin labels predefinidos
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: {
          duration: 200
        },
        plugins: {
          legend: { 
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            callbacks: {
              title: function(context) {
                // Usar la fecha completa del punto de datos
                const dataPoint = context[0].raw;
                return dataPoint.fechaCompleta || context[0].label;
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
            type: 'category', // Usar categorías para manejar tiempos no uniformes
            title: { 
              display: true, 
              text: 'Tiempo (Datos Individuales)' 
            },
            ticks: { 
              maxRotation: 45, 
              minRotation: 45,
              maxTicksLimit: 15,
              callback: function(value, index, values) {
                // Mostrar solo algunos labels para evitar solapamiento
                const totalLabels = values.length;
                if (totalLabels > 15) {
                  const step = Math.ceil(totalLabels / 15);
                  return index % step === 0 ? this.getLabelForValue(value) : '';
                }
                return this.getLabelForValue(value);
              }
            }
          },
          y: {
            title: { display: true, text: yAxisLabel },
            beginAtZero: chartType === 'peso' // Solo para peso comenzar en 0
          }
        }
      }
    };

    return new Chart.Chart(ctx, config);
  };

  // NUEVA: Función para crear tabla de datos individuales
  const createIndividualDataTable = (data, tableType, title) => {
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
            No hay datos individuales disponibles para el período seleccionado
          </p>
        </div>
      );
    }
    
    // Tomar los últimos 50 registros individuales para la tabla
    const datosTabla = data.slice(-50);
    
    let columnas = [];
    
    switch (tableType) {
      case 'temperatura':
        columnas = [
          { key: 'fechaStr', title: 'Fecha/Hora', format: (d) => d.fechaStr },
          { key: 'valor', title: 'Temperatura (°C)', format: (d) => `${d.valor.toFixed(1)}°C` },
          { key: 'tipo', title: 'Tipo Sensor', format: (d) => d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1) },
          { key: 'nodo_id', title: 'Nodo ID', format: (d) => d.nodo_id ? d.nodo_id.substring(0, 8) + '...' : 'N/A' }
        ];
        break;
        
      case 'humedad':
        columnas = [
          { key: 'fechaStr', title: 'Fecha/Hora', format: (d) => d.fechaStr },
          { key: 'valor', title: 'Humedad (%)', format: (d) => `${d.valor.toFixed(1)}%` },
          { key: 'tipo', title: 'Tipo Sensor', format: (d) => d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1) },
          { key: 'nodo_id', title: 'Nodo ID', format: (d) => d.nodo_id ? d.nodo_id.substring(0, 8) + '...' : 'N/A' }
        ];
        break;
        
      case 'peso':
        columnas = [
          { key: 'fechaStr', title: 'Fecha/Hora', format: (d) => d.fechaStr },
          { key: 'valor', title: 'Peso (kg)', format: (d) => `${(d.valor / 1000).toFixed(3)}kg` },
          { key: 'tipo', title: 'Tipo Sensor', format: (d) => d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1) },
          { key: 'nodo_id', title: 'Nodo ID', format: (d) => d.nodo_id ? d.nodo_id.substring(0, 8) + '...' : 'N/A' }
        ];
        break;
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
          📊 {title} (Datos Individuales)
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '500',
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {datosTabla.length} registros
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

  const TimeFiltersComponent = () => {
  const isMobile = window.innerWidth <= 768;
  const selectedFilter = timeFilters.find(f => f.key === timeFilter);
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      padding: isMobile ? '20px' : '28px',
      borderRadius: '24px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
      marginBottom: '32px',
      border: '1px solid rgba(226, 232, 240, 0.6)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '200px',
        height: '200px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        zIndex: 0
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '2px solid rgba(226, 232, 240, 0.3)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              fontSize: '2rem',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>
              🕒
            </div>
            <h3 style={{
              margin: 0,
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #1f2937 0%, #6366f1 50%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.025em'
            }}>
              Filtros de Tiempo
            </h3>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            padding: '12px 20px',
            borderRadius: '16px',
            display: 'inline-block',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <p style={{
              margin: 0,
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: '#475569',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>📊</span>
              {filteredData.length} registros individuales
              <span style={{
                background: selectedFilter?.gradient || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                marginLeft: '4px'
              }}>
                {selectedFilter?.description || 'período personalizado'}
              </span>
            </p>
          </div>
        </div>

        {/* Filter Buttons Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '16px',
          marginBottom: '28px'
        }}>
          {timeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleTimeFilterChange(filter.key)}
              style={{
                padding: isMobile ? '16px 12px' : '18px 16px',
                background: timeFilter === filter.key 
                  ? filter.gradient
                  : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                color: timeFilter === filter.key ? 'white' : '#374151',
                border: timeFilter === filter.key 
                  ? 'none' 
                  : '2px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: timeFilter === filter.key ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: timeFilter === filter.key 
                  ? `0 8px 25px ${filter.shadowColor}, 0 3px 10px rgba(0,0,0,0.1)` 
                  : '0 2px 8px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                letterSpacing: '0.025em'
              }}
              // ... eventos hover ...
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
                  {filter.label}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  opacity: timeFilter === filter.key ? 0.9 : 0.6,
                  fontWeight: '500'
                }}>
                  {filter.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Date Range Section - MEJORADO */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          padding: isMobile ? '16px' : '20px',
          borderRadius: '16px',
          border: '2px solid rgba(148, 163, 184, 0.15)'
        }}>
          {/* ... resto del selector de fechas mejorado ... */}
        </div>
      </div>
    </div>
  );
};

  const latestData = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;
  const isMobile = window.innerWidth <= 768;

  return (
  <div style={{ 
    padding: isMobile ? '16px' : '24px',
    maxWidth: '100%',
    overflow: 'hidden',
    background: '#184036', // ← NUEVO FONDO
    minHeight: '100vh'
  }}>
      {/* Header */}
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
            SmartBee Dashboard (Datos Individuales)
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
          <AlertasButton 
            sensorData={sensorData}
            filteredData={filteredData}
          />
        </div>
      </div>

      {/* Componente de Filtros de Tiempo */}
      <TimeFiltersComponent />
      
      {/* Grid de estadísticas AMPLIADO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
        gap: isMobile ? '16px' : '20px',
        marginBottom: '32px'
      }}>
        {/* Obtener últimos datos por tipo */}
        {(() => {
          const ultimaTempInterna = filteredData.filter(d => d.temperatura !== null && d.tipo === 'interno').slice(-1)[0];
          const ultimaTempExterna = filteredData.filter(d => d.temperatura !== null && d.tipo === 'externo').slice(-1)[0];
          const ultimaHumInterna = filteredData.filter(d => d.humedad !== null && d.tipo === 'interno').slice(-1)[0];
          const ultimaHumExterna = filteredData.filter(d => d.humedad !== null && d.tipo === 'externo').slice(-1)[0];
          const ultimoPeso = filteredData.filter(d => d.peso !== null && d.tipo === 'interno').slice(-1)[0];
          
          return [
            { 
              title: 'Mis Colmenas', 
              value: userColmenas.length, 
              icon: '🏠', 
              color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              bgColor: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
            },
            { 
              title: '🌡️ Temp. Interna', 
              value: ultimaTempInterna ? 
                `${ultimaTempInterna.temperatura.toFixed(1)}°C` : 
                'Sin datos', 
              icon: '🌡️', 
              color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              bgColor: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              time: ultimaTempInterna ? `[${ultimaTempInterna.fecha.toLocaleTimeString()}]` : ''
            },
            { 
              title: '🌡️ Temp. Externa', 
              value: ultimaTempExterna ? 
                `${ultimaTempExterna.temperatura.toFixed(1)}°C` : 
                'Sin datos', 
              icon: '🌡️', 
              color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              bgColor: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              time: ultimaTempExterna ? `[${ultimaTempExterna.fecha.toLocaleTimeString()}]` : ''
            },
            { 
              title: '💧 Hum. Interna', 
              value: ultimaHumInterna ? 
                `${ultimaHumInterna.humedad.toFixed(1)}%` : 
                'Sin datos', 
              icon: '💧', 
              color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              bgColor: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              time: ultimaHumInterna ? `[${ultimaHumInterna.fecha.toLocaleTimeString()}]` : ''
            },
            { 
              title: '💧 Hum. Externa', 
              value: ultimaHumExterna ? 
                `${ultimaHumExterna.humedad.toFixed(1)}%` : 
                'Sin datos', 
              icon: '💧', 
              color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              bgColor: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
              time: ultimaHumExterna ? `[${ultimaHumExterna.fecha.toLocaleTimeString()}]` : ''
            },
            { 
              title: '⚖️ Peso Colmena', 
              value: ultimoPeso ? 
                `${(ultimoPeso.peso / 1000).toFixed(3)}kg` : 
                'Sin datos', 
              icon: '⚖️', 
              color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              bgColor: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              time: ultimoPeso ? `[${ultimoPeso.fecha.toLocaleTimeString()}]` : ''
            }
          ];
        })().map((stat, index) => (
          <div key={index} style={{
            background: stat.bgColor,
            padding: isMobile ? '16px' : '20px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              fontSize: isMobile ? '1.5rem' : '2rem', 
              marginBottom: '8px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>
              {stat.icon}
            </div>
            <h3 style={{ 
              margin: '0 0 4px 0', 
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              background: stat.color,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1.2'
            }}>
              {stat.value}
            </h3>
            {stat.time && (
              <p style={{ 
                margin: '0 0 4px 0', 
                fontSize: '0.7rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {stat.time}
              </p>
            )}
            <p style={{ 
              margin: 0, 
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: '#6b7280',
              fontWeight: '600',
              letterSpacing: '0.025em'
            }}>
              {stat.title}
            </p>
          </div>
        ))}
      </div>



{/* Gráficos con datos individuales */}
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
      Sin Datos Individuales para el Período Seleccionado
    </h3>
    <p style={{ 
      fontSize: isMobile ? '1rem' : '1.1rem', 
      color: '#6b7280',
      margin: '0 0 16px 0',
      fontWeight: '500'
    }}>
      No se encontraron registros individuales de sensores para el filtro aplicado.
    </p>
  </div>
) : (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    marginBottom: '32px'
  }}>
    {/* Gráfico de Temperatura Interna */}
    <div>
      {createIndividualChart(processedData.temperaturaInterna, 'temperaturaInterna', 'Temperatura Interna', 'temp-interna-chart')}
      {createIndividualDataTable(processedData.temperaturaInterna, 'temperatura', 'Registros de Temperatura Interna')}
    </div>

    {/* Gráfico de Temperatura Externa */}
    <div>
      {createIndividualChart(processedData.temperaturaExterna, 'temperaturaExterna', 'Temperatura Externa', 'temp-externa-chart')}
      {createIndividualDataTable(processedData.temperaturaExterna, 'temperatura', 'Registros de Temperatura Externa')}
    </div>

    {/* Gráfico de Humedad Interna */}
    <div>
      {createIndividualChart(processedData.humedadInterna, 'humedadInterna', 'Humedad Interna', 'hum-interna-chart')}
      {createIndividualDataTable(processedData.humedadInterna, 'humedad', 'Registros de Humedad Interna')}
    </div>

    {/* Gráfico de Humedad Externa */}
    <div>
      {createIndividualChart(processedData.humedadExterna, 'humedadExterna', 'Humedad Externa', 'hum-externa-chart')}
      {createIndividualDataTable(processedData.humedadExterna, 'humedad', 'Registros de Humedad Externa')}
    </div>

    {/* Gráfico de Peso Individual */}
    <div>
      {createIndividualChart(processedData.peso, 'peso', 'Peso Individual de la Colmena (en KG)', 'peso-chart')}
      {createIndividualDataTable(processedData.peso, 'peso', 'Registros Individuales de Peso (en KG)')}
    </div>
  </div>
)}
    </div>
  );
};

export default DashboardComplete;