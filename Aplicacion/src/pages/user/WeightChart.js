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

const WeightChart = ({ filteredData, ensureDate }) => {
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

  // Procesar datos de peso para Recharts
  const processWeightData = () => {
    if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0) {
      return [];
    }

    try {
      const weightData = filteredData
        .filter(d => d && d.peso !== null && d.peso !== undefined && d.tipo === 'interno')
        .sort((a, b) => {
          try {
            return ensureDate(a.fecha).getTime() - ensureDate(b.fecha).getTime();
          } catch {
            return 0;
          }
        })
        .map(d => ({
          fecha: formatDateTime(d.fecha),
          fechaCompleta: formatFullDateTime(d.fecha),
          peso: Number(d.peso) / 1000, // Convertir a kg
          nodo_id: d.nodo_id || 'N/A',
          timestamp: ensureDate(d.fecha).getTime()
        }));

      return weightData;
    } catch (error) {
      console.error('Error procesando datos de peso:', error);
      return [];
    }
  };

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
        <div style={{ 
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
              backgroundColor: '#f59e0b'
            }}
          />
          <span style={{ color: '#f9fafb', fontSize: '13px' }}>
            Peso: <strong>{payload[0].value?.toFixed(3)} kg</strong>
          </span>
        </div>
        {data.nodo_id && (
          <p style={{ color: '#d1d5db', fontSize: '11px', margin: '8px 0 0 0' }}>
            Nodo: {data.nodo_id.length > 8 ? data.nodo_id.substring(0, 8) + '...' : data.nodo_id}
          </p>
        )}
      </div>
    );
  };

  const data = processWeightData();
  const hasData = data.length > 0;

  // Calcular rango dinámico para el eje Y
  const pesoValues = data.map(d => d.peso);
  const pesoRange = pesoValues.length > 0 ? {
    min: Math.min(...pesoValues),
    max: Math.max(...pesoValues)
  } : { min: 0, max: 1 };

  console.log('📊 Rango peso:', pesoRange);
  console.log('📈 Total puntos de datos:', data.length);

  if (!hasData) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        textAlign: 'center',
        border: '1px solid rgba(55, 65, 81, 0.8)',
        color: '#e5e7eb'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
          📊 Peso de la Colmena
        </h3>
        <p style={{ color: '#9ca3af', margin: '16px 0 0 0' }}>
          No hay datos de peso para mostrar en el período seleccionado
        </p>
      </div>
    );
  }

  // Calcular estadísticas del peso
  const pesoActual = data.length > 0 ? data[data.length - 1].peso : 0;
  const pesoInicial = data.length > 0 ? data[0].peso : 0;
  const variacionPeso = pesoActual - pesoInicial;
  const pesoPromedio = data.reduce((sum, d) => sum + d.peso, 0) / data.length;
  const pesoMaximo = Math.max(...data.map(d => d.peso));
  const pesoMinimo = Math.min(...data.map(d => d.peso));

  // Crear tabla de historial
  const createHistoryTable = () => {
    const sortedData = [...data]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    if (sortedData.length === 0) return null;

    return (
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(55, 65, 81, 0.8)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        marginTop: '16px'
      }}>
        <h4 style={{
          margin: '0 0 16px 0',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📊 Historial de Peso
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '500',
            color: '#d1d5db',
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            padding: '2px 8px',
            borderRadius: '12px',
            border: '1px solid rgba(75, 85, 99, 0.5)'
          }}>
            {sortedData.length} registros más recientes
          </span>
        </h4>
        
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
            fontSize: '0.9rem'
          }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              backgroundColor: '#374151', 
              zIndex: 1 
            }}>
              <tr>
                <th style={{ 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#f9fafb', 
                  borderBottom: '2px solid #4b5563' 
                }}>
                  Fecha/Hora
                </th>
                <th style={{ 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#f9fafb', 
                  borderBottom: '2px solid #4b5563' 
                }}>
                  Peso (kg)
                </th>
                <th style={{ 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#f9fafb', 
                  borderBottom: '2px solid #4b5563' 
                }}>
                  Variación
                </th>
                <th style={{ 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#f9fafb', 
                  borderBottom: '2px solid #4b5563' 
                }}>
                  Nodo
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => {
                const prevRow = index < sortedData.length - 1 ? sortedData[index + 1] : null;
                const variacion = prevRow ? row.peso - prevRow.peso : 0;
                
                return (
                  <tr key={index} style={{
                    borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
                    backgroundColor: index % 2 === 0 ? 'rgba(31, 41, 55, 0.3)' : 'rgba(17, 24, 39, 0.3)'
                  }}>
                    <td style={{ padding: '10px 8px', color: '#d1d5db' }}>
                      {row.fecha}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#f59e0b', fontWeight: '600' }}>
                      {row.peso.toFixed(3)} kg
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: '600' }}>
                      {index === sortedData.length - 1 ? (
                        <span style={{ color: '#d1d5db' }}>-</span>
                      ) : (
                        <span style={{
                          color: variacion > 0 ? '#10b981' : variacion < 0 ? '#ef4444' : '#d1d5db',
                          backgroundColor: variacion !== 0 ? (
                            variacion > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                          ) : 'transparent',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontSize: '0.8rem'
                        }}>
                          {variacion > 0 ? '+' : ''}{variacion.toFixed(3)} kg
                        </span>
                      )}
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      color: '#d1d5db',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      {row.nodo_id.length > 8 ? row.nodo_id.substring(0, 8) + '...' : row.nodo_id}
                    </td>
                  </tr>
                );
              })}
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
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)',
        border: '1px solid rgba(55, 65, 81, 0.8)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decoraciones de fondo */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
          borderRadius: '50%',
          opacity: 0.6
        }} />

        {/* Header del gráfico */}
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
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
            letterSpacing: '0.025em'
          }}>
            ⚖️ Peso de la Colmena
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
          Debug: {data.length} puntos | Peso: {pesoRange.min.toFixed(3)}kg - {pesoRange.max.toFixed(3)}kg
        </div>
        
        {/* Area Chart con Recharts */}
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
                <linearGradient id="pesoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
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
              
              <YAxis 
                tick={{ fontSize: 12, fill: '#f59e0b', fontWeight: 'bold' }}
                tickCount={6}
                domain={[pesoRange.min - 0.1, pesoRange.max + 0.1]}
                type="number"
                allowDataOverflow={false}
                width={80}
                tickFormatter={(value) => `${value.toFixed(3)}`}
                label={{ 
                  value: 'Peso (kg)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }
                }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              
              <Area
                type="monotone"
                dataKey="peso"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#pesoGradient)"
                name={`Peso de la Colmena (${data.length} lecturas)`}
                connectNulls={false}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estadísticas de peso */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
          gap: '12px',
          padding: '16px',
          background: 'rgba(55, 65, 81, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(75, 85, 99, 0.5)',
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Actual</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f59e0b' }}>
              {pesoActual.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Variación</div>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: '600', 
              color: variacionPeso > 0 ? '#10b981' : variacionPeso < 0 ? '#ef4444' : '#9ca3af' 
            }}>
              {variacionPeso > 0 ? '+' : ''}{variacionPeso.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Promedio</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#d1d5db' }}>
              {pesoPromedio.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Máximo</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#10b981' }}>
              {pesoMaximo.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Mínimo</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ef4444' }}>
              {pesoMinimo.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Lecturas</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#d1d5db' }}>
              {data.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de historial */}
      {createHistoryTable()}
    </div>
  );
};

export default WeightChart;