import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../../context/ApiContext';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
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
  const [alertMessage, setAlertMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [dataHash, setDataHash] = useState('');
  const [previousDataLength, setPreviousDataLength] = useState(0);

  const API_BASE = 'https://backend-production-eb26.up.railway.app/api';

  // Referencias para los gráficos de Chart.js
  const temperaturaChartRef = useRef(null);
  const humedadChartRef = useRef(null);
  const pesoChartRef = useRef(null);
  const chartInstances = useRef({});

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

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

  // Hook para crear/actualizar gráficos cuando cambien los datos
  useEffect(() => {
    if (sensorData.length > 0) {
      const isInitialLoad = !chartInstances.current.temperatura && !chartInstances.current.humedad && !chartInstances.current.peso;
      const hasNewData = sensorData.length > previousDataLength;

      if (isInitialLoad) {
        // Primera carga: crear gráficos desde cero
        console.log('🎨 Creando gráficos iniciales...');
        createInitialCharts();
      } else if (hasNewData) {
        // Datos nuevos: actualizar gráficos existentes
        console.log('📈 Actualizando gráficos con nuevos datos...');
        updateExistingCharts();
      }

      setPreviousDataLength(sensorData.length);
    }
  }, [sensorData]);

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

    // Crear nuevos gráficos
    setTimeout(() => {
      try {
        if (temperaturaChartRef.current) {
          const existingChart = Chart.Chart.getChart(temperaturaChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          const ctx = temperaturaChartRef.current.getContext('2d');
          chartInstances.current.temperatura = createChartJSInstance(ctx, sensorData, 'temperatura');
        }
        
        if (humedadChartRef.current) {
          const existingChart = Chart.Chart.getChart(humedadChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          const ctx = humedadChartRef.current.getContext('2d');
          chartInstances.current.humedad = createChartJSInstance(ctx, sensorData, 'humedad');
        }
        
        if (pesoChartRef.current) {
          const existingChart = Chart.Chart.getChart(pesoChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          const ctx = pesoChartRef.current.getContext('2d');
          chartInstances.current.peso = createChartJSInstance(ctx, sensorData, 'peso');
        }
      } catch (error) {
        console.error('Error creando gráficos:', error);
      }
    }, 100);
  };

  const updateExistingCharts = () => {
    if (!sensorData || sensorData.length === 0) return;

    const newData = sensorData.slice(previousDataLength); // Solo los datos nuevos
    
    Object.keys(chartInstances.current).forEach(chartType => {
      const chart = chartInstances.current[chartType];
      if (chart && newData.length > 0) {
        updateChartWithNewData(chart, newData, chartType);
      }
    });
  };

  const updateChartWithNewData = (chart, newData, chartType) => {
    try {
      newData.forEach(dataPoint => {
        const fecha = ensureDate(dataPoint.fecha);
        const label = fecha.toLocaleString('es-CL', { 
          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
        });

        // Agregar nueva etiqueta
        chart.data.labels.push(label);

        // Actualizar datasets según el tipo de gráfico
        switch (chartType) {
          case 'temperatura':
            if (dataPoint.tipo === 'interno' && dataPoint.temperatura !== null) {
              chart.data.datasets[0].data.push(dataPoint.temperatura);
              if (chart.data.datasets[1]) chart.data.datasets[1].data.push(null);
            } else if (dataPoint.tipo === 'externo' && dataPoint.temperatura !== null) {
              chart.data.datasets[0].data.push(null);
              if (chart.data.datasets[1]) chart.data.datasets[1].data.push(dataPoint.temperatura);
            }
            break;
            
          case 'humedad':
            if (dataPoint.tipo === 'interno' && dataPoint.humedad !== null) {
              chart.data.datasets[0].data.push(dataPoint.humedad);
              if (chart.data.datasets[1]) chart.data.datasets[1].data.push(null);
            } else if (dataPoint.tipo === 'externo' && dataPoint.humedad !== null) {
              chart.data.datasets[0].data.push(null);
              if (chart.data.datasets[1]) chart.data.datasets[1].data.push(dataPoint.humedad);
            }
            break;
            
          case 'peso':
            if (dataPoint.tipo === 'interno' && dataPoint.peso !== null) {
              chart.data.datasets[0].data.push(dataPoint.peso);
            }
            break;
        }
      });

      // Actualizar el gráfico suavemente
      chart.update('none'); // 'none' evita animaciones, para actualización instantánea
    } catch (error) {
      console.error('Error actualizando gráfico:', error);
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
      console.log('📡 [' + startTime.toLocaleTimeString() + '] Cargando TODOS los datos reales disponibles...');
      
      // Intentar primero con el endpoint específico del dashboard
      try {
        const dashboardResponse = await dashboard.getSensorData(168); // 168 horas = 7 días completos
        console.log('📊 Respuesta dashboard:', {
          timestamp: new Date().toLocaleTimeString(),
          data: dashboardResponse
        });
        
        if (dashboardResponse && dashboardResponse.combinados && dashboardResponse.combinados.length > 0) {
          // Tomar TODOS los datos disponibles (sin límite de 50)
          const datosReales = dashboardResponse.combinados
            .map(item => ({
              ...item,
              fecha: ensureDate(item.fecha)
            }))
            .sort((a, b) => a.fecha.getTime() - b.fecha.getTime()); // Orden cronológico
          
          // Crear un hash de los datos para detectar cambios reales
          const newDataHash = JSON.stringify(datosReales.map(d => ({ id: d.id, fecha: d.fecha.getTime() })));
          
          console.log('🔍 Comparando datos:', {
            timestamp: new Date().toLocaleTimeString(),
            totalRegistros: datosReales.length,
            hashAnterior: dataHash.substring(0, 50) + '...',
            hashNuevo: newDataHash.substring(0, 50) + '...',
            hashIgual: dataHash === newDataHash,
            primerRegistro: datosReales[0] ? {
              id: datosReales[0].id,
              fecha: datosReales[0].fecha.toLocaleString(),
              temperatura: datosReales[0].temperatura,
              tipo: datosReales[0].tipo
            } : null,
            ultimoRegistro: datosReales[datosReales.length - 1] ? {
              id: datosReales[datosReales.length - 1].id,
              fecha: datosReales[datosReales.length - 1].fecha.toLocaleString(),
              temperatura: datosReales[datosReales.length - 1].temperatura,
              tipo: datosReales[datosReales.length - 1].tipo
            } : null
          });
          
          // Solo actualizar si los datos realmente cambiaron
          if (dataHash !== newDataHash) {
            console.log('✅ DATOS NUEVOS DETECTADOS - Actualizando dashboard');
            
            setSensorData(datosReales);
            setDataHash(newDataHash);
            setLastUpdateTime(new Date());
            setDataSourceInfo(`Dashboard API - ${datosReales.length} registros totales`);
            
            setAlertMessage({
              type: 'success',
              message: `🔄 Datos actualizados: ${datosReales.length} registros totales (${new Date().toLocaleTimeString()})`
            });
          } else {
            console.log('⏸️ Mismos datos - Sin cambios detectados');
            setAlertMessage({
              type: 'info', 
              message: `⏸️ Sin cambios - ${datosReales.length} registros totales (${new Date().toLocaleTimeString()})`
            });
          }
          
          return; // Salir exitosamente
        } else {
          console.warn('⚠️ Dashboard API no devolvió datos válidos');
        }
      } catch (dashboardError) {
        console.warn('⚠️ Error en dashboard API:', dashboardError.message);
      }
      
      // Fallback: endpoint de mensajes
      try {
        console.log('🔄 Fallback: Intentando con endpoint de mensajes...');
        const mensajesResponse = await mensajes.getRecientes(168); // 168 horas = 7 días
        console.log('📊 Respuesta mensajes:', {
          timestamp: new Date().toLocaleTimeString(),
          totalMensajes: mensajesResponse?.data?.length || 0
        });
        
        if (mensajesResponse && mensajesResponse.data && mensajesResponse.data.length > 0) {
          const processedData = processSensorMessages(mensajesResponse.data);
          
          if (processedData.length > 0) {
            // Tomar TODOS los datos procesados (sin límite)
            const todosLosDatos = processedData
              .sort((a, b) => a.fecha.getTime() - b.fecha.getTime()); // Orden cronológico
            
            // Crear hash para detectar cambios
            const newDataHash = JSON.stringify(todosLosDatos.map(d => ({ id: d.id, fecha: d.fecha.getTime() })));
            
            if (dataHash !== newDataHash) {
              console.log('✅ DATOS NUEVOS desde mensajes - Actualizando dashboard');
              
              setSensorData(todosLosDatos);
              setDataHash(newDataHash);
              setLastUpdateTime(new Date());
              setDataSourceInfo(`Mensajes API - ${todosLosDatos.length} registros totales`);
              
              setAlertMessage({
                type: 'success',
                message: `🔄 Datos actualizados desde mensajes: ${todosLosDatos.length} registros totales (${new Date().toLocaleTimeString()})`
              });
            } else {
              console.log('⏸️ Mismos datos desde mensajes - Sin cambios');
            }
            
            return; // Salir exitosamente
          }
        }
      } catch (mensajesError) {
        console.warn('⚠️ Error en mensajes API:', mensajesError.message);
      }
      
      // Si llegamos aquí, no hay datos disponibles
      console.log('❌ No se encontraron datos en ningún endpoint');
      if (sensorData.length === 0) {
        setSensorData([]);
        setDataSourceInfo('Sin datos');
        setAlertMessage({
          type: 'error',
          message: '❌ No se encontraron datos reales de sensores'
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

  // Función para procesar mensajes (CORREGIDA para incluir TODOS los nodos con datos de sensores)
  const processSensorMessages = (messages) => {
    if (!messages || !Array.isArray(messages)) {
      console.warn('⚠️ Mensajes inválidos:', messages);
      return [];
    }

    console.log('🔄 Procesando', messages.length, 'mensajes para obtener TODOS los datos...');
    
    // CORREGIDO: Definir todos los nodos que pueden tener datos de sensores
    const nodoInterno = 'NODO-BEF8C985-0FF3-4874-935B-40AA8A235FF7';
    const nodoExterno = 'NODO-B5B3ABC4-E0CE-4662-ACB3-7A631C12394A';
    const nodoReal = 'NODO-7881883A-97A5-47E0-869C-753E99E1B168'; // TU NODO REAL
    
    // Mostrar todos los nodos únicos disponibles
    const nodosUnicos = [...new Set(messages.map(m => m.nodo_id))];
    console.log('📋 Nodos únicos en mensajes:', nodosUnicos);
    
    const sensorMessages = messages
      .filter(msg => {
        const hasPayload = msg.payload && typeof msg.payload === 'object';
        
        // CORREGIDO: Aceptar CUALQUIER nodo que tenga datos de sensores
        const hasSensorData = hasPayload && (
          msg.payload.temperatura !== undefined || 
          msg.payload.humedad !== undefined ||
          msg.payload.peso !== undefined ||
          msg.payload.temperature !== undefined ||
          msg.payload.humidity !== undefined ||
          msg.payload.weight !== undefined
        );
        
        return hasPayload && hasSensorData; // ACEPTAR TODOS LOS NODOS CON DATOS
      })
      .map(msg => {
        const payload = msg.payload;
        const temperatura = payload.temperatura || payload.temperature || null;
        const humedad = payload.humedad || payload.humidity || null;
        const peso = payload.peso || payload.weight || null;
        
        // CORREGIDO: Determinar el tipo según el nodo o por defecto
        let tipo = 'sensor';
        if (msg.nodo_id === nodoInterno) {
          tipo = 'interno';
        } else if (msg.nodo_id === nodoExterno) {
          tipo = 'externo';
        } else if (msg.nodo_id === nodoReal) {
          tipo = 'real'; // Nuevo tipo para tu nodo real
        } else {
          // Para cualquier otro nodo, determinar tipo por presencia de peso
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
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime()); // Orden cronológico

    console.log('✅ Mensajes procesados (TODOS los datos):', sensorMessages.length);
    console.log('📊 Desglose por tipo:', {
      internos: sensorMessages.filter(m => m.tipo === 'interno').length,
      externos: sensorMessages.filter(m => m.tipo === 'externo').length,
      reales: sensorMessages.filter(m => m.tipo === 'real').length,
      otros: sensorMessages.filter(m => m.tipo === 'sensor').length
    });
    
    return sensorMessages;
  };

  const handleRefresh = () => {
    console.log('🔄 Refresh manual iniciado...');
    loadDashboardData();
  };

  // Función para crear gráficos con Chart.js - Versión optimizada
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
            No hay suficientes datos reales para mostrar el gráfico
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
        
        {/* Leyenda simple */}
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
            Todos los datos disponibles - Actualización suave
          </span>
        </div>
      </div>
    );
  };

  // Función auxiliar para crear instancias de Chart.js
  const createChartJSInstance = (ctx, data, chartType) => {
    if (!data || data.length < 2) return null;

    const dataWithValidDates = data.map(item => ({
      ...item,
      fecha: ensureDate(item.fecha)
    }));

    let datasets = [];
    let labels = [];
    let yAxisLabel = '';
    
    switch (chartType) {
      case 'temperatura':
        const datosInternos = dataWithValidDates.filter(d => d.tipo === 'interno' && d.temperatura !== null);
        const datosExternos = dataWithValidDates.filter(d => d.tipo === 'externo' && d.temperatura !== null);
        
        labels = [...datosInternos, ...datosExternos]
          .map(d => d.fecha.toLocaleString('es-CL', { 
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
          }))
          .filter((value, index, self) => self.indexOf(value) === index)
          .sort();
        
        yAxisLabel = 'Temperatura (°C)';
        datasets = [
          {
            label: 'Temperatura Interna',
            data: labels.map(label => {
              const match = datosInternos.find(d => 
                d.fecha.toLocaleString('es-CL', { 
                  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                }) === label
              );
              return match ? match.temperatura : null;
            }),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: false
          },
          {
            label: 'Temperatura Externa',
            data: labels.map(label => {
              const match = datosExternos.find(d => 
                d.fecha.toLocaleString('es-CL', { 
                  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                }) === label
              );
              return match ? match.temperatura : null;
            }),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: false
          }
        ];
        break;
        
      case 'humedad':
        const datosInternosHum = dataWithValidDates.filter(d => d.tipo === 'interno' && d.humedad !== null);
        const datosExternosHum = dataWithValidDates.filter(d => d.tipo === 'externo' && d.humedad !== null);
        
        labels = [...datosInternosHum, ...datosExternosHum]
          .map(d => d.fecha.toLocaleString('es-CL', { 
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
          }))
          .filter((value, index, self) => self.indexOf(value) === index)
          .sort();
        
        yAxisLabel = 'Humedad (%)';
        datasets = [
          {
            label: 'Humedad Interna',
            data: labels.map(label => {
              const match = datosInternosHum.find(d => 
                d.fecha.toLocaleString('es-CL', { 
                  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                }) === label
              );
              return match ? match.humedad : null;
            }),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: false
          },
          {
            label: 'Humedad Externa',
            data: labels.map(label => {
              const match = datosExternosHum.find(d => 
                d.fecha.toLocaleString('es-CL', { 
                  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                }) === label
              );
              return match ? match.humedad : null;
            }),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: false
          }
        ];
        break;
        
      case 'peso':
        const datosPeso = dataWithValidDates.filter(d => d.tipo === 'interno' && d.peso !== null);
        
        labels = datosPeso.map(d => d.fecha.toLocaleString('es-CL', { 
          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
        }));
        
        yAxisLabel = 'Peso (g)';
        datasets = [
          {
            label: 'Peso de la Colmena',
            data: datosPeso.map(d => d.peso),
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
          duration: 0 // Desactivar animaciones para actualizaciones suaves
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  if (chartType === 'peso') {
                    label += context.parsed.y.toFixed(0) + 'g';
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
            title: { display: true, text: 'Tiempo' },
            ticks: { 
              maxRotation: 45, 
              minRotation: 45,
              maxTicksLimit: 20 // Limitar etiquetas en el eje X para mejor legibilidad
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

  // Función para crear tabla de datos (simplificada pero mostrando más datos)
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
            No hay datos reales disponibles para mostrar
          </p>
        </div>
      );
    }
    
    let datosTabla = [];
    let columnas = [];
    
    switch (tableType) {
      case 'temperatura':
        const datosInternos = data.filter(d => d.tipo === 'interno' && d.temperatura !== null).slice(-20);
        const datosExternos = data.filter(d => d.tipo === 'externo' && d.temperatura !== null).slice(-20);
        
        datosTabla = [...datosInternos, ...datosExternos]
          .sort((a, b) => ensureDate(b.fecha).getTime() - ensureDate(a.fecha).getTime())
          .slice(0, 30); // Mostrar últimos 30 registros
          
        columnas = [
          { key: 'fecha', title: 'Fecha', format: (d) => ensureDate(d.fecha).toLocaleString('es-CL') },
          { key: 'tipo', title: 'Ubicación', format: (d) => d.tipo === 'interno' ? 'Interna' : 'Externa' },
          { key: 'temperatura', title: 'Temperatura (°C)', format: (d) => `${d.temperatura.toFixed(1)}°C` }
        ];
        break;
        
      case 'humedad':
        const datosInternosHum = data.filter(d => d.tipo === 'interno' && d.humedad !== null).slice(-20);
        const datosExternosHum = data.filter(d => d.tipo === 'externo' && d.humedad !== null).slice(-20);
        
        datosTabla = [...datosInternosHum, ...datosExternosHum]
          .sort((a, b) => ensureDate(b.fecha).getTime() - ensureDate(a.fecha).getTime())
          .slice(0, 30); // Mostrar últimos 30 registros
          
        columnas = [
          { key: 'fecha', title: 'Fecha', format: (d) => ensureDate(d.fecha).toLocaleString('es-CL') },
          { key: 'tipo', title: 'Ubicación', format: (d) => d.tipo === 'interno' ? 'Interna' : 'Externa' },
          { key: 'humedad', title: 'Humedad (%)', format: (d) => `${d.humedad.toFixed(1)}%` }
        ];
        break;
        
      case 'peso':
        datosTabla = data.filter(d => d.tipo === 'interno' && d.peso !== null)
          .sort((a, b) => ensureDate(b.fecha).getTime() - ensureDate(a.fecha).getTime())
          .slice(0, 30); // Mostrar últimos 30 registros
          
        columnas = [
          { key: 'fecha', title: 'Fecha', format: (d) => ensureDate(d.fecha).toLocaleString('es-CL') },
          { key: 'peso', title: 'Peso (g)', format: (d) => `${d.peso.toFixed(0)}g` }
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
            No hay datos reales de {tableType} para mostrar
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
            Últimos {datosTabla.length} registros
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

  if (isLoading || !currentUser) {
    return <Loading message="Cargando dashboard con todos los datos reales..." />;
  }

  const latestData = sensorData.length > 0 ? sensorData[sensorData.length - 1] : null;
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ 
      padding: isMobile ? '16px' : '24px',
      maxWidth: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh'
    }}>
      {/* Header mejorado */}
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
            🏠 Dashboard SmartBee - Todos los Datos Reales
          </h1>
          <h2 style={{ 
            margin: '8px 0 0 0',
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '600',
            color: '#6b7280',
            letterSpacing: '0.025em'
          }}>
            👋 {currentUser.nombre} {currentUser.apellido}
          </h2>
          <div style={{ 
            fontSize: isMobile ? '0.875rem' : '0.95rem', 
            color: '#9ca3af', 
            margin: '8px 0 0 0',
            lineHeight: '1.5',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '4px' : '24px'
          }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '4px 12px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#92400e',
              width: 'fit-content'
            }}>
              🎯 <strong>Rol:</strong> {currentUser.rol_nombre || currentUser.rol}
            </span>
            {currentUser.comuna && (
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '4px 12px',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#1e40af',
                width: 'fit-content'
              }}>
                📍 <strong>Ubicación:</strong> {currentUser.comuna}
              </span>
            )}
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '4px 12px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#166534',
              width: 'fit-content'
            }}>
              📊 <strong>Fuente:</strong> {dataSourceInfo || 'Cargando...'}
            </span>
          </div>
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
          {isLoadingData ? '⏳ Actualizando...' : '🔄 Actualizar Todos los Datos'}
        </button>
      </div>
      
      {alertMessage && (
        <div style={{ 
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: alertMessage.type === 'error' 
            ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
            : alertMessage.type === 'warning'
            ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
            : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: `2px solid ${
            alertMessage.type === 'error' ? '#fecaca' : 
            alertMessage.type === 'warning' ? '#fde68a' : '#bbf7d0'
          }`,
          color: alertMessage.type === 'error' ? '#b91c1c' : 
                 alertMessage.type === 'warning' ? '#92400e' : '#166534',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {alertMessage.type === 'error' ? '❌' : alertMessage.type === 'warning' ? '⚠️' : '✅'} {alertMessage.message}
        </div>
      )}

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
            title: '🔥 Peso EN VIVO', 
            value: latestData && latestData.peso !== null ? 
              `${latestData.peso.toFixed(0)}g [${latestData.fecha.toLocaleTimeString()}]` : 
              'Sin datos reales', 
            icon: '⚖️', 
            color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            bgColor: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            span: isMobile ? 2 : 1
          },
          { 
            title: '🔥 Humedad EN VIVO', 
            value: latestData && latestData.humedad !== null ? 
              `${latestData.humedad.toFixed(1)}% [${latestData.fecha.toLocaleTimeString()}]` : 
              'Sin datos reales', 
            icon: '💧', 
            color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            bgColor: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
          },
          { 
            title: '🔥 Temperatura EN VIVO', 
            value: latestData && latestData.temperatura !== null ? 
              `${latestData.temperatura.toFixed(1)}°C [${latestData.fecha.toLocaleTimeString()}]` : 
              'Sin datos reales', 
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

      {/* Gráficos solo con datos reales */}
      {sensorData.length === 0 ? (
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
            Sin Datos Reales Disponibles
          </h3>
          <p style={{ 
            fontSize: isMobile ? '1rem' : '1.1rem', 
            color: '#6b7280',
            margin: '0 0 16px 0',
            fontWeight: '500'
          }}>
            No se encontraron datos reales de sensores en la base de datos.
          </p>
          <p style={{ 
            fontSize: '0.9rem', 
            color: '#9ca3af',
            margin: 0,
            fontWeight: '400'
          }}>
            Los datos de sensores aparecerán aquí cuando estén disponibles en tiempo real.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          marginBottom: '32px'
        }}>
          {/* Información de datos cargados - MEJORADA */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid rgba(34, 197, 94, 0.3)',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              color: '#166534',
              fontSize: '1.2rem',
              fontWeight: '700'
            }}>
              📊 Todos los Datos Reales - Actualización Suave
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              margin: '16px 0'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <strong>📊 Total Registros:</strong><br/>
                {sensorData.length} datos desde {dataSourceInfo}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <strong>🕒 Última Actualización:</strong><br/>
                {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'Nunca'}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <strong>📈 Dato Más Reciente:</strong><br/>
                {sensorData.length > 0 ? sensorData[sensorData.length - 1].fecha.toLocaleTimeString() : 'N/A'}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <strong>🔥 Último Valor:</strong><br/>
                {sensorData.length > 0 && sensorData[sensorData.length - 1].temperatura ? 
                  `${sensorData[sensorData.length - 1].temperatura}°C` : 'Sin temperatura'}
              </div>
            </div>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: '#16a34a',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              🔄 Auto-actualización suave cada 10 segundos • Todos los datos históricos • Sin recreación de gráficos
            </p>
          </div>

          {/* Gráfico de Temperatura Interna/Externa */}
          <div>
            {createSpecificChart(sensorData, 'temperatura', 'Temperatura Interna vs Externa', 'temp-chart')}
            {createDataTable(sensorData, 'temperatura', 'Mediciones de Temperatura')}
          </div>

          {/* Gráfico de Humedad Interna/Externa */}
          <div>
            {createSpecificChart(sensorData, 'humedad', 'Humedad Interna vs Externa', 'hum-chart')}
            {createDataTable(sensorData, 'humedad', 'Mediciones de Humedad')}
          </div>

          {/* Gráfico de Peso */}
          <div>
            {createSpecificChart(sensorData, 'peso', 'Monitoreo de Peso', 'peso-chart')}
            {createDataTable(sensorData, 'peso', 'Mediciones de Peso')}
          </div>
        </div>
      )}

      {/* Panel de información del sistema mejorado */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '2px solid rgba(34, 197, 94, 0.3)',
        fontSize: '14px',
        color: '#166534',
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '12px' : '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            fontWeight: '600'
          }}>
            📊 <strong>Todos los datos:</strong> {sensorData.length} registros completos
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            fontWeight: '600'
          }}>
            🕒 <strong>Frecuencia:</strong> Cada 10 segundos
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            fontWeight: '600'
          }}>
            🔄 <strong>Actualizado:</strong> {new Date().toLocaleTimeString('es-CL', { hour12: false })}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            fontWeight: '600'
          }}>
            ⚡ <strong>Actualización:</strong> Suave (sin recrear gráficos)
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            fontWeight: '600'
          }}>
            👤 <strong>Usuario:</strong> {currentUser.nombre} {currentUser.apellido}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: isConnected 
              ? 'rgba(220, 252, 231, 0.8)' 
              : 'rgba(254, 243, 199, 0.8)',
            borderRadius: '20px',
            fontWeight: '600',
            color: isConnected ? '#166534' : '#92400e'
          }}>
            {isConnected ? '🟢' : '🟡'} <strong>Estado:</strong> {isConnected ? 'Base de Datos Real' : 'Desconectado'}
          </div>
        </div>
      </div>

      {/* Footer con información adicional */}
      <div style={{
        marginTop: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? '16px' : '32px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            🐝 <span>SmartBee Dashboard</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            📡 <span>Todos los Datos Reales</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            ⚡ <span>Actualización Suave</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            🏆 <span>Apicultura Inteligente</span>
          </div>
        </div>
        <p style={{ 
          margin: 0, 
          fontSize: '0.875rem', 
          color: '#9ca3af',
          fontWeight: '500'
        }}>
          Todos los datos históricos • Auto-actualización suave cada 10 segundos • Sin recreación de gráficos
        </p>
      </div>
    </div>
  );
};

export default DashboardComplete;