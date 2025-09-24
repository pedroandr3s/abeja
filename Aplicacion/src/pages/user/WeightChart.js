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

  // Funciones de redondeo (igual que interno)
  const roundWeight = (weight) => {
    if (weight === null || weight === undefined || isNaN(weight)) return weight;
    return Math.round(weight * 1000) / 1000; // Redondea a 3 decimales
  };

  // Funciones de formato (sin segundos, igual que interno)
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
          peso: roundWeight(Number(d.peso) / 1000), // Convertir a kg y redondear
          nodo_id: d.nodo_id || 'N/A',
          timestamp: ensureDate(d.fecha).getTime()
        }));

      return weightData;
    } catch (error) {
      console.error('Error procesando datos de peso:', error);
      return [];
    }
  };

  // Custom tooltip con tema naranja (igual que interno)
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
              backgroundColor: '#f59e0b',
              boxShadow: '0 0 6px #f59e0b'
            }}
          />
          <span style={{ color: '#1a1a1a', fontSize: '13px', fontWeight: '500' }}>
            Peso: <strong>{payload[0].value?.toFixed(3)} kg</strong>
          </span>
        </div>
        {data.nodo_id && (
          <p style={{ color: '#6b7280', fontSize: '11px', margin: '8px 0 0 0' }}>
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
          ⚖️ Peso de la Colmena
        </h3>
        <p style={{ 
          color: '#2d2d2d', 
          margin: '20px 0 0 0',
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>
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
            📊 Historial de Peso
          </h4>
          <span style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#1a1a1a',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            padding: '4px 12px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.4)'
          }}>
            {sortedData.length} registros
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
                  Fecha/Hora
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#1a1a1a',
                  borderBottom: '2px solid rgba(255, 193, 7, 0.6)',
                  textShadow: '0 1px 1px rgba(255,255,255,0.3)'
                }}>
                  Peso (kg)
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#1a1a1a',
                  borderBottom: '2px solid rgba(255, 193, 7, 0.6)',
                  textShadow: '0 1px 1px rgba(255,255,255,0.3)'
                }}>
                  Variación
                </th>
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
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => {
                const prevRow = index < sortedData.length - 1 ? sortedData[index + 1] : null;
                const variacion = prevRow ? row.peso - prevRow.peso : 0;
                
                return (
                  <tr key={index} style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                  }}>
                    <td style={{ padding: '10px 12px', color: '#2d2d2d', fontWeight: '500' }}>
                      {row.fecha}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#1a1a1a', fontWeight: '600' }}>
                      {row.peso.toFixed(3)} kg
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>
                      {index === sortedData.length - 1 ? (
                        <span style={{ color: '#2d2d2d' }}>-</span>
                      ) : (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'white',
                          backgroundColor: variacion > 0 ? '#10b981' : variacion < 0 ? '#ef4444' : '#6b7280',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {variacion > 0 ? '+' : ''}{variacion.toFixed(3)} kg
                        </span>
                      )}
                    </td>
                    <td style={{ 
                      padding: '10px 12px', 
                      color: '#2d2d2d',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: '500'
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
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: '800',
            color: '#1a1a1a',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(255,255,255,0.3)'
          }}>
            ⚖️ Peso de la Colmena
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
          Debug: {data.length} puntos | Peso: {pesoRange.min.toFixed(3)}kg - {pesoRange.max.toFixed(3)}kg
        </div>
        
        {/* Area Chart con Recharts */}
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
                <linearGradient id="pesoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
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
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(5px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#1a1a1a', marginBottom: '4px', fontWeight: '600' }}>Actual</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1a1a' }}>
              {pesoActual.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#1a1a1a', marginBottom: '4px', fontWeight: '600' }}>Variación</div>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: '600', 
              color: variacionPeso > 0 ? '#10b981' : variacionPeso < 0 ? '#ef4444' : '#1a1a1a' 
            }}>
              {variacionPeso > 0 ? '+' : ''}{variacionPeso.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#1a1a1a', marginBottom: '4px', fontWeight: '600' }}>Promedio</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1a1a' }}>
              {pesoPromedio.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#1a1a1a', marginBottom: '4px', fontWeight: '600' }}>Máximo</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#10b981' }}>
              {pesoMaximo.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#1a1a1a', marginBottom: '4px', fontWeight: '600' }}>Mínimo</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ef4444' }}>
              {pesoMinimo.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#1a1a1a', marginBottom: '4px', fontWeight: '600' }}>Lecturas</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1a1a' }}>
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