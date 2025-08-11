import React, { useState, useEffect } from 'react';
import AlertasSystem from './AlertasSystem';

const AlertasButton = ({ sensorData, filteredData }) => {
  const [showAlertas, setShowAlertas] = useState(false);
  const [alertasActivas, setAlertasActivas] = useState([]);
  const [alertasCriticas, setAlertasCriticas] = useState(0);

  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      // Simulación de evaluación rápida de alertas para el contador
      const alertas = evaluarAlertasRapido(filteredData);
      setAlertasActivas(alertas);
      setAlertasCriticas(alertas.filter(a => a.prioridad === 'CRÍTICA').length);
    }
  }, [filteredData]);

  const evaluarAlertasRapido = (datos) => {
    if (!datos || datos.length === 0) return [];
    
    const alertas = [];
    const ultimoDato = datos[datos.length - 1];
    
    // Evaluar temperatura crítica alta
    if (ultimoDato.temperatura > 38) {
      alertas.push({
        id: 'temp_critica_alta',
        tipo: 'temperatura',
        prioridad: 'CRÍTICA',
        mensaje: '🔥 TEMPERATURA CRÍTICA ALTA',
        valor: ultimoDato.temperatura,
        fecha: ultimoDato.fecha
      });
    }
    
    // Evaluar temperatura crítica baja (en período de invernada)
    const mes = new Date().getMonth() + 1;
    const esInvernada = mes >= 3 && mes <= 7;
    if (esInvernada && ultimoDato.temperatura < 12) {
      alertas.push({
        id: 'temp_critica_baja',
        tipo: 'temperatura',
        prioridad: 'CRÍTICA',
        mensaje: '🧊 TEMPERATURA CRÍTICA BAJA',
        valor: ultimoDato.temperatura,
        fecha: ultimoDato.fecha
      });
    }
    
    // Evaluar humedad crítica
    if (esInvernada && ultimoDato.humedad > 70) {
      alertas.push({
        id: 'humedad_critica_alta',
        tipo: 'humedad',
        prioridad: 'CRÍTICA',
        mensaje: '💧 HUMEDAD CRÍTICA ALTA',
        valor: ultimoDato.humedad,
        fecha: ultimoDato.fecha
      });
    } else if (!esInvernada && ultimoDato.humedad < 40) {
      alertas.push({
        id: 'humedad_critica_baja',
        tipo: 'humedad',
        prioridad: 'CRÍTICA',
        mensaje: '🏜️ HUMEDAD CRÍTICA BAJA',
        valor: ultimoDato.humedad,
        fecha: ultimoDato.fecha
      });
    }
    
    return alertas;
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <>
      <button
        onClick={() => setShowAlertas(true)}
        style={{
          position: 'relative',
          padding: isMobile ? '12px' : '16px',
          background: alertasCriticas > 0 
            ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
            : alertasActivas.length > 0
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: alertasCriticas > 0 
            ? '0 4px 14px rgba(220, 38, 38, 0.4)'
            : alertasActivas.length > 0
            ? '0 4px 14px rgba(245, 158, 11, 0.4)'
            : '0 4px 14px rgba(107, 114, 128, 0.3)',
          transition: 'all 0.3s ease',
          transform: 'scale(1)',
          animation: alertasCriticas > 0 ? 'pulse 2s infinite' : 'none',
          letterSpacing: '0.025em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
      >
        {/* Icono de alertas */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '16px',
            height: '2px',
            backgroundColor: 'white',
            borderRadius: '1px'
          }}></div>
          <div style={{
            width: '16px',
            height: '2px',
            backgroundColor: 'white',
            borderRadius: '1px'
          }}></div>
          <div style={{
            width: '16px',
            height: '2px',
            backgroundColor: 'white',
            borderRadius: '1px'
          }}></div>
        </div>
        
        {/* Texto del botón */}
        <span>
          🚨 Alertas
          {alertasActivas.length > 0 && (
            <span style={{
              fontSize: '0.8rem',
              marginLeft: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 6px',
              borderRadius: '8px'
            }}>
              {alertasActivas.length}
            </span>
          )}
        </span>

        {/* Indicador de alertas críticas */}
        {alertasCriticas > 0 && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '20px',
            height: '20px',
            background: '#fef2f2',
            color: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: '800',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
          }}>
            {alertasCriticas}
          </div>
        )}
      </button>

      {/* Modal del sistema de alertas */}
      {showAlertas && (
        <AlertasSystem
          isOpen={showAlertas}
          onClose={() => setShowAlertas(false)}
          sensorData={sensorData}
          filteredData={filteredData}
        />
      )}

      {/* Estilos para la animación de pulso */}
      <style>
        {`
          @keyframes pulse {
            0% {
              box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
            }
            50% {
              box-shadow: 0 4px 20px rgba(220, 38, 38, 0.8), 0 0 0 4px rgba(220, 38, 38, 0.2);
            }
            100% {
              box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
            }
          }
        `}
      </style>
    </>
  );
};

export default AlertasButton;