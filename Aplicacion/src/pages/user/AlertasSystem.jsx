// =====================================================
// ALERTAS SYSTEM CORREGIDO - MODAL PANTALLA COMPLETA
// Archivo: frontend/components/AlertasSystemActualizado.js
// =====================================================

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useApi } from '../../context/ApiContext';

const AlertasSystemActualizado = ({ isOpen, onClose, sensorData, filteredData }) => {
  const { alertas, usuarios, colmenas, loading, error } = useApi();
  const [alertasActivas, setAlertasActivas] = useState([]);
  const [alertasDefinidas, setAlertasDefinidas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [colmenasUsuario, setColmenasUsuario] = useState([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const [alertaExpandida, setAlertaExpandida] = useState(null);
  const [sugerenciasCache, setSugerenciasCache] = useState({});

  // Referencias para control estricto de carga
  const isLoadingRef = useRef(false);
  const alertasDefinadasCargadas = useRef(false);
  const colmenasCarradas = useRef(false);
  const alertasEvaluadasRef = useRef(false);
  const mountedRef = useRef(true);
  const currentUserIdRef = useRef(null);

  const usuarioActual = usuarios.getCurrentUser();

  // Limpiar referencias al desmontar
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, []);

  // Reset cuando cambia el usuario
  useEffect(() => {
    if (usuarioActual?.id !== currentUserIdRef.current) {
      console.log('👤 Usuario cambió, reseteando cache de alertas system');
      alertasDefinadasCargadas.current = false;
      colmenasCarradas.current = false;
      alertasEvaluadasRef.current = false;
      currentUserIdRef.current = usuarioActual?.id;
      
      // Limpiar estados
      setAlertasDefinidas([]);
      setColmenasUsuario([]);
      setAlertasActivas([]);
    }
  }, [usuarioActual?.id]);

  // Reset al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      isLoadingRef.current = false;
      setLoadingAlertas(false);
    }
  }, [isOpen]);

  // Cargar alertas definidas - SOLO UNA VEZ
  const cargarAlertasDefinidas = useCallback(async () => {
    if (alertasDefinadasCargadas.current || isLoadingRef.current) {
      console.log('📋 Alertas definidas ya cargadas o cargando, omitiendo...');
      return;
    }

    try {
      isLoadingRef.current = true;
      console.log('📋 Cargando alertas definidas...');
      
      const response = await alertas.getAll();
      
      if (mountedRef.current && response.success) {
        setAlertasDefinidas(response.data || []);
        alertasDefinadasCargadas.current = true;
        console.log(`✅ ${response.data?.length || 0} alertas definidas cargadas`);
      }
    } catch (error) {
      console.error('❌ Error cargando alertas definidas:', error);
      if (mountedRef.current) {
        setAlertasDefinidas([]);
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, [alertas]);

  // Cargar colmenas del usuario - SOLO UNA VEZ POR USUARIO
  const cargarColmenasUsuario = useCallback(async () => {
    if (!usuarioActual || colmenasCarradas.current || isLoadingRef.current) {
      console.log('🏠 Colmenas ya cargadas o cargando, omitiendo...');
      return;
    }

    try {
      isLoadingRef.current = true;
      console.log('🏠 Cargando colmenas del usuario...');
      
      const colmenasResponse = await colmenas.getByDueno(usuarioActual.id);
      
      if (mountedRef.current) {
        const colmenasData = colmenasResponse.data || [];
        setColmenasUsuario(colmenasData);
        colmenasCarradas.current = true;
        console.log(`✅ ${colmenasData.length} colmenas cargadas para ${usuarioActual.id}`);
      }
    } catch (error) {
      console.error('❌ Error cargando colmenas:', error);
      if (mountedRef.current) {
        setColmenasUsuario([]);
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, [usuarioActual, colmenas]);

  // Evaluar alertas del usuario - SOLO UNA VEZ POR SESIÓN
  const evaluarAlertasUsuario = useCallback(async () => {
    if (!usuarioActual || alertasEvaluadasRef.current || isLoadingRef.current) {
      console.log('🔍 Alertas ya evaluadas o evaluando, omitiendo...');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoadingAlertas(true);
      console.log('🔍 Evaluando alertas del usuario...');
      
      const alertasResponse = await alertas.evaluarParaUsuario(usuarioActual.id, 168);
      
      if (mountedRef.current && alertasResponse.success) {
        const { alertas_por_colmena } = alertasResponse.data;
        
        // Procesar alertas activas
        const todasLasAlertas = [];
        alertas_por_colmena.forEach(({ colmena, alertas: alertasColmena }) => {
          const alertasConColmena = alertasColmena.map(alerta => ({
            ...alerta,
            colmena_nombre: colmena.nombre || `Colmena #${colmena.id}`,
            colmena_id: colmena.id,
            es_tiempo_real: true,
            fecha: new Date(alerta.fecha)
          }));
          todasLasAlertas.push(...alertasConColmena);
        });

        setAlertasActivas(todasLasAlertas);
        alertasEvaluadasRef.current = true;
        console.log(`✅ ${todasLasAlertas.length} alertas evaluadas`);
      }
    } catch (error) {
      console.error('❌ Error evaluando alertas:', error);
      if (mountedRef.current) {
        setAlertasActivas([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingAlertas(false);
      }
      isLoadingRef.current = false;
    }
  }, [usuarioActual, alertas]);

  // Cargar datos cuando se abre el modal - SECUENCIAL para evitar sobrecargas
  useEffect(() => {
    if (isOpen && usuarioActual && mountedRef.current) {
      console.log('🚀 Modal abierto, iniciando carga secuencial...');
      
      const cargarDatosSecuencial = async () => {
        try {
          // 1. Cargar alertas definidas
          await cargarAlertasDefinidas();
          
          // 2. Cargar colmenas del usuario
          if (mountedRef.current) {
            await cargarColmenasUsuario();
          }
          
          // 3. Evaluar alertas del usuario
          if (mountedRef.current) {
            await evaluarAlertasUsuario();
          }
          
          console.log('✅ Carga secuencial completada');
        } catch (error) {
          console.error('❌ Error en carga secuencial:', error);
        }
      };

      cargarDatosSecuencial();
    }
  }, [isOpen, usuarioActual?.id, cargarAlertasDefinidas, cargarColmenasUsuario, evaluarAlertasUsuario]);

  // Función para obtener sugerencias (con cache)
  const obtenerSugerencias = useCallback(async (alertaId) => {
    if (sugerenciasCache[alertaId]) {
      return sugerenciasCache[alertaId];
    }

    try {
      const response = await alertas.getSugerencias(alertaId);
      
      if (response.success) {
        const sugerencias = response.data.sugerencias || [];
        setSugerenciasCache(prev => ({
          ...prev,
          [alertaId]: sugerencias
        }));
        return sugerencias;
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
    }
    
    return [];
  }, [alertas, sugerenciasCache]);

  // Mapear alertas con nueva estructura
  const mapearAlertaActualizada = useCallback((alertaDB) => {
    const getPrioridadPorId = (id) => {
      const prioridadesMap = {
        'TI-TAC': 'CRÍTICA',
        'TI-TAP': 'PREVENTIVA',
        'TI-TBC-PI': 'CRÍTICA',
        'TE-TA': 'ALTA',
        'TE-TB': 'ALTA',
        'HI-HAC-PI': 'CRÍTICA',
        'HI-HAP-PI': 'PREVENTIVA',
        'HI-HBC-PV': 'CRÍTICA',
        'HI-HBP-PV': 'PREVENTIVA',
        'PE-E': 'ALTA',
        'PE-CPA': 'INFORMATIVA',
        'PE-DP-PI': 'ALTA',
        'TIE-TAC': 'CRÍTICA',
        'HIE-HAC': 'CRÍTICA'
      };
      return prioridadesMap[id] || 'MEDIA';
    };

    const getTipoPorIndicador = (indicador) => {
      if (indicador?.toLowerCase().includes('temperatura')) {
        return 'temperatura';
      } else if (indicador?.toLowerCase().includes('humedad')) {
        return 'humedad';
      } else if (indicador?.toLowerCase().includes('peso')) {
        return 'peso';
      } else if (indicador?.toLowerCase().includes('interna') && 
                 indicador?.toLowerCase().includes('externa')) {
        return 'combinada';
      }
      return 'general';
    };

    const prioridad = getPrioridadPorId(alertaDB.id);
    const tipo = getTipoPorIndicador(alertaDB.indicador);

    const getEmojiBySeverity = (prioridad) => {
      const emojiMap = {
        'CRÍTICA': '🚨',
        'ALTA': '⚠️', 
        'PREVENTIVA': '💡',
        'MEDIA': 'ℹ️',
        'INFORMATIVA': '✅'
      };
      return emojiMap[prioridad] || 'ℹ️';
    };

    return {
      id: alertaDB.id,
      tipo: tipo,
      prioridad: prioridad,
      titulo: `${getEmojiBySeverity(prioridad)} ${alertaDB.nombre}`,
      mensaje: alertaDB.descripcion,
      valor: alertaDB.valor || 'N/A',
      unidad: tipo === 'temperatura' ? '°C' : tipo === 'humedad' ? '%' : tipo === 'peso' ? 'kg' : '',
      condicion: alertaDB.descripcion,
      eventos: alertaDB.eventos || null,
      fecha: alertaDB.fecha || new Date(),
      colmena_nombre: alertaDB.colmena_nombre || `Colmena #${alertaDB.colmena_id}`,
      diferencia: alertaDB.diferencia,
      incremento: alertaDB.incremento,
      nodo_id: alertaDB.nodo_id,
      sugerencia_raw: alertaDB.sugerencia
    };
  }, []);

  // Convertir alertas activas a formato UI
  const alertasParaUI = useMemo(() => {
    return alertasActivas.map(alerta => mapearAlertaActualizada(alerta));
  }, [alertasActivas, mapearAlertaActualizada]);

  // Filtrar alertas según criterios seleccionados
  const alertasFiltradas = useMemo(() => {
    let alertas = alertasParaUI;
    
    if (filtroTipo !== 'todos') {
      alertas = alertas.filter(alerta => alerta.tipo === filtroTipo);
    }
    
    if (filtroPrioridad !== 'todos') {
      alertas = alertas.filter(alerta => alerta.prioridad === filtroPrioridad);
    }
    
    return alertas.sort((a, b) => {
      const prioridades = { 'CRÍTICA': 5, 'ALTA': 4, 'PREVENTIVA': 3, 'MEDIA': 2, 'INFORMATIVA': 1 };
      const diffPrioridad = prioridades[b.prioridad] - prioridades[a.prioridad];
      if (diffPrioridad !== 0) return diffPrioridad;
      return b.fecha.getTime() - a.fecha.getTime();
    });
  }, [alertasParaUI, filtroTipo, filtroPrioridad]);

  // Configuración de colores por prioridad
  const getColorConfig = useCallback((prioridad) => {
    const configs = {
      'CRÍTICA': {
        bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        border: '#dc2626',
        text: '#991b1b',
        icon: '🚨'
      },
      'ALTA': {
        bg: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
        border: '#ea580c',
        text: '#c2410c',
        icon: '⚠️'
      },
      'PREVENTIVA': {
        bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '#f59e0b',
        text: '#d97706',
        icon: '💡'
      },
      'MEDIA': {
        bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '#3b82f6',
        text: '#1d4ed8',
        icon: 'ℹ️'
      },
      'INFORMATIVA': {
        bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        border: '#10b981',
        text: '#047857',
        icon: '✅'
      }
    };
    return configs[prioridad] || configs['MEDIA'];
  }, []);

  // Función para expandir/contraer alerta
  const toggleAlertaExpansion = useCallback(async (alertaId) => {
    if (alertaExpandida === alertaId) {
      setAlertaExpandida(null);
    } else {
      setAlertaExpandida(alertaId);
      if (!sugerenciasCache[alertaId]) {
        await obtenerSugerencias(alertaId);
      }
    }
  }, [alertaExpandida, sugerenciasCache, obtenerSugerencias]);

  // Procesar sugerencias desde texto crudo
  const procesarSugerencias = useCallback((sugerenciaTexto) => {
    if (!sugerenciaTexto) return [];
    
    const sugerencias = sugerenciaTexto
      .split(/\d+\./)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());
      
    return sugerencias;
  }, []);

  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 10000, // Z-index extremadamente alto
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : isTablet ? '16px' : '24px',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: isMobile ? '0' : '20px',
        width: '100%',
        maxWidth: isMobile ? '100%' : isTablet ? '95%' : '1200px',
        maxHeight: isMobile ? '100vh' : '90vh',
        minHeight: isMobile ? '100vh' : 'auto',
        overflow: 'hidden',
        boxShadow: '0 25px 75px rgba(0, 0, 0, 0.25)',
        border: isMobile ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Header del Modal */}
        <div style={{
          padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '16px',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : '0'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1.2'
            }}>
              Sistema de Alertas SmartBee
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '10px 14px' : '12px 16px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                alignSelf: isMobile ? 'flex-end' : 'auto'
              }}
            >
              ✕ Cerrar
            </button>
          </div>

          {/* Información del usuario */}
          {usuarioActual && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.9rem',
              color: '#4c1d95'
            }}>
              <strong>Usuario:</strong> {usuarioActual.nombre} {usuarioActual.apellido} | 
              <strong> Colmenas:</strong> {colmenasUsuario.length}
              {loadingAlertas && <span> | Evaluando alertas...</span>}
            </div>
          )}

          {/* Estadísticas rápidas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
            gap: isMobile ? '8px' : '12px',
            marginBottom: isMobile ? '16px' : '20px'
          }}>
            {[
              { label: 'Críticas', count: alertasParaUI.filter(a => a.prioridad === 'CRÍTICA').length, color: '#dc2626' },
              { label: 'Altas', count: alertasParaUI.filter(a => a.prioridad === 'ALTA').length, color: '#ea580c' },
              { label: 'Preventivas', count: alertasParaUI.filter(a => a.prioridad === 'PREVENTIVA').length, color: '#f59e0b' },
              { label: 'Medias', count: alertasParaUI.filter(a => a.prioridad === 'MEDIA').length, color: '#3b82f6' },
              { label: 'Informativas', count: alertasParaUI.filter(a => a.prioridad === 'INFORMATIVA').length, color: '#10b981' }
            ].map((stat, index) => (
              <div key={index} style={{
                background: 'white',
                padding: isMobile ? '10px' : '12px',
                borderRadius: isMobile ? '10px' : '12px',
                textAlign: 'center',
                border: `2px solid ${stat.color}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  color: stat.color,
                  margin: '0 0 4px 0'
                }}>
                  {stat.count}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  color: '#6b7280',
                  fontWeight: '600'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '8px' : '12px',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{
                padding: isMobile ? '10px 12px' : '8px 12px',
                border: '2px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '500',
                background: 'white',
                color: '#4b5563',
                cursor: 'pointer',
                flex: isMobile ? '1' : 'auto'
              }}
            >
              <option value="todos">Todos los tipos</option>
              <option value="temperatura">Temperatura</option>
              <option value="humedad">Humedad</option>
              <option value="peso">Peso</option>
              <option value="combinada">Combinadas</option>
            </select>

            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              style={{
                padding: isMobile ? '10px 12px' : '8px 12px',
                border: '2px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '500',
                background: 'white',
                color: '#4b5563',
                cursor: 'pointer',
                flex: isMobile ? '1' : 'auto'
              }}
            >
              <option value="todos">Todas las prioridades</option>
              <option value="CRÍTICA">Críticas</option>
              <option value="ALTA">Altas</option>
              <option value="PREVENTIVA">Preventivas</option>
              <option value="MEDIA">Medias</option>
              <option value="INFORMATIVA">Informativas</option>
            </select>
          </div>
        </div>

        {/* Contenido de Alertas - CON SCROLL INDEPENDIENTE */}
        <div style={{
          padding: isMobile ? '16px' : '24px',
          flex: '1',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {loadingAlertas ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '16px',
              border: '2px dashed #0ea5e9'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#0c4a6e',
                margin: '0 0 8px 0'
              }}>
                Evaluando alertas...
              </h3>
              <p style={{
                color: '#075985',
                margin: 0,
                fontSize: '1rem'
              }}>
                Analizando datos de {colmenasUsuario.length} colmenas
              </p>
            </div>
          ) : alertasFiltradas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '16px',
              border: '2px dashed #0ea5e9'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#0c4a6e',
                margin: '0 0 8px 0'
              }}>
                No hay alertas activas
              </h3>
              <p style={{
                color: '#075985',
                margin: 0,
                fontSize: '1rem'
              }}>
                Todas las condiciones están dentro de los rangos normales
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {alertasFiltradas.map((alerta, index) => {
                const colorConfig = getColorConfig(alerta.prioridad);
                const isExpanded = alertaExpandida === alerta.id;
                const sugerenciasArray = procesarSugerencias(alerta.sugerencia_raw);
                
                return (
                  <div key={`${alerta.id}-${index}`} style={{
                    background: colorConfig.bg,
                    border: `2px solid ${colorConfig.border}`,
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                  }}>
                    {/* Header de la alerta */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ fontSize: '1.5rem' }}>{colorConfig.icon}</span>
                          <h4 style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: colorConfig.text
                          }}>
                            {alerta.titulo}
                          </h4>
                          <span style={{
                            background: colorConfig.border,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            {alerta.prioridad}
                          </span>
                          {alerta.colmena_nombre && (
                            <span style={{
                              background: '#6366f1',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}>
                              {alerta.colmena_nombre}
                            </span>
                          )}
                        </div>
                        <p style={{
                          margin: '0 0 8px 0',
                          color: colorConfig.text,
                          fontSize: '0.95rem',
                          fontWeight: '500'
                        }}>
                          {alerta.mensaje}
                        </p>
                      </div>
                      
                      <div style={{
                        textAlign: 'right',
                        flex: '0 0 auto'
                      }}>
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: '800',
                          color: colorConfig.text,
                          marginBottom: '2px'
                        }}>
                          {alerta.valor}{alerta.unidad}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#6b7280'
                        }}>
                          {alerta.fecha?.toLocaleString ? alerta.fecha.toLocaleString() : 'Fecha no disponible'}
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      marginBottom: '16px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '12px'
                    }}>
                      <div>
                        <strong style={{ color: colorConfig.text, fontSize: '0.8rem' }}>Condición:</strong>
                        <div style={{ fontSize: '0.9rem', color: '#374151' }}>{alerta.condicion}</div>
                      </div>
                      {alerta.eventos && (
                        <div>
                          <strong style={{ color: colorConfig.text, fontSize: '0.8rem' }}>Eventos:</strong>
                          <div style={{ fontSize: '0.9rem', color: '#374151' }}>{alerta.eventos} detectados</div>
                        </div>
                      )}
                    </div>

                    {/* Botón para expandir sugerencias */}
                    <button
                      onClick={() => toggleAlertaExpansion(alerta.id)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: `linear-gradient(135deg, ${colorConfig.border} 0%, ${colorConfig.text} 100%)`,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginBottom: isExpanded ? '16px' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {isExpanded ? '▼' : '▶'} Ver Acciones Recomendadas
                    </button>

                    {/* Sugerencias expandidas */}
                    {isExpanded && sugerenciasArray.length > 0 && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '16px',
                        borderRadius: '12px',
                        border: `1px solid ${colorConfig.border}`
                      }}>
                        <h5 style={{
                          margin: '0 0 12px 0',
                          fontSize: '1rem',
                          fontWeight: '700',
                          color: colorConfig.text,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          💡 Acciones Recomendadas:
                        </h5>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          {sugerenciasArray.map((sugerencia, sugIndex) => (
                            <div key={sugIndex} style={{
                              background: 'white',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px'
                              }}>
                                <div style={{
                                  background: colorConfig.border,
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  flexShrink: 0
                                }}>
                                  {sugIndex + 1}
                                </div>
                                <div style={{
                                  fontSize: '0.85rem',
                                  lineHeight: '1.4',
                                  color: '#374151'
                                }}>
                                  {sugerencia}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderTop: '1px solid rgba(226, 232, 240, 0.8)',
          fontSize: '0.8rem',
          color: '#6b7280',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Período Estacional:</strong> {(() => {
              const mes = new Date().getMonth() + 1;
              const esInvernada = mes >= 3 && mes <= 7;
              return esInvernada ? 'Invernada (Marzo-Julio)' : 'Primavera-Verano (Agosto-Febrero)';
            })()} | 
            <strong> Sistema:</strong> {new Date().toLocaleString()}
          </div>
          {error && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: '#fee2e2',
              borderRadius: '4px',
              color: '#dc2626',
              fontSize: '0.8rem'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertasSystemActualizado;