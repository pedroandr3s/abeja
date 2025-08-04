import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ApiProvider } from './context/ApiContext';
import Login from './pages/Login';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Importar páginas de administrador
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Colmenas from './pages/Colmenas';
import Revisiones from './pages/Revisiones';

// Importar páginas de usuario/apicultor
import UserDashboard from './pages/user/UserDashboard';
import UserColmenas from './pages/user/UserColmenas';
import UserProfile from './pages/user/UserProfile';
import UserReportes from './pages/user/UserReportes';

// Configuración de rutas por rol
const ROLE_CONFIG = {
  ADM: {
    name: 'Administrador',
    defaultRoute: '/dashboard',
    routes: [
      { path: '/dashboard', component: Dashboard, name: 'Dashboard', icon: '📊' },
      { path: '/usuarios', component: Usuarios, name: 'Usuarios', icon: '👥' },
      { path: '/colmenas', component: Colmenas, name: 'Colmenas', icon: '🏠' },
      { path: '/revisiones', component: Revisiones, name: 'Revisiones', icon: '📋' },
    ]
  },
  API: {
    name: 'Apicultor',
    defaultRoute: '/user-dashboard',
    routes: [
      { path: '/user-dashboard', component: UserDashboard, name: 'Mi Dashboard', icon: '📊' },
      { path: '/user-colmenas', component: UserColmenas, name: 'Mis Colmenas', icon: '🏠' },
      { path: '/user-reportes', component: UserReportes, name: 'Reportes', icon: '📈' },
      { path: '/user-profile', component: UserProfile, name: 'Mi Perfil', icon: '👤' },
    ]
  }
};

// Componente wrapper para la aplicación autenticada
const AuthenticatedApp = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener configuración basada en el rol del usuario
  const userRole = currentUser?.rol || 'API';
  const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.API;

  // Función para cambiar página y actualizar URL
  const setCurrentPage = (page) => {
    navigate(`/${page}`);
  };

  // Obtener página actual desde la URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return roleConfig.defaultRoute.substring(1);
    return path.substring(1); // Remover el '/' inicial
  };

  // Verificar si el usuario tiene acceso a la ruta actual
  const hasAccessToCurrentRoute = () => {
    const currentPath = location.pathname;
    return roleConfig.routes.some(route => route.path === currentPath);
  };

  // Redirigir si no tiene acceso a la ruta actual
  useEffect(() => {
    if (!hasAccessToCurrentRoute() && location.pathname !== '/') {
      console.log(`🔒 Usuario ${userRole} no tiene acceso a ${location.pathname}, redirigiendo...`);
      navigate(roleConfig.defaultRoute, { replace: true });
    }
  }, [location.pathname, userRole]);

  return (
    <div className="app">
      <Sidebar 
        currentPage={getCurrentPage()} 
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        roleConfig={roleConfig}
      />
      <div className="main-content">
        <Navbar 
          currentUser={currentUser}
          onLogout={onLogout}
          roleConfig={roleConfig}
        />
        <div className="page-container">
          <Routes>
            {/* Ruta raíz redirige al dashboard por defecto del rol */}
            <Route path="/" element={<Navigate to={roleConfig.defaultRoute} replace />} />
            
            {/* Rutas dinámicas basadas en el rol */}
            {roleConfig.routes.map(({ path, component: Component }) => (
              <Route 
                key={path} 
                path={path} 
                element={<Component currentUser={currentUser} />} 
              />
            ))}
            
            {/* Ruta catch-all para páginas no encontradas - redirige al dashboard del rol */}
            <Route path="*" element={<Navigate to={roleConfig.defaultRoute} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar información de rol no válido
const InvalidRoleMessage = ({ currentUser, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Rol No Válido
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Tu usuario tiene un rol no reconocido: <strong>{currentUser?.rol}</strong>
          <br />
          Por favor contacta al administrador del sistema.
        </p>
        <div className="text-xs text-gray-400 mb-6">
          Roles válidos: Administrador (ADM), Apicultor (API)
        </div>
        <button
          onClick={onLogout}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay una sesión activa al cargar la app
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('smartbee_token');
        const userData = localStorage.getItem('smartbee_user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          
          // Validar que el usuario tenga un rol válido
          if (user.rol && ROLE_CONFIG[user.rol]) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            console.log('✅ Sesión existente encontrada:', user);
            console.log('🎭 Rol del usuario:', user.rol, '-', ROLE_CONFIG[user.rol].name);
          } else {
            console.warn('⚠️ Usuario con rol inválido:', user.rol);
            // Mantener como autenticado pero con rol inválido para mostrar mensaje
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        // Limpiar datos corruptos
        localStorage.removeItem('smartbee_token');
        localStorage.removeItem('smartbee_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Manejar login exitoso
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    
    const roleConfig = ROLE_CONFIG[userData.rol];
    console.log('🚀 Usuario autenticado:', userData);
    console.log('🎭 Rol:', userData.rol, '-', roleConfig?.name || 'Desconocido');
    
    if (roleConfig) {
      console.log('📱 Redirigiendo a:', roleConfig.defaultRoute);
    }
  };

  // Manejar logout
  const handleLogout = () => {
    localStorage.removeItem('smartbee_token');
    localStorage.removeItem('smartbee_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    console.log('👋 Usuario desconectado');
  };

  // Mostrar loading mientras verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando SmartBee...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ApiProvider>
        {/* Si no está autenticado, mostrar login */}
        {!isAuthenticated ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          /* Si está autenticado, verificar que tenga un rol válido */
          currentUser?.rol && ROLE_CONFIG[currentUser.rol] ? (
            <AuthenticatedApp 
              currentUser={currentUser} 
              onLogout={handleLogout} 
            />
          ) : (
            <InvalidRoleMessage 
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )
        )}
      </ApiProvider>
    </Router>
  );
}

export default App;