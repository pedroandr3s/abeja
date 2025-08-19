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

const WeightChart = ({ filteredData, ensureDate }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const isMobile = window.innerWidth <= 768;

  // Procesar datos de peso
  const processWeightData = () => {
    if (!filteredData || filteredData.length === 0) return null;

    const weightData = filteredData
      .filter(d => d.peso !== null && d.peso !== undefined && d.tipo === 'interno')
      .sort((a, b) => ensureDate(a.fecha).getTime() - ensureDate(b.fecha).getTime())
      .map(d => ({
        ...d,
        fechaStr: formatDateTime(d.fecha),
        fechaCompleta: formatFullDateTime(d.fecha),
        valor: d.peso / 1000 // Convertir a kg
      }));

    return weightData;
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

  const createChart = () => {
    if (!chartRef.current) return;

    // Destruir gráfico existente
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const data = processWeightData();
    if (!data || data.length === 0) {
      return;
    }

    const ctx = chartRef.current.getContext('2d');
    
    const dataset = {
      label: `Peso de la Colmena (${data.length} lecturas)`,
      data: data.map(d => ({
        x: d.fechaStr,
        y: d.valor,
        fechaCompleta: d.fechaCompleta
      })),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      tension: 0.1,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#f59e0b',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      fill: true,
      spanGaps: false,
      showLine: true
    };

    const config = {
      type: 'line',
      data: { datasets: [dataset] },
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
                  label += context.parsed.y.toFixed(3) + ' kg';
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'category',
            title: { display: true, text: 'Tiempo' },
            ticks: { 
              maxRotation: 45, 
              minRotation: 45,
              maxTicksLimit: 15
            }
          },
          y: {
            title: { display: true, text: 'Peso (kg)' },
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return value.toFixed(3) + ' kg';
              }
            }
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
  }, [filteredData]);

  const data = processWeightData();
  
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        textAlign: 'center',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <h3 style={{ margin: 0, color: '#6b7280' }}>📊 Peso de la Colmena</h3>
        <p style={{ color: '#9ca3af', margin: '16px 0 0 0' }}>
          No hay datos de peso para mostrar en el período seleccionado
        </p>
      </div>
    );
  }

  // Calcular estadísticas del peso
  const pesoActual = data.length > 0 ? data[data.length - 1].valor : 0;
  const pesoInicial = data.length > 0 ? data[0].valor : 0;
  const variacionPeso = pesoActual - pesoInicial;
  const pesoPromedio = data.reduce((sum, d) => sum + d.valor, 0) / data.length;
  const pesoMaximo = Math.max(...data.map(d => d.valor));
  const pesoMinimo = Math.min(...data.map(d => d.valor));

  // Crear tabla de historial (datos más recientes arriba)
  const createHistoryTable = () => {
    const sortedData = [...data]
      .sort((a, b) => ensureDate(b.fecha).getTime() - ensureDate(a.fecha).getTime()) // Más recientes arriba
      .slice(0, 20); // Últimos 20 registros

    if (sortedData.length === 0) return null;

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
          📊 Historial de Peso
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '500',
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {sortedData.length} registros más recientes
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
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Fecha/Hora</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Peso (kg)</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Variación</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Nodo</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => {
                const prevRow = index < sortedData.length - 1 ? sortedData[index + 1] : null;
                const variacion = prevRow ? row.valor - prevRow.valor : 0;
                
                return (
                  <tr key={index} style={{
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                  }}>
                    <td style={{ padding: '10px 8px', color: '#6b7280' }}>{row.fechaStr}</td>
                    <td style={{ padding: '10px 8px', color: '#6b7280', fontWeight: '600' }}>
                      {row.valor.toFixed(3)} kg
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: '600' }}>
                      {index === sortedData.length - 1 ? (
                        <span style={{ color: '#6b7280' }}>-</span>
                      ) : (
                        <span style={{
                          color: variacion > 0 ? '#10b981' : variacion < 0 ? '#ef4444' : '#6b7280',
                          backgroundColor: variacion !== 0 ? (variacion > 0 ? '#ecfdf5' : '#fef2f2') : 'transparent',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontSize: '0.8rem'
                        }}>
                          {variacion > 0 ? '+' : ''}{variacion.toFixed(3)} kg
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#6b7280' }}>
                      {row.nodo_id ? row.nodo_id.substring(0, 8) + '...' : 'N/A'}
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
        
        {/* Estadísticas de peso */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
          gap: '12px',
          padding: '16px',
          background: 'rgba(249, 250, 251, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(229, 231, 235, 0.5)',
          marginBottom: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Actual</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f59e0b' }}>
              {pesoActual.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Variación</div>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: '600', 
              color: variacionPeso > 0 ? '#10b981' : variacionPeso < 0 ? '#ef4444' : '#6b7280' 
            }}>
              {variacionPeso > 0 ? '+' : ''}{variacionPeso.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Promedio</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>
              {pesoPromedio.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Máximo</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#10b981' }}>
              {pesoMaximo.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Mínimo</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ef4444' }}>
              {pesoMinimo.toFixed(3)} kg
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Lecturas</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>
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