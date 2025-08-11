import React, { useState, useEffect } from 'react';
import { Home, Plus, MapPin, Calendar, Package, RefreshCw, User, Activity, AlertTriangle } from 'lucide-react';
import { useApi } from '../context/ApiContext';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';

const Colmenas = () => {
  const { colmenas, usuarios, nodos, loading, error } = useApi();
  const [colmenasList, setColmenasList] = useState([]);
  const [usuariosList, setUsuariosList] = useState([]);
  const [nodosList, setNodosList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColmena, setEditingColmena] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    descripcion: '',
    dueno: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Cargando datos de colmenas, usuarios y nodos...');
      
      const [colmenasData, usuariosData, nodosData] = await Promise.all([
        colmenas.getAll(),
        usuarios.getAll(),
        nodos ? nodos.getAll() : Promise.resolve([])
      ]);
      
      console.log('✅ Colmenas cargadas:', colmenasData);
      console.log('✅ Usuarios cargados:', usuariosData);
      console.log('✅ Nodos cargados:', nodosData);
      
      setColmenasList(colmenasData || []);
      setUsuariosList(usuariosData || []);
      setNodosList(nodosData || []);
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setAlertMessage({
        type: 'error',
        message: 'Error al cargar los datos'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenModal = (colmena = null) => {
    if (colmena) {
      console.log('📝 Editando colmena:', colmena);
      setEditingColmena(colmena);
      setFormData({
        id: colmena.id || '',
        descripcion: colmena.descripcion || '',
        dueno: colmena.dueno || ''
      });
    } else {
      setEditingColmena(null);
      setFormData({
        id: '',
        descripcion: '',
        dueno: ''
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingColmena(null);
    setFormData({
      id: '',
      descripcion: '',
      dueno: ''
    });
    setFormErrors({});
    setIsSubmitting(false);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!editingColmena && (!formData.id || !formData.id.trim())) {
      errors.id = 'El ID es requerido';
    } else if (!editingColmena && formData.id.trim().length > 64) {
      errors.id = 'El ID no puede exceder 64 caracteres';
    }
    
    if (!formData.descripcion || !formData.descripcion.trim()) {
      errors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.trim().length > 1024) {
      errors.descripcion = 'La descripción no puede exceder 1024 caracteres';
    }
    
    if (!formData.dueno) {
      errors.dueno = 'El propietario es requerido';
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
        descripcion: formData.descripcion.trim(),
        dueno: formData.dueno
      };
      
      if (!editingColmena) {
        dataToSend.id = formData.id.trim();
      }
      
      console.log('📤 Datos a enviar:', dataToSend);

      if (editingColmena) {
        console.log('✏️ Actualizando colmena:', editingColmena.id);
        const result = await colmenas.update(editingColmena.id, dataToSend);
        console.log('✅ Colmena actualizada:', result);
        setAlertMessage({
          type: 'success',
          message: 'Colmena actualizada correctamente'
        });
      } else {
        console.log('➕ Creando nueva colmena');
        const result = await colmenas.create(dataToSend);
        console.log('✅ Colmena creada:', result);
        setAlertMessage({
          type: 'success',
          message: 'Colmena creada correctamente'
        });
      }
      
      handleCloseModal();
      await loadData();
    } catch (err) {
      console.error('❌ Error guardando colmena:', err);
      
      let errorMessage = `Error al ${editingColmena ? 'actualizar' : 'crear'} la colmena`;
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

  const handleDelete = async (colmenaId, colmenaDesc) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la colmena "${colmenaDesc}"?`)) {
      try {
        console.log('🗑️ Eliminando colmena:', colmenaId);
        await colmenas.delete(colmenaId);
        setAlertMessage({
          type: 'success',
          message: 'Colmena eliminada correctamente'
        });
        await loadData();
      } catch (err) {
        console.error('❌ Error eliminando colmena:', err);
        
        let errorMessage = 'Error al eliminar la colmena';
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

  // Función para obtener información del propietario
  const getPropietarioInfo = (colmena) => {
    if (!colmena.dueno || !usuariosList.length) {
      return { nombre: 'Propietario desconocido', apellido: '' };
    }
    
    const usuario = usuariosList.find(u => u.id === colmena.dueno);
    return usuario ? {
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || ''
    } : { nombre: 'Propietario desconocido', apellido: '' };
  };

  // Función para obtener estado de la colmena
  const getStatusBadge = (colmena) => {
    if (colmena.activo === 1 || colmena.activo === true) {
      return <span className="badge badge-success">Activa</span>;
    } else {
      return <span className="badge badge-secondary">Inactiva</span>;
    }
  };

  // Función para contar nodos asociados a la colmena
  const getColmenaNodos = (colmenaId) => {
    // Esta función dependería de si tienes información de nodo_colmena
    // Por ahora retorna un placeholder
    return { count: 0, lastUpdate: null };
  };

  if (loading && colmenasList.length === 0) {
    return <Loading message="Cargando colmenas..." />;
  }

  return (
    <div>
      <div className="flex flex-between flex-center mb-6">
        <div>
          <h1 className="page-title flex items-center" style={{ margin: 0 }}>
            <Home className="h-8 w-8 mr-3 text-bee-green" />
            Gestión de Colmenas
          </h1>
          <p className="text-gray-600 mt-1">Administra las colmenas del sistema SmartBee</p>
        </div>
        
        <div className="flex flex-gap">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => handleOpenModal()}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Colmena
          </button>
        </div>
      </div>

      {alertMessage && (
        <Alert 
          type={alertMessage.type}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}

      <Card title={`Colmenas Registradas (${colmenasList.length})`}>
        {colmenasList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
            <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>
              No hay colmenas registradas
            </h3>
            <p>Comienza agregando tu primera colmena al sistema</p>
            <button 
              className="btn btn-primary mt-4"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Colmena
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colmenasList.map((colmena) => {
              const propietario = getPropietarioInfo(colmena);
              const nodosInfo = getColmenaNodos(colmena.id);
              
              return (
                <div key={colmena.id} className="border border-gray-200 rounded-lg p-6 card-hover bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-bee-green bg-opacity-20 p-3 rounded-lg">
                      <Home className="h-6 w-6 text-bee-green" />
                    </div>
                    <div className="flex flex-gap">
                      {getStatusBadge(colmena)}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">
                      Colmena {colmena.id}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2 text-bee-green" />
                        <span className="font-medium">
                          {propietario.nombre} {propietario.apellido}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Activity className="h-4 w-4 mr-2 text-bee-yellow" />
                        {nodosInfo.count} nodo(s) conectado(s)
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Package className="h-4 w-4 mr-2 text-gray-500" />
                        ID: <code className="ml-1 bg-gray-100 px-1 rounded text-xs">{colmena.id}</code>
                      </div>
                    </div>
                  </div>

                  {colmena.descripcion && (
                    <div className="mb-4 p-3 bg-white bg-opacity-60 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {colmena.descripcion}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      {colmena.dueno}
                    </span>
                    
                    <div className="flex flex-gap">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenModal(colmena)}
                        disabled={isSubmitting}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(colmena.id, colmena.descripcion)}
                        disabled={isSubmitting}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal para crear/editar colmena */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingColmena ? 'Editar Colmena' : 'Nueva Colmena'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          {/* Campo ID solo para nuevas colmenas */}
          {!editingColmena && (
            <div className="form-group">
              <label className="form-label">ID de Colmena * (máx. 64 caracteres)</label>
              <input
                type="text"
                className={`form-input ${formErrors.id ? 'error' : ''}`}
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                placeholder="Ej: COL001, HIVE_NORTE_01, etc."
                maxLength="64"
                disabled={isSubmitting}
                style={{ fontFamily: 'monospace' }}
              />
              {formErrors.id && (
                <div className="error-message">{formErrors.id}</div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                Este será el identificador único de la colmena
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Descripción * (máx. 1024 caracteres)</label>
            <textarea
              className={`form-input ${formErrors.descripcion ? 'error' : ''}`}
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Describe las características de la colmena..."
              maxLength="1024"
              rows="4"
              disabled={isSubmitting}
            />
            {formErrors.descripcion && (
              <div className="error-message">{formErrors.descripcion}</div>
            )}
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
              {formData.descripcion.length}/1024 caracteres
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Propietario *</label>
            <select
              className={`form-select ${formErrors.dueno ? 'error' : ''}`}
              value={formData.dueno}
              onChange={(e) => {
                console.log('🔄 Cambiando propietario a:', e.target.value);
                setFormData({...formData, dueno: e.target.value});
              }}
              disabled={isSubmitting}
            >
              <option value="">Selecciona un propietario</option>
              {usuariosList.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre} {usuario.apellido} ({usuario.id})
                </option>
              ))}
            </select>
            {formErrors.dueno && (
              <div className="error-message">{formErrors.dueno}</div>
            )}
            {formData.dueno && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                Propietario seleccionado: {formData.dueno}
              </div>
            )}
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
                (editingColmena ? 'Actualizando...' : 'Creando...') : 
                (editingColmena ? 'Actualizar' : 'Crear')
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Colmenas;