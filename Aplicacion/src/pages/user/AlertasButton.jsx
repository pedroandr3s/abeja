// =====================================================
// ALERTAS BUTTON CORREGIDO - DETECTA Y MARCA COMO VISTAS
// Archivo: frontend/components/AlertasButton.js - VERSIÓN FUNCIONAL
// =====================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../../context/ApiContext';
import AlertasSystemActualizado from './AlertasSystem';

const AlertasButtonCorregido = ({ sensorData, filteredData }) => {
  const { alertas, usuarios, helpers } = useApi();
  const [showAlertas, setShowAlertas] = useState(false);
  const [alertasActivas, setAlertasActivas] = useState([]);
  const [alertasCriticas, setAlertasCriticas] = useState(0);
  const [alertasAltas, setAlertasAltas] = useState(0);
  const [totalAlertas, setTotalAlertas] = useState(0);
  const [alertasNoVistas, setAlertasNoVistas] = useState(0);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [alertaReciente, setAlertaReciente] = useState(false);
  
  // Referencias para control estricto de ejecución
  const intervalRef = useRef(null);
  const isEvaluatingRef = useRef(false);
  const lastEvaluationTimeRef = useRef(0);
  const mountedRef = useRef(true);
  const evaluationTimeoutRef = useRef(null);

  // LocalStorage key para alertas vistas por usuario
  const usuarioActual = usuarios.getCurrentUser();
  const alertasVistasKey = usuarioActual ? `alertas_vistas_${usuarioActual.id}` : null;

  // Función para obtener alertas vistas del localStorage
  const getAlertasVistas = useCallback(() => {
    if (!alertasVistasKey) return new Set();
    try {
      const stored = localStorage.getItem(alertasVistasKey);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Error leyendo alertas vistas:', error);
      return new Set();
    }
  }, [alertasVistasKey]);

  // Función para marcar alertas como vistas
  const marcarAlertasComoVistas = useCallback((alertaIds) => {
    if (!alertasVistasKey) return;
    try {
      const vistas = getAlertasVistas();
      alertaIds.forEach(id => vistas.add(id));
      localStorage.setItem(alertasVistasKey, JSON.stringify([...vistas]));
      
      // Actualizar contador de alertas no vistas
      const noVistas = alertasActivas.filter(alerta => !vistas.has(alerta.id)).length;
      setAlertasNoVistas(noVistas);
      
      console.log(`Marcadas ${alertaIds.length} alertas como vistas. No vistas: ${noVistas}`);
    } catch (error) {
      console.error('Error marcando alertas como vistas:', error);
    }
  }, [alertasVistasKey, alertasActivas, getAlertasVistas]);

  // Función para calcular alertas no vistas
  const calcularAlertasNoVistas = useCallback((alertas) => {
    if (!alertasVistasKey || !alertas.length) return alertas.length;
    
    const vistas = getAlertasVistas();
    const noVistas = alertas.filter(alerta => !vistas.has(alerta.id));
    return noVistas.length;
  }, [alertasVistasKey, getAlertasVistas]);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      // Limpiar todos los timers y referencias
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (evaluationTimeoutRef.current) {
        clearTimeout(evaluationTimeoutRef.current);
        evaluationTimeoutRef.current = null;
      }

      // Reset de flags
      isEvaluatingRef.current = false;
    };
  }, []);

  // Función de evaluación con detección de alertas no vistas
  const evaluarAlertasUsuario = useCallback(async () => {
    // Verificaciones de seguridad ANTES de proceder
    if (!mountedRef.current) {
      console.log('Componente desmontado, cancelando evaluación');
      return;
    }

    if (!usuarioActual) {
      console.log('No hay usuario actual');
      return;
    }

    if (isEvaluatingRef.current) {
      console.log('Ya hay una evaluación en curso, cancelando');
      return;
    }

    if (loadingAlertas) {
      console.log('Ya está cargando alertas, cancelando');
      return;
    }

    // Debounce más permisivo - mínimo 5 segundos entre evaluaciones para detección rápida
    const ahora = Date.now();
    if (ahora - lastEvaluationTimeRef.current < 5000) {
      console.log(`Evaluación muy reciente (${Math.round((ahora - lastEvaluationTimeRef.current) / 1000)}s), cancelando`);
      return;
    }

    try {
      // Marcar como en proceso INMEDIATAMENTE
      isEvaluatingRef.current = true;
      lastEvaluationTimeRef.current = ahora;
      
      // Solo actualizar loading si el componente sigue montado
      if (!mountedRef.current) return;
      setLoadingAlertas(true);
      
      console.log(`Evaluando alertas para usuario: ${usuarioActual.id} (${new Date().toLocaleTimeString()})`);

      // Usar la API con timeout
      const response = await Promise.race([
        alertas.evaluarParaUsuario(usuarioActual.id, 168),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
      ]);
      
      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) return;
      
      if (response.success) {
        const { alertas_por_colmena } = response.data;
        
        // Extraer todas las alertas activas
        const todasLasAlertas = [];
        alertas_por_colmena.forEach(({ colmena, alertas: alertasColmena }) => {
          const alertasConColmena = alertasColmena.map(alerta => ({
            ...alerta,
            colmena_nombre: colmena.nombre,
            colmena_id: colmena.id
          }));
          todasLasAlertas.push(...alertasConColmena);
        });

        // Contar alertas por prioridad
        let criticas = 0;
        let altas = 0;
        
        todasLasAlertas.forEach(alerta => {
          const prioridad = helpers.getPrioridadAlerta(alerta.id);
          if (prioridad === 'CRÍTICA') criticas++;
          else if (prioridad === 'ALTA') altas++;
        });

        // Calcular alertas no vistas
        const noVistas = calcularAlertasNoVistas(todasLasAlertas);

        // Detectar nuevas alertas no vistas
        if (noVistas > 0 && alertasNoVistas === 0) {
          setAlertaReciente(true);
          console.log('¡Alerta detectada!');
          setTimeout(() => setAlertaReciente(false), 5000);
        }

        // Actualizar estado solo si hay cambios y el componente sigue montado
        if (mountedRef.current) {
          console.log(`Alertas encontradas: ${todasLasAlertas.length} total (${criticas} críticas, ${altas} altas, ${noVistas} no vistas)`);
          
          setAlertasActivas(todasLasAlertas);
          setAlertasCriticas(criticas);
          setAlertasAltas(altas);
          setTotalAlertas(todasLasAlertas.length);
          setAlertasNoVistas(noVistas);
          setLastEvaluation(new Date());
        }
      } else {
        console.log('La evaluación no fue exitosa:', response);
      }
    } catch (error) {
      console.error('Error evaluando alertas del usuario:', error);
    } finally {
      // Liberar flags SIEMPRE, incluso si el componente se desmontó
      isEvaluatingRef.current = false;
      
      // Solo actualizar loading si el componente sigue montado
      if (mountedRef.current) {
        setLoadingAlertas(false);
      }
    }
  }, [usuarioActual, alertas, helpers, loadingAlertas, calcularAlertasNoVistas, alertasNoVistas]);

  // Configurar evaluación inicial con delay
  useEffect(() => {
    if (usuarioActual && filteredData && filteredData.length > 0) {
      // Usar timeout para evitar evaluaciones simultáneas al cargar
      if (evaluationTimeoutRef.current) {
        clearTimeout(evaluationTimeoutRef.current);
      }
      
      evaluationTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          evaluarAlertasUsuario();
        }
      }, 2000); // Delay de 2 segundos
    }

    return () => {
      if (evaluationTimeoutRef.current) {
        clearTimeout(evaluationTimeoutRef.current);
        evaluationTimeoutRef.current = null;
      }
    };
  }, [usuarioActual?.id]); // Solo depende del ID del usuario

  // Configurar intervalo automático (SOLO UNA VEZ y con protecciones)
  useEffect(() => {
    if (usuarioActual && mountedRef.current) {
      // Limpiar intervalo anterior si existe
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Crear nuevo intervalo solo si no existe uno
      intervalRef.current = setInterval(() => {
        if (mountedRef.current && !isEvaluatingRef.current) {
          console.log('Intervalo automático de alertas (cada 30 segundos)');
          evaluarAlertasUsuario();
        }
      }, 30000); // Aumentado a 30 segundos para reducir carga
      
      console.log('Intervalo de alertas configurado para', usuarioActual.id);
    }
    
    // Cleanup específico para este useEffect
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [usuarioActual?.id, evaluarAlertasUsuario]);

  // Determinar el estado del botón
  const getButtonState = useCallback(() => {
    if (alertaReciente) {
      return {
        color: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', // rojo alerta
        shadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
        animation: 'pulse 2s infinite',
        text: '¡Alerta detectada!'
      };
    }

    if (loadingAlertas) {
      return {
        color: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
        shadow: '0 4px 14px rgba(156, 163, 175, 0.3)',
        animation: 'none',
        text: 'Evaluando...'
      };
    }

    // Usar alertasNoVistas en lugar de totalAlertas para determinar el color
    if (alertasCriticas > 0 && alertasNoVistas > 0) {
      return {
        color: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        shadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
        animation: 'pulse 2s infinite',
        text: `Alertas (${totalAlertas})`
      };
    }

    if ((alertasAltas > 0 || totalAlertas > 0) && alertasNoVistas > 0) {
      return {
        color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        shadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
        animation: 'none',
        text: `Alertas (${totalAlertas})`
      };
    }

    // Verde cuando no hay alertas no vistas (aunque haya alertas totales)
    return {
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
      animation: 'none',
      text: totalAlertas > 0 ? `Alertas Vistas (${totalAlertas})` : 'Alertas'
    };
  }, [loadingAlertas, alertasCriticas, alertasAltas, totalAlertas, alertasNoVistas, alertaReciente]);

  // Handler del click del botón con marcado como vistas
  const handleButtonClick = useCallback(() => {
    if (!loadingAlertas && mountedRef.current) {
      setShowAlertas(true);
      
      // Al usuario abrir el modal y ver alertas
      setAlertaReciente(false); // Vuelve a verde

      // Marcar todas las alertas actuales como vistas al abrir el modal
      if (alertasActivas.length > 0) {
        const alertaIds = alertasActivas.map(alerta => alerta.id);
        marcarAlertasComoVistas(alertaIds);
      }
    }
  }, [loadingAlertas, alertasActivas, marcarAlertasComoVistas]);

  // Handler para cerrar modal
  const handleCloseModal = useCallback(() => {
    if (mountedRef.current) {
      setShowAlertas(false);
    }
  }, []);

  const buttonState = getButtonState();
  const isMobile = window.innerWidth <= 768;

  // No renderizar si no hay usuario
  if (!usuarioActual) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleButtonClick}
        style={{
          position: 'relative',
          padding: isMobile ? '12px 16px' : '16px 20px',
          background: buttonState.color,
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          cursor: loadingAlertas ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: buttonState.shadow,
          transition: 'all 0.3s ease',
          transform: 'scale(1)',
          animation: buttonState.animation,
          letterSpacing: '0.025em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        disabled={loadingAlertas}
        onMouseOver={(e) => {
          if (!loadingAlertas) {
            e.target.style.transform = 'scale(1.05)';
          }
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
        title={`Total: ${totalAlertas} | No vistas: ${alertasNoVistas} | Última evaluación: ${lastEvaluation ? helpers.formatDate(lastEvaluation) : 'Nunca'}`}
      >
        {/* Icono del sistema de alertas */}
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
            borderRadius: '1px',
            opacity: loadingAlertas ? 0.5 : 1
          }}></div>
          <div style={{
            width: '16px',
            height: '2px',
            backgroundColor: 'white',
            borderRadius: '1px',
            opacity: loadingAlertas ? 0.5 : 1
          }}></div>
          <div style={{
            width: '16px',
            height: '2px',
            backgroundColor: 'white',
            borderRadius: '1px',
            opacity: loadingAlertas ? 0.5 : 1
          }}></div>
        </div>
        
        {/* Texto del botón */}
        <span>
          {buttonState.text}
        </span>

        {/* Indicador solo para alertas NO VISTAS */}
        {alertasNoVistas > 0 && !loadingAlertas && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
            background: alertasCriticas > 0 
              ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
              : 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
            color: alertasCriticas > 0 ? '#dc2626' : '#ea580c',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: '800',
            border: '2px solid white',
            boxShadow: alertasCriticas > 0 
              ? '0 2px 8px rgba(220, 38, 38, 0.3)'
              : '0 2px 8px rgba(234, 88, 12, 0.3)',
            animation: alertasCriticas > 0 ? 'pulse 2s infinite' : 'none'
          }}>
            {alertasNoVistas}
          </div>
        )}
      </button>

    

      {/* Modal del sistema de alertas */}
      {showAlertas && (
        <AlertasSystemActualizado
          isOpen={showAlertas}
          onClose={handleCloseModal}
          sensorData={sensorData}
          filteredData={filteredData}
          alertasActivas={alertasActivas}
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

export default AlertasButtonCorregido;