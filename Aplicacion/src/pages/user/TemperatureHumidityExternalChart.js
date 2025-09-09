import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const TemperatureHumidityExternalChart = ({ 
  filteredData, 
  ensureDate, 
  isAggregated = false, 
  aggregationType = 'individual' 
}) => {
  const isMobile = window.innerWidth <= 768;

  // Funciones de formato
  const formatDateTime = (fecha) => {
    try {
      const date = ensureDate(fecha);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${day}/${month} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatFullDateTime = (fecha) => {
    try {
      const date = ensureDate(fecha);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getAggregationLabel = (type) => {
    switch (type) {
      case 'daily': return 'Promedio Diario';
      case 'weekly': return 'Promedio Semanal';
      case 'monthly': return 'Promedio Mensual';
      case 'individual': return 'Datos Individuales';
      default: return 'Datos Agrupados';
    }
  };

  // Procesar datos para Recharts
  const processDataForRecharts = () => {
    console.log('🔍 Datos originales filtrados:', filteredData);
    
    if (!filteredData || filteredData.length === 0) {
      console.log('❌ No hay datos filtrados');
      return [];
    }

    const externalData = filteredData
      .filter(d => d.tipo === 'externo')
      .sort((a, b) => ensureDate(a.fecha).getTime() - ensureDate(b.fecha).getTime());

    console.log('🔍 Datos externos filtrados:', externalData);

    if (externalData.length === 0) {
      console.log('❌ No hay datos externos');
      return [];
    }

    // Crear mapa de fechas únicas
    const dataMap = new Map();

    externalData.forEach(d => {
      const fechaStr = isAggregated ? d.groupKey : formatDateTime(d.fecha);
      const fechaCompleta = isAggregated ? 
        `${d.groupKey} (Promedio de ${d.tempCount || d.originalCount || 1} lecturas)` : 
        formatFullDateTime(d.fecha);

      if (!dataMap.has(fechaStr)) {
        dataMap.set(fechaStr, {
          fecha: fechaStr,
          fechaCompleta,
          timestamp: ensureDate(d.fecha).getTime(),
          nodo_id: d.nodo_id
        });
      }

      const entry = dataMap.get(fechaStr);
      
      if (d.temperatura !== null && d.temperatura !== undefined && !isNaN(d.temperatura)) {
        entry.temperatura = Number(d.temperatura);
        entry.tempCount = d.tempCount || d.originalCount || 1;
      }
      
      if (d.humedad !== null && d.humedad !== undefined && !isNaN(d.humedad)) {
        entry.humedad = Number(d.humedad);
        entry.humCount = d.humCount || d.originalCount || 1;
      }
    });

    const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    console.log('📊 Datos procesados para Recharts:', result);
    
    return result;
  };

  // Procesar datos y calcular rangos
  const data = processDataForRecharts();
  const hasTemperature = data.some(d => d.temperatura !== undefined && !isNaN(d.temperatura));
  const hasHumidity = data.some(d => d.humedad !== undefined && !isNaN(d.humedad));

  // Calcular rangos para ejes Y
  const tempValues = data.filter(d => d.temperatura !== undefined).map(d => d.temperatura);
  const humValues = data.filter(d => d.humedad !== undefined).map(d => d.humedad);
  
  const tempRange = tempValues.length > 0 ? {
    min: Math.min(...tempValues),
    max: Math.max(...tempValues)
  } : null;
  
  const humRange = humValues.length > 0 ? {
    min: Math.min(...humValues),
    max: Math.max(...humValues)
  } : null;

  console.log('🌡️ Rango temperatura externa:', tempRange);
  console.log('💧 Rango humedad externa:', humRange);
  console.log('📈 Tiene temperatura:', hasTemperature, 'Tiene humedad:', hasHumidity);
  console.log('📊 Total puntos de datos:', data.length);

  // Custom tooltip para modo oscuro
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div style={{
        backgroundColor: '#1f2937',
        padding: '12px',
        border: '1px solid #4b5563',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        fontSize: '14px'
      }}>
        <p style={{ 
          color: '#e5e7eb', 
          fontSize: '12px', 
          fontWeight: '600', 
          margin: '0 0 8px 0' 
        }}>
          {data.fechaCompleta || label}
        </p>
        {payload.map((entry, index) => {
          const isTemp = entry.dataKey === 'temperatura';
          const count = isTemp ? data.tempCount : data.humCount;
          
          return (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              margin: '4px 0' 
            }}>
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%',
                  backgroundColor: entry.color 
                }}
              />
              <span style={{ color: '#f9fafb', fontSize: '13px' }}>
                {entry.name}: <strong>{entry.value?.toFixed(1)}</strong>
                {isTemp ? '°C' : '%'}
                {isAggregated && count && (
                  <span style={{ color: '#d1d5db', fontSize: '11px', marginLeft: '4px' }}>
                    (prom. {count})
                  </span>
                )}
              </span>
            </div>
          );
        })}
        {!isAggregated && data.nodo_id && (
          <p style={{ color: '#d1d5db', fontSize: '11px', margin: '8px 0 0 0' }}>
            Nodo: {data.nodo_id.substring(0, 8)}...
          </p>
        )}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
        padding: '32px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        textAlign: 'center',
        border: '1px solid rgba(55, 65, 81, 0.8)',
        color: '#e5e7eb'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          📊 Temperatura y Humedad Externa
        </h3>
        <p style={{ 
          color: '#9ca3af', 
          margin: '20px 0 0 0',
          fontSize: '1.1rem'
        }}>
          No hay datos externos para mostrar en el período seleccionado
        </p>
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#9ca3af' }}>
          <p>Debug info:</p>
          <p>Datos filtrados: {filteredData?.length || 0}</p>
          <p>Datos externos: {filteredData?.filter(d => d.tipo === 'externo').length || 0}</p>
        </div>
      </div>
    );
  }

  // Crear tabla de historial
  const createHistoryTable = () => {
    const allData = [];
    
    data.forEach(d => {
      if (d.temperatura !== undefined && !isNaN(d.temperatura)) {
        allData.push({ ...d, tipo: 'temperatura', valor: d.temperatura, unidad: '°C' });
      }
      if (d.humedad !== undefined && !isNaN(d.humedad)) {
        allData.push({ ...d, tipo: 'humedad', valor: d.humedad, unidad: '%' });
      }
    });

    const recentData = allData
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    if (recentData.length === 0) return null;

    return (
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(55, 65, 81, 0.8)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        marginTop: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <h4 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#f9fafb'
          }}>
            📊 Historial Sensores Externos
          </h4>
          {isAggregated && (
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              padding: '4px 12px',
              borderRadius: '16px',
              border: '1px solid rgba(59, 130, 246, 0.4)'
            }}>
              {getAggregationLabel(aggregationType)}
            </span>
          )}
          <span style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#d1d5db',
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            padding: '4px 12px',
            borderRadius: '16px',
            border: '1px solid rgba(75, 85, 99, 0.5)'
          }}>
            {recentData.length} registros
          </span>
        </div>
        
        <div style={{ 
          overflowX: 'auto', 
          maxHeight: '400px', 
          overflowY: 'auto',
          borderRadius: '12px',
          border: '1px solid rgba(55, 65, 81, 0.6)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              backgroundColor: '#374151', 
              zIndex: 1
            }}>
              <tr>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#f9fafb',
                  borderBottom: '2px solid #4b5563'
                }}>
                  {isAggregated ? 'Período' : 'Fecha/Hora'}
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#f9fafb',
                  borderBottom: '2px solid #4b5563'
                }}>
                  Tipo
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#f9fafb',
                  borderBottom: '2px solid #4b5563'
                }}>
                  Valor
                </th>
                {!isAggregated && (
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: '#f9fafb',
                    borderBottom: '2px solid #4b5563'
                  }}>
                    Nodo
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {recentData.map((row, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
                  backgroundColor: index % 2 === 0 ? 'rgba(31, 41, 55, 0.3)' : 'rgba(17, 24, 39, 0.3)'
                }}>
                  <td style={{ padding: '10px 12px', color: '#d1d5db' }}>
                    {row.fecha}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'white',
                      backgroundColor: row.tipo === 'temperatura' ? '#3b82f6' : '#8b5cf6'
                    }}>
                      {row.tipo}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '10px 12px', 
                    color: '#f9fafb', 
                    fontWeight: '600' 
                  }}>
                    {row.valor.toFixed(1)}{row.unidad}
                  </td>
                  {!isAggregated && (
                    <td style={{ 
                      padding: '10px 12px', 
                      color: '#d1d5db',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      {row.nodo_id ? row.nodo_id.substring(0, 8) + '...' : 'N/A'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
        padding: '24px',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        border: '1px solid rgba(55, 65, 81, 0.8)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decoraciones */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
          borderRadius: '50%',
          opacity: 0.6
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 1
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center'
          }}>
            🌡️💧 Temperatura y Humedad Externa
            {isAggregated && (
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#3b82f6',
                marginLeft: '8px'
              }}>
                ({getAggregationLabel(aggregationType)})
              </span>
            )}
          </h3>
        </div>
        
        {/* Debug info */}
        <div style={{ 
          marginBottom: '16px', 
          padding: '8px', 
          backgroundColor: 'rgba(55, 65, 81, 0.6)', 
          borderRadius: '8px',
          fontSize: '12px',
          color: '#d1d5db',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(75, 85, 99, 0.5)'
        }}>
          Debug: {data.length} puntos | Temp: {hasTemperature ? 'Sí' : 'No'} | Hum: {hasHumidity ? 'Sí' : 'No'}
          {tempRange && <span> | Temp: {tempRange.min.toFixed(1)}°C - {tempRange.max.toFixed(1)}°C</span>}
          {humRange && <span> | Hum: {humRange.min.toFixed(1)}% - {humRange.max.toFixed(1)}%</span>}
        </div>
        
        {/* Area Chart */}
        <div style={{ 
          width: '100%', 
          height: '400px', 
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(55, 65, 81, 0.6)'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}
            >
              <defs>
                <linearGradient id="temperatureExternalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="humidityExternalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.7} />
              
              <XAxis 
                dataKey="fecha"
                tick={{ fontSize: 11, fill: '#d1d5db' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={Math.max(0, Math.floor(data.length / 8))}
              />
              
              {hasTemperature && tempRange && (
                <YAxis 
                  yAxisId="temp"
                  orientation="left"
                  tick={{ fontSize: 12, fill: '#3b82f6', fontWeight: 'bold' }}
                  tickCount={6}
                  domain={[tempRange.min - 1, tempRange.max + 1]}
                  type="number"
                  allowDataOverflow={false}
                  width={60}
                  label={{ 
                    value: 'Temperatura (°C)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: '13px', fontWeight: 'bold' }
                  }}
                />
              )}
              
              {hasHumidity && humRange && (
                <YAxis 
                  yAxisId="hum"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#8b5cf6', fontWeight: 'bold' }}
                  tickCount={6}
                  domain={[humRange.min - 2, humRange.max + 2]}
                  type="number"
                  allowDataOverflow={false}
                  width={60}
                  label={{ 
                    value: 'Humedad (%)', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { textAnchor: 'middle', fill: '#8b5cf6', fontSize: '13px', fontWeight: 'bold' }
                  }}
                />
              )}
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              
              {hasTemperature && (
                <Area
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperatura"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#temperatureExternalGradient)"
                  name="Temperatura Externa (°C)"
                  connectNulls={false}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
                />
              )}
              
              {hasHumidity && (
                <Area
                  yAxisId="hum"
                  type="monotone"
                  dataKey="humedad"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#humidityExternalGradient)"
                  name="Humedad Externa (%)"
                  connectNulls={false}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Información de datos */}
        <div style={{ 
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '16px',
          background: 'rgba(55, 65, 81, 0.5)',
          borderRadius: '12px',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(75, 85, 99, 0.5)'
        }}>
          <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>
            🌡️ Temperatura: {data.filter(d => d.temperatura !== undefined).length} puntos
          </span>
          <span style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: '600' }}>
            💧 Humedad: {data.filter(d => d.humedad !== undefined).length} puntos
          </span>
          {isAggregated && (
            <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700' }}>
              📊 {getAggregationLabel(aggregationType)}
            </span>
          )}
        </div>
      </div>

      {/* Tabla de historial */}
      {createHistoryTable()}
    </div>
  );
};

export default TemperatureHumidityExternalChart;