import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const TemperatureHumidityInternalChart = ({ 
  filteredData, 
  ensureDate, 
  isAggregated = false, 
  aggregationType = 'individual' 
}) => {
  const isMobile = window.innerWidth <= 768;

  // Funciones de redondeo
  const roundTemperature = (temp) => {
    if (temp === null || temp === undefined || isNaN(temp)) return temp;
    return Math.round(temp * 10) / 10; // Redondea a 1 decimal
  };

  const roundHumidity = (hum) => {
    if (hum === null || hum === undefined || isNaN(hum)) return hum;
    return Math.round(hum); // Redondea al entero más cercano
  };

  // Funciones de formato
  const formatDateTime = (fecha) => {
    const date = ensureDate(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month} ${hours}:${minutes}`;
  };

  const formatFullDateTime = (fecha) => {
    const date = ensureDate(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
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
    console.log('🔍 Datos originales filtrados:', filteredData); // Debug
    
    if (!filteredData || filteredData.length === 0) {
      console.log('❌ No hay datos filtrados');
      return [];
    }

    const internalData = filteredData
      .filter(d => d.tipo === 'interno')
      .sort((a, b) => ensureDate(a.fecha).getTime() - ensureDate(b.fecha).getTime());

    console.log('🔍 Datos internos filtrados:', internalData); // Debug

    if (internalData.length === 0) {
      console.log('❌ No hay datos internos');
      return [];
    }

    // Crear mapa de fechas únicas
    const dataMap = new Map();

    internalData.forEach(d => {
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
        entry.temperatura = roundTemperature(Number(d.temperatura));
        entry.tempCount = d.tempCount || d.originalCount || 1;
      }
      
      if (d.humedad !== null && d.humedad !== undefined && !isNaN(d.humedad)) {
        entry.humedad = roundHumidity(Number(d.humedad));
        entry.humCount = d.humCount || d.originalCount || 1;
      }
    });

    const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    console.log('📊 Datos procesados para Recharts:', result); // Debug
    
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

  console.log('🌡️ Rango temperatura:', tempRange);
  console.log('💧 Rango humedad:', humRange);
  console.log('📈 Tiene temperatura:', hasTemperature, 'Tiene humedad:', hasHumidity);
  console.log('📊 Total puntos de datos:', data.length);

  // Custom tooltip con tema naranja
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '12px',
        border: '2px solid rgba(255, 193, 7, 0.6)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(255, 143, 0, 0.3)',
        fontSize: '14px'
      }}>
        <p style={{ 
          color: '#1a1a1a', 
          fontSize: '12px', 
          fontWeight: '600', 
          margin: '0 0 8px 0',
          textShadow: '0 1px 2px rgba(255,255,255,0.3)'
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
                  backgroundColor: entry.color,
                  boxShadow: `0 0 6px ${entry.color}`
                }}
              />
              <span style={{ color: '#1a1a1a', fontSize: '13px', fontWeight: '500' }}>
                {entry.name}: <strong>
                  {isTemp ? 
                    (entry.value % 1 === 0 ? entry.value.toString() : entry.value.toFixed(1)) : 
                    entry.value.toString()
                  }
                </strong>
                {isTemp ? '°C' : '%'}
                {isAggregated && count && (
                  <span style={{ color: '#6b7280', fontSize: '11px', marginLeft: '4px' }}>
                    (prom. {count})
                  </span>
                )}
              </span>
            </div>
          );
        })}
        {!isAggregated && data.nodo_id && (
          <p style={{ color: '#6b7280', fontSize: '11px', margin: '8px 0 0 0' }}>
            Nodo: {data.nodo_id.substring(0, 8)}...
          </p>
        )}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 25%, #ffb300 50%, #fff59d 100%)',
        backdropFilter: 'blur(15px)',
        padding: '32px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(255, 143, 0, 0.3)',
        textAlign: 'center',
        border: '2px solid rgba(255, 193, 7, 0.4)'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#1a1a1a',
          fontSize: '1.5rem',
          fontWeight: '700',
          textShadow: '0 1px 2px rgba(255,255,255,0.3)'
        }}>
          📊 Temperatura y Humedad Interna
        </h3>
        <p style={{ 
          color: '#2d2d2d', 
          margin: '20px 0 0 0',
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>
          No hay datos internos para mostrar en el período seleccionado
        </p>
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#1a1a1a' }}>
          <p>Debug info:</p>
          <p>Datos filtrados: {filteredData?.length || 0}</p>
          <p>Datos internos: {filteredData?.filter(d => d.tipo === 'interno').length || 0}</p>
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
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(15px)',
        padding: '24px',
        borderRadius: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 24px rgba(255, 143, 0, 0.2)',
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
            color: '#1a1a1a',
            textShadow: '0 1px 2px rgba(255,255,255,0.3)'
          }}>
            📊 Historial Sensores Internos
          </h4>
          {isAggregated && (
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              padding: '4px 12px',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.6)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {getAggregationLabel(aggregationType)}
            </span>
          )}
          <span style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#1a1a1a',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            padding: '4px 12px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.4)'
          }}>
            {recentData.length} registros
          </span>
        </div>
        
        <div style={{ 
          overflowX: 'auto', 
          maxHeight: '400px', 
          overflowY: 'auto',
          borderRadius: '12px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              background: 'rgba(255, 193, 7, 0.4)',
              backdropFilter: 'blur(10px)',
              zIndex: 1
            }}>
              <tr>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#1a1a1a',
                  borderBottom: '2px solid rgba(255, 193, 7, 0.6)',
                  textShadow: '0 1px 1px rgba(255,255,255,0.3)'
                }}>
                  {isAggregated ? 'Período' : 'Fecha/Hora'}
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#1a1a1a',
                  borderBottom: '2px solid rgba(255, 193, 7, 0.6)',
                  textShadow: '0 1px 1px rgba(255,255,255,0.3)'
                }}>
                  Tipo
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#1a1a1a',
                  borderBottom: '2px solid rgba(255, 193, 7, 0.6)',
                  textShadow: '0 1px 1px rgba(255,255,255,0.3)'
                }}>
                  Valor
                </th>
                {!isAggregated && (
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    fontWeight: '600', 
                    color: '#1a1a1a',
                    borderBottom: '2px solid rgba(255, 193, 7, 0.6)',
                    textShadow: '0 1px 1px rgba(255,255,255,0.3)'
                  }}>
                    Nodo
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {recentData.map((row, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                }}>
                  <td style={{ padding: '10px 12px', color: '#2d2d2d', fontWeight: '500' }}>
                    {row.fecha}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'white',
                      backgroundColor: row.tipo === 'temperatura' ? '#ef4444' : '#10b981',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {row.tipo}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '10px 12px', 
                    color: '#1a1a1a', 
                    fontWeight: '600' 
                  }}>
                    {row.tipo === 'temperatura' ? 
                      (row.valor % 1 === 0 ? row.valor.toString() : row.valor.toFixed(1)) : 
                      row.valor.toString()
                    }{row.unidad}
                  </td>
                  {!isAggregated && (
                    <td style={{ 
                      padding: '10px 12px', 
                      color: '#2d2d2d',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: '500'
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
        background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 25%, #ffb300 50%, #ffc107 75%, #fff59d 100%)',
        backdropFilter: 'blur(15px)',
        padding: '24px',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(255, 143, 0, 0.4)',
        border: '2px solid rgba(255, 193, 7, 0.4)',
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
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          opacity: 0.6,
          filter: 'blur(20px)'
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
            color: '#1a1a1a',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(255,255,255,0.3)'
          }}>
            🌡️💧 Temperatura y Humedad Interna
            {isAggregated && (
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#b8860b',
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
          background: 'rgba(255, 255, 255, 0.2)', 
          backdropFilter: 'blur(5px)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#1a1a1a',
          fontWeight: '500',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          Debug: {data.length} puntos | Temp: {hasTemperature ? 'Sí' : 'No'} | Hum: {hasHumidity ? 'Sí' : 'No'}
          {tempRange && <span> | Temp: {tempRange.min % 1 === 0 ? tempRange.min : tempRange.min.toFixed(1)}°C - {tempRange.max % 1 === 0 ? tempRange.max : tempRange.max.toFixed(1)}°C</span>}
          {humRange && <span> | Hum: {humRange.min}% - {humRange.max}%</span>}
        </div>
        
        {/* Area Chart */}
        <div style={{ 
          width: '100%', 
          height: '400px', 
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1,
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '2px solid rgba(255, 193, 7, 0.4)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
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
                <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#b8860b" opacity={0.7} />
              
              <XAxis 
                dataKey="fecha"
                tick={{ fontSize: 11, fill: '#1a1a1a', fontWeight: '500' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={Math.max(0, Math.floor(data.length / 8))}
              />
              
              {hasTemperature && tempRange && (
                <YAxis 
                  yAxisId="temp"
                  orientation="left"
                  tick={{ fontSize: 12, fill: '#ef4444', fontWeight: 'bold' }}
                  tickCount={6}
                  domain={[tempRange.min - 1, tempRange.max + 1]}
                  type="number"
                  allowDataOverflow={false}
                  width={60}
                  label={{ 
                    value: 'Temperatura (°C)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#ef4444', fontSize: '13px', fontWeight: 'bold' }
                  }}
                />
              )}
              
              {hasHumidity && humRange && (
                <YAxis 
                  yAxisId="hum"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#10b981', fontWeight: 'bold' }}
                  tickCount={6}
                  domain={[humRange.min - 2, humRange.max + 2]}
                  type="number"
                  allowDataOverflow={false}
                  width={60}
                  label={{ 
                    value: 'Humedad (%)', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { textAnchor: 'middle', fill: '#10b981', fontSize: '13px', fontWeight: 'bold' }
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
                  stroke="#ef4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#temperatureGradient)"
                  name="Temperatura (°C)"
                  connectNulls={false}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
                />
              )}
              
              {hasHumidity && (
                <Area
                  yAxisId="hum"
                  type="monotone"
                  dataKey="humedad"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#humidityGradient)"
                  name="Humedad (%)"
                  connectNulls={false}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
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
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(5px)',
          borderRadius: '12px',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>
            🌡️ Temperatura: {data.filter(d => d.temperatura !== undefined).length} puntos
          </span>
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
            💧 Humedad: {data.filter(d => d.humedad !== undefined).length} puntos
          </span>
          {isAggregated && (
            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>
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

export default TemperatureHumidityInternalChart;