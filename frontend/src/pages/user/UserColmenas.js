import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';

const UnifiedDashboard = () => {
  const { dashboard, mensajes, colmenas, usuarios, isConnected } = useApi();
  const [stats, setStats] = useState(null);
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
      }, 30000);
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

      // Cargar todas las colmenas
      const todasLasColmenas = await colmenas.getAll();
      console.log('📊 Total colmenas en sistema:', todasLasColmenas.length);

      // Filtrar colmenas del usuario actual
      let colmenasDelUsuario = [];
      if (currentUser.rol === 'ADM') {
        // Administradores ven todas las colmenas
        colmenasDelUsuario = todasLasColmenas;
        console.log('👑 Administrador: mostrando todas las colmenas');
      } else {
        // Usuarios normales solo ven sus propias colmenas
        colmenasDelUsuario = todasLasColmenas.filter(colmena => 
          colmena.dueno === currentUser.id
        );
        console.log(`🐝 Usuario ${currentUser.nombre}: ${colmenasDelUsuario.length} colmenas propias`);
      }

      setUserColmenas(colmenasDelUsuario);

      // Calcular estadísticas basadas en las colmenas del usuario
      const statsData = {
        totalColmenas: colmenasDelUsuario.length,
        colmenasActivas: colmenasDelUsuario.filter(c => c.activa !== false).length,
        totalUsuarios: currentUser.rol === 'ADM' ? todasLasColmenas.length : 1, // Para usuarios normales, solo ellos
        mensajesHoy: 0 // Se calculará después
      };

      setStats(statsData);

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
      console.log('📊 Cargando datos reales de sensores...');
      
      const response = await fetch(`${API_BASE}/nodo-mensajes/simple`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const mensajes = await response.json();
      console.log('✅ Mensajes recibidos:', mensajes.length);

      if (mensajes.length === 0) {
        setSensorData([]);
        return;
      }

      // Procesar solo datos reales existentes
      const processedData = [];
      
      mensajes.forEach(msg => {
        try {
          const payload = JSON.parse(msg.payload);
          
          // Solo agregar si tiene datos de peso o humedad
          if (payload.peso !== undefined || payload.humedad !== undefined) {
            processedData.push({
              id: msg.id,
              fecha: new Date(msg.fecha),
              peso: parseFloat(payload.peso) || 0,
              humedad: parseFloat(payload.humedad) || 0,
              temperatura: parseFloat(payload.temperatura) || 0,
              nodo_id: msg.nodo_id
            });
          }
        } catch (parseError) {
          console.warn('⚠️ Error parseando payload:', parseError.message);
        }
      });

      // Ordenar por fecha
      processedData.sort((a, b) => a.fecha - b.fecha);
      
      console.log('📈 Datos procesados:', processedData.length, 'puntos válidos');
      setSensorData(processedData);

      // Actualizar estadística de mensajes
      if (stats) {
        const today = new Date().toDateString();
        const mensajesHoy = processedData.filter(d => 
          d.fecha.toDateString() === today
        ).length;
        
        setStats(prev => ({
          ...prev,
          mensajesHoy
        }));
      }

    } catch (err) {
      console.error('❌ Error cargando datos de sensores:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  // Configuración del gráfico
  const createChart = (data, metrics, title, width = 600, height = 300) => {
    if (data.length < 2) return null;

    const padding = 60;
    
    const getRange = (key) => {
      const values = data.map(d => d[key]).filter(v => !isNaN(v));
      if (values.length === 0) return { min: 0, max: 100 };
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const padding = range > 0 ? range * 0.1 : 1;
      
      return {
        min: min - padding,
        max: max + padding
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

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>
          {title}
        </h3>
        
        <svg width={width} height={height} style={{ border: '1px solid #e5e7eb' }}>
          {/* Grid */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1={padding}
              y1={padding + i * (height - 2 * padding) / 4}
              x2={width - padding}
              y2={padding + i * (height - 2 * padding) / 4}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Ejes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" strokeWidth="2"/>
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth="2"/>
          
          {/* Líneas de datos */}
          {metrics.map(metric => {
            const points = generatePoints(metric.key);
            if (!points) return null;
            
            const pathData = points.map((point, index) => 
              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            ).join(' ');
            
            return (
              <g key={metric.key}>
                {/* Línea */}
                <path
                  d={pathData}
                  stroke={metric.color}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Puntos */}
                {points.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={metric.color}
                    stroke="white"
                    strokeWidth="2"
                  >
                    <title>
                      {metric.key}: {point.value.toFixed(metric.key === 'peso' ? 2 : 1)}{metric.unit} | 
                      Nodo: {point.nodo} | {point.fecha.toLocaleString()}
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
        
        {/* Leyenda */}
        <div style={{ 
          marginTop: '15px',
          display: 'flex',
          gap: '20px',
          justifyContent: 'center'
        }}>
          {metrics.map(metric => (
            <div key={metric.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '15px', 
                height: '3px', 
                backgroundColor: metric.color,
                borderRadius: '2px'
              }}/>
              <span style={{ fontSize: '14px', textTransform: 'capitalize', fontWeight: '500' }}>
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

  return (
    <div>
      {/* Header personalizado por usuario */}
      <div className="flex flex-between flex-center mb-6">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Dashboard - {currentUser.nombre} {currentUser.apellido}
          </h1>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280', 
            margin: '4px 0 0 0' 
          }}>
            <strong>Rol:</strong> {currentUser.rol_nombre || currentUser.rol}
            {currentUser.comuna && (
              <span style={{ marginLeft: '1rem' }}>
                <strong>Ubicación:</strong> {currentUser.comuna}
              </span>
            )}
            {currentUser.rol === 'ADM' && (
              <span style={{ marginLeft: '1rem', color: '#dc2626' }}>
                (Vista de Administrador - Todas las colmenas)
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-primary"
            onClick={handleRefresh}
            disabled={isLoading || isLoadingData}
          >
            {isLoadingData ? '⏳ Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>
      
      {alertMessage && (
        <Alert 
          type={alertMessage.type}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}

      {!isConnected && (
        <Alert 
          type="error"
          title="Backend Desconectado"
          message="No se puede conectar al backend. Verificando conexión..."
        />
      )}

      {/* Estadísticas personalizadas por usuario */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats?.totalColmenas || 0}</h3>
          <p>{currentUser.rol === 'ADM' ? 'Total Colmenas (Sistema)' : 'Mis Colmenas'}</p>
          <div style={{ fontSize: '2rem', marginTop: '0.5rem' }}>🏠</div>
        </div>
        
        <div className="stat-card">
          <h3>{stats?.colmenasActivas || 0}</h3>
          <p>Colmenas Activas</p>
          <div style={{ fontSize: '2rem', marginTop: '0.5rem' }}>✅</div>
        </div>
        
        <div className="stat-card">
          <h3>{latestData ? latestData.peso.toFixed(2) : '0.00'}</h3>
          <p>Peso Actual (g)</p>
          <div style={{ fontSize: '2rem', marginTop: '0.5rem' }}>⚖️</div>
        </div>
        
        <div className="stat-card">
          <h3>{latestData ? latestData.humedad.toFixed(1) : '0.0'}</h3>
          <p>Humedad Actual (%)</p>
          <div style={{ fontSize: '2rem', marginTop: '0.5rem' }}>💧</div>
        </div>
      </div>

      {sensorData.length === 0 ? (
        <Card title="📊 Datos de Sensores" className="mb-6">
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3>No hay datos de sensores disponibles</h3>
            <p>Los datos de peso y humedad aparecerán aquí cuando estén disponibles</p>
            <button 
              className="btn btn-primary mt-4"
              onClick={loadSensorData}
              disabled={isLoadingData}
            >
              {isLoadingData ? '⏳ Cargando...' : '🔄 Verificar Datos'}
            </button>
          </div>
        </Card>
      ) : (
        <div>
          {/* Valores actuales */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #10b981'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                textTransform: 'uppercase',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Peso Actual
              </div>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: '#10b981',
                marginBottom: '8px'
              }}>
                {latestData.peso.toFixed(2)}g
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                {latestData.fecha.toLocaleTimeString()}
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #3b82f6'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                textTransform: 'uppercase',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Humedad Actual
              </div>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 'bold', 
                color: '#3b82f6',
                marginBottom: '8px'
              }}>
                {latestData.humedad.toFixed(1)}%
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                {latestData.fecha.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Gráfico combinado: Peso y Humedad */}
          {createChart(
            sensorData,
            [
              { key: 'peso', color: '#10b981', unit: 'g', label: 'Peso' },
              { key: 'humedad', color: '#3b82f6', unit: '%', label: 'Humedad' }
            ],
            '📊 Evolución de Peso y Humedad',
            800,
            350
          )}

          {/* Gráfico individual: Solo Peso */}
          {createChart(
            sensorData,
            [
              { key: 'peso', color: '#10b981', unit: 'g', label: 'Peso' }
            ],
            '⚖️ Evolución del Peso',
            800,
            300
          )}
        </div>
      )}

      {/* Información de colmenas del usuario */}
      <div className="grid grid-2">
        <Card title={currentUser.rol === 'ADM' ? "Todas las Colmenas" : "Mis Colmenas"}>
          {userColmenas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏠</div>
              <p>
                {currentUser.rol === 'ADM' ? 
                  'No hay colmenas registradas en el sistema' : 
                  'No tienes colmenas asignadas'
                }
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {userColmenas.slice(0, 5).map((colmena) => (
                <div key={colmena.id} style={{
                  padding: '1rem',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.25rem'
                  }}>
                    🏠
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: 0, 
                      marginBottom: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      Colmena #{colmena.id}
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      {colmena.descripcion || 'Sin descripción'}
                    </p>
                    {colmena.dueno === currentUser.id && (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                        Mi Colmena
                      </span>
                    )}
                    {currentUser.rol === 'ADM' && colmena.dueno !== currentUser.id && (
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                        Usuario: {colmena.dueno}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {userColmenas.length > 5 && (
                <div style={{ 
                  padding: '1rem', 
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  Y {userColmenas.length - 5} colmenas más...
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Estado del Sistema personalizado */}
        <Card title="Mi Estado del Sistema">
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem',
            padding: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {isConnected ? '🟢' : '🔴'}
              </div>
              <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Conexión</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
              <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Usuario</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {currentUser.rol_nombre || currentUser.rol}
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🐝</div>
              <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Sensores</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {sensorData.length} lecturas
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
              <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Ubicación</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {currentUser.comuna || 'Sin definir'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Info de datos y actualización */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: sensorData.length > 0 ? '#f0fdf4' : '#fef2f2',
        borderRadius: '8px',
        border: sensorData.length > 0 ? '1px solid #bbf7d0' : '1px solid #fecaca'
      }}>
        <div style={{ 
          fontSize: '14px', 
          color: sensorData.length > 0 ? '#166534' : '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <span>
            <strong>{sensorData.length > 0 ? '✅ Datos en tiempo real' : '❌ Sin datos'}:</strong> 
            {sensorData.length > 0 ? 
              ` ${sensorData.length} registros de sensores` : 
              ' No hay datos disponibles en nodo_mensaje'
            }
          </span>
          <span>
            <strong>🔄 Última actualización:</strong> {new Date().toLocaleTimeString()}
          </span>
          <span>
            <strong>👤 Vista de:</strong> {currentUser.nombre} {currentUser.apellido}
          </span>
          <span>
            <strong>🏠 Colmenas visibles:</strong> {userColmenas.length}
          </span>
          {currentUser.rol === 'ADM' && (
            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
              (Administrador - Vista completa)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;