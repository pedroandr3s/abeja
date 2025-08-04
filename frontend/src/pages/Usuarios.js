import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';

const Usuarios = () => {
  const { usuarios, roles, loading, error } = useApi();
  const navigate = useNavigate();
  const [usuariosList, setUsuariosList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    apellido: '',
    comuna: '',
    clave: '',
    rol: '',
    activo: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Cargando datos de usuarios y roles...');
      
      const [usuariosData, rolesData] = await Promise.all([
        usuarios.getAll(),
        roles.getAll()
      ]);
      
      console.log('✅ Usuarios cargados:', usuariosData);
      console.log('✅ Roles cargados:', rolesData);
      
      setUsuariosList(usuariosData || []);
      setRolesList(rolesData || []);
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setAlertMessage({
        type: 'error',
        message: 'Error al cargar los datos de usuarios'
      });
    }
  };

  // Nota: El hash de contraseñas se hace en el backend por seguridad

  // Función para navegar a colmenas con filtro de usuario
  const handleNavigateToColmenas = (usuario) => {
    console.log('🚀 Navegando a colmenas con filtro de usuario:', usuario);
    
    localStorage.setItem('colmenas_filtro_dueno', usuario.id);
    localStorage.setItem('colmenas_filtro_nombre', `${usuario.nombre} ${usuario.apellido}`);
    localStorage.setItem('colmenas_filtro_aplicar', 'true');
    
    navigate('/colmenas');
  };

  // Obtener rol por clave (varchar)
  const getRolByKey = (rolKey) => {
    if (!rolKey || !rolesList || rolesList.length === 0) {
      return null;
    }
    
    return rolesList.find(r => r.rol === rolKey);
  };

  // Obtener nombre del rol desde la clave
  const getRolNameFromKey = (rolKey) => {
    const rol = getRolByKey(rolKey);
    return rol ? rol.descripcion : 'Sin rol';
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      console.log('📝 Editando usuario:', user);
      setEditingUser(user);
      
      setFormData({
        id: user.id || '',
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        comuna: user.comuna || '',
        clave: '', 
        rol: user.rol || '',
        activo: user.activo !== undefined ? Boolean(user.activo) : true
      });
    } else {
      setEditingUser(null);
      setFormData({
        id: '',
        nombre: '',
        apellido: '',
        comuna: '',
        clave: '',
        rol: '',
        activo: true
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      id: '',
      nombre: '',
      apellido: '',
      comuna: '',
      clave: '',
      rol: '',
      activo: true
    });
    setFormErrors({});
    setIsSubmitting(false);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!editingUser && (!formData.id || !formData.id.trim())) {
      errors.id = 'El ID es requerido';
    } else if (!editingUser && formData.id.trim().length > 16) {
      errors.id = 'El ID no puede exceder 16 caracteres';
    }
    
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
    
    // Validación de contraseña mejorada
    if (!editingUser && (!formData.clave || !formData.clave.trim())) {
      errors.clave = 'La clave es requerida';
    } else if (formData.clave && formData.clave.trim().length < 6) {
      errors.clave = 'La clave debe tener al menos 6 caracteres';
    } else if (formData.clave && formData.clave.trim().length > 64) {
      errors.clave = 'La clave no puede exceder 64 caracteres';
    }
    
    if (!formData.rol) {
      errors.rol = 'El rol es requerido';
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
      console.log('📝 Enviando datos del formulario:', formData);
      
      const dataToSend = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        comuna: formData.comuna.trim(),
        rol: formData.rol.trim(),
        activo: formData.activo ? 1 : 0
      };
      
      if (!editingUser) {
        dataToSend.id = formData.id.trim();
      }
      
      // Enviar contraseña en texto plano - el backend se encarga del hash
      if (formData.clave && formData.clave.trim()) {
        dataToSend.clave = formData.clave.trim();
        console.log('🔐 Enviando contraseña al backend para encriptar');
      }
      
      console.log('📤 Datos a enviar:', {
        ...dataToSend,
        clave: dataToSend.clave ? '[CONTRASEÑA ENVIADA AL BACKEND]' : undefined
      });

      if (editingUser) {
        console.log('✏️ Actualizando usuario:', editingUser.id);
        const result = await usuarios.update(editingUser.id, dataToSend);
        console.log('✅ Usuario actualizado:', result);
        setAlertMessage({
          type: 'success',
          message: 'Usuario actualizado correctamente. La contraseña se encriptó de forma segura en el servidor.'
        });
      } else {
        console.log('➕ Creando nuevo usuario');
        const result = await usuarios.create(dataToSend);
        console.log('✅ Usuario creado:', result);
        setAlertMessage({
          type: 'success',
          message: 'Usuario creado correctamente. La contraseña se encriptó de forma segura en el servidor.'
        });
      }
      
      handleCloseModal();
      await loadData();
    } catch (err) {
      console.error('❌ Error guardando usuario:', err);
      
      let errorMessage = `Error al ${editingUser ? 'actualizar' : 'crear'} el usuario`;
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

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${userName}"?`)) {
      try {
        console.log('🗑️ Eliminando usuario:', userId);
        await usuarios.delete(userId);
        setAlertMessage({
          type: 'success',
          message: 'Usuario eliminado correctamente'
        });
        await loadData();
      } catch (err) {
        console.error('❌ Error eliminando usuario:', err);
        
        let errorMessage = 'Error al eliminar el usuario';
        if (err.response && err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
        
        setAlertMessage({
          type: 'error',
          message: errorMessage
        });
      }
    }
  };

  const handleMantenedorColmenas = (usuario) => {
    console.log('🏠 Abriendo mantenedor de colmenas para usuario:', usuario);
    handleNavigateToColmenas(usuario);
  };

  const getRoleName = (usuario) => {
    console.log('🔍 Obteniendo nombre del rol para usuario:', usuario);
    
    if (usuario.rol) {
      return getRolNameFromKey(usuario.rol);
    }
    
    console.log('⚠️ Usuario sin rol asignado');
    return 'Sin rol';
  };

  const getRoleBadgeClass = (usuario) => {
    const rolKey = usuario.rol;
    
    switch (rolKey) {
      case 'ADM':
        return 'badge-danger';
      case 'API':
        return 'badge-success';
      case 'USR':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusBadge = (usuario) => {
    if (usuario.activo === 1 || usuario.activo === true) {
      return <span className="badge badge-success">Activo</span>;
    } else {
      return <span className="badge badge-secondary">Inactivo</span>;
    }
  };

  if (loading && usuariosList.length === 0) {
    return <Loading message="Cargando usuarios..." />;
  }

  return (
    <div>
      <div className="flex flex-between flex-center mb-6">
        <h1 className="page-title" style={{ margin: 0 }}>Usuarios</h1>
        <button 
          className="btn btn-primary"
          onClick={() => handleOpenModal()}
          disabled={isSubmitting}
        >
          + Nuevo Usuario
        </button>
      </div>

      {alertMessage && (
        <Alert 
          type={alertMessage.type}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}

      <Card title="Lista de Usuarios">
        {usuariosList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>
              No hay usuarios registrados
            </h3>
            <p>Comienza agregando tu primer usuario</p>
            <button 
              className="btn btn-primary mt-4"
              onClick={() => handleOpenModal()}
            >
              Crear Usuario
            </button>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Comuna</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosList.map((usuario) => {
                  console.log('👤 Usuario en tabla:', usuario);
                  
                  return (
                    <tr key={usuario.id}>
                      <td>
                        <button
                          onClick={() => handleNavigateToColmenas(usuario)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            fontWeight: '600',
                            color: '#2563eb',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#dbeafe';
                            e.target.style.color = '#1d4ed8';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#2563eb';
                          }}
                          title={`Ver colmenas de ${usuario.nombre} ${usuario.apellido}`}
                        >
                          {usuario.id}
                        </button>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {usuario.nombre} {usuario.apellido}
                          </div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: '#6b7280' 
                          }}>
                            ID: {usuario.id}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.875rem',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {usuario.comuna}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(usuario)}`}>
                          {getRoleName(usuario)}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                          Clave: {usuario.rol || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(usuario)}
                      </td>
                      <td>
                        <div className="flex flex-gap">
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => handleMantenedorColmenas(usuario)}
                            disabled={isSubmitting}
                            title="Ver colmenas de este usuario"
                          >
                            🏠 Colmenas
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenModal(usuario)}
                            disabled={isSubmitting}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(usuario.id, `${usuario.nombre} ${usuario.apellido}`)}
                            disabled={isSubmitting}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          {!editingUser && (
            <div className="form-group">
              <label className="form-label">ID de Usuario * (máx. 16 caracteres)</label>
              <input
                type="text"
                className={`form-input ${formErrors.id ? 'error' : ''}`}
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                placeholder="Ej: user001, admin, etc."
                maxLength="16"
                disabled={isSubmitting}
                style={{ fontFamily: 'monospace' }}
              />
              {formErrors.id && (
                <div className="error-message">{formErrors.id}</div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                Este será el identificador único del usuario
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nombre * (máx. 100 caracteres)</label>
            <input
              type="text"
              className={`form-input ${formErrors.nombre ? 'error' : ''}`}
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Ingresa el nombre"
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
              placeholder="Ingresa el apellido"
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
              placeholder="Ingresa la comuna"
              maxLength="100"
              disabled={isSubmitting}
            />
            {formErrors.comuna && (
              <div className="error-message">{formErrors.comuna}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              🔐 Contraseña Segura {editingUser ? '(dejar vacío para mantener actual)' : '*'} 
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {' '}(mín. 6 caracteres, máx. 64)
              </span>
            </label>
            <input
              type="password"
              className={`form-input ${formErrors.clave ? 'error' : ''}`}
              value={formData.clave}
              onChange={(e) => setFormData({...formData, clave: e.target.value})}
              placeholder={editingUser ? "Nueva contraseña (opcional)" : "Ingresa una contraseña segura"}
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
              padding: '8px',
              backgroundColor: '#ecfdf5',
              borderRadius: '4px',
              border: '1px solid #a7f3d0'
            }}>
              🔒 Las contraseñas se encriptan automáticamente con Bcrypt en el servidor (nivel 12)
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Rol *</label>
            <select
              className={`form-select ${formErrors.rol ? 'error' : ''}`}
              value={formData.rol}
              onChange={(e) => {
                console.log('🔄 Cambiando rol a:', e.target.value);
                setFormData({...formData, rol: e.target.value});
              }}
              disabled={isSubmitting}
            >
              <option value="">Selecciona un rol</option>
              {rolesList.map((rol) => (
                <option key={rol.rol} value={rol.rol}>
                  {rol.descripcion}
                </option>
              ))}
            </select>
            {formErrors.rol && (
              <div className="error-message">{formErrors.rol}</div>
            )}
            {formData.rol && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                Rol seleccionado: {formData.rol} - {getRolNameFromKey(formData.rol)}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Estado</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                disabled={isSubmitting}
                style={{ width: 'auto' }}
              />
              <label htmlFor="activo" style={{ marginBottom: 0, fontSize: '0.875rem' }}>
                Usuario activo
              </label>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
              Los usuarios inactivos no podrán acceder al sistema
            </div>
          </div>

          <div className="flex flex-gap flex-between mt-6">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 
                (editingUser ? 'Actualizando...' : 'Creando...') : 
                (editingUser ? 'Actualizar' : 'Crear')
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Usuarios;