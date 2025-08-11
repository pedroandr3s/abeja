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
      { path: '/revisiones', component: Revisiones, name: 'Nodos', icon: '📡' },
    ]
  },
  API: {
    name: 'Apicultor',
    defaultRoute: '/user-dashboard',
    routes: [
      { path: '/user-dashboard', component: UserDashboard, name: 'Mi Dashboard', icon: '📊' },
    ]
  }
};

// Función para obtener el tema del sidebar basado en el rol
const getSidebarTheme = (userRole) => {
  if (userRole === 'API') {
    return {
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      cardBackground: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      textPrimary: '#f8fafc',
      textSecondary: '#e2e8f0',
      textMuted: '#94a3b8',
      border: '1px solid rgba(71, 85, 105, 0.3)',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      buttonActive: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
      buttonHover: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
      iconColor: '#f8fafc',
      accentColor: '#3b82f6'
    };
  } else {
    return {
      background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
      cardBackground: 'rgba(0, 0, 0, 0.2)',
      textPrimary: '#ffffff',
      textSecondary: '#e2e8f0',
      textMuted: '#94a3b8',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      buttonActive: 'rgba(245, 158, 11, 0.2)',
      buttonHover: 'rgba(255, 255, 255, 0.1)',
      iconColor: '#ffffff',
      accentColor: '#f59e0b'
    };
  }
};

// Componente wrapper para la aplicación autenticada
const AuthenticatedApp = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Obtener configuración basada en el rol del usuario
  const userRole = currentUser?.rol || 'API';
  const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.API;
  const sidebarTheme = getSidebarTheme(userRole);

  // Verificar si el usuario tiene acceso a la ruta actual
  const hasAccessToCurrentRoute = () => {
    const currentPath = location.pathname;
    
    // Para apicultores, solo permitir acceso a user-dashboard
    if (userRole === 'API') {
      return currentPath === '/user-dashboard' || currentPath === '/';
    }
    
    // Para administradores, permitir acceso a todas sus rutas
    return roleConfig.routes.some(route => route.path === currentPath) || currentPath === '/';
  };

  // Redirigir si no tiene acceso a la ruta actual
  useEffect(() => {
    if (!hasAccessToCurrentRoute() && location.pathname !== '/') {
      console.log(`🔒 Usuario ${userRole} no tiene acceso a ${location.pathname}, redirigiendo...`);
      navigate(roleConfig.defaultRoute, { replace: true });
    }
  }, [location.pathname, userRole]);

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Función para alternar sidebar móvil
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <Sidebar 
        currentUser={currentUser}
        roleConfig={roleConfig}
        theme={sidebarTheme}
        isDarkMode={userRole === 'API'}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={setIsMobileSidebarOpen}
      />

      {/* Main Content */}
      <div className="main-content">
        <Navbar 
          currentUser={currentUser}
          onLogout={onLogout}
          roleConfig={roleConfig}
          onMobileMenuToggle={() => toggleMobileSidebar()}
        />
        
        <div className="page-container">
          <Routes>
            {/* Ruta raíz redirige al dashboard por defecto del rol */}
            <Route path="/" element={<Navigate to={roleConfig.defaultRoute} replace />} />
            
            {/* Rutas filtradas basadas en el rol */}
            {userRole === 'API' ? (
              // Solo user-dashboard para apicultores
              <Route 
                path="/user-dashboard" 
                element={<UserDashboard currentUser={currentUser} />} 
              />
            ) : (
              // Todas las rutas para administradores
              roleConfig.routes.map(({ path, component: Component }) => (
                <Route 
                  key={path} 
                  path={path} 
                  element={<Component currentUser={currentUser} />} 
                />
              ))
            )}
            
            {/* Ruta catch-all - redirige al dashboard del rol */}
            <Route path="*" element={<Navigate to={roleConfig.defaultRoute} replace />} />
          </Routes>
        </div>
      </div>

      <style jsx>{`
        .app {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          margin-left: 280px;
          transition: margin-left 0.3s ease;
        }

        .page-container {
          flex: 1;
          padding: 1rem;
          margin-top: 4rem; /* Altura del navbar */
          overflow-y: auto;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
          }

          .page-container {
            padding: 0.5rem;
            margin-top: 3.5rem;
          }
        }

        @media (max-width: 640px) {
          .page-container {
            padding: 0.25rem;
            margin-top: 3rem;
          }
        }

        /* Clases de utilidad globales */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .card {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          background: white;
        }

        .btn-primary {
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
          border-color: #2563eb;
        }

        .btn-secondary {
          background-color: #6b7280;
          border-color: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #4b5563;
          border-color: #4b5563;
        }

        .btn-danger {
          background-color: #dc2626;
          border-color: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background-color: #b91c1c;
          border-color: #b91c1c;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
        }

        .btn-lg {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
        }

        /* Grid y Flexbox utilities */
        .grid {
          display: grid;
        }

        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

        .gap-1 { gap: 0.25rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .gap-8 { gap: 2rem; }

        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-wrap { flex-wrap: wrap; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .items-end { align-items: flex-end; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .justify-end { justify-content: flex-end; }

        /* Spacing utilities */
        .m-0 { margin: 0; }
        .m-1 { margin: 0.25rem; }
        .m-2 { margin: 0.5rem; }
        .m-3 { margin: 0.75rem; }
        .m-4 { margin: 1rem; }
        .m-6 { margin: 1.5rem; }
        .m-8 { margin: 2rem; }

        .mt-0 { margin-top: 0; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }

        .mb-0 { margin-bottom: 0; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }

        .ml-0 { margin-left: 0; }
        .ml-1 { margin-left: 0.25rem; }
        .ml-2 { margin-left: 0.5rem; }
        .ml-3 { margin-left: 0.75rem; }
        .ml-4 { margin-left: 1rem; }
        .ml-6 { margin-left: 1.5rem; }
        .ml-8 { margin-left: 2rem; }

        .mr-0 { margin-right: 0; }
        .mr-1 { margin-right: 0.25rem; }
        .mr-2 { margin-right: 0.5rem; }
        .mr-3 { margin-right: 0.75rem; }
        .mr-4 { margin-right: 1rem; }
        .mr-6 { margin-right: 1.5rem; }
        .mr-8 { margin-right: 2rem; }

        .p-0 { padding: 0; }
        .p-1 { padding: 0.25rem; }
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .p-8 { padding: 2rem; }

        .pt-0 { padding-top: 0; }
        .pt-1 { padding-top: 0.25rem; }
        .pt-2 { padding-top: 0.5rem; }
        .pt-3 { padding-top: 0.75rem; }
        .pt-4 { padding-top: 1rem; }
        .pt-6 { padding-top: 1.5rem; }
        .pt-8 { padding-top: 2rem; }

        .pb-0 { padding-bottom: 0; }
        .pb-1 { padding-bottom: 0.25rem; }
        .pb-2 { padding-bottom: 0.5rem; }
        .pb-3 { padding-bottom: 0.75rem; }
        .pb-4 { padding-bottom: 1rem; }
        .pb-6 { padding-bottom: 1.5rem; }
        .pb-8 { padding-bottom: 2rem; }

        .pl-0 { padding-left: 0; }
        .pl-1 { padding-left: 0.25rem; }
        .pl-2 { padding-left: 0.5rem; }
        .pl-3 { padding-left: 0.75rem; }
        .pl-4 { padding-left: 1rem; }
        .pl-6 { padding-left: 1.5rem; }
        .pl-8 { padding-left: 2rem; }

        .pr-0 { padding-right: 0; }
        .pr-1 { padding-right: 0.25rem; }
        .pr-2 { padding-right: 0.5rem; }
        .pr-3 { padding-right: 0.75rem; }
        .pr-4 { padding-right: 1rem; }
        .pr-6 { padding-right: 1.5rem; }
        .pr-8 { padding-right: 2rem; }

        /* Text utilities */
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-base { font-size: 1rem; line-height: 1.5rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }

        .font-normal { font-weight: 400; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }

        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .text-gray-400 { color: #9ca3af; }
        .text-gray-500 { color: #6b7280; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-900 { color: #111827; }

        .text-blue-500 { color: #3b82f6; }
        .text-blue-600 { color: #2563eb; }
        .text-green-500 { color: #10b981; }
        .text-green-600 { color: #059669; }
        .text-red-500 { color: #ef4444; }
        .text-red-600 { color: #dc2626; }
        .text-yellow-500 { color: #eab308; }
        .text-yellow-600 { color: #ca8a04; }

        /* Background utilities */
        .bg-white { background-color: #ffffff; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .bg-gray-200 { background-color: #e5e7eb; }
        .bg-gray-800 { background-color: #1f2937; }
        .bg-gray-900 { background-color: #111827; }

        .bg-blue-50 { background-color: #eff6ff; }
        .bg-blue-100 { background-color: #dbeafe; }
        .bg-blue-500 { background-color: #3b82f6; }
        .bg-blue-600 { background-color: #2563eb; }

        .bg-green-50 { background-color: #ecfdf5; }
        .bg-green-100 { background-color: #d1fae5; }
        .bg-green-500 { background-color: #10b981; }
        .bg-green-600 { background-color: #059669; }

        .bg-red-50 { background-color: #fef2f2; }
        .bg-red-100 { background-color: #fee2e2; }
        .bg-red-500 { background-color: #ef4444; }
        .bg-red-600 { background-color: #dc2626; }

        .bg-yellow-50 { background-color: #fffbeb; }
        .bg-yellow-100 { background-color: #fef3c7; }
        .bg-yellow-500 { background-color: #eab308; }
        .bg-yellow-600 { background-color: #ca8a04; }

        /* Border utilities */
        .border { border-width: 1px; }
        .border-0 { border-width: 0; }
        .border-2 { border-width: 2px; }
        .border-t { border-top-width: 1px; }
        .border-b { border-bottom-width: 1px; }
        .border-l { border-left-width: 1px; }
        .border-r { border-right-width: 1px; }

        .border-gray-200 { border-color: #e5e7eb; }
        .border-gray-300 { border-color: #d1d5db; }
        .border-gray-400 { border-color: #9ca3af; }

        .border-blue-200 { border-color: #bfdbfe; }
        .border-blue-300 { border-color: #93c5fd; }
        .border-green-200 { border-color: #bbf7d0; }
        .border-green-300 { border-color: #86efac; }
        .border-red-200 { border-color: #fecaca; }
        .border-red-300 { border-color: #fca5a5; }

        .rounded { border-radius: 0.25rem; }
        .rounded-md { border-radius: 0.375rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .rounded-xl { border-radius: 0.75rem; }
        .rounded-full { border-radius: 9999px; }

        /* Width and Height utilities */
        .w-full { width: 100%; }
        .w-auto { width: auto; }
        .w-1\/2 { width: 50%; }
        .w-1\/3 { width: 33.333333%; }
        .w-2\/3 { width: 66.666667%; }
        .w-1\/4 { width: 25%; }
        .w-3\/4 { width: 75%; }

        .h-full { height: 100%; }
        .h-auto { height: auto; }
        .h-screen { height: 100vh; }

        .min-h-screen { min-height: 100vh; }
        .min-h-full { min-height: 100%; }

        /* Display utilities */
        .block { display: block; }
        .inline-block { display: inline-block; }
        .inline { display: inline; }
        .hidden { display: none; }

        /* Position utilities */
        .relative { position: relative; }
        .absolute { position: absolute; }
        .fixed { position: fixed; }
        .sticky { position: sticky; }

        .top-0 { top: 0; }
        .bottom-0 { bottom: 0; }
        .left-0 { left: 0; }
        .right-0 { right: 0; }

        /* Shadow utilities */
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
        .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }

        /* Opacity utilities */
        .opacity-0 { opacity: 0; }
        .opacity-25 { opacity: 0.25; }
        .opacity-50 { opacity: 0.5; }
        .opacity-75 { opacity: 0.75; }
        .opacity-100 { opacity: 1; }

        /* Responsive utilities */
        @media (min-width: 640px) {
          .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .sm\\:flex-row { flex-direction: row; }
          .sm\\:text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .sm\\:text-base { font-size: 1rem; line-height: 1.5rem; }
          .sm\\:p-6 { padding: 1.5rem; }
        }

        @media (min-width: 768px) {
          .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .md\\:flex-row { flex-direction: row; }
          .md\\:block { display: block; }
          .md\\:hidden { display: none; }
          .md\\:text-base { font-size: 1rem; line-height: 1.5rem; }
          .md\\:text-lg { font-size: 1.125rem; line-height: 1.75rem; }
          .md\\:p-8 { padding: 2rem; }
        }

        @media (min-width: 1024px) {
          .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .lg\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          .lg\\:text-lg { font-size: 1.125rem; line-height: 1.75rem; }
          .lg\\:text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        }

        /* Custom utilities específicas para la app */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.online {
          background-color: #ecfdf5;
          color: #059669;
          border: 1px solid #d1fae5;
        }

        .status-badge.offline {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fee2e2;
        }

        .status-badge.warning {
          background-color: #fffbeb;
          color: #ca8a04;
          border: 1px solid #fef3c7;
        }

        .metric-card {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .loading-spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Animaciones personalizadas */
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .slide-in {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        /* Estados de hover mejorados */
        .hover-lift {
          transition: all 0.2s ease;
        }

        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Estilos para formularios */
        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-error {
          color: #dc2626;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        /* Estilos para tablas responsivas */
        .table-container {
          overflow-x: auto;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .table th,
        .table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .table th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .table td {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .table tbody tr:hover {
          background-color: #f9fafb;
        }

        @media (max-width: 640px) {
          .table th,
          .table td {
            padding: 0.5rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

// Componente para mostrar información de rol no válido
const InvalidRoleMessage = ({ currentUser, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
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
          className="w-full btn btn-danger"
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
            console.log('🎨 Tema sidebar:', user.rol === 'API' ? 'Oscuro (Apicultor)' : 'Claro (Administrador)');
            console.log('🔒 Restricciones:', user.rol === 'API' ? 'Solo UserDashboard' : 'Acceso completo');
          } else {
            console.warn('⚠️ Usuario con rol inválido:', user.rol);
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
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
    console.log('🎨 Tema sidebar aplicado:', userData.rol === 'API' ? 'Oscuro' : 'Claro');
    console.log('🔒 Restricciones aplicadas:', userData.rol === 'API' ? 'Solo UserDashboard permitido' : 'Acceso completo');
    
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
          <div className="loading-spinner mx-auto mb-4" style={{ width: '3rem', height: '3rem' }}></div>
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