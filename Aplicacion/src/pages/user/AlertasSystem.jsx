import React, { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../context/ApiContext'; // Ajusta la ruta según tu estructura

const AlertasSystem = ({ isOpen, onClose, sensorData, filteredData }) => {
  const { alertas, usuarios, colmenas, loading, error } = useApi();
  const [alertasActivas, setAlertasActivas] = useState([]);
  const [alertasDefinidas, setAlertasDefinidas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [historialAlertas, setHistorialAlertas] = useState([]);
  const [tabActiva, setTabActiva] = useState('activas');
  const [colmenasUsuario, setColmenasUsuario] = useState([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);

  // Obtener información del usuario actual
  const usuarioActual = usuarios.getCurrentUser();

  // Cargar alertas definidas al montar el componente
  useEffect(() => {
    const cargarAlertasDefinidas = async () => {
      try {
        const response = await alertas.getAll();
        setAlertasDefinidas(response.data || []);
      } catch (error) {
        console.error('Error cargando alertas definidas:', error);
      }
    };

    if (isOpen) {
      cargarAlertasDefinidas();
    }
  }, [isOpen, alertas]);

  // Cargar colmenas del usuario y evaluar alertas
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!usuarioActual || !isOpen) return;

      setLoadingAlertas(true);
      try {
        // Obtener colmenas del usuario
        const colmenasResponse = await colmenas.getByDueno(usuarioActual.id);
        const colmenasData = colmenasResponse.data || [];
        setColmenasUsuario(colmenasData);

        // Evaluar alertas para todas las colmenas del usuario usando el método optimizado
        const alertasResponse = await alertas.evaluarParaUsuario(168); // Últimas 7 días
        
        if (alertasResponse.success) {
          const { alertas_usuario, alertas_por_colmena } = alertasResponse.data;
          
          // Procesar alertas activas de evaluación en tiempo real
          const todasLasAlertas = [];
          alertas_por_colmena.forEach(({ colmena, alertas: alertasColmena }) => {
            const alertasConColmena = alertasColmena.map(alerta => ({
              ...alerta,
              colmena_nombre: colmena.nombre || `Colmena #${colmena.id}`,
              colmena_id: colmena.id,
              es_tiempo_real: true
            }));
            todasLasAlertas.push(...alertasConColmena);
          });

          // Convertir fechas en alertas activas
          const alertasActivasConFecha = todasLasAlertas.map(alerta => ({
            ...alerta,
            fecha: new Date(alerta.fecha)
          }));

          setAlertasActivas(alertasActivasConFecha);

          // Procesar historial desde nodo_alerta
          const historialConFormato = alertas_usuario.map(alertaHistorial => ({
            id: alertaHistorial.alerta_id,
            nombre: alertaHistorial.nombre,
            descripcion: alertaHistorial.descripcion,
            indicador: alertaHistorial.indicador,
            fecha: new Date(alertaHistorial.fecha),
            colmena_nombre: alertaHistorial.colmena_nombre,
            colmena_id: alertaHistorial.colmena_id,
            nodo_id: alertaHistorial.nodo_id,
            nodo_nombre: alertaHistorial.nodo_nombre,
            tipo_nodo: alertaHistorial.tipo_nodo,
            es_historial: true,
            prioridad: 'MEDIA' // El historial no tiene prioridad específica
          }));

          setHistorialAlertas(historialConFormato);
        }

      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
      } finally {
        setLoadingAlertas(false);
      }
    };

    cargarDatosUsuario();
  }, [usuarioActual, isOpen, alertas, colmenas]);

  // Mapeo de alertas de base de datos a la UI
  const mapearAlertaDB = (alertaDB) => {
    const alertaDefinida = alertasDefinidas.find(def => def.id === alertaDB.id);
    
    // Mapeo de prioridades
    const prioridadMap = {
      'CRÍTICA': 'CRÍTICA',
      'ALTA': 'ALTA', 
      'PREVENTIVA': 'PREVENTIVA',
      'MEDIA': 'MEDIA',
      'INFORMATIVA': 'INFORMATIVA'
    };

    // Mapeo de tipos basado en el indicador
    let tipo = 'general';
    if (alertaDefinida?.indicador?.toLowerCase().includes('temperatura')) {
      tipo = 'temperatura';
    } else if (alertaDefinida?.indicador?.toLowerCase().includes('humedad')) {
      tipo = 'humedad';
    } else if (alertaDefinida?.indicador?.toLowerCase().includes('peso')) {
      tipo = 'peso';
    } else if (alertaDefinida?.indicador?.toLowerCase().includes('externa') && 
               alertaDefinida?.indicador?.toLowerCase().includes('interna')) {
      tipo = 'combinada';
    }

    // Generar acciones basadas en el tipo de alerta
    const generarAcciones = (alertaId, tipo) => {
      const accionesMap = {
        'ALERT001': [
          'Alerta urgente: visitar apiario inmediatamente',
          'Retirar listón guarda piquera para mejorar ventilación', 
          'Evaluar necesidad de colocar alza para descongestionar',
          'Proporcionar fuentes de hidratación adicionales',
          'Implementar sombreado (malla sombra NO negra o sombra natural)'
        ],
        'ALERT002': [
          'Revisar y ajustar guarda piquera',
          'Evaluar necesidad de alza adicional',
          'Revisar control de enjambrazón',
          'Proporcionar fuentes de hidratación',
          'Implementar sombreado preventivo'
        ],
        'ALERT003': [
          'Revisar población (si <4 marcos con abejas → fusionar o cambiar a nuclero)',
          'Evaluar reservas de alimento (suplementar si es necesario)',
          'Reducir espacio de colmena (retirar alzas no utilizadas)',
          'Verificar posición relativa de abejas respecto al sensor'
        ],
        'ALERT004': [
          'Gestionar tamaño de colmena (retirar alzas innecesarias)',
          'Evaluar reservas de alimento',
          'Verificar posición de abejas respecto al sensor'
        ],
        'ALERT005': [
          'Revisar y ajustar guarda piquera externa',
          'Evaluar ubicación del apiario (exceso de radiación)',
          'Implementar sombreado natural'
        ],
        'ALERT006': [
          'Monitorear condiciones climáticas externas',
          'Verificar protección de la colmena',
          'Evaluar microubicación del apiario'
        ],
        'ALERT007': [
          'Verificar posición de abejas respecto al sensor',
          'Reducir espacio de colmena (retirar alzas no utilizadas)',
          'Revisar estado físico de la colmena (cambiar si está deteriorada)',
          'Evaluar población (si <4 marcos → fusionar o cambiar a nuclero)',
          'Revisar ubicación del apiario (cambiar si está en zona húmeda)'
        ],
        'ALERT008': [
          'Gestionar tamaño de colmena',
          'Colocar cuña para drenaje hacia piquera'
        ],
        'ALERT009': [
          'URGENTE: Proporcionar fuentes de agua inmediatamente',
          'Evaluar ubicación del apiario (exceso de radiación solar)',
          'Implementar mecanismos de sombra'
        ],
        'ALERT010': [
          'Colocar recipientes con agua (con flotadores o piedras)',
          'Registrar para análisis de humedad interna vs externa'
        ],
        'ALERT011': [
          'Revisar colmenas cada 7-10 días eliminando celdas reales',
          'Colocar alzas en colmenas desarrolladas',
          'Realizar núcleos aprovechando celdas reales'
        ],
        'ALERT012': [
          'Evaluar cosecha de miel',
          'Si no se puede cosechar → colocar alzas adicionales'
        ],
        'ALERT013': [
          'Evaluar suplementación alimentaria',
          'Revisar reservas naturales de la colmena',
          'Considerar fusión con otra colmena si la pérdida es crítica'
        ],
        'ALERT014': [
          'Investigar causa de pérdida abrupta de peso',
          'Revisar integridad física de la colmena',
          'Evaluar posible robo o pillaje'
        ],
        'ALERT015': [
          'URGENTE: Visitar apiario inmediatamente',
          'Retirar material si hay colonias muertas (evitar pillaje)',
          'Cambiar a cajas menores si quedan abejas vivas',
          'Evaluar posición relativa de abejas respecto al sensor'
        ],
        'ALERT016': [
          'URGENTE: Visitar apiario inmediatamente',
          'Retirar material si hay colonias muertas (evitar pillaje)',
          'Cambiar a cajas menores si quedan abejas vivas',
          'Evaluar posición relativa de abejas respecto al sensor'
        ]
      };

      return accionesMap[alertaId] || [
        'Revisar condiciones de la colmena',
        'Consultar con especialista si persiste',
        'Monitorear evolución en próximas mediciones'
      ];
    };

    return {
      id: alertaDB.id,
      tipo: tipo,
      subtipo: alertaDB.id.toLowerCase(),
      prioridad: prioridadMap[alertaDB.prioridad] || 'MEDIA',
      titulo: `${getEmojiBySeverity(alertaDB.prioridad)} ${alertaDB.nombre}`,
      mensaje: alertaDB.descripcion || alertaDefinida?.descripcion || 'Condición detectada',
      valor: alertaDB.valor || 'N/A',
      unidad: tipo === 'temperatura' ? '°C' : tipo === 'humedad' ? '%' : tipo === 'peso' ? 'kg' : '',
      condicion: alertaDefinida?.descripcion || 'Revisar condición',
      eventos: alertaDB.eventos || null,
      fecha: alertaDB.fecha || new Date(),
      acciones: generarAcciones(alertaDB.id, tipo),
      colmena_nombre: alertaDB.colmena_nombre || `Colmena #${alertaDB.colmena_id}`,
      diferencia: alertaDB.diferencia,
      incremento: alertaDB.incremento,
      nodo_id: alertaDB.nodo_id
    };
  };

  // Helper para obtener emoji según severidad
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

  // Convertir alertas de DB a formato de UI
  const alertasParaUI = useMemo(() => {
    return alertasActivas.map(alerta => {
      // Si es una alerta de tiempo real (recién evaluada)
      if (alerta.es_tiempo_real) {
        return mapearAlertaDB(alerta);
      }
      
      // Si es una alerta del historial de nodo_alerta
      const alertaDefinida = alertasDefinidas.find(def => def.id === alerta.id);
      return {
        ...mapearAlertaDB({
          id: alerta.id,
          nombre: alerta.nombre || alertaDefinida?.nombre || 'Alerta',
          descripcion: alerta.descripcion || alertaDefinida?.descripcion,
          prioridad: alerta.prioridad || 'MEDIA',
          valor: alerta.valor || 'N/A',
          fecha: alerta.fecha,
          colmena_nombre: alerta.colmena_nombre,
          colmena_id: alerta.colmena_id,
          nodo_id: alerta.nodo_id
        }),
        es_historial: alerta.es_historial
      };
    });
  }, [alertasActivas, alertasDefinidas]);

  const historialParaUI = useMemo(() => {
    return historialAlertas.map(alertaHistorial => {
      const alertaDefinida = alertasDefinidas.find(def => def.id === alertaHistorial.id);
      
      return {
        ...mapearAlertaDB({
          id: alertaHistorial.id,
          nombre: alertaHistorial.nombre || alertaDefinida?.nombre || 'Alerta',
          descripcion: alertaHistorial.descripcion || alertaDefinida?.descripcion,
          prioridad: alertaHistorial.prioridad || 'MEDIA',
          valor: 'Ver detalles',
          fecha: alertaHistorial.fecha,
          colmena_nombre: alertaHistorial.colmena_nombre,
          colmena_id: alertaHistorial.colmena_id,
          nodo_id: alertaHistorial.nodo_id
        }),
        nodo_nombre: alertaHistorial.nodo_nombre,
        tipo_nodo: alertaHistorial.tipo_nodo,
        es_historial: true
      };
    });
  }, [historialAlertas, alertasDefinidas]);

  // Filtrar alertas según criterios seleccionados
  const alertasFiltradas = useMemo(() => {
    let alertas = tabActiva === 'activas' ? alertasParaUI : historialParaUI;
    
    if (filtroTipo !== 'todos') {
      alertas = alertas.filter(alerta => alerta.tipo === filtroTipo);
    }
    
    if (filtroPrioridad !== 'todos') {
      alertas = alertas.filter(alerta => alerta.prioridad === filtroPrioridad);
    }
    
    return alertas.sort((a, b) => {
      // Ordenar por prioridad y luego por fecha
      const prioridades = { 'CRÍTICA': 5, 'ALTA': 4, 'PREVENTIVA': 3, 'MEDIA': 2, 'INFORMATIVA': 1 };
      const diffPrioridad = prioridades[b.prioridad] - prioridades[a.prioridad];
      if (diffPrioridad !== 0) return diffPrioridad;
      return b.fecha.getTime() - a.fecha.getTime();
    });
  }, [alertasParaUI, historialParaUI, filtroTipo, filtroPrioridad, tabActiva]);

  // Configuración de colores por prioridad
  const getColorConfig = (prioridad) => {
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
  };

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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '8px' : isTablet ? '16px' : '24px',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: isMobile ? '12px' : '20px',
        width: '100%',
        maxWidth: isMobile ? '100%' : isTablet ? '95%' : '1200px',
        maxHeight: isMobile ? '100vh' : '90vh',
        minHeight: isMobile ? '100vh' : 'auto',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        margin: isMobile ? '0' : 'auto',
        display: 'flex',
        flexDirection: 'column'
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
              🚨 Sistema de Alertas SmartBee
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

          {/* Información del usuario y colmenas */}
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
              <strong> Colmenas monitoreadas:</strong> {colmenasUsuario.length}
              {loadingAlertas && <span> | ⏳ Evaluando alertas...</span>}
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
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                gridColumn: isMobile && index >= 3 ? (index === 3 ? 'span 1' : 'span 1') : 'span 1'
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

          {/* Tabs y Filtros */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: isMobile ? 'center' : 'flex-start',
              flexWrap: 'wrap'
            }}>
              {[
                { key: 'activas', label: '🔴 Activas', count: alertasParaUI.length },
                { key: 'historial', label: '📋 Historial', count: historialParaUI.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTabActiva(tab.key)}
                  style={{
                    padding: isMobile ? '8px 14px' : '10px 16px',
                    background: tabActiva === tab.key 
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    color: tabActiva === tab.key ? 'white' : '#4b5563',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: tabActiva === tab.key 
                      ? '0 4px 14px rgba(99, 102, 241, 0.4)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    flex: isMobile ? '1' : 'auto'
                  }}
                >
                  {isMobile ? tab.label.split(' ')[1] : tab.label} ({tab.count})
                </button>
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
                <option value="todos">📊 Todos los tipos</option>
                <option value="temperatura">🌡️ Temperatura</option>
                <option value="humedad">💧 Humedad</option>
                <option value="peso">⚖️ Peso</option>
                <option value="combinada">🔗 Combinadas</option>
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
                <option value="todos">🎯 Todas las prioridades</option>
                <option value="CRÍTICA">🚨 Críticas</option>
                <option value="ALTA">⚠️ Altas</option>
                <option value="PREVENTIVA">💡 Preventivas</option>
                <option value="MEDIA">ℹ️ Medias</option>
                <option value="INFORMATIVA">✅ Informativas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contenido de Alertas */}
        <div style={{
          padding: '24px',
          maxHeight: '60vh',
          overflowY: 'auto'
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
                {tabActiva === 'activas' ? 'No hay alertas activas' : 'Sin historial de alertas'}
              </h3>
              <p style={{
                color: '#075985',
                margin: 0,
                fontSize: '1rem'
              }}>
                {tabActiva === 'activas' 
                  ? 'Todas las condiciones están dentro de los rangos normales'
                  : 'Aún no se han registrado alertas en el sistema'
                }
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
                              🏠 {alerta.colmena_nombre}
                            </span>
                          )}
                          {alerta.nodo_nombre && alerta.es_historial && (
                            <span style={{
                              background: '#10b981',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}>
                              📡 {alerta.nodo_nombre}
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
                      {alerta.diferencia !== undefined && (
                        <div>
                          <strong style={{ color: colorConfig.text, fontSize: '0.8rem' }}>Diferencia:</strong>
                          <div style={{ fontSize: '0.9rem', color: '#374151' }}>
                            {alerta.tipo === 'peso' ? `${alerta.diferencia}g` : `${Number(alerta.diferencia).toFixed(1)}°`}
                          </div>
                        </div>
                      )}
                      {alerta.incremento && (
                        <div>
                          <strong style={{ color: colorConfig.text, fontSize: '0.8rem' }}>Incremento:</strong>
                          <div style={{ fontSize: '0.9rem', color: '#374151' }}>+{Number(alerta.incremento).toFixed(1)}kg</div>
                        </div>
                      )}
                    </div>

                    {/* Acciones recomendadas */}
                    <div>
                      <h5 style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: colorConfig.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        🎯 Acciones Recomendadas:
                      </h5>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        color: '#374151'
                      }}>
                        {alerta.acciones?.map((accion, actionIndex) => (
                          <li key={actionIndex} style={{
                            fontSize: '0.85rem',
                            marginBottom: '4px',
                            lineHeight: '1.4'
                          }}>
                            {accion}
                          </li>
                        )) || (
                          <li style={{
                            fontSize: '0.85rem',
                            marginBottom: '4px',
                            lineHeight: '1.4'
                          }}>
                            Revisar condiciones y contactar especialista si es necesario
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con información del período */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderTop: '1px solid rgba(226, 232, 240, 0.8)',
          fontSize: '0.8rem',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Período Estacional Actual:</strong> {(() => {
              const mes = new Date().getMonth() + 1;
              const esInvernada = mes >= 3 && mes <= 7;
              return esInvernada ? '❄️ Invernada (Marzo-Julio)' : '🌞 Primavera-Verano (Agosto-Febrero)';
            })()}
          </div>
          <div>
            Evaluación basada en {alertasDefinidas.length} tipos de alertas | 
            Colmenas monitoreadas: {colmenasUsuario.length} | 
            Sistema actualizado: {new Date().toLocaleString()}
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
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertasSystem;