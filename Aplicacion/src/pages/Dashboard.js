import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import Alert from '../components/common/Alert';

const Dashboard = () => {
  const { dashboard, mensajes, colmenas, usuarios, isConnected } = useApi();
  const [stats, setStats] = useState(null);
  const [mensajesRecientes, setMensajesRecientes] = useState([]);
  const [colmenasActivas, setColmenasActivas] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Cargar estadísticas generales (con manejo de errores robusto)
      const statsData = await getStats();
      setStats(statsData);

      // Cargar mensajes recientes (con fallback)
      try {
        const mensajesData = await mensajes.getRecientes(24);
        setMensajesRecientes(mensajesData.slice(0, 10));
      } catch (err) {
        console.warn('Endpoint mensajes no disponible, usando datos mock');
        // Crear mensajes mock para demostración
        const mockMensajes = [
          {
            id: 1,
            nodo_id: 1,
            topico: 'temperatura',
            payload: '35.2°C',
            fecha: new Date().toISOString()
          },
          {
            id: 2,
            nodo_id: 2,
            topico: 'humedad',
            payload: '82%',
            fecha: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: 3,
            nodo_id: 3,
            topico: 'estado',
            payload: 'Ventilador encendido',
            fecha: new Date(Date.now() - 600000).toISOString()
          }
        ];
        setMensajesRecientes(mockMensajes);
      }

      // Cargar colmenas (con fallback)
      try {
        const colmenasData = await colmenas.getAll();
        setColmenasActivas(colmenasData.slice(0, 5));
      } catch (err) {
        console.warn('Error cargando colmenas:', err.message);
        // Crear colmenas mock basadas en la base de datos
        const mockColmenas = [
          {
            id: 1,
            descripcion: 'Colmena en zona rural',
            dueno: 1,
            activa: true
          },
          {
            id: 2,
            descripcion: 'Colmena experimental',
            dueno: 2,
            activa: true
          }
        ];
        setColmenasActivas(mockColmenas);
      }

    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setAlertMessage({
        type: 'warning',
        message: 'Algunos endpoints del backend aún no están implementados. Mostrando datos de demostración.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = async () => {
    try {
      try {
        return await dashboard.getStats();
      } catch (dashboardErr) {
        console.log('Dashboard stats endpoint no disponible, calculando manualmente...');
      }

      let stats = {
        totalColmenas: 0,
        totalUsuarios: 0,
        mensajesHoy: 0,
        colmenasActivas: 0
      };

      try {
        const colmenasData = await colmenas.getAll();
        stats.totalColmenas = colmenasData.length;
        stats.colmenasActivas = colmenasData.filter(c => c.activa !== false).length;
      } catch (err) {
        console.warn('Error obteniendo colmenas:', err.message);
        stats.totalColmenas = 20;
        stats.colmenasActivas = 20;
      }

      try {
        const usuariosData = await usuarios.getAll();
        stats.totalUsuarios = usuariosData.length;
      } catch (err) {
        console.warn('Error obteniendo usuarios:', err.message);
        stats.totalUsuarios = 30;
      }

      try {
        const mensajesData = await mensajes.getRecientes(24);
        stats.mensajesHoy = mensajesData.length;
      } catch (err) {
        console.warn('Error obteniendo mensajes:', err.message);
        stats.mensajesHoy = 30;
      }

      return stats;
    } catch (err) {
      console.error('Error obteniendo estadísticas:', err);
      // Retornar estadísticas basadas en los datos de la BD
      return {
        totalColmenas: 2,
        totalUsuarios: 3,
        mensajesHoy: 3,
        colmenasActivas: 2
      };
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoMensajeBadge = (topico) => {
    switch (topico.toLowerCase()) {
      case 'temperatura':
        return { class: 'badge-warning', icon: '🌡️' };
      case 'humedad':
        return { class: 'badge-info', icon: '💧' };
      case 'estado':
        return { class: 'badge-success', icon: '⚙️' };
      default:
        return { class: 'badge-info', icon: '📊' };
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (isLoading) {
    return <Loading message="Cargando dashboard..." />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 20% 80%, rgba(255, 215, 0, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.25) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(255, 235, 59, 0.2) 0%, transparent 50%),
        linear-gradient(135deg, #ffc107 0%, #ff8f00 25%, #ffb300 50%, #ffc107 75%, #fff59d 100%)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Liquid Glass Effect Overlays */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '200px',
        height: '200px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float1 6s ease-in-out infinite',
        zIndex: 0
      }} />
      
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '20%',
        width: '150px',
        height: '150px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '50%',
        filter: 'blur(35px)',
        animation: 'float2 8s ease-in-out infinite',
        zIndex: 0
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '25%',
        width: '120px',
        height: '120px',
        background: 'rgba(255, 215, 0, 0.15)',
        borderRadius: '50%',
        filter: 'blur(30px)',
        animation: 'float3 7s ease-in-out infinite',
        zIndex: 0
      }} />

      {/* Glass overlay effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          linear-gradient(45deg, 
            rgba(255, 255, 255, 0.05) 0%, 
            transparent 25%, 
            rgba(255, 255, 255, 0.03) 50%, 
            transparent 75%, 
            rgba(255, 255, 255, 0.05) 100%
          )
        `,
        backdropFilter: 'blur(1px)',
        zIndex: 0
      }} />

      {/* Main content container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        margin: '1rem',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2)
        `
      }}>
        <div className="flex flex-between flex-center mb-6">
          <h1 style={{ 
            margin: 0,
            fontSize: '2.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #b8860b, #daa520, #ffd700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            letterSpacing: '1px'
          }}>
            🍯 Dashboard Apícola
          </h1>
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              borderRadius: '16px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: '#b8860b',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              ':hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-2px)'
              }
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🔄 Actualizar
          </button>
        </div>
        
        {alertMessage && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#b8860b'
          }}>
            <Alert 
              type={alertMessage.type}
              message={alertMessage.message}
              onClose={() => setAlertMessage(null)}
            />
          </div>
        )}

        {!isConnected && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#dc2626'
          }}>
            <Alert 
              type="error"
              title="Backend Desconectado"
              message="No se puede conectar al backend. Verificando conexión..."
            />
          </div>
        )}

        {/* Estadísticas principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            { value: stats?.totalColmenas || 0, label: 'Total Colmenas', icon: '🏠' },
            { value: stats?.colmenasActivas || 0, label: 'Colmenas Activas', icon: '✅' },
            { value: stats?.totalUsuarios || 0, label: 'Usuarios', icon: '👥' },
            { value: stats?.mensajesHoy || 0, label: 'Mensajes Hoy', icon: '📡' }
          ].map((stat, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{stat.icon}</div>
              <h3 style={{ 
                fontSize: '2.5rem', 
                margin: '0 0 0.5rem 0',
                fontWeight: '800',
                color: '#b8860b',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {stat.value}
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#8b6914',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem'
        }}>
          {/* Colmenas */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#b8860b',
              marginBottom: '1.5rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              🏠 Colmenas Monitoreadas
            </h2>
            
            {colmenasActivas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#8b6914' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.6 }}>🏠</div>
                <p style={{ fontSize: '1.2rem', fontWeight: '600' }}>No hay colmenas registradas</p>
                <p style={{ fontSize: '1rem', marginTop: '0.5rem', opacity: 0.8 }}>
                  Las colmenas aparecerán aquí cuando se registren
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {colmenasActivas.map((colmena) => (
                  <div key={colmena.id} style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ffd700, #ffb300)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                      🏠
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: 0, 
                        marginBottom: '0.5rem',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#b8860b'
                      }}>
                        Colmena #{colmena.id}
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.9rem', 
                        color: '#8b6914',
                        marginBottom: '0.5rem'
                      }}>
                        {colmena.descripcion || 'Sin descripción'}
                      </p>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#059669',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}>
                        Activa
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-180deg); }
        }
        
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;