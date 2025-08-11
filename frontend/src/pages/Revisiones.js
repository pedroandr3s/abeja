import React, { useState, useEffect } from 'react';

const SimpleChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_BASE = 'https://backend-production-eb26.up.railway.app/api';
  
  // SOLO cargar datos reales de la base de datos
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📊 Cargando datos REALES de nodo_mensaje...');
      
      const response = await fetch(`${API_BASE}/nodo-mensajes/simple`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const mensajes = await response.json();
      console.log('✅ Datos REALES recibidos:', mensajes.length);
      
      if (mensajes.length === 0) {
        setData([]);
        setError('No hay datos en la tabla nodo_mensaje');
        return;
      }
      
      // Procesar SOLO datos reales existentes
      const processedData = [];
      
      mensajes.forEach(msg => {
        try {
          const payload = JSON.parse(msg.payload);
          
          // Solo agregar si tiene datos válidos
          if (payload.temperatura !== undefined || payload.humedad !== undefined || payload.peso !== undefined) {
            processedData.push({
              id: msg.id,
              fecha: new Date(msg.fecha),
              temperatura: parseFloat(payload.temperatura) || 0,
              humedad: parseFloat(payload.humedad) || 0,
              peso: parseFloat(payload.peso) || 0,
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
      setData(processedData);
      setError(null);
      
    } catch (err) {
      console.error('❌ Error cargando datos reales:', err);
      setError(`Error: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-recargar datos cada 10 segundos
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // Configuración del gráfico
  const width = 800;
  const height = 400;
  const padding = 60;
  
  // Calcular rangos de datos REALES
  const getRange = (key) => {
    if (data.length === 0) return { min: 0, max: 100 };
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
  
  // Generar puntos del gráfico desde datos REALES
  const generatePoints = (key) => {
    if (data.length < 2) return null;
    
    const range = getRange(key);
    return data.map((d, i) => ({
      x: padding + (i * (width - 2 * padding)) / (data.length - 1),
      y: height - padding - ((d[key] - range.min) / (range.max - range.min)) * (height - 2 * padding),
      value: d[key],
      fecha: d.fecha,
      nodo: d.nodo_id
    }));
  };
  
  const sensors = [
    { key: 'temperatura', color: '#ef4444', unit: '°C' },
    { key: 'humedad', color: '#3b82f6', unit: '%' },
    { key: 'peso', color: '#10b981', unit: 'gramos' }
  ];
  
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h2>Cargando datos reales de nodo_mensaje...</h2>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h2>{error}</h2>
        <p>Verifica que la tabla nodo_mensaje tenga datos</p>
        <button 
          onClick={loadData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          🔄 Recargar Datos Reales
        </button>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
        <h2>No hay datos en nodo_mensaje</h2>
        <p>La tabla está vacía o no contiene datos válidos de sensores</p>
        <button 
          onClick={loadData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          🔄 Verificar Datos
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8fafc'
    }}>
      {/* Header con info de datos REALES */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>
          📊 SmartBee - Datos Reales
        </h1>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          <p style={{ margin: '5px 0' }}>
            <strong>📈 Puntos de datos:</strong> {data.length} registros reales
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>🕒 Rango:</strong> {data[0]?.fecha.toLocaleString()} → {data[data.length - 1]?.fecha.toLocaleString()}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>🔌 Nodos:</strong> {[...new Set(data.map(d => d.nodo_id))].join(', ')}
          </p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          {loading ? '⏳ Cargando...' : '🔄 Actualizar Datos Reales'}
        </button>
      </div>
      
      {/* Valores actuales REALES */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px',
        marginBottom: '20px'
      }}>
        {sensors.map(sensor => {
          const latest = data[data.length - 1];
          return (
            <div key={sensor.key} style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${sensor.color}`
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                textTransform: 'uppercase',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {sensor.key} (Real)
              </div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: sensor.color,
                marginBottom: '5px'
              }}>
                {latest[sensor.key].toFixed(sensor.key === 'peso' ? 2 : 1)}{sensor.unit}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                {latest.fecha.toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Gráfico con datos REALES */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>📈 Gráfico de Datos Reales de nodo_mensaje</h3>
        
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
          
          {/* Líneas de datos REALES */}
          {sensors.map(sensor => {
            const points = generatePoints(sensor.key);
            if (!points) return null;
            
            const pathData = points.map((point, index) => 
              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            ).join(' ');
            
            return (
              <g key={sensor.key}>
                {/* Línea */}
                <path
                  d={pathData}
                  stroke={sensor.color}
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
                    fill={sensor.color}
                    stroke="white"
                    strokeWidth="2"
                  >
                    <title>
                      {sensor.key}: {point.value.toFixed(sensor.key === 'peso' ? 2 : 1)}{sensor.unit} | Nodo: {point.nodo} | {point.fecha.toLocaleString()}
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
        
        {/* Leyenda */}
        <div style={{ 
          marginTop: '20px',
          display: 'flex',
          gap: '30px',
          justifyContent: 'center'
        }}>
          {sensors.map(sensor => (
            <div key={sensor.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '4px', 
                backgroundColor: sensor.color,
                borderRadius: '2px'
              }}/>
              <span style={{ fontSize: '16px', textTransform: 'capitalize', fontWeight: '500' }}>
                {sensor.key} ({sensor.unit})
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Info de conexión a datos REALES */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '1px solid #bbf7d0'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>
          <strong>✅ Conectado a datos reales:</strong> {API_BASE}/nodo-mensajes/simple • 
          <strong>📊 Tabla:</strong> nodo_mensaje • 
          <strong>🔄 Auto-actualización:</strong> cada 10 segundos • 
          <strong>🕒 Última carga:</strong> {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default SimpleChart;