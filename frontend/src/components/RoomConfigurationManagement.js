import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assuming you use axios
import RoomConfigurationModal from './RoomConfigurationModal';
import ConfirmationModal from './ConfirmationModal'; // For delete confirmation
// import styles from './RoomConfigurationManagement.module.css'; // Optional: for specific styling

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'; // Adjust as needed

const RoomConfigurationManagement = ({ onBack }) => {
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfiguration, setEditingConfiguration] = useState(null);

  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  const getToken = () => localStorage.getItem('token');

  // Fetch configurations
  const fetchConfigurations = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await axios.get(`${API_BASE_URL}/api/room-configurations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfigurations(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch room configurations.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const handleAddNew = () => {
    setEditingConfiguration(null);
    setIsModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const handleEdit = (config) => {
    setEditingConfiguration(config);
    setIsModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const handleDeleteClick = (config) => {
    setConfigToDelete(config);
    setIsDeleteConfirmModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const handleSaveConfiguration = async (configData, id) => {
    setError('');
    setSuccessMessage('');
    const token = getToken();
    const url = id 
      ? `${API_BASE_URL}/api/room-configurations/${id}` 
      : `${API_BASE_URL}/api/room-configurations`;
    const method = id ? 'put' : 'post';

    try {
      const response = await axios[method](url, configData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage(id ? 'Configuration updated successfully!' : 'Configuration created successfully!');
      fetchConfigurations(); // Refresh list
      setIsModalOpen(false);
      setEditingConfiguration(null);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${id ? 'update' : 'create'} configuration.`);
      // Keep modal open if there's an error during save
      // setIsModalOpen(false); 
    }
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;
    setError('');
    setSuccessMessage('');
    const token = getToken();
    try {
      await axios.delete(`${API_BASE_URL}/api/room-configurations/${configToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage('Configuration deleted successfully!');
      fetchConfigurations(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete configuration.');
    }
    setIsDeleteConfirmModalOpen(false);
    setConfigToDelete(null);
  };

  // Basic styling for now, can be moved to a CSS module
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '20px', color: '#333' };
  const thTdStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left' };
  const buttonStyle = { marginRight: '5px', padding: '5px 10px', cursor: 'pointer' };
  const pageHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };

  if (loading) return <div style={{color: 'white'}}>Loading configurations...</div>;
  // Error display needs to be visible on the blue background
  // Success message display also needs to be visible

  return (
    <div style={{ padding: '20px', backgroundColor: '#6C8EBF', color: 'white', borderRadius: '8px' }}>
      <div style={pageHeaderStyle}>
        <h2 style={{ margin: 0 }}>Room Configuration Types</h2>
        <button onClick={handleAddNew} style={{ ...buttonStyle, backgroundColor: '#28a745', color: 'white', border: 'none' }}>
          Add New Type
        </button>
      </div>
      <button onClick={onBack} style={{ ...buttonStyle, marginBottom: '15px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
        &larr; Back to Admin Console
      </button>

      {error && <div style={{ color: 'red', backgroundColor: 'white', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>Error: {error}</div>}
      {successMessage && <div style={{ color: 'green', backgroundColor: 'lightgreen', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>{successMessage}</div>}

      {configurations.length === 0 && !loading && <p>No room configuration types found. Click "Add New Type" to create one.</p>}
      
      {configurations.length > 0 && (
        <table style={tableStyle} className="configurations-table">
          <thead style={{ backgroundColor: '#f2f2f2' }}>
            <tr>
              <th style={thTdStyle}>Name</th>
              <th style={thTdStyle}>Base Capacity</th>
              <th style={thTdStyle}>Base Rent</th>
              <th style={thTdStyle}>Convertible?</th>
              <th style={thTdStyle}>AC Status</th>
              <th style={thTdStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {configurations.map((config) => (
              <tr key={config._id} style={{ backgroundColor: 'white' }}>
                <td style={thTdStyle}>{config.name}</td>
                <td style={thTdStyle}>{config.baseSharingCapacity}</td>
                <td style={thTdStyle}>{config.baseRent}</td>
                <td style={thTdStyle}>{config.isConvertible ? `Yes (To ${config.convertedSharingCapacity} @ ${config.convertedRent})` : 'No'}</td>
                <td style={thTdStyle}>{config.acStatus}</td>
                <td style={thTdStyle}>
                  <button onClick={() => handleEdit(config)} style={{ ...buttonStyle, backgroundColor: '#ffc107', color: 'black', border: 'none' }}>Edit</button>
                  <button onClick={() => handleDeleteClick(config)} style={{ ...buttonStyle, backgroundColor: '#dc3545', color: 'white', border: 'none' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <RoomConfigurationModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingConfiguration(null);
            setError(''); // Clear error when modal is closed manually
          }}
          existingConfiguration={editingConfiguration}
          onSave={handleSaveConfiguration}
        />
      )}

      {isDeleteConfirmModalOpen && configToDelete && (
        <ConfirmationModal
          isOpen={isDeleteConfirmModalOpen}
          title="Confirm Deletion"
          message={`Are you sure you want to delete the configuration: "${configToDelete.name}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsDeleteConfirmModalOpen(false);
            setConfigToDelete(null);
            setError('');
          }}
          confirmText="Yes, Delete"
          cancelText="No, Cancel"
        />
      )}
    </div>
  );
};

export default RoomConfigurationManagement;
