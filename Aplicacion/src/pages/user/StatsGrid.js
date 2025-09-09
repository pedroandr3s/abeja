import React from 'react';

const StatsGrid = ({ userColmenas, filteredData }) => {
  const isMobile = window.innerWidth <= 768;

  // Obtener últimos datos por tipo
  const ultimaTempInterna = filteredData.filter(d => d.temperatura !== null && d.tipo === 'interno').slice(-1)[0];
  const ultimaTempExterna = filteredData.filter(d => d.temperatura !== null && d.tipo === 'externo').slice(-1)[0];
  const ultimaHumInterna = filteredData.filter(d => d.humedad !== null && d.tipo === 'interno').slice(-1)[0];
  const ultimaHumExterna = filteredData.filter(d => d.humedad !== null && d.tipo === 'externo').slice(-1)[0];
  const ultimoPeso = filteredData.filter(d => d.peso !== null && d.tipo === 'interno').slice(-1)[0];

  const stats = [
    { 
      title: 'Mis Colmenas', 
      value: userColmenas.length, 
      icon: '🏠', 
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      bgColor: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      borderColor: 'rgba(16, 185, 129, 0.4)'
    },
    { 
      title: '🌡️ Temp. Interna', 
      value: ultimaTempInterna ? 
        `${ultimaTempInterna.temperatura.toFixed(1)}°C` : 
        'Sin datos', 
      icon: '🌡️', 
      color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      bgColor: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      borderColor: 'rgba(239, 68, 68, 0.4)',
      time: ultimaTempInterna ? `[${ultimaTempInterna.fecha.toLocaleTimeString()}]` : ''
    },
    { 
      title: '🌡️ Temp. Externa', 
      value: ultimaTempExterna ? 
        `${ultimaTempExterna.temperatura.toFixed(1)}°C` : 
        'Sin datos', 
      icon: '🌡️', 
      color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      bgColor: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      borderColor: 'rgba(59, 130, 246, 0.4)',
      time: ultimaTempExterna ? `[${ultimaTempExterna.fecha.toLocaleTimeString()}]` : ''
    },
    { 
      title: '💧 Hum. Interna', 
      value: ultimaHumInterna ? 
        `${ultimaHumInterna.humedad.toFixed(1)}%` : 
        'Sin datos', 
      icon: '💧', 
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      bgColor: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      time: ultimaHumInterna ? `[${ultimaHumInterna.fecha.toLocaleTimeString()}]` : ''
    },
    { 
      title: '💧 Hum. Externa', 
      value: ultimaHumExterna ? 
        `${ultimaHumExterna.humedad.toFixed(1)}%` : 
        'Sin datos', 
      icon: '💧', 
      color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      bgColor: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      borderColor: 'rgba(139, 92, 246, 0.4)',
      time: ultimaHumExterna ? `[${ultimaHumExterna.fecha.toLocaleTimeString()}]` : ''
    },
    { 
      title: '⚖️ Peso Colmena', 
      value: ultimoPeso ? 
        `${(ultimoPeso.peso / 1000).toFixed(3)}kg` : 
        'Sin datos', 
      icon: '⚖️', 
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      bgColor: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      time: ultimoPeso ? `[${ultimoPeso.fecha.toLocaleTimeString()}]` : ''
    }
  ];

  return (
    <>
      {/* CSS para hexágonos modo oscuro */}
      <style>
        {`
          .hexagon-container {
            display: grid;
            grid-template-columns: ${isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)'};
            gap: ${isMobile ? '20px' : '24px'};
            margin-bottom: 32px;
            padding: 20px 0;
            background: transparent;
          }

          .hexagon-wrapper {
            position: relative;
            width: 100%;
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .hexagon-card {
            position: relative;
            width: 100%;
            height: 100%;
            clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
          }

          .hexagon-card:hover {
            transform: scale(1.08) rotate(2deg);
            filter: drop-shadow(0 8px 25px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 20px rgba(59, 130, 246, 0.3));
          }

          .hexagon-border {
            position: absolute;
            top: 3px;
            left: 3px;
            right: 3px;
            bottom: 3px;
            clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
            border: 2px solid var(--border-color);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
          }

          .hexagon-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            width: 80%;
            z-index: 10;
            padding: ${isMobile ? '12px' : '16px'};
          }

          .hexagon-icon {
            font-size: ${isMobile ? '1.8rem' : '2.2rem'};
            margin-bottom: 8px;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
            display: block;
          }

          .hexagon-value {
            margin: 0 0 4px 0;
            font-size: ${isMobile ? '1rem' : '1.2rem'};
            font-weight: 900;
            line-height: 1.1;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
          }

          .hexagon-time {
            margin: 0 0 4px 0;
            font-size: 0.65rem;
            color: #9ca3af;
            font-weight: 600;
            opacity: 0.9;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }

          .hexagon-title {
            margin: 0;
            font-size: ${isMobile ? '0.7rem' : '0.75rem'};
            color: #d1d5db;
            font-weight: 700;
            letter-spacing: 0.02em;
            line-height: 1.2;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }

          .hexagon-glow {
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
          }

          .hexagon-card:hover .hexagon-glow {
            opacity: 1;
            animation: hexagon-shine 0.6s ease-out;
          }

          @keyframes hexagon-shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .hexagon-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.02) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.02) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.02) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
          }

          .hexagon-inner-glow {
            position: absolute;
            top: 8px;
            left: 8px;
            right: 8px;
            bottom: 8px;
            clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 50%, rgba(255, 255, 255, 0.03) 100%);
            pointer-events: none;
          }

          .hexagon-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%);
            pointer-events: none;
            border-radius: inherit;
          }
        `}
      </style>

      {/* Patrón de fondo decorativo oscuro */}
      <div className="hexagon-pattern" />

      {/* Grid de hexágonos */}
      <div className="hexagon-container">
        {stats.map((stat, index) => (
          <div key={index} className="hexagon-wrapper">
            <div 
              className="hexagon-card"
              style={{ 
                background: stat.bgColor,
                '--border-color': stat.borderColor
              }}
            >
              {/* Overlay oscuro */}
              <div className="hexagon-overlay" />
              
              {/* Borde hexagonal con color específico */}
              <div className="hexagon-border" />
              
              {/* Brillo interno sutil */}
              <div className="hexagon-inner-glow" />
              
              {/* Contenido */}
              <div className="hexagon-content">
                <div className="hexagon-icon">
                  {stat.icon}
                </div>
                
                <h3 
                  className="hexagon-value"
                  style={{ 
                    background: stat.color,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {stat.value}
                </h3>
                
                {stat.time && (
                  <p className="hexagon-time">
                    {stat.time}
                  </p>
                )}
                
                <p className="hexagon-title">
                  {stat.title}
                </p>
              </div>

              {/* Efecto de brillo */}
              <div className="hexagon-glow" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default StatsGrid;