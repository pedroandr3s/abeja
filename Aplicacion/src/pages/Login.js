import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import './login.css';

// Configuración de roles - debe coincidir con App.js
const ROLE_CONFIG = {
  ADM: {
    name: 'Administrador',
    defaultRoute: '/dashboard',
    description: 'Gestión completa del sistema',
    features: ['Gestión de usuarios', 'Todas las colmenas', 'Reportes globales', 'Configuración del sistema']
  },
  API: {
    name: 'Apicultor',
    defaultRoute: '/user-dashboard',
    description: 'Gestión de colmenas propias',
    features: ['Mis colmenas', 'Dashboard personal', 'Reportes de mis colmenas', 'Gestión de perfil'] // ✅ AGREGAR ESTA LÍNEA
  }
};

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [loginStep, setLoginStep] = useState('credentials'); // 'credentials', 'role-info', 'redirecting'
  const [userInfo, setUserInfo] = useState(null);
  
  // Usar el ApiContext de forma segura
  let apiContext = null;
  try {
    apiContext = useApi();
  } catch (error) {
    console.warn('ApiContext no disponible en Login:', error.message);
  }

  const { usuarios, isConnected, loading } = apiContext || {};

  // Verificar conexión al cargar el componente
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        
        // Intentar conectar directamente si no hay ApiContext
        const baseUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8080' 
          : 'https://backend-production-20f9.up.railway.app/api';
          
        const response = await fetch(`${baseUrl}/api/health`);
        
        if (response.ok) {
          setConnectionStatus('connected');
          console.log('✅ Conexión al servidor establecida');
        } else {
          setConnectionStatus('disconnected');
          console.log('❌ Servidor responde pero con error');
        }
      } catch (error) {
        setConnectionStatus('disconnected');
        console.error('❌ Error de conexión:', error);
      }
    };

    // Si tenemos ApiContext, usar su estado de conexión
    if (apiContext && typeof isConnected !== 'undefined') {
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } else {
      // Si no, verificar conexión manualmente
      checkConnection();
    }
  }, [apiContext, isConnected]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (connectionStatus !== 'connected') {
      setError('No hay conexión con el servidor. Verifique su conexión.');
      return;
    }
    
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.password.trim()) {
      setError('Nombre, apellido y contraseña son requeridos');
      return;
    }

    setIsLogging(true);
    setError('');

    try {
      console.log('🔐 Intentando login con nombre y apellido...');
      
      let result;
      
      // Preparar los datos de login
      const loginData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        password: formData.password
      };
      
      // Intentar usar ApiContext primero
      if (usuarios && usuarios.login) {
        console.log('📡 Usando ApiContext para login');
        result = await usuarios.login(loginData);
      } else {
        // Fallback: petición directa
        console.log('📡 Usando fetch directo para login');
        const baseUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8080' 
          : 'https://backend-production-20f9.up.railway.app/api';
          
        const response = await fetch(`${baseUrl}/api/usuarios/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        result = await response.json();
      }

      // Manejar respuesta exitosa
      if (result.data && result.data.usuario) {
        const usuario = result.data.usuario;
        const roleConfig = ROLE_CONFIG[usuario.rol];
        
        console.log('✅ Login exitoso:', usuario);
        console.log('🎭 Rol detectado:', usuario.rol, '-', roleConfig?.name || 'Desconocido');
        
        // Verificar que el rol sea válido
        if (!roleConfig) {
          throw new Error(`Rol no válido: ${usuario.rol}. Contacte al administrador.`);
        }
        
        // Guardar tokens
        localStorage.setItem('smartbee_token', result.data.token);
        localStorage.setItem('smartbee_user', JSON.stringify(usuario));
        
        // Mostrar información del rol antes de redirigir
        setUserInfo({ usuario, roleConfig });
        setLoginStep('role-info');
        
        // Auto-redirigir después de 3 segundos o cuando el usuario haga clic
        setTimeout(() => {
          finalizeLogin(usuario, roleConfig);
        }, 3000);
        
      } else {
        throw new Error(result.error || 'Error al iniciar sesión');
      }
      
    } catch (error) {
      console.error('💥 Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Credenciales incorrectas. Verifique su nombre, apellido y contraseña.';
            break;
          case 404:
            errorMessage = 'Servicio de login no disponible. Contacte al administrador.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intente más tarde.';
            break;
          default:
            errorMessage = error.response.data?.error || 'Error del servidor';
        }
      } else if (error.message.includes('401')) {
        errorMessage = 'Credenciales incorrectas. Verifique su nombre, apellido y contraseña.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Servicio de login no disponible. Contacte al administrador.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Error interno del servidor. Intente más tarde.';
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Verifique su conexión a internet.';
      } else if (error.message.includes('Rol no válido')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoginStep('credentials');
    } finally {
      setIsLogging(false);
    }
  };

  const finalizeLogin = (usuario, roleConfig) => {
    setLoginStep('redirecting');
    
    // Llamar al callback de login exitoso
    onLoginSuccess(usuario);
    
    // Redirigir a la ruta por defecto del rol
    setTimeout(() => {
      navigate(roleConfig.defaultRoute);
    }, 100);
  };

  const handleContinue = () => {
    if (userInfo) {
      finalizeLogin(userInfo.usuario, userInfo.roleConfig);
    }
  };

  const handleForgotPassword = () => {
    alert('Contacte al administrador para restablecer su contraseña');
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return { bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e', text: '#166534' };
      case 'disconnected': return { bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', text: '#b91c1c' };
      case 'checking': return { bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', text: '#92400e' };
      default: return { bg: '#f9fafb', border: '#e5e7eb', dot: '#6b7280', text: '#374151' };
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado al servidor';
      case 'disconnected': return 'Sin conexión al servidor';
      case 'checking': return 'Verificando conexión...';
      default: return 'Estado desconocido';
    }
  };

  const colors = getConnectionColor();

  // Renderizar paso de información de rol
  if (loginStep === 'role-info' && userInfo) {
    const { usuario, roleConfig } = userInfo;
    
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-form-panel" style={{ width: '100%' }}>
            <div className="login-form-container">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido, {usuario.nombre} {usuario.apellido}!</h2>
                <p className="text-gray-600">Login exitoso como <strong>{roleConfig.name}</strong></p>
                {usuario.comuna && (
                  <p className="text-sm text-gray-500">Ubicación: {usuario.comuna}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Tu perfil de acceso:</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Rol:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {roleConfig.name}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Descripción:</span>
                    <span>{roleConfig.description}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">ID:</span>
                    <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{usuario.id}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-3">Funcionalidades disponibles:</h4>
                <ul className="space-y-2">
                  {roleConfig.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-blue-800">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleContinue}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
              >
                Continuar al Sistema
              </button>

              <div className="text-center mt-4">
                <p className="text-xs text-gray-500">
                  Redirigiendo automáticamente en unos segundos...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar paso de redirección
  if (loginStep === 'redirecting') {
    return (
      <div className="login-container">
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tu workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar formulario de login por defecto
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-branding">
          <div className="login-branding-content">
            <div className="login-logo">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="login-title">SmartBee</h1>
            <p className="login-subtitle">Sistema de Gestión de Colmenas</p>
          </div>
          
          <div className="login-decoration-1"></div>
          <div className="login-decoration-2"></div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-container">
            <div className="login-header">
              <h2 className="login-welcome-title">Bienvenido</h2>
              <p className="login-welcome-subtitle">Ingresa tu nombre, apellido y contraseña</p>
            </div>

            {/* Estado de conexión */}
            <div style={{ 
              marginBottom: '1rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: colors.dot
              }} />
              <span style={{ 
                fontSize: '0.875rem',
                color: colors.text,
                fontWeight: '500'
              }}>
                {getConnectionText()}
              </span>
            </div>

            {error && (
              <div className="login-error">
                <div className="login-error-content">
                  <svg className="login-error-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="login-error-text">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-form-group">
                <label htmlFor="nombre" className="login-form-label">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="login-form-input"
                  placeholder="Ingresa tu nombre"
                  disabled={isLogging || connectionStatus !== 'connected'}
                  autoComplete="given-name"
                />
              </div>

              <div className="login-form-group">
                <label htmlFor="apellido" className="login-form-label">
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="login-form-input"
                  placeholder="Ingresa tu apellido"
                  disabled={isLogging || connectionStatus !== 'connected'}
                  autoComplete="family-name"
                />
              </div>

              <div className="login-form-group">
                <label htmlFor="password" className="login-form-label">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="login-form-input"
                  placeholder="Ingresa tu contraseña"
                  disabled={isLogging || connectionStatus !== 'connected'}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLogging || connectionStatus !== 'connected'}
                className="login-submit-button"
              >
                {isLogging ? (
                  <>
                    <div className="login-spinner"></div>
                    Verificando credenciales...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>

            <div className="login-forgot-password">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="login-forgot-link"
                disabled={isLogging}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div className="login-footer">
              <p className="login-footer-text">
                {/* Credenciales de prueba por rol */}
                <strong>Para ingresar:</strong><br/>
                Use su nombre y apellido registrados en el sistema<br/>
                junto con su contraseña personal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;