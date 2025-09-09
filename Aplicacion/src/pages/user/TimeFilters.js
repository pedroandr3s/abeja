import React from 'react';
import { getAggregationInfo } from './dataAggregationUtils';

const TimeFilters = ({ 
  timeFilter, 
  timeFilters, 
  rawData,
  filteredData, 
  aggregatedData,
  onTimeFilterChange, 
  onCustomDateRange 
}) => {
  const isMobile = window.innerWidth <= 768;
  const selectedFilter = timeFilters.find(f => f.key === timeFilter);

  // Determinar qué datos mostrar y generar información
  const currentData = aggregatedData?.length > 0 ? aggregatedData : filteredData || [];
  const isAggregated = currentData.length > 0 && currentData[0]?.isAggregated;
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
      padding: isMobile ? '20px' : '28px',
      borderRadius: '24px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
      marginBottom: '32px',
      border: '1px solid rgba(55, 65, 81, 0.6)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '200px',
        height: '200px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        zIndex: 0
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '2px solid rgba(55, 65, 81, 0.4)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              fontSize: '2rem',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}>
              🕒
            </div>
            <h3 style={{
              margin: 0,
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f9fafb 0%, #6366f1 50%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.025em'
            }}>
            </h3>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
            padding: '12px 20px',
            borderRadius: '16px',
            display: 'inline-block',
            border: '1px solid rgba(75, 85, 99, 0.4)'
          }}>
            <div style={{
              margin: 0,
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: '#e5e7eb',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '1.2rem' }}>
                {isAggregated ? '📊' : '📋'}
              </span>
              
              <span>
                {getAggregationInfo(timeFilter, currentData, timeFilter === 'personalizado' ? {
                  start: document.getElementById('customStartDate')?.value,
                  end: document.getElementById('customEndDate')?.value
                } : null)}
              </span>
              
              <span style={{
                background: selectedFilter?.gradient || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                marginLeft: '4px'
              }}>
                {selectedFilter?.aggregationType || 'agrupación automática'}
              </span>

              {isAggregated && (
                <span style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  marginLeft: '4px'
                }}>
                  PROMEDIADO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filter Buttons Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '16px',
          marginBottom: '28px'
        }}>
          {timeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onTimeFilterChange(filter.key)}
              style={{
                padding: isMobile ? '16px 12px' : '18px 16px',
                background: timeFilter === filter.key 
                  ? filter.gradient
                  : 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
                color: 'white',
                border: timeFilter === filter.key 
                  ? 'none' 
                  : '2px solid rgba(75, 85, 99, 0.4)',
                borderRadius: '16px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: timeFilter === filter.key ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: timeFilter === filter.key 
                  ? `0 8px 25px ${filter.shadowColor}, 0 3px 10px rgba(0,0,0,0.3)` 
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                letterSpacing: '0.025em'
              }}
              onMouseEnter={(e) => {
                if (timeFilter !== filter.key) {
                  e.target.style.transform = 'translateY(-1px) scale(1.01)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                  e.target.style.background = 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeFilter !== filter.key) {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  e.target.style.background = 'linear-gradient(135deg, #374151 0%, #4b5563 100%)';
                }
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
                  {filter.label}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  opacity: timeFilter === filter.key ? 0.9 : 0.7,
                  fontWeight: '500'
                }}>
                  {filter.aggregationType}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Date Range Section */}
        <div style={{
          background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
          padding: isMobile ? '16px' : '20px',
          borderRadius: '16px',
          border: '2px solid rgba(75, 85, 99, 0.3)'
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
            📅 Período Personalizado
            <span style={{
              fontSize: '0.75rem',
              color: '#d1d5db',
              fontWeight: '400'
            }}>
              (Agrupación automática según rango)
            </span>
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '12px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '4px'
              }}>
                Fecha Inicio
              </label>
              <input
                type="date"
                id="customStartDate"
                onChange={(e) => {
                  const start = e.target.value;
                  const endInput = document.getElementById('customEndDate');
                  const end = endInput?.value;
                  if (start && end) {
                    onCustomDateRange(start, end);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #6b7280',
                  fontSize: '0.9rem',
                  background: '#1f2937',
                  color: '#f9fafb'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '4px'
              }}>
                Fecha Fin
              </label>
              <input
                type="date"
                id="customEndDate"
                onChange={(e) => {
                  const end = e.target.value;
                  const startInput = document.getElementById('customStartDate');
                  const start = startInput?.value;
                  if (start && end) {
                    onCustomDateRange(start, end);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #6b7280',
                  fontSize: '0.9rem',
                  background: '#1f2937',
                  color: '#f9fafb'
                }}
              />
            </div>
          </div>
          
          {/* Información de agrupación automática */}
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#93c5fd',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <strong>📝 Agrupación automática:</strong> ≤1 día (individual), 2-7 días (por día), 8-60 días (por semana), &gt;60 días (por mes)
          </div>
        </div>

        {/* Información adicional sobre datos originales */}
        {rawData && rawData.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(75, 85, 99, 0.3)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            color: '#d1d5db',
            textAlign: 'center',
            border: '1px solid rgba(75, 85, 99, 0.4)'
          }}>
            <strong>💾 Datos disponibles:</strong> {rawData.length} registros totales en la base de datos
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeFilters;