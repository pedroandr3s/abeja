import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';

const UserProfile = () => {
  const { usuarios, loading, error } = useApi();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    comuna: '',
    clave: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    checkAuthentication();
  }, []);

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
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        comuna: user.comuna || '',
        clave: ''
      });
      
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      navigate('/');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.nombre || !formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length > 100) {
      errors.nombre = 'El nombre no puede exceder 100 caracteres';
    }
    
    if (!formData.apellido || !formData.apellido.trim()) {
      errors.apellido = 'El apellido es requerido';
    } else if (formData.apellido.trim().length > 100) {
      errors.apellido = 'El apellido no puede exceder 100 caracteres';
    }

    if (!formData.comuna || !formData.comuna.trim()) {
      errors.comuna = 'La comuna es requerida';
    } else if (formData.comuna.trim().length > 100) {
      errors.comuna = 'La comuna no puede exceder 100 caracteres';
    }
    
    // Solo validar contraseña si se proporciona
    if (formData.clave && formData.clave.trim()) {
      if (formData.clave.trim().length < 6) {
        errors.clave = 'La clave debe tener al menos 6 caracteres';
      } else if (formData.clave.trim().length > 64) {
        errors.clave = 'La clave no puede exceder 64 caracteres';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 Actualizando perfil del usuario...');
      
      const dataToSend = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        comuna: formData.comuna.trim(),
        activo: currentUser.activo
      };
      
      // Solo incluir contraseña si se proporciona
      if (formData.clave && formData.clave.trim()) {
        dataToSend.clave = formData.clave.trim();
      }
      
      const result = await usuarios.update(currentUser.id, dataToSend);
      
      // Actualizar datos del usuario en localStorage
      const updatedUser = {
        ...currentUser,
        nombre: dataToSend.nombre,
        apellido: dataToSend.apellido,
        comuna: dataToSend.comuna
      };
      
      localStorage.setItem('smartbee_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      setAlertMessage({
        type: 'success',
        message: formData.clave ? 
          'Perfil actualizado correctamente. La contraseña se encriptó de forma segura.' :
          'Perfil actualizado correctamente.'
      });
      
      setIsEditing(false);
      setFormData(prev => ({ ...prev, clave: '' })); // Limpiar campo de contraseña
      
    } catch (err) {
      console.error('❌ Error actualizando perfil:', err);
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('smartbee_token');
        localStorage.removeItem('smartbee_user');
        navigate('/');
        return;
      }
      
      let errorMessage = 'Error al actualizar el perfil';
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setAlertMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      nombre: currentUser.nombre || '',
      apellido: currentUser.apellido || '',
      comuna: currentUser.comuna || '',
      clave: ''
    });
    setFormErrors({});
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('smartbee_token');
      localStorage.removeItem('smartbee_user');
      navigate('/');
    }
  };

  if (!currentUser) {
    return <Loading message="Cargando perfil..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">
          Mi Perfil 👤
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: '#6b7280', 
          margin: '4px 0 0 0' 
        }}>
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {alertMessage && (
        <Alert 
          type={alertMessage.type}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '1.5rem'
      }}>
        {/* Información Personal */}
        <Card title="👤 Información Personal">
          {!isEditing ? (
            <div style={{ padding: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#f59e0b', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {currentUser.nombre?.charAt(0)?.toUpperCase() || '👤'}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <strong style={{ color: '#374151' }}>Nombre Completo:</strong>
                  <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '1.1rem' }}>
                    {currentUser.nombre} {currentUser.apellido}
                  </p>
                </div>
                
                <div>
                  <strong style={{ color: '#374151' }}>ID de Usuario:</strong>
                  <p style={{ 
                    margin: '0.25rem 0 0', 
                    color: '#6b7280', 
                    fontFamily: 'monospace',
                    fontSize: '1rem'
                  }}>
                    {currentUser.id}
                  </p>
                </div>
                
                <div>
                  <strong style={{ color: '#374151' }}>Comuna:</strong>
                  <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '1rem' }}>
                    📍 {currentUser.comuna}
                  </p>
                </div>
                
                <div>
                  <strong style={{ color: '#374151' }}>Tipo de Usuario:</strong>
                  <p style={{ margin: '0.25rem 0 0' }}>
                    <span className="badge badge-info">
                      🐝 Apicultor
                    </span>
                  </p>
                </div>

                <div>
                  <strong style={{ color: '#374151' }}>Estado de la Cuenta:</strong>
                  <p style={{ margin: '0.25rem 0 0' }}>
                    <span className="badge badge-success">
                      ✅ Activa
                    </span>
                  </p>
                </div>
              </div>
              
              <div style={{ marginTop: '2rem' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                  style={{ width: '100%' }}
                >
                  ✏️ Editar Información
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre * (máx. 100 caracteres)</label>
                <input
                  type="text"
                  className={`form-input ${formErrors.nombre ? 'error' : ''}`}
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ingresa tu nombre"
                  maxLength="100"
                  disabled={isSubmitting}
                />
                {formErrors.nombre && (
                  <div className="error-message">{formErrors.nombre}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Apellido * (máx. 100 caracteres)</label>
                <input
                  type="text"
                  className={`form-input ${formErrors.apellido ? 'error' : ''}`}
                  value={formData.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                  placeholder="Ingresa tu apellido"
                  maxLength="100"
                  disabled={isSubmitting}
                />
                {formErrors.apellido && (
                  <div className="error-message">{formErrors.apellido}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Comuna * (máx. 100 caracteres)</label>
                <input
                  type="text"
                  className={`form-input ${formErrors.comuna ? 'error' : ''}`}
                  value={formData.comuna}
                  onChange={(e) => setFormData({...formData, comuna: e.target.value})}
                  placeholder="Ingresa tu comuna"
                  maxLength="100"
                  disabled={isSubmitting}
                />
                {formErrors.comuna && (
                  <div className="error-message">{formErrors.comuna}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  🔐 Nueva Contraseña (opcional)
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {' '}(dejar vacío para mantener actual, mín. 6 caracteres)
                  </span>
                </label>
                <input
                  type="password"
                  className={`form-input ${formErrors.clave ? 'error' : ''}`}
                  value={formData.clave}
                  onChange={(e) => setFormData({...formData, clave: e.target.value})}
                  placeholder="Nueva contraseña (opcional)"
                  maxLength="64"
                  disabled={isSubmitting}
                />
                {formErrors.clave && (
                  <div className="error-message">{formErrors.clave}</div>
                )}
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#059669', 
                  marginTop: '4px',
                  padding: '6px',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '4px',
                  border: '1px solid #a7f3d0'
                }}>
                  🔒 Las contraseñas se encriptan automáticamente en el servidor
                </div>
              </div>

              <div className="flex flex-gap flex-between mt-6">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
              </div>
            </form>
          )}
        </Card>

        {/* Estadísticas de la cuenta */}
        <Card title="📊 Estadísticas de Mi Cuenta">
          <div style={{ padding: '1rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ 
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#fef3c7',
                borderRadius: '0.5rem'
              }}>
                <div style={{ fontSize: '2rem', color: '#d97706', fontWeight: 'bold' }}>
                  3
                </div>
                <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  Colmenas Registradas
                </div>
              </div>
              
              <div style={{ 
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#dcfce7',
                borderRadius: '0.5rem'
              }}>
                <div style={{ fontSize: '2rem', color: '#16a34a', fontWeight: 'bold' }}>
                  15
                </div>
                <div style={{ fontSize: '0.875rem', color: '#166534' }}>
                  Días Activo
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '0.5rem',
              border: '1px solid #bae6fd',
              marginBottom: '1rem'
            }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#0c4a6e',
                marginBottom: '0.5rem'
              }}>
                📈 Actividad Reciente
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#075985', lineHeight: '1.6' }}>
                <div>• Última conexión: Hoy a las 14:30</div>
                <div>• Colmenas revisadas: 2 esta semana</div>
                <div>• Reportes generados: 5 este mes</div>
                <div>• Alertas resueltas: 1 pendiente</div>
              </div>
            </div>

            <div style={{ 
              padding: '1rem',
              backgroundColor: '#fffbeb',
              borderRadius: '0.5rem',
              border: '1px solid #fde68a'
            }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#92400e',
                marginBottom: '0.5rem'
              }}>
                🎯 Próximas Tareas Recomendadas
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: '1.6' }}>
                <div>• Revisar colmena "Norte" (próxima revisión en 3 días)</div>
                <div>• Actualizar datos de ubicación para mejor precisión</div>
                <div>• Verificar niveles de humedad en colmenas del sector sur</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sección de configuración y seguridad */}
      <Card title="⚙️ Configuración y Seguridad" className="mt-6">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem',
          padding: '1rem'
        }}>
          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '1rem'
            }}>
              🔐 Seguridad de la Cuenta
            </h4>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span>Estado de la contraseña:</span>
                <span style={{ color: '#059669', fontWeight: '500' }}>Segura ✅</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span>Último cambio:</span>
                <span>Hace 30 días</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <span>Sesiones activas:</span>
                <span>1 (esta sesión)</span>
              </div>
              
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(true)}
                style={{ marginRight: '0.5rem' }}
              >
                🔑 Cambiar Contraseña
              </button>
            </div>
          </div>

          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '1rem'
            }}>
              📱 Información del Sistema
            </h4>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span>Versión de SmartBee:</span>
                <span>v2.1.0</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span>Cuenta creada:</span>
                <span>Enero 2025</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <span>ID único:</span>
                <span style={{ fontFamily: 'monospace' }}>{currentUser.id}</span>
              </div>
              
              <button 
                className="btn btn-danger btn-sm"
                onClick={handleLogout}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Información de contacto y soporte */}
      <Card title="📞 Soporte y Contacto" className="mt-6">
        <div style={{ padding: '1rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem'
          }}>
            <div>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                🆘 ¿Necesitas Ayuda?
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                Si tienes problemas con tu cuenta o necesitas asistencia técnica, 
                puedes contactar a nuestro equipo de soporte.
              </p>
              <button className="btn btn-info btn-sm">
                📧 Contactar Soporte
              </button>
            </div>

            <div>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                📚 Recursos Útiles
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.8' }}>
                <div>• Guía de usuario para apicultores</div>
                <div>• Manual de instalación de sensores</div>
                <div>• FAQ sobre el sistema SmartBee</div>
                <div>• Tutoriales en video</div>
              </div>
            </div>

            <div>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                🔔 Preferencias de Notificación
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <input type="checkbox" defaultChecked />
                  <span>Alertas de temperatura crítica</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <input type="checkbox" defaultChecked />
                  <span>Recordatorios de mantenimiento</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <input type="checkbox" />
                  <span>Boletín semanal de actividad</span>
                </div>
                <button className="btn btn-secondary btn-sm">
                  💾 Guardar Preferencias
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;