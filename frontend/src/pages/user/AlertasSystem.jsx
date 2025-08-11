
                import React, { useState, useEffect, useMemo } from 'react';

const AlertasSystem = ({ isOpen, onClose, sensorData, filteredData }) => {
  const [alertasActivas, setAlertasActivas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [historialAlertas, setHistorialAlertas] = useState([]);
  const [tabActiva, setTabActiva] = useState('activas');

  // Configuración de períodos estacionales
  const getPerioodoEstacional = () => {
    const mes = new Date().getMonth() + 1; // 1-12
    return {
      esInvernada: mes >= 3 && mes <= 7,
      esPrimaveraVerano: mes >= 8 || mes <= 2,
      esEnjarbrazon: (mes >= 8 && mes <= 12) || mes === 1, // Agosto-Enero
      esCosecha: mes >= 11 || mes <= 3 // Noviembre-Marzo
    };
  };

  // Evaluar todas las alertas basadas en las especificaciones
  const evaluarAlertas = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const alertas = [];
    const periodos = getPerioodoEstacional();
    const ultimaLectura = filteredData[filteredData.length - 1];
    const ahora = new Date();

    // Obtener datos de las últimas 24 y 48 horas para contadores
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const hace48h = new Date(ahora.getTime() - 48 * 60 * 60 * 1000);
    
    const datos24h = filteredData.filter(d => d.fecha >= hace24h);
    const datos48h = filteredData.filter(d => d.fecha >= hace48h);

    // ========== ALERTAS DE TEMPERATURA ==========

    // 1. Temperatura Alta Crítica (>38°C, 8 eventos en 24h)
    const eventosTemp38Plus = datos24h.filter(d => d.temperatura > 38).length;
    if (eventosTemp38Plus >= 8) {
      alertas.push({
        id: 'temp_critica_alta',
        tipo: 'temperatura',
        subtipo: 'critica_alta',
        prioridad: 'CRÍTICA',
        titulo: '🔥 TEMPERATURA CRÍTICA ALTA',
        mensaje: 'Riesgo de colapso de panales',
        valor: ultimaLectura.temperatura,
        unidad: '°C',
        condicion: '>38°C',
        eventos: eventosTemp38Plus,
        fecha: ultimaLectura.fecha,
        acciones: [
          'Alerta urgente: visitar apiario inmediatamente',
          'Retirar listón guarda piquera para mejorar ventilación',
          'Evaluar necesidad de colocar alza para descongestionar',
          'Proporcionar fuentes de hidratación adicionales',
          'Implementar sombreado (malla sombra NO negra o sombra natural)'
        ]
      });
    }

    // 2. Temperatura Alta Preventiva (36-37°C, 8 eventos en 48h)
    const eventosTemp36_37 = datos48h.filter(d => d.temperatura >= 36 && d.temperatura <= 37).length;
    if (eventosTemp36_37 >= 8 && eventosTemp38Plus < 8) {
      alertas.push({
        id: 'temp_alta_preventiva',
        tipo: 'temperatura',
        subtipo: 'alta_preventiva',
        prioridad: 'PREVENTIVA',
        titulo: '⚠️ TEMPERATURA ALTA',
        mensaje: 'Monitoreo preventivo requerido',
        valor: ultimaLectura.temperatura,
        unidad: '°C',
        condicion: '36-37°C',
        eventos: eventosTemp36_37,
        fecha: ultimaLectura.fecha,
        acciones: [
          'Revisar y ajustar guarda piquera',
          'Evaluar necesidad de alza adicional',
          'Revisar control de enjambrazón',
          'Proporcionar fuentes de hidratación',
          'Implementar sombreado preventivo'
        ]
      });
    }

    // 3. Temperatura Baja Crítica (Invernada: <12°C, 8 eventos en 48h)
    if (periodos.esInvernada) {
      const eventosTempBaja12 = datos48h.filter(d => d.temperatura < 12).length;
      if (eventosTempBaja12 >= 8) {
        alertas.push({
          id: 'temp_critica_baja_invernada',
          tipo: 'temperatura',
          subtipo: 'critica_baja',
          prioridad: 'CRÍTICA',
          titulo: '🧊 TEMPERATURA CRÍTICA BAJA',
          mensaje: 'Riesgo de supervivencia colonia (Período Invernada)',
          valor: ultimaLectura.temperatura,
          unidad: '°C',
          condicion: '<12°C',
          eventos: eventosTempBaja12,
          fecha: ultimaLectura.fecha,
          acciones: [
            'Revisar población (si <4 marcos con abejas → fusionar o cambiar a nuclero)',
            'Evaluar reservas de alimento (suplementar si es necesario)',
            'Reducir espacio de colmena (retirar alzas no utilizadas)',
            'Verificar posición relativa de abejas respecto al sensor'
          ]
        });
      }
    }

    // 4. Temperatura Baja Preventiva (Invernada: 13-15°C, 8 eventos en 48h)
    if (periodos.esInvernada) {
      const eventosTempBaja13_15 = datos48h.filter(d => d.temperatura >= 13 && d.temperatura <= 15).length;
      if (eventosTempBaja13_15 >= 8 && datos48h.filter(d => d.temperatura < 12).length < 8) {
        alertas.push({
          id: 'temp_baja_preventiva_invernada',
          tipo: 'temperatura',
          subtipo: 'baja_preventiva',
          prioridad: 'PREVENTIVA',
          titulo: '❄️ TEMPERATURA BAJA',
          mensaje: 'Monitoreo invernal preventivo',
          valor: ultimaLectura.temperatura,
          unidad: '°C',
          condicion: '13-15°C',
          eventos: eventosTempBaja13_15,
          fecha: ultimaLectura.fecha,
          acciones: [
            'Gestionar tamaño de colmena (retirar alzas innecesarias)',
            'Evaluar reservas de alimento',
            'Verificar posición de abejas respecto al sensor'
          ]
        });
      }
    }

    // ========== ALERTAS DE HUMEDAD ==========

    // 1. Humedad Alta Crítica (Invernada: >70%)
    if (periodos.esInvernada && ultimaLectura.humedad > 70) {
      alertas.push({
        id: 'humedad_critica_alta_invernada',
        tipo: 'humedad',
        subtipo: 'critica_alta',
        prioridad: 'CRÍTICA',
        titulo: '💧 HUMEDAD CRÍTICA ALTA',
        mensaje: 'Riesgo de hongos y enfermedades (Período Invernada)',
        valor: ultimaLectura.humedad,
        unidad: '%',
        condicion: '>70%',
        fecha: ultimaLectura.fecha,
        acciones: [
          'Verificar posición de abejas respecto al sensor',
          'Reducir espacio de colmena (retirar alzas no utilizadas)',
          'Revisar estado físico de la colmena (cambiar si está deteriorada)',
          'Evaluar población (si <4 marcos → fusionar o cambiar a nuclero)',
          'Revisar ubicación del apiario (cambiar si está en zona húmeda)'
        ]
      });
    }

    // 2. Humedad Alta Preventiva (Invernada: >60%)
    if (periodos.esInvernada && ultimaLectura.humedad > 60 && ultimaLectura.humedad <= 70) {
      alertas.push({
        id: 'humedad_alta_preventiva_invernada',
        tipo: 'humedad',
        subtipo: 'alta_preventiva',
        prioridad: 'PREVENTIVA',
        titulo: '💦 HUMEDAD ALTA',
        mensaje: 'Monitoreo preventivo invernal',
        valor: ultimaLectura.humedad,
        unidad: '%',
        condicion: '>60%',
        fecha: ultimaLectura.fecha,
        acciones: [
          'Gestionar tamaño de colmena',
          'Colocar cuña para drenaje hacia piquera'
        ]
      });
    }

    // 3. Humedad Baja Crítica (Primavera-Verano: <40%)
    if (periodos.esPrimaveraVerano && ultimaLectura.humedad < 40) {
      alertas.push({
        id: 'humedad_critica_baja_verano',
        tipo: 'humedad',
        subtipo: 'critica_baja',
        prioridad: 'CRÍTICA',
        titulo: '🏜️ HUMEDAD CRÍTICA BAJA',
        mensaje: 'Riesgo de deshidratación de cría (Primavera-Verano)',
        valor: ultimaLectura.humedad,
        unidad: '%',
        condicion: '<40%',
        fecha: ultimaLectura.fecha,
        acciones: [
          'URGENTE: Proporcionar fuentes de agua inmediatamente',
          'Evaluar ubicación del apiario (exceso de radiación solar)',
          'Implementar mecanismos de sombra'
        ]
      });
    }

    // 4. Humedad Baja Preventiva (Primavera-Verano: <50%)
    if (periodos.esPrimaveraVerano && ultimaLectura.humedad < 50 && ultimaLectura.humedad >= 40) {
      alertas.push({
        id: 'humedad_baja_preventiva_verano',
        tipo: 'humedad',
        subtipo: 'baja_preventiva',
        prioridad: 'PREVENTIVA',
        titulo: '🌵 HUMEDAD BAJA',
        mensaje: 'Monitoreo preventivo estacional',
        valor: ultimaLectura.humedad,
        unidad: '%',
        condicion: '<50%',
        fecha: ultimaLectura.fecha,
        acciones: [
          'Colocar recipientes con agua (con flotadores o piedras)',
          'Registrar para análisis de humedad interna vs externa'
        ]
      });
    }

    // ========== ALERTAS DE PESO ==========

    // 1. Alerta de Enjambre (Disminución 500g en 2 mediciones seguidas)
    if (periodos.esEnjarbrazon && filteredData.length >= 2) {
      const ultimasPesadas = filteredData.filter(d => d.peso !== null).slice(-2);
      if (ultimasPesadas.length === 2) {
        const diferencia = ultimasPesadas[0].peso - ultimasPesadas[1].peso;
        if (diferencia >= 500) {
          alertas.push({
            id: 'alerta_enjambre',
            tipo: 'peso',
            subtipo: 'enjambre',
            prioridad: 'ALTA',
            titulo: '🐝 ALERTA DE ENJAMBRE',
            mensaje: 'Pérdida de peso detectada',
            valor: ultimaLectura.peso / 1000,
            unidad: 'kg',
            condicion: 'Disminución >500g',
            diferencia: diferencia,
            fecha: ultimaLectura.fecha,
            acciones: [
              'Revisar colmenas cada 7-10 días eliminando celdas reales',
              'Colocar alzas en colmenas desarrolladas',
              'Realizar núcleos aprovechando celdas reales'
            ]
          });
        }
      }
    }

    // 2. Incremento de Peso - Cosecha
    if (periodos.esCosecha && filteredData.length >= 20) {
      const datosUltimos20Dias = filteredData.filter(d => d.peso !== null).slice(-20);
      if (datosUltimos20Dias.length >= 20) {
        const pesoInicial = datosUltimos20Dias[0].peso;
        const pesoFinal = datosUltimos20Dias[datosUltimos20Dias.length - 1].peso;
        const incremento = (pesoFinal - pesoInicial) / 1000; // convertir a kg
        
        if (incremento > 20) {
          alertas.push({
            id: 'oportunidad_cosecha',
            tipo: 'peso',
            subtipo: 'cosecha',
            prioridad: 'INFORMATIVA',
            titulo: '🍯 OPORTUNIDAD DE COSECHA',
            mensaje: 'Incremento significativo de peso',
            valor: ultimaLectura.peso / 1000,
            unidad: 'kg',
            condicion: `+${incremento.toFixed(1)}kg en 20 días`,
            incremento: incremento,
            fecha: ultimaLectura.fecha,
            acciones: [
              'Evaluar cosecha de miel',
              'Si no se puede cosechar → colocar alzas adicionales'
            ]
          });
        }
      }
    }

    // ========== ALERTAS COMBINADAS ==========

    // Evaluar datos internos vs externos si están disponibles
    const datosInternos = filteredData.filter(d => d.tipo === 'interno');
    const datosExternos = filteredData.filter(d => d.tipo === 'externo');
    
    if (datosInternos.length > 0 && datosExternos.length > 0) {
      const ultimoInterno = datosInternos[datosInternos.length - 1];
      const ultimoExterno = datosExternos[datosExternos.length - 1];
      
      // Verificar si las mediciones son del mismo período (últimas 6 horas)
      const hace6h = new Date(ahora.getTime() - 6 * 60 * 60 * 1000);
      
      if (ultimoInterno.fecha >= hace6h && ultimoExterno.fecha >= hace6h) {
        // Temperatura anormal
        const difTemp = Math.abs(ultimoInterno.temperatura - ultimoExterno.temperatura);
        if (difTemp <= 2) {
          alertas.push({
            id: 'temperatura_anormal',
            tipo: 'combinada',
            subtipo: 'temp_anormal',
            prioridad: 'CRÍTICA',
            titulo: '🚨 TEMPERATURA ANORMAL',
            mensaje: 'Posible mortandad o problema sanitario grave',
            valor: `${ultimoInterno.temperatura}°C ≈ ${ultimoExterno.temperatura}°C`,
            unidad: '',
            condicion: 'T°INTERNA ≈ T°EXTERNA',
            diferencia: difTemp,
            fecha: ultimaLectura.fecha,
            acciones: [
              'URGENTE: Visitar apiario inmediatamente',
              'Retirar material si hay colonias muertas (evitar pillaje)',
              'Cambiar a cajas menores si quedan abejas vivas',
              'Evaluar posición relativa de abejas respecto al sensor'
            ]
          });
        }

        // Humedad anormal
        const difHum = Math.abs(ultimoInterno.humedad - ultimoExterno.humedad);
        if (difHum <= 2) {
          alertas.push({
            id: 'humedad_anormal',
            tipo: 'combinada',
            subtipo: 'hum_anormal',
            prioridad: 'CRÍTICA',
            titulo: '🚨 HUMEDAD ANORMAL',
            mensaje: 'Posible mortandad o problema sanitario grave',
            valor: `${ultimoInterno.humedad}% ≈ ${ultimoExterno.humedad}%`,
            unidad: '',
            condicion: 'H°INTERNA ≈ H°EXTERNA',
            diferencia: difHum,
            fecha: ultimaLectura.fecha,
            acciones: [
              'URGENTE: Visitar apiario inmediatamente',
              'Retirar material si hay colonias muertas (evitar pillaje)',
              'Cambiar a cajas menores si quedan abejas vivas',
              'Evaluar posición relativa de abejas respecto al sensor'
            ]
          });
        }
      }
    }

    return alertas;
  }, [filteredData]);

  useEffect(() => {
    const nuevasAlertas = evaluarAlertas;
    setAlertasActivas(nuevasAlertas);
    
    // Agregar al historial solo alertas nuevas
    if (nuevasAlertas.length > 0) {
      setHistorialAlertas(prev => {
        const alertasNuevas = nuevasAlertas.filter(nueva => 
          !prev.some(existente => existente.id === nueva.id && 
            existente.fecha.getTime() === nueva.fecha.getTime())
        );
        return [...prev, ...alertasNuevas].slice(-100); // Mantener últimas 100
      });
    }
  }, [evaluarAlertas]);

  // Filtrar alertas según criterios seleccionados
  const alertasFiltradas = useMemo(() => {
    let alertas = tabActiva === 'activas' ? alertasActivas : historialAlertas;
    
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
  }, [alertasActivas, historialAlertas, filtroTipo, filtroPrioridad, tabActiva]);

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

          {/* Estadísticas rápidas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
            gap: isMobile ? '8px' : '12px',
            marginBottom: isMobile ? '16px' : '20px'
          }}>
            {[
              { label: 'Críticas', count: alertasActivas.filter(a => a.prioridad === 'CRÍTICA').length, color: '#dc2626' },
              { label: 'Altas', count: alertasActivas.filter(a => a.prioridad === 'ALTA').length, color: '#ea580c' },
              { label: 'Preventivas', count: alertasActivas.filter(a => a.prioridad === 'PREVENTIVA').length, color: '#f59e0b' },
              { label: 'Medias', count: alertasActivas.filter(a => a.prioridad === 'MEDIA').length, color: '#3b82f6' },
              { label: 'Informativas', count: alertasActivas.filter(a => a.prioridad === 'INFORMATIVA').length, color: '#10b981' }
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
                { key: 'activas', label: '🔴 Activas', count: alertasActivas.length },
                { key: 'historial', label: '📋 Historial', count: historialAlertas.length }
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
          {alertasFiltradas.length === 0 ? (
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
                          marginBottom: '4px'
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
                          {alerta.fecha.toLocaleString()}
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
                            {alerta.tipo === 'peso' ? `${alerta.diferencia}g` : `${alerta.diferencia.toFixed(1)}°`}
                          </div>
                        </div>
                      )}
                      {alerta.incremento && (
                        <div>
                          <strong style={{ color: colorConfig.text, fontSize: '0.8rem' }}>Incremento:</strong>
                          <div style={{ fontSize: '0.9rem', color: '#374151' }}>+{alerta.incremento.toFixed(1)}kg</div>
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
                        {alerta.acciones.map((accion, actionIndex) => (
                          <li key={actionIndex} style={{
                            fontSize: '0.85rem',
                            marginBottom: '4px',
                            lineHeight: '1.4'
                          }}>
                            {accion}
                          </li>
                        ))}
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
            <strong>Período Estacional Actual:</strong> {getPerioodoEstacional().esInvernada ? '❄️ Invernada (Marzo-Julio)' : '🌞 Primavera-Verano (Agosto-Febrero)'}
          </div>
          <div>
            Evaluación basada en {filteredData.length} registros de sensores | 
            Sistema actualizado: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertasSystem;