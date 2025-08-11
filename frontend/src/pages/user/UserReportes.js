import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';

const UserReportes = () => {
  const { colmenas, mensajes, reportes, loading, error } = useApi();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userColmenas, setUserColmenas] = useState([]);
  const [selectedColmena, setSelectedColmena] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('diario');
  const [selectedMetric, setSelectedMetric] = useState('temperatura');
  const [reportData, setReportData] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Datos simulados para los gráficos (basados en los mockups)
  const [simulatedData, setSimulatedData] = useState({
    temperatura: {
      diario: {
        interna: [14, 15, 17, 19, 21, 23, 25, 24, 22, 20, 18, 16, 15],
        externa: [16, 17, 16, 18, 20, 22, 24, 23, 21, 19, 17, 15, 14],
        labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
      },
      semanal: {
        interna_min: [10, 12, 11, 15, 20, 18, 20],
        interna_max: [28, 28, 25, 22, 28, 25, 23],
        externa_min: [14, 15, 14, 17, 17, 17, 20],
        externa_max: [28, 25, 26, 23, 22, 25, 24],
        labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
      },
      mensual: {
        interna_min: [10, 11, 15, 20, 19, 21, 20, 20, 21],
        interna_max: [28, 28, 25, 28, 26, 25, 25, 25, 21],
        externa_min: [14, 15, 17, 18, 18, 21, 20, 20, 21],
        externa_max: [28, 25, 26, 22, 25, 24, 24, 25, 24],
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Sept']
      }
    },
    humedad: {
      diario: {
        interna: [68, 66, 64, 66, 68, 66, 64, 66, 68, 64, 66, 64, 66],
        externa: [70, 68, 66, 68, 70, 68, 66, 68, 70, 66, 68, 66, 68],
        labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
      }
    },
    peso: {
      diario: {
        valores: [18, 19, 26, 24, 35, 35, 35],
        labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
      }
    }
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserColmenas();
    }
  }, [currentUser]);

  useEffect(() => {
    // Verificar si hay una colmena seleccionada desde el localStorage
    const savedColmena = localStorage.getItem('user_selected_colmena');
    if (savedColmena) {
      try {
        const colmena = JSON.parse(savedColmena);
        setSelectedColmena(colmena);
        localStorage.removeItem('user_selected_colmena');
      } catch (err) {
        console.warn('Error parsing saved colmena:', err);
      }
    }
  }, [userColmenas]);

  const checkAuthentication = () => {
    try {
      const userData = localStorage.getItem('smartbee_user');
      if (!userData) {
        navigate('/');
        return;
      }

      const user = JSON.parse(userData);
      
      if (user.rol === 'ADM') {
        navigate('/usuarios');
        return;
      }

      setCurrentUser(user);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      navigate('/');
    }
  };

  const loadUserColmenas = async () => {
    try {
      const colmenasData = await colmenas.getByDueno(currentUser.id);
      setUserColmenas(colmenasData || []);
      
      // Seleccionar la primera colmena por defecto si no hay ninguna seleccionada
      if (!selectedColmena && colmenasData && colmenasData.length > 0) {
        setSelectedColmena(colmenasData[0]);
      }
      
    } catch (err) {
      console.error('❌ Error cargando colmenas:', err);
      setAlertMessage({
        type: 'error',
        message: 'Error al cargar las colmenas'
      });
    }
  };

  const getCurrentData = () => {
    const data = simulatedData[selectedMetric];
    if (!data || !data[selectedPeriod]) return null;
    return data[selectedPeriod];
  };

  const renderChart = () => {
    const data = getCurrentData();
    if (!data) return null;

    const maxValue = Math.max(...Object.values(data).flat().filter(v => typeof v === 'number'));
    const minValue = Math.min(...Object.values(data).flat().filter(v => typeof v === 'number'));
    const range = maxValue - minValue || 1;

    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ 
          height: '300px', 
          position: 'relative',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem',
          backgroundColor: '#fafafa'
        }}>
          {/* Título del gráfico */}
          <div style={{ 
            textAlign: 'center',
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            {selectedMetric === 'temperatura' && 'Temperatura Interna vs Externa'}
            {selectedMetric === 'humedad' && 'Humedad Interna vs Externa'}
            {selectedMetric === 'peso' && 'Peso de la Colmena'}
          </div>

          {/* Simulación de gráfico */}
          <div style={{ 
            height: '200px',
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'space-around',
            paddingTop: '2rem'
          }}>
            {data.labels?.map((label, index) => {
              const isTemperatura = selectedMetric === 'temperatura';
              const isHumedad = selectedMetric === 'humedad';
              const isPeso = selectedMetric === 'peso';

              let height1 = 0, height2 = 0;
              let color1 = '#f59e0b', color2 = '#3b82f6';

              if (isTemperatura && selectedPeriod === 'diario') {
                height1 = ((data.interna[index] - minValue) / range) * 150;
                height2 = ((data.externa[index] - minValue) / range) * 150;
                color1 = '#ef4444'; // Rojo para temperatura interna
                color2 = '#f59e0b'; // Naranja para temperatura externa
              } else if (isTemperatura && (selectedPeriod === 'semanal' || selectedPeriod === 'mensual')) {
                height1 = ((data.interna_max[index] - minValue) / range) * 150;
                height2 = ((data.externa_max[index] - minValue) / range) * 150;
                color1 = '#ef4444';
                color2 = '#f59e0b';
              } else if (isHumedad) {
                height1 = ((data.interna[index] - minValue) / range) * 150;
                height2 = ((data.externa[index] - minValue) / range) * 150;
                color1 = '#3b82f6'; // Azul para humedad interna
                color2 = '#6366f1'; // Índigo para humedad externa
              } else if (isPeso) {
                height1 = ((data.valores[index] - minValue) / range) * 150;
                color1 = '#059669'; // Verde para peso
              }

              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '40px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'end',
                    gap: '2px',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      width: '8px',
                      height: `${Math.max(height1, 5)}px`,
                      backgroundColor: color1,
                      borderRadius: '2px 2px 0 0'
                    }} />
                    {!isPeso && (
                      <div style={{
                        width: '8px',
                        height: `${Math.max(height2, 5)}px`,
                        backgroundColor: color2,
                        borderRadius: '2px 2px 0 0'
                      }} />
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    transform: selectedPeriod === 'diario' ? 'rotate(-45deg)' : 'none',
                    transformOrigin: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '1rem',
            fontSize: '0.875rem'
          }}>
            {selectedMetric === 'temperatura' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
                  <span>Interna</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '2px' }} />
                  <span>Externa</span>
                </div>
              </>
            )}
            {selectedMetric === 'humedad' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
                  <span>Interna</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#6366f1', borderRadius: '2px' }} />
                  <span>Externa</span>
                </div>
              </>
            )}
            {selectedMetric === 'peso' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#059669', borderRadius: '2px' }} />
                <span>Peso Total</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentValues = () => {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '1rem',
        padding: '1rem'
      }}>
        {selectedMetric === 'temperatura' && (
          <>
            <div style={{ 
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              borderRadius: '0.5rem'
            }}>
              <div style={{ fontSize: '2rem', color: '#ef4444', fontWeight: 'bold' }}>
                35°C
              </div>
              <div style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
                Temp. Interna
              </div>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#fef3c7',
              borderRadius: '0.5rem'
            }}>
              <div style={{ fontSize: '2rem', color: '#f59e0b', fontWeight: 'bold' }}>
                38°C
              </div>
              <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                Temp. Externa
              </div>
            </div>
          </>
        )}
        
        {selectedMetric === 'humedad' && (
          <>
            <div style={{ 
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#eff6ff',
              borderRadius: '0.5rem'
            }}>
              <div style={{ fontSize: '2rem', color: '#3b82f6', fontWeight: 'bold' }}>
                72%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                Humedad Interna
              </div>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '0.5rem'
            }}>
              <div style={{ fontSize: '2rem', color: '#6366f1', fontWeight: 'bold' }}>
                80%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#4338ca' }}>
                Humedad Externa
              </div>
            </div>
          </>
        )}
        
        {selectedMetric === 'peso' && (
          <>
            <div style={{ 
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#ecfdf5',
              borderRadius: '0.5rem'
            }}>
              <div style={{ fontSize: '2rem', color: '#059669', fontWeight: 'bold' }}>
                28.5 kg
              </div>
              <div style={{ fontSize: '0.875rem', color: '#065f46' }}>
                Peso Actual
              </div>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '0.5rem'
            }}>
              <div style={{ fontSize: '2rem', color: '#16a34a', fontWeight: 'bold' }}>
                +1.0 kg
              </div>
              <div style={{ fontSize: '0.875rem', color: '#166534' }}>
                Variación
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (!currentUser) {
    return <Loading message="Verificando autenticación..." />;
  }

  if (userColmenas.length === 0) {
    return (
      <div>
        <h1 className="page-title mb-6">Reportes y Gráficos 📊</h1>
        <Card title="🏠 Sin Colmenas">
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>
              No tienes colmenas para generar reportes
            </h3>
            <p style={{ marginBottom: '1.5rem' }}>
              Primero necesitas agregar colmenas para poder ver sus reportes y gráficos.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/user/colmenas')}
            >
              🏠 Ir a Mis Colmenas
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title" style={{ margin: 0 }}>
          Reportes y Gráficos 📊
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: '#6b7280', 
          margin: '4px 0 0 0' 
        }}>
          Analiza los datos de tus colmenas en diferentes períodos de tiempo
        </p>
      </div>

      {alertMessage && (
        <Alert 
          type={alertMessage.type}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Controles de selección */}
      <Card title="🎛️ Configuración del Reporte" className="mb-6">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          padding: '1rem'
        }}>
          {/* Selector de colmena */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              🏠 Seleccionar Colmena
            </label>
            <select
              className="form-select"
              value={selectedColmena?.id || ''}
              onChange={(e) => {
                const colmena = userColmenas.find(c => c.id === e.target.value);
                setSelectedColmena(colmena);
              }}
            >
              {userColmenas.map((colmena) => (
                <option key={colmena.id} value={colmena.id}>
                  {colmena.descripcion || `Colmena ${colmena.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de métrica */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              📈 Métrica a Visualizar
            </label>
            <select
              className="form-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="temperatura">🌡️ Temperatura</option>
              <option value="humedad">💧 Humedad</option>
              <option value="peso">⚖️ Peso</option>
            </select>
          </div>

          {/* Selector de período */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              📅 Período de Tiempo
            </label>
            <select
              className="form-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="diario">📅 Diario (último día)</option>
              <option value="semanal">📅 Semanal (última semana)</option>
              <option value="mensual">📅 Mensual (últimos meses)</option>
              <option value="anual">📅 Anual (último año)</option>
            </select>
          </div>
        </div>

        {/* Información de la colmena seleccionada */}
        {selectedColmena && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            borderRadius: '0.5rem',
            border: '1px solid #bae6fd'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>🏠</div>
              <div>
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#0c4a6e', 
                  margin: 0 
                }}>
                  {selectedColmena.descripcion || `Colmena ${selectedColmena.id}`}
                </h4>
                <div style={{ fontSize: '0.875rem', color: '#075985', marginTop: '0.25rem' }}>
                  ID: {selectedColmena.id} • 
                  Coordenadas: {selectedColmena.latitud?.toFixed(6)}, {selectedColmena.longitud?.toFixed(6)} • 
                  Propietario: {currentUser.nombre} {currentUser.apellido}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Valores actuales */}
      <Card title={`📊 Valores Actuales - ${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`} className="mb-6">
        {renderCurrentValues()}
      </Card>

      {/* Gráfico principal */}
      <Card title={`📈 Gráfico ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} - ${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`} className="mb-6">
        {renderChart()}
      </Card>

      {/* Análisis y recomendaciones */}
      <Card title="🔍 Análisis y Recomendaciones" className="mb-6">
        <div style={{ padding: '1rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem'
          }}>
            {/* Análisis automático */}
            <div>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '1rem'
              }}>
                📈 Análisis Automático
              </h4>
              
              {selectedMetric === 'temperatura' && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                  <div style={{ 
                    padding: '0.75rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <strong style={{ color: '#166534' }}>✅ Estado: Óptimo</strong>
                    <div style={{ color: '#065f46', marginTop: '0.25rem' }}>
                      La temperatura interna se mantiene en el rango ideal (32-36°C)
                    </div>
                  </div>
                  <div>• Temperatura promedio: 35°C</div>
                  <div>• Variación diaria: ±3°C (normal)</div>
                  <div>• Picos máximos durante 14:00-16:00</div>
                  <div>• Estabilidad térmica: Excelente</div>
                </div>
              )}

              {selectedMetric === 'humedad' && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                  <div style={{ 
                    padding: '0.75rem',
                    backgroundColor: '#fffbeb',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    border: '1px solid #fde68a'
                  }}>
                    <strong style={{ color: '#92400e' }}>⚠️ Estado: Atención</strong>
                    <div style={{ color: '#92400e', marginTop: '0.25rem' }}>
                      Humedad ligeramente alta, monitorear ventilación
                    </div>
                  </div>
                  <div>• Humedad promedio: 72%</div>
                  <div>• Rango recomendado: 50-70%</div>
                  <div>• Tendencia: Estable</div>
                  <div>• Riesgo de condensación: Medio</div>
                </div>
              )}

              {selectedMetric === 'peso' && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                  <div style={{ 
                    padding: '0.75rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <strong style={{ color: '#166534' }}>✅ Estado: Crecimiento</strong>
                    <div style={{ color: '#065f46', marginTop: '0.25rem' }}>
                      Incremento de peso positivo, colmena productiva
                    </div>
                  </div>
                  <div>• Peso actual: 28.5 kg</div>
                  <div>• Incremento semanal: +1.0 kg</div>
                  <div>• Variación diaria: Normal</div>
                  <div>• Proyección mensual: +4 kg</div>
                </div>
              )}
            </div>

            {/* Recomendaciones */}
            <div>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '1rem'
              }}>
                💡 Recomendaciones
              </h4>
              
              {selectedMetric === 'temperatura' && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                  <div>🔵 <strong>Mantener:</strong> La temperatura está en rango óptimo</div>
                  <div>🟡 <strong>Monitorear:</strong> Cambios bruscos durante el día</div>
                  <div>🟢 <strong>Verificar:</strong> Aislamiento durante noches frías</div>
                  <div>📋 <strong>Próxima revisión:</strong> En 7 días</div>
                </div>
              )}

              {selectedMetric === 'humedad' && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                  <div>🔴 <strong>Mejorar:</strong> Ventilación de la colmena</div>
                  <div>🟡 <strong>Revisar:</strong> Entrada de agua externa</div>
                  <div>🟢 <strong>Considerar:</strong> Reducir humedad ambiente</div>
                  <div>📋 <strong>Acción:</strong> Revisar en 3 días</div>
                </div>
              )}

              {selectedMetric === 'peso' && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                  <div>🟢 <strong>Excelente:</strong> Crecimiento sostenido</div>
                  <div>📈 <strong>Continuar:</strong> Manejo actual</div>
                  <div>🍯 <strong>Preparar:</strong> Cosecha en 2-3 semanas</div>
                  <div>📋 <strong>Próxima acción:</strong> Revisar alzas</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Resumen del período */}
      <Card title="📋 Resumen del Período" className="mb-6">
        <div style={{ padding: '1rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem'
          }}>
            <div style={{ 
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <h5 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                📊 Estadísticas Generales
              </h5>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.5' }}>
                <div>• Período: {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}</div>
                <div>• Lecturas procesadas: 144</div>
                <div>• Datos válidos: 99.3%</div>
                <div>• Última actualización: Hace 5 min</div>
              </div>
            </div>

            <div style={{ 
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <h5 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                🎯 Rangos Óptimos
              </h5>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.5' }}>
                {selectedMetric === 'temperatura' && (
                  <>
                    <div>• Temperatura interna: 32-36°C</div>
                    <div>• Diferencial máx: 4°C</div>
                    <div>• Variación diaria: &lt;3°C</div>
                  </>
                )}
                {selectedMetric === 'humedad' && (
                  <>
                    <div>• Humedad interna: 50-70%</div>
                    <div>• Diferencial máx: 15%</div>
                    <div>• Ventilación: Crítica &gt;75%</div>
                  </>
                )}
                {selectedMetric === 'peso' && (
                  <>
                    <div>• Incremento semanal: +0.5-2kg</div>
                    <div>• Peso mínimo: 15kg</div>
                    <div>• Peso cosecha: &gt;25kg</div>
                  </>
                )}
              </div>
            </div>

            <div style={{ 
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <h5 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                🔔 Alertas Configuradas
              </h5>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.5' }}>
                <div>• Temperatura &gt; 40°C: SMS</div>
                <div>• Humedad &gt; 80%: Email</div>
                <div>• Pérdida peso &gt; 2kg: Urgente</div>
                <div>• Sin datos &gt; 6h: Notificación</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Acciones rápidas */}
      <Card title="⚡ Acciones Rápidas">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          padding: '1rem'
        }}>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/user/colmenas')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            🏠 Ver Mis Colmenas
          </button>
          
          <button 
            className="btn btn-info"
            onClick={() => {
              const reportText = `Reporte de ${selectedColmena?.descripcion || 'Colmena'}\n` +
                `Período: ${selectedPeriod}\n` +
                `Métrica: ${selectedMetric}\n` +
                `Fecha: ${new Date().toLocaleDateString('es-CL')}`;
              
              navigator.clipboard.writeText(reportText).then(() => {
                setAlertMessage({
                  type: 'success',
                  message: 'Reporte copiado al portapapeles'
                });
              });
            }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            📋 Copiar Reporte
          </button>
          
          <button 
            className="btn btn-success"
            onClick={() => {
              setAlertMessage({
                type: 'info',
                message: 'Función de exportación disponible próximamente'
              });
            }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            📊 Exportar Excel
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/user/perfil')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            ⚙️ Configurar Alertas
          </button>
        </div>
      </Card>
    </div>
  );
};

export default UserReportes;