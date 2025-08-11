// hooks/useAuth.js
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay datos de autenticación al inicializar
    const savedToken = localStorage.getItem('smartbee_token');
    const savedUser = localStorage.getItem('smartbee_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('smartbee_token');
        localStorage.removeItem('smartbee_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const { token: newToken, usuario } = result.data;
        
        // Guardar en localStorage
        localStorage.setItem('smartbee_token', newToken);
        localStorage.setItem('smartbee_user', JSON.stringify(usuario));
        
        // Actualizar estado
        setToken(newToken);
        setUser(usuario);
        
        return { success: true, user: usuario };
      } else {
        throw new Error(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('smartbee_token');
    localStorage.removeItem('smartbee_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!(token && user);
  };

  // Función para hacer peticiones autenticadas
  const authenticatedFetch = async (url, options = {}) => {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Si la respuesta es 401, probablemente el token expiró
      if (response.status === 401) {
        logout();
        window.location.reload();
        return null;
      }
      
      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  };

  return {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: isAuthenticated(),
    authenticatedFetch,
  };
};