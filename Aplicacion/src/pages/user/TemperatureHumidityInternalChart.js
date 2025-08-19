import React, { useRef, useEffect } from 'react';
import * as Chart from 'chart.js';

// Registrar componentes necesarios de Chart.js
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

const TemperatureHumidityInternalChart = ({ 
  filteredData, 
  ensureDate, 
  isAggregated = false, 
  aggregationType = 'individual' 
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const isMobile = window.innerWidth <= 768;

  // Procesar datos internos
  const processInternalData = () => {
    if (!filteredData || filteredData.length === 0) return null;

    const internalData = filteredData
      .filter(d => d.tipo === 'interno')
      .sort((a, b) => ensureDate(a.fecha).getTime() - ensureDate(b.fecha).getTime());

    const temperaturaData = internalData
      .filter(d => d.temperatura !== null && d.temperatura !== undefined)
      .map(d => ({
        ...d,
        fechaStr: isAggregated ? d.groupKey : formatDateTime(d.fecha),
        fechaCompleta: isAggregated ? 
          `${d.groupKey} (Promedio de ${d.tempCount || d.originalCount || 1} lecturas)` : 
          formatFullDateTime(d.fecha),
        valor: d.temperatura
      }));

    const humedadData = internalData
      .filter(d => d.humedad !== null && d.humedad !== undefined)
      .map(d => ({
        ...d,
        fechaStr: isAggregated ? d.groupKey : formatDateTime(d.fecha),
        fechaCompleta: isAggregated ? 
          `${d.groupKey} (Promedio de ${d.humCount || d.originalCount || 1} lecturas)` : 
          formatFullDateTime(d.fecha),
        valor: d.humedad
      }));

    return { temperaturaData, humedadData };
  };

  const formatDateTime = (fecha) => {
    const date = ensureDate(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month} ${hours}:${minutes}:${seconds}`;
  };

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

  // Función para obtener etiqueta de agregación
  const getAggregationLabel = (type) => {
    switch (type) {
      case 'daily': return 'Promedio Diario';
      case 'weekly': return 'Promedio Semanal';
      case 'monthly': return 'Promedio Mensual';
      case 'individual': return 'Datos Individuales';
      default: return 'Datos Agrupados';
    }
  };

  const createChart = () => {
    if (!chartRef.current) return;

    // Destruir gráfico existente
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const data = processInternalData();
    if (!data || (data.temperaturaData.length === 0 && data.humedadData.length === 0)) {
      return;
    }

    const ctx = chartRef.current.getContext('2d');
    
    const datasets = [];

    // Dataset de temperatura
    if (data.temperaturaData.length > 0) {
      datasets.push({
        label: isAggregated ? 
          `Temperatura Interna - ${getAggregationLabel(aggregationType)} (${data.temperaturaData.length})` :
          `Temperatura Interna (${data.temperaturaData.length} lecturas)`,
        data: data.temperaturaData.map(d => ({
          x: d.fechaStr,
          y: d.valor,
          fechaCompleta: d.fechaCompleta
        })),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
        pointRadius: isAggregated ? 5 : 3,
        pointHoverRadius: isAggregated ? 7 : 5,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: isAggregated ? 2 : 1,
        fill: false,
        yAxisID: 'temp'
      });
    }

    // Dataset de humedad
    if (data.humedadData.length > 0) {
      datasets.push({
        label: isAggregated ? 
          `Humedad Interna - ${getAggregationLabel(aggregationType)} (${data.humedadData.length})` :
          `Humedad Interna (${data.humedadData.length} lecturas)`,
        data: data.humedadData.map(d => ({
          x: d.fechaStr,
          y: d.valor,
          fechaCompleta: d.fechaCompleta
        })),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        pointRadius: isAggregated ? 5 : 3,
        pointHoverRadius: isAggregated ? 7 : 5,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: isAggregated ? 2 : 1,
        fill: false,
        yAxisID: 'hum'
      });
    }

    const config = {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 200 },
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
                const dataPoint = context[0].raw;
                return dataPoint.fechaCompleta || context[0].label;
              },
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  if (context.dataset.yAxisID === 'temp') {
                    label += context.parsed.y.toFixed(1) + '°C';
                    if (isAggregated) label += ' (promedio)';
                  } else {
                    label += context.parsed.y.toFixed(1) + '%';
                    if (isAggregated) label += ' (promedio)';
                  }
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'category',
            title: { 
              display: true, 
              text: isAggregated ? `Tiempo - ${getAggregationLabel(aggregationType)}` : 'Tiempo'
            },
            ticks: { 
              maxRotation: 45, 
              minRotation: 45,
              maxTicksLimit: 15
            }
          },
          temp: {
            type: 'linear',
            display: data.temperaturaData.length > 0,
            position: 'left',
            title: { 
              display: true, 
              text: isAggregated ? 'Temperatura (°C) - Promedio' : 'Temperatura (°C)' 
            },
            grid: { drawOnChartArea: true },
          },
          hum: {
            type: 'linear',
            display: data.humedadData.length > 0,
            position: 'right',
            title: { 
              display: true, 
              text: isAggregated ? 'Humedad (%) - Promedio' : 'Humedad (%)' 
            },
            grid: { drawOnChartArea: false },
            min: 0,
            max: 100
          }
        }
      }
    };

    chartInstance.current = new Chart.Chart(ctx, config);
  };

  useEffect(() => {
    createChart();
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [filteredData, isAggregated, aggregationType]);

  const data = processInternalData();
  
  if (!data || (data.temperaturaData.length === 0 && data.humedadData.length === 0)) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        textAlign: 'center',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <h3 style={{ margin: 0, color: '#6b7280' }}>📊 Temperatura y Humedad Interna</h3>
        <p style={{ color: '#9ca3af', margin: '16px 0 0 0' }}>
          No hay datos internos para mostrar en el período seleccionado
        </p>
      </div>
    );
  }

  // Crear tabla de historial (datos más recientes arriba)
  const createHistoryTable = () => {
    const allData = [
      ...data.temperaturaData.map(d => ({ ...d, tipo: 'temperatura', unidad: '°C' })),
      ...data.humedadData.map(d => ({ ...d, tipo: 'humedad', unidad: '%' }))
    ]
    .sort((a, b) => ensureDate(b.fecha).getTime() - ensureDate(a.fecha).getTime()) // Más recientes arriba
    .slice(0, 20); // Últimos 20 registros

    if (allData.length === 0) return null;

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
          📊 Historial Sensores Internos
          {isAggregated && (
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '500',
              color: '#059669',
              backgroundColor: '#ecfdf5',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {getAggregationLabel(aggregationType)}
            </span>
          )}
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '500',
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {allData.length} registros más recientes
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
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
                  {isAggregated ? `Período (${getAggregationLabel(aggregationType)})` : 'Fecha/Hora'}
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Tipo</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
                  {isAggregated ? 'Valor Promedio' : 'Valor'}
                </th>
                {!isAggregated && (
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Nodo</th>
                )}
                {isAggregated && (
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Lecturas</th>
                )}
              </tr>
            </thead>
            <tbody>
              {allData.map((row, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                }}>
                  <td style={{ padding: '10px 8px', color: '#6b7280' }}>{row.fechaStr}</td>
                  <td style={{ padding: '10px 8px', color: '#6b7280' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'white',
                      backgroundColor: row.tipo === 'temperatura' ? '#ef4444' : '#10b981'
                    }}>
                      {row.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: '#6b7280', fontWeight: '600' }}>
                    {row.valor.toFixed(1)}{row.unidad}
                    {isAggregated && <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}> (prom.)</span>}
                  </td>
                  {!isAggregated && (
                    <td style={{ padding: '10px 8px', color: '#6b7280' }}>
                      {row.nodo_id ? row.nodo_id.substring(0, 8) + '...' : 'N/A'}
                    </td>
                  )}
                  {isAggregated && (
                    <td style={{ padding: '10px 8px', color: '#6b7280' }}>
                      {row.tipo === 'temperatura' ? (row.tempCount || row.originalCount || 1) : (row.humCount || row.originalCount || 1)}
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
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
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
            background: 'linear-gradient(135deg, #ef4444 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
            letterSpacing: '0.025em'
          }}>
            🌡️💧 Temperatura y Humedad Interna
            {isAggregated && (
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#059669',
                marginLeft: '8px'
              }}>
                ({getAggregationLabel(aggregationType)})
              </span>
            )}
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
            ref={chartRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </div>
        
        {/* Información de datos */}
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
            Temperatura: {data.temperaturaData.length} {isAggregated ? 'períodos' : 'lecturas'}
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Humedad: {data.humedadData.length} {isAggregated ? 'períodos' : 'lecturas'}
          </span>
          {isAggregated && (
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
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