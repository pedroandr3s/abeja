import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import AlertasButton from './AlertasButton';
import TimeFilters from './TimeFilters';
import StatsGrid from './StatsGrid';
import TemperatureHumidityInternalChart from './TemperatureHumidityInternalChart';
import TemperatureHumidityExternalChart from './TemperatureHumidityExternalChart';
import WeightChart from './WeightChart';
import { 
  aggregateDataByTimeFilter, 
  getAggregationInfo, 
  getCustomRangeAggregationType,
  updateTimeFiltersConfig 
} from './dataAggregationUtils';

const UserDashboard = () => {
  const { dashboard, mensajes, colmenas, usuarios, isConnected } = useApi();
  const [currentUser, setCurrentUser] = useState(null);
  const [userColmenas, setUserColmenas] = useState([]);
  const [selectedColmenas, setSelectedColmenas] = useState([]); // NUEVO: Colmenas seleccionadas
  const [sensorData, setSensorData] = useState([]); // Datos sin procesar
  const [filteredData, setFilteredData] = useState([]); // Datos filtrados por tiempo
  const [aggregatedData, setAggregatedData] = useState([]); // Datos agrupados/promediados
  const [alertMessage, setAlertMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [dataHash, setDataHash] = useState('');
  
  // Estados para filtros de tiempo
  const [timeFilter, setTimeFilter] = useState('1dia');
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null
  });

  const API_BASE = 'backend-production-20f9.up.railway.app';

  // Configuración de filtros con información de agrupación
  const baseTimeFilters = [
    { 
      key: '1dia', 
      label: '📅 Diario', 
      hours: 24,
      description: 'Últimas 24 horas',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      shadowColor: 'rgba(59, 130, 246, 0.3)',
      aggregationType: 'datos individuales'
    },
    { 
      key: '1semana', 
      label: '📊 Semanal', 
      hours: 168,
      description: 'Últimos 7 días',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.3)',
      aggregationType: 'promedio por día'
    },
    { 
      key: '1mes', 
      label: '🗓️ Mensual', 
      hours: 720,
      description: 'Últimos 30 días',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.3)',
      aggregationType: 'promedio por semana'
    },
    { 
      key: '1año', 
      label: '📈 Anual', 
      hours: 8760,
      description: 'Últimos 365 días',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      shadowColor: 'rgba(139, 92, 246, 0.3)',
      aggregationType: 'promedio por mes'
    }
  ];

  const [timeFilters, setTimeFilters] = useState(updateTimeFiltersConfig(baseTimeFilters));

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  // NUEVO: Aplicar filtro de colmenas cuando cambien las seleccionadas
  useEffect(() => {
    if (sensorData.length > 0) {
      applyColmenaFilterAndTimeAggregation();
    }
  }, [sensorData, selectedColmenas, timeFilter, customDateRange]);

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

  // NUEVO: Manejar selección de colmenas
  const handleColmenaSelectionChange = (colmenaId, isSelected) => {
    setSelectedColmenas(prev => {
      if (isSelected) {
        return [...prev, colmenaId];
      } else {
        return prev.filter(id => id !== colmenaId);
      }
    });
  };

  // NUEVO: Seleccionar/deseleccionar todas las colmenas
  const handleSelectAllColmenas = (selectAll) => {
    if (selectAll) {
      setSelectedColmenas(userColmenas.map(c => c.id));
    } else {
      setSelectedColmenas([]);
    }
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
        const colmenasData = colmenasResponse.data || [];
        setUserColmenas(colmenasData);
        
        // NUEVO: Auto-seleccionar todas las colmenas al cargar
        setSelectedColmenas(colmenasData.map(c => c.id));
        
        if (colmenasData.length === 0) {
          setAlertMessage({
            type: 'warning',
            message: 'No tienes colmenas registradas en el sistema.'
          });
        }
      } catch (error) {
        console.error('❌ Error cargando colmenas:', error);
        setUserColmenas([]);
        setSelectedColmenas([]);
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
        console.log('📡 [' + startTime.toLocaleTimeString() + '] Cargando datos de sensores...');
        
        if (!currentUser || !currentUser.id) {
            console.error('❌ No hay usuario autenticado');
            setAlertMessage({
                type: 'error',
                message: 'Error: Usuario no autenticado'
            });
            return;
        }
        
        try {
            // Llamar al endpoint para obtener datos (obtener más datos para agregación)
            const dashboardResponse = await dashboard.getSensorData(8760, currentUser.id); // 1 año de datos
            console.log('📊 Respuesta dashboard:', {
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
                // Procesar datos - MODIFICADO: Incluir colmena_id
                const datosCompletos = dashboardResponse.combinados
                    .map(item => ({
                        ...item,
                        fecha: ensureDate(item.fecha),
                        colmena_id: item.colmena_id || item.nodo?.colmena_id // Asegurar que tenemos colmena_id
                    }))
                    .filter(item => item.colmena_id) // Solo items con colmena_id válida
                    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
                
                const newDataHash = JSON.stringify(datosCompletos.map(d => ({ id: d.id, fecha: d.fecha.getTime() })));
                
                console.log('🔍 Datos procesados:', {
                    timestamp: new Date().toLocaleTimeString(),
                    totalRegistros: datosCompletos.length,
                    nodosActivos: dashboardResponse.nodosActivosCount || 0,
                    colmenasUnicas: [...new Set(datosCompletos.map(d => d.colmena_id))].length
                });
                
                if (dataHash !== newDataHash) {
                    console.log('✅ DATOS NUEVOS - Actualizando dashboard');
                    
                    setSensorData(datosCompletos);
                    setDataHash(newDataHash);
                    setLastUpdateTime(new Date());
                    
                    const infoDetallada = `${datosCompletos.length} registros de ${dashboardResponse.colmenasConNodosActivos} colmenas activas`;
                    setDataSourceInfo(infoDetallada);
                    
                    setAlertMessage({
                        type: 'success',
                        message: `✅ Datos cargados: ${datosCompletos.length} registros`
                    });
                } else {
                    console.log('⏸️ Mismos datos - Sin cambios detectados');
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
        console.error('❌ Error general cargando datos:', err);
        setAlertMessage({
            type: 'error',
            message: 'Error de conexión cargando datos de tus colmenas'
        });
    } finally {
        setIsLoadingData(false);
    }
  };

  // MODIFICADO: Nueva función que combina filtro de colmenas Y agregación por tiempo
  const applyColmenaFilterAndTimeAggregation = () => {
    console.log(`🔍 Aplicando filtro de colmenas y agregación: ${timeFilter}`, {
      selectedColmenas,
      totalData: sensorData.length
    });
    
    if (!sensorData || sensorData.length === 0) {
      setFilteredData([]);
      setAggregatedData([]);
      return;
    }

    // PASO 1: Filtrar por colmenas seleccionadas
    let dataByColmenas = sensorData;
    if (selectedColmenas.length > 0) {
      dataByColmenas = sensorData.filter(item => 
        selectedColmenas.includes(item.colmena_id)
      );
      console.log(`🏠 Filtro colmenas: ${dataByColmenas.length} registros de ${selectedColmenas.length} colmenas seleccionadas`);
    }

    // PASO 2: Filtrar por tiempo
    let filtered = [...dataByColmenas];
    const now = new Date();
    
    if (timeFilter !== 'personalizado') {
      const selectedFilter = timeFilters.find(f => f.key === timeFilter);
      if (selectedFilter) {
        const cutoffTime = new Date(now.getTime() - (selectedFilter.hours * 60 * 60 * 1000));
        filtered = dataByColmenas.filter(item => {
          const itemDate = ensureDate(item.fecha);
          return itemDate >= cutoffTime;
        });
        
        console.log(`📊 Filtro ${selectedFilter.label}: ${filtered.length} registros de ${dataByColmenas.length} totales`);
      }
    } else if (customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = dataByColmenas.filter(item => {
        const itemDate = ensureDate(item.fecha);
        return itemDate >= startDate && itemDate <= endDate;
      });
      
      console.log(`📊 Filtro personalizado: ${filtered.length} registros entre ${startDate.toLocaleDateString()} y ${endDate.toLocaleDateString()}`);
    }

    // Ordenar por fecha
    filtered.sort((a, b) => ensureDate(a.fecha).getTime() - ensureDate(b.fecha).getTime());
    setFilteredData(filtered);

    // PASO 3: Aplicar agregación según el tipo de filtro
    const aggregated = aggregateDataByTimeFilter(filtered, timeFilter, customDateRange);
    console.log(`📈 Datos agregados: ${aggregated.length} grupos`, {
      filterType: timeFilter,
      originalCount: filtered.length,
      aggregatedCount: aggregated.length,
      aggregationType: aggregated[0]?.aggregationType || 'individual',
      selectedColmenas: selectedColmenas.length
    });
    
    setAggregatedData(aggregated);
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

  const handleRefresh = () => {
    console.log('🔄 Refresh manual iniciado...');
    loadDashboardData();
  };

  const isMobile = window.innerWidth <= 768;

  // Datos para pasar a los componentes (usar agregatedData si existe, sino filteredData)
  const dataForComponents = aggregatedData.length > 0 ? aggregatedData : filteredData;

  return (
    <div style={{ 
      padding: isMobile ? '16px' : '24px',
      maxWidth: '100%',
      overflow: 'hidden',
      background: '#184036',
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
            SmartBee Dashboard
          </h1>
          {/* Indicador de tipo de agregación y colmenas */}
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '0.9rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {getAggregationInfo(timeFilter, dataForComponents, customDateRange)}
            {selectedColmenas.length > 0 && (
              <span style={{
                marginLeft: '12px',
                padding: '2px 8px',
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                🏠 {selectedColmenas.length} colmena{selectedColmenas.length !== 1 ? 's' : ''}
              </span>
            )}
            {dataForComponents.length > 0 && dataForComponents[0]?.isAggregated && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                📊 PROMEDIADO
              </span>
            )}
          </p>
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
            filteredData={dataForComponents}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {/* NUEVO: Selector de Colmenas */}
          {userColmenas.length > 1 && (
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              marginBottom: '32px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                gap: isMobile ? '16px' : '0'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  🏠 Seleccionar Colmenas ({selectedColmenas.length}/{userColmenas.length})
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSelectAllColmenas(true)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✅ Todas
                  </button>
                  <button
                    onClick={() => handleSelectAllColmenas(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Ninguna
                  </button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {userColmenas.map(colmena => {
                  const isSelected = selectedColmenas.includes(colmena.id);
                  const colmenaDataCount = sensorData.filter(d => d.colmena_id === colmena.id).length;
                  
                  return (
                    <div
                      key={colmena.id}
                      onClick={() => handleColmenaSelectionChange(colmena.id, !isSelected)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: isSelected ? '#1d4ed8' : '#374151'
                        }}>
                          🏠 Colmena #{colmena.id}
                        </h4>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          backgroundColor: isSelected ? '#3b82f6' : '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px'
                        }}>
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {colmena.descripcion || 'Sin descripción'}
                      </p>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>📊 {colmenaDataCount} registros</span>
                        <span>🟢 {colmenaDataCount > 0 ? 'Activa' : 'Sin datos'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Componente de Filtros de Tiempo */}
          <TimeFilters
            timeFilter={timeFilter}
            timeFilters={timeFilters}
            rawData={sensorData}
            filteredData={filteredData}
            aggregatedData={aggregatedData}
            onTimeFilterChange={handleTimeFilterChange}
            onCustomDateRange={handleCustomDateRange}
          />
          
          {/* Grid de estadísticas - MODIFICADO: Mostrar info de colmenas seleccionadas */}
          <StatsGrid 
            userColmenas={userColmenas.filter(c => selectedColmenas.includes(c.id))}
            filteredData={dataForComponents}
          />

          {/* Gráficos */}
          {dataForComponents.length === 0 ? (
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
                {selectedColmenas.length === 0 ? 'Selecciona al menos una colmena' : 'Sin Datos para el Período Seleccionado'}
              </h3>
              <p style={{ 
                fontSize: isMobile ? '1rem' : '1.1rem', 
                color: '#6b7280',
                margin: '0 0 16px 0',
                fontWeight: '500'
              }}>
                {selectedColmenas.length === 0 ? 
                  'Debes seleccionar al menos una colmena para ver los datos.' :
                  'No se encontraron registros de sensores para el filtro aplicado.'
                }
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              marginBottom: '32px'
            }}>
             

              {/* Gráfico de Temperatura y Humedad Interna */}
              <TemperatureHumidityInternalChart 
                filteredData={dataForComponents}
                ensureDate={ensureDate}
                isAggregated={dataForComponents[0]?.isAggregated || false}
                aggregationType={dataForComponents[0]?.aggregationType || 'individual'}
              />

              {/* Gráfico de Temperatura y Humedad Externa */}
              <TemperatureHumidityExternalChart 
                filteredData={dataForComponents}
                ensureDate={ensureDate}
                isAggregated={dataForComponents[0]?.isAggregated || false}
                aggregationType={dataForComponents[0]?.aggregationType || 'individual'}
              />

              {/* Gráfico de Peso */}
              <WeightChart 
                filteredData={dataForComponents}
                ensureDate={ensureDate}
                isAggregated={dataForComponents[0]?.isAggregated || false}
                aggregationType={dataForComponents[0]?.aggregationType || 'individual'}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserDashboard;