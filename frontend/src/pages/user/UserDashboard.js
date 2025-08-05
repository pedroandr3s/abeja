import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';

const DashboardComplete = () => {
  const { dashboard, mensajes, colmenas, usuarios, isConnected } = useApi();
  const [currentUser, setCurrentUser] = useState(null);
  const [userColmenas, setUserColmenas] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const API_BASE = 'https://backend-production-eb26.up.railway.app/api';

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  // Auto-actualizar datos cada 30 segundos
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        loadSensorData();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

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

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Cargando datos para usuario:', currentUser.nombre, currentUser.apellido);

      // Simular colmenas del usuario
      const simulatedColmenas = [
        { id: 'COL-001', descripcion: 'Colmena Principal', dueno: currentUser.id },
        { id: 'COL-002', descripcion: 'Colmena Secundaria', dueno: currentUser.id }
      ];
      
      setUserColmenas(simulatedColmenas);

      // Cargar datos simulados de sensores
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

  const generateSimulatedData = () => {
    const data = [];
    const now = new Date();
    
    // Generar 24 puntos de datos (últimas 24 horas, cada hora)
    for (let i = 23; i >= 0; i--) {
      const fecha = new Date(now.getTime() - i * 60 * 60 * 1000); // 1 hora hacia atrás
      
      // Simular datos realistas con patrones naturales
      const hour = fecha.getHours();
      
      // Temperatura con variación diurna
      let baseTemp = 20 + Math.sin((hour - 6) * Math.PI / 12) * 8; // Pico a las 18:00
      baseTemp += (Math.random() - 0.5) * 3; // Variación aleatoria
      
      // Humedad inversamente relacionada con temperatura
      let baseHumedad = 80 - (baseTemp - 15) * 2;
      baseHumedad += (Math.random() - 0.5) * 10;
      baseHumedad = Math.max(30, Math.min(95, baseHumedad));
      
      // Peso con variación gradual (simula actividad de abejas)
      let basePeso = 1200 + Math.sin(i * 0.3) * 100;
      basePeso += Math.random() * 50 - 25;
      
      data.push({
        id: 24 - i,
        fecha: fecha,
        temperatura: Math.max(5, Math.min(40, Number(baseTemp.toFixed(1)))),
        humedad: Number(baseHumedad.toFixed(1)),
        peso: Number(basePeso.toFixed(2)),
        nodo_id: 'NODO-SIM-001'
      });
    }
    
    return data;
  };

  const loadSensorData = async () => {
    setIsLoadingData(true);
    try {
      console.log('🎲 Generando datos simulados optimizados...');
      
      // Usar siempre datos simulados mejorados
      const simulatedData = generateSimulatedData();
      setSensorData(simulatedData);
      console.log('📈 Datos simulados generados:', simulatedData.length, 'puntos');

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  // Crear gráfico individual mejorado
  const createChart = (data, metrics, title, chartId) => {
    if (data.length < 2) return null;

    const isMobile = window.innerWidth <= 768;
    const width = isMobile ? Math.min(window.innerWidth - 40, 350) : 500;
    const height = 320;
    const padding = 70;
    
    const getRange = (key) => {
      const values = data.map(d => d[key]).filter(v => !isNaN(v));
      if (values.length === 0) return { min: 0, max: 100 };
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const paddingValue = range > 0 ? range * 0.15 : 1;
      
      return {
        min: Math.max(0, min - paddingValue),
        max: max + paddingValue
      };
    };
    
    const generatePoints = (key) => {
      const range = getRange(key);
      return data.map((d, i) => ({
        x: padding + (i * (width - 2 * padding)) / (data.length - 1),
        y: height - padding - ((d[key] - range.min) / (range.max - range.min)) * (height - 2 * padding),
        value: d[key],
        fecha: d.fecha,
        nodo: d.nodo_id
      }));
    };

    // Etiquetas de fecha mejoradas
    const timeLabels = [];
    const step = Math.ceil(data.length / 6);
    
    for (let i = 0; i < data.length; i += step) {
      if (i < data.length) {
        timeLabels.push({
          x: padding + (i * (width - 2 * padding)) / (data.length - 1),
          y: height - padding + 25,
          text: data[i].fecha.toLocaleDateString('es-CL', { 
            day: '2-digit',
            month: '2-digit'
          }) + ' ' + data[i].fecha.toLocaleTimeString('es-CL', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          })
        });
      }
    }

    // Valores Y para cada métrica
    const getYLabels = (key) => {
      const range = getRange(key);
      const labels = [];
      for (let i = 0; i <= 4; i++) {
        const value = range.min + (range.max - range.min) * (4 - i) / 4;
        labels.push({
          y: padding + i * (height - 2 * padding) / 4,
          text: value.toFixed(key === 'peso' ? 0 : 1)
        });
      }
      return labels;
    };

    const primaryMetric = metrics[0];
    const yLabels = getYLabels(primaryMetric.key);

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
        
        <div style={{ 
          width: '100%', 
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          position: 'relative'
        }}>
          <svg width={width} height={height + 50} style={{ 
            background: 'linear-gradient(135deg, #fefefe 0%, #f9fafb 100%)',
            borderRadius: '12px',
            border: '2px solid rgba(229, 231, 235, 0.6)',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))'
          }}>
            {/* Definir gradientes */}
            <defs>
              <linearGradient id={`gradient-${chartId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={metrics[0].color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={metrics[0].color} stopOpacity="0.05" />
              </linearGradient>
              
              {/* Filtro de sombra para líneas */}
              <filter id={`shadow-${chartId}`}>
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={metrics[0].color} floodOpacity="0.3"/>
              </filter>
            </defs>
            
            {/* Grid mejorado */}
            {[0, 1, 2, 3, 4].map(i => (
              <g key={i}>
                <line
                  x1={padding}
                  y1={padding + i * (height - 2 * padding) / 4}
                  x2={width - padding}
                  y2={padding + i * (height - 2 * padding) / 4}
                  stroke={i === 4 ? "#d1d5db" : "#f3f4f6"}
                  strokeWidth={i === 4 ? "2" : "1"}
                  strokeDasharray={i === 4 ? "none" : "2,2"}
                />
              </g>
            ))}
            
            {/* Grid vertical */}
            {timeLabels.map((label, index) => (
              <line
                key={`vgrid-${index}`}
                x1={label.x}
                y1={padding}
                x2={label.x}
                y2={height - padding}
                stroke="#f8fafc"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}
            
            {/* Ejes principales */}
            <line 
              x1={padding} 
              y1={padding} 
              x2={padding} 
              y2={height - padding} 
              stroke="#374151" 
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line 
              x1={padding} 
              y1={height - padding} 
              x2={width - padding} 
              y2={height - padding} 
              stroke="#374151" 
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Etiquetas Y */}
            {yLabels.map((label, index) => (
              <text
                key={`ylabel-${index}`}
                x={padding - 10}
                y={label.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6b7280"
                fontWeight="500"
              >
                {label.text}
              </text>
            ))}
            
            {/* Líneas de datos */}
            {metrics.map((metric, metricIndex) => {
              const points = generatePoints(metric.key);
              if (!points) return null;
              
              const pathData = points.map((point, index) => 
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
              ).join(' ');
              
              return (
                <g key={metric.key}>
                  {/* Área bajo la curva para el primer metric */}
                  {metricIndex === 0 && (
                    <path
                      d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
                      fill={`url(#gradient-${chartId})`}
                      stroke="none"
                    />
                  )}
                  
                  {/* Línea principal */}
                  <path
                    d={pathData}
                    stroke={metric.color}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#shadow-${chartId})`}
                  />
                  
                  {/* Puntos de datos */}
                  {points.map((point, index) => (
                    <g key={`point-${index}`}>
                      {/* Anillo exterior */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="8"
                        fill="rgba(255,255,255,0.9)"
                        stroke={metric.color}
                        strokeWidth="3"
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                      />
                      {/* Punto interior */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill={metric.color}
                      />
                      <title>
                        {metric.label}: {point.value.toFixed(metric.key === 'peso' ? 2 : 1)}{metric.unit}
                        {'\n'}Fecha: {point.fecha.toLocaleString('es-CL')}
                        {'\n'}Nodo: {point.nodo}
                      </title>
                    </g>
                  ))}
                </g>
              );
            })}

            {/* Etiquetas de tiempo mejoradas */}
            {timeLabels.map((label, index) => (
              <text
                key={`xlabel-${index}`}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                fontSize="10"
                fill="#4b5563"
                fontWeight="500"
                transform={`rotate(-35, ${label.x}, ${label.y})`}
              >
                {label.text}
              </text>
            ))}
          </svg>
        </div>
        
        {/* Leyenda mejorada */}
        <div style={{ 
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '16px',
          background: 'rgba(249, 250, 251, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(229, 231, 235, 0.5)'
        }}>
          {metrics.map(metric => (
            <div key={metric.key} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 12px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: `2px solid ${metric.color}20`
            }}>
              <div style={{ 
                width: '20px', 
                height: '4px', 
                background: `linear-gradient(90deg, ${metric.color} 0%, ${metric.color}80 100%)`,
                borderRadius: '2px',
                boxShadow: `0 1px 3px ${metric.color}40`
              }}/>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#374151',
                textTransform: 'capitalize'
              }}>
                {metric.label} ({metric.unit})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading || !currentUser) {
    return <Loading message="Cargando dashboard personalizado..." />;
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
            🏠 Dashboard SmartBee
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
          {isLoadingData ? '⏳ Actualizando...' : '🔄 Actualizar Datos'}
        </button>
      </div>
      
      {alertMessage && (
        <div style={{ 
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: alertMessage.type === 'error' 
            ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
            : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: `2px solid ${alertMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: alertMessage.type === 'error' ? '#b91c1c' : '#166534',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {alertMessage.type === 'error' ? '❌' : '✅'} {alertMessage.message}
        </div>
      )}

      {!isConnected && (
        <div style={{ 
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: '2px solid #fed7aa',
          color: '#c2410c',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          ⚠️ <strong>Modo Simulación:</strong> Mostrando datos simulados para demostración.
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
            value: userColmenas.length > 0 ? `ID: ${userColmenas[0].id.substring(0, 8)}...` : 'N/A',
            icon: '📋', 
            color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            bgColor: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
            small: true
          },
          { 
            title: 'Peso Actual', 
            value: latestData ? `${latestData.peso.toFixed(2)} g` : '0.00 g', 
            icon: '⚖️', 
            color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            bgColor: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            span: isMobile ? 2 : 1
          },
          { 
            title: 'Humedad', 
            value: latestData ? `${latestData.humedad.toFixed(1)}%` : '0.0%', 
            icon: '💧', 
            color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            bgColor: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
          },
          { 
            title: 'Temperatura', 
            value: latestData ? `${latestData.temperatura.toFixed(1)}°C` : '0.0°C', 
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

      {/* Gráficos mejorados */}
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
            Generando Datos de Sensores...
          </h3>
          <p style={{ 
            fontSize: isMobile ? '1rem' : '1.1rem', 
            color: '#6b7280',
            margin: 0,
            fontWeight: '500'
          }}>
            Preparando visualizaciones con datos simulados realistas
          </p>
        </div>
      ) : (
        <>
          {/* Contenedor de gráficos */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Gráfico de Temperatura y Humedad */}
            {createChart(
              sensorData,
              [
                { key: 'temperatura', color: '#ef4444', unit: '°C', label: 'Temperatura' },
                { key: 'humedad', color: '#3b82f6', unit: '%', label: 'Humedad' }
              ],
              'Condiciones Ambientales',
              'temp-humedad'
            )}

            {/* Gráfico de Peso */}
            {createChart(
              sensorData,
              [
                { key: 'peso', color: '#10b981', unit: 'g', label: 'Peso' }
              ],
              'Monitoreo de Peso',
              'peso'
            )}
          </div>

          {/* Panel de resumen de datos */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            marginBottom: '24px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📈 Resumen de Monitoreo
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {/* Estadísticas de temperatura */}
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(239, 68, 68, 0.2)'
              }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#dc2626', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  🌡️ Temperatura
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#7f1d1d', lineHeight: '1.4' }}>
                  <div><strong>Actual:</strong> {latestData ? `${latestData.temperatura.toFixed(1)}°C` : 'N/A'}</div>
                  <div><strong>Promedio:</strong> {sensorData.length > 0 ? 
                    `${(sensorData.reduce((acc, d) => acc + d.temperatura, 0) / sensorData.length).toFixed(1)}°C` : 'N/A'}</div>
                  <div><strong>Rango:</strong> {sensorData.length > 0 ? 
                    `${Math.min(...sensorData.map(d => d.temperatura)).toFixed(1)}°C - ${Math.max(...sensorData.map(d => d.temperatura)).toFixed(1)}°C` : 'N/A'}</div>
                </div>
              </div>

              {/* Estadísticas de humedad */}
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(59, 130, 246, 0.2)'
              }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#1d4ed8', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  💧 Humedad
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#1e3a8a', lineHeight: '1.4' }}>
                  <div><strong>Actual:</strong> {latestData ? `${latestData.humedad.toFixed(1)}%` : 'N/A'}</div>
                  <div><strong>Promedio:</strong> {sensorData.length > 0 ? 
                    `${(sensorData.reduce((acc, d) => acc + d.humedad, 0) / sensorData.length).toFixed(1)}%` : 'N/A'}</div>
                  <div><strong>Rango:</strong> {sensorData.length > 0 ? 
                    `${Math.min(...sensorData.map(d => d.humedad)).toFixed(1)}% - ${Math.max(...sensorData.map(d => d.humedad)).toFixed(1)}%` : 'N/A'}</div>
                </div>
              </div>

              {/* Estadísticas de peso */}
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(16, 185, 129, 0.2)'
              }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#059669', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ⚖️ Peso
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#064e3b', lineHeight: '1.4' }}>
                  <div><strong>Actual:</strong> {latestData ? `${latestData.peso.toFixed(2)}g` : 'N/A'}</div>
                  <div><strong>Promedio:</strong> {sensorData.length > 0 ? 
                    `${(sensorData.reduce((acc, d) => acc + d.peso, 0) / sensorData.length).toFixed(2)}g` : 'N/A'}</div>
                  <div><strong>Variación:</strong> {sensorData.length > 1 ? 
                    `${(sensorData[sensorData.length - 1].peso - sensorData[0].peso).toFixed(2)}g` : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </>
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
            📊 <strong>Datos:</strong> {sensorData.length} registros
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
            🕒 <strong>Intervalo:</strong> 1 hora
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
            👤 <strong>Usuario:</strong> {currentUser.nombre} {currentUser.apellido}
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
            📡 <span>Monitoreo en Tiempo Real</span>
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
          Sistema de monitoreo avanzado para colmenas • Datos actualizados automáticamente
        </p>
      </div>
    </div>
  );
};

export default DashboardComplete;