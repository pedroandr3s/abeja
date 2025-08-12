import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

// Configuración dinámica de la URL base
const getBaseURL = () => {
  // Si hay una variable de entorno definida, úsala
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // En desarrollo, usa backend local
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080/api';
  }
  
  // ✅ Railway funcionando - URL corregida
  return 'https://backend-production-eb26.up.railway.app/api';
};

// Configuración de axios para conectar al backend
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Agregar token si existe
    const token = localStorage.getItem('smartbee_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.message);
    console.error('❌ URL que falló:', error.config?.url);
    
    // Si es error 401, limpiar localStorage y redirigir
    if (error.response?.status === 401) {
      console.log('🔐 Token expirado o inválido, limpiando sesión...');
      localStorage.removeItem('smartbee_token');
      localStorage.removeItem('smartbee_user');
      // Solo recargar si no estamos ya en login
      if (!window.location.pathname.includes('login')) {
        window.location.reload();
      }
    }
    
    return Promise.reject(error);
  }
);

export const ApiProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mostrar la URL que se está usando
  useEffect(() => {
    console.log('🌐 Base URL configurada:', getBaseURL());
  }, []);

  // Probar conexión al cargar
  useEffect(() => {
    testConnection();
    
    // Verificar conexión cada 30 segundos
    const interval = setInterval(() => {
      testConnectionSilent();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await api.get('/health');
      setIsConnected(true);
      setError(null);
      console.log('🟢 Conexión establecida:', response.data.message);
      return response.data;
    } catch (err) {
      setIsConnected(false);
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión con el servidor';
      setError(errorMessage);
      console.error('🔴 Error de conexión:', errorMessage);
      console.error('🔴 URL que falló:', err.config?.url);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testConnectionSilent = async () => {
    try {
      await api.get('/health');
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setIsConnected(false);
      setError('Conexión perdida');
    }
  };

  const apiRequest = async (method, endpoint, data = null, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(endpoint);
          break;
        case 'post':
          response = await api.post(endpoint, data);
          break;
        case 'put':
          response = await api.put(endpoint, data);
          break;
        case 'delete':
          response = await api.delete(endpoint);
          break;
        default:
          throw new Error(`Método HTTP no válido: ${method}`);
      }
      
      setIsConnected(true);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error en la petición';
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        setIsConnected(false);
        setError('No se puede conectar al servidor backend');
      } else {
        setError(errorMessage);
      }
      
      console.error(`❌ Error en ${method.toUpperCase()} ${endpoint}:`, errorMessage);
      throw err;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Métodos específicos para cada entidad basados en el esquema de BD
  const usuarios = {
    getAll: () => apiRequest('get', '/usuarios'),
    getById: (id) => apiRequest('get', `/usuarios/${id}`),
    create: (data) => apiRequest('post', '/usuarios', data),
    update: (id, data) => apiRequest('put', `/usuarios/${id}`, data),
    delete: (id) => apiRequest('delete', `/usuarios/${id}`),
    // ✅ Método de login corregido
    login: async (credentials) => {
      try {
        const response = await api.post('/usuarios/login', credentials);
        
        if (response.data && response.data.data) {
          // Guardar token y datos del usuario
          localStorage.setItem('smartbee_token', response.data.data.token);
          localStorage.setItem('smartbee_user', JSON.stringify(response.data.data.usuario));
          
          console.log('✅ Login exitoso desde ApiContext');
          return response.data;
        }
        
        throw new Error('Respuesta de login inválida');
      } catch (error) {
        console.error('❌ Error en login desde ApiContext:', error);
        throw error;
      }
    },
    // Método para cerrar sesión
    logout: () => {
      localStorage.removeItem('smartbee_token');
      localStorage.removeItem('smartbee_user');
      console.log('👋 Sesión cerrada desde ApiContext');
    },
    // Método para verificar si está autenticado
    isAuthenticated: () => {
      const token = localStorage.getItem('smartbee_token');
      const user = localStorage.getItem('smartbee_user');
      return !!(token && user);
    },
    // Método para obtener usuario actual
    getCurrentUser: () => {
      try {
        const userData = localStorage.getItem('smartbee_user');
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        console.error('Error obteniendo usuario actual:', error);
        return null;
      }
    }
  };

  const roles = {
    getAll: () => apiRequest('get', '/roles'),
    getById: (id) => apiRequest('get', `/roles/${id}`),
    create: (data) => apiRequest('post', '/roles', data),
    update: (id, data) => apiRequest('put', `/roles/${id}`, data),
    delete: (id) => apiRequest('delete', `/roles/${id}`),
  };

  const colmenas = {
    getAll: () => apiRequest('get', '/colmenas'),
    getById: (id) => apiRequest('get', `/colmenas/${id}`),
    create: (data) => apiRequest('post', '/colmenas', data),
    update: (id, data) => apiRequest('put', `/colmenas/${id}`, data),
    delete: (id) => apiRequest('delete', `/colmenas/${id}`),
    getByDueno: (duenoId) => apiRequest('get', `/colmenas/dueno/${duenoId}`),
    getUbicaciones: (id) => apiRequest('get', `/colmenas/${id}/ubicaciones`),
    addUbicacion: (id, data) => apiRequest('post', `/colmenas/${id}/ubicaciones`, data),
    getNodos: (id) => apiRequest('get', `/colmenas/${id}/nodos`),
    addNodo: (id, data) => apiRequest('post', `/colmenas/${id}/nodos`, data),
    removeNodo: (colmenaId, nodoId) => apiRequest('delete', `/colmenas/${colmenaId}/nodos/${nodoId}`),
  };

  const nodos = {
    getAll: () => apiRequest('get', '/nodos'),
    getById: (id) => apiRequest('get', `/nodos/${id}`),
    create: (data) => apiRequest('post', '/nodos', data),
    update: (id, data) => apiRequest('put', `/nodos/${id}`, data),
    delete: (id) => apiRequest('delete', `/nodos/${id}`),
    getByTipo: (tipo) => apiRequest('get', `/nodos/tipo/${tipo}`),
    getUbicaciones: (id) => apiRequest('get', `/nodos/${id}/ubicaciones`),
    addUbicacion: (id, data) => apiRequest('post', `/nodos/${id}/ubicaciones`, data),
    getMensajes: (id, limit = 100) => apiRequest('get', `/nodos/${id}/mensajes?limit=${limit}`),
    // ✅ NUEVOS MÉTODOS para obtener nodos disponibles
    getInterioresDisponibles: () => apiRequest('get', '/nodos/interiores/disponibles'),
    getExterioresDisponibles: () => apiRequest('get', '/nodos/exteriores/disponibles'),
  };

  const nodoTipos = {
    getAll: () => apiRequest('get', '/nodo-tipos'),
    getById: (id) => apiRequest('get', `/nodo-tipos/${id}`),
    create: (data) => apiRequest('post', '/nodo-tipos', data),
    update: (id, data) => apiRequest('put', `/nodo-tipos/${id}`, data),
    delete: (id) => apiRequest('delete', `/nodo-tipos/${id}`),
  };

  const mensajes = {
    getAll: (limit = 100) => apiRequest('get', `/mensajes?limit=${limit}`),
    getById: (id) => apiRequest('get', `/mensajes/${id}`),
    create: (data) => apiRequest('post', '/mensajes', data),
    getByNodo: (nodoId, limit = 100) => apiRequest('get', `/mensajes/nodo/${nodoId}?limit=${limit}`),
    getByTopico: (topico, limit = 100) => apiRequest('get', `/mensajes/topico/${topico}?limit=${limit}`),
    getRecientes: (hours = 24) => apiRequest('get', `/mensajes/recientes?hours=${hours}`),
    delete: (id) => apiRequest('delete', `/mensajes/${id}`),
  };

  const dashboard = {
    getStats: () => apiRequest('get', '/dashboard/stats'),
    getRecent: () => apiRequest('get', '/dashboard/recent'),
    getAlertas: () => apiRequest('get', '/dashboard/alertas'),
    getGraficos: () => apiRequest('get', '/dashboard/graficos'),
    getMonitoreo: () => apiRequest('get', '/dashboard/monitoreo'),
    // NUEVO: Método específico para datos de sensores del dashboard
    getSensorData: (hours = 168) => apiRequest('get', `/dashboard/sensor-data?hours=${hours}`)
  };

  const selects = {
    usuarios: () => apiRequest('get', '/select/usuarios', null, false),
    roles: () => apiRequest('get', '/select/roles', null, false),
    colmenas: () => apiRequest('get', '/select/colmenas', null, false),
    nodos: () => apiRequest('get', '/select/nodos', null, false),
    nodoTipos: () => apiRequest('get', '/select/nodo-tipos', null, false),
  };

  // Métodos para reportes y análisis
  const reportes = {
    temperaturas: (colmenaId, fechaInicio, fechaFin) => 
      apiRequest('get', `/reportes/temperaturas/${colmenaId}?inicio=${fechaInicio}&fin=${fechaFin}`),
    humedad: (colmenaId, fechaInicio, fechaFin) => 
      apiRequest('get', `/reportes/humedad/${colmenaId}?inicio=${fechaInicio}&fin=${fechaFin}`),
    actividad: (colmenaId, fechaInicio, fechaFin) => 
      apiRequest('get', `/reportes/actividad/${colmenaId}?inicio=${fechaInicio}&fin=${fechaFin}`),
    resumen: (colmenaId) => apiRequest('get', `/reportes/resumen/${colmenaId}`),
  };

  const value = {
    // Estado
    isConnected,
    loading,
    error,
    
    // Métodos de conexión
    testConnection,
    
    // Entidades principales
    usuarios,
    roles,
    colmenas,
    nodos,
    nodoTipos,
    mensajes,
    dashboard,
    reportes,
    selects,
    
    // Método genérico
    apiRequest,
    
    // Configuración de axios
    api,
    
    // URL base para referencia
    baseURL: getBaseURL(),
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};