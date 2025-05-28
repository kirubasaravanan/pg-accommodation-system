import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // No longer directly using axios for this fetch
import { 
  // fetchRoomConfigurationTypes, // No longer fetched here
  deleteRoomConfigurationType,
  addRoomConfigurationType,
  updateRoomConfigurationType
} from '../api'; // Import the function from api.js
import RoomConfigurationModal from './RoomConfigurationModal';
import ConfirmationModal from './ConfirmationModal'; // For delete confirmation
// import styles from './RoomConfigurationManagement.module.css'; // Optional: for specific styling

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'; // No longer needed here

const RoomConfigurationManagement = ({ 
  onBack, 
  roomConfigurationTypes, // Use this prop for data
  onRefreshConfigurations // Callback to refresh data in parent
}) => {
  // Removed internal states: configurations, loading (for fetch)
  // Error state is kept for save/delete errors
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfiguration, setEditingConfiguration] = useState(null);

  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  // Removed getToken function
  // Removed fetchConfigurations function
  // Removed useEffect hook that called fetchConfigurations

  // useEffect to log when roomConfigurationTypes prop changes (for debugging and to see if it's populated)
  useEffect(() => {
    console.log('RoomConfigurationManagement: roomConfigurationTypes prop updated:', roomConfigurationTypes);
  }, [roomConfigurationTypes]);

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
    // Token is now handled by Axios interceptor in api.js
    try {
      if (id) {
        await updateRoomConfigurationType(id, configData); // Token no longer passed
      } else {
        await addRoomConfigurationType(configData); // Token no longer passed
      }
      setSuccessMessage(id ? 'Configuration updated successfully!' : 'Configuration created successfully!');
      if (onRefreshConfigurations) {
        onRefreshConfigurations(); // Refresh data via parent
      }
      setIsModalOpen(false);
      setEditingConfiguration(null);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${id ? 'update' : 'create'} configuration.`);
    }
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;
    setError('');
    setSuccessMessage('');
    // Token is now handled by Axios interceptor in api.js
    try {
      await deleteRoomConfigurationType(configToDelete._id); // Token no longer passed
      setSuccessMessage('Configuration deleted successfully!');
      if (onRefreshConfigurations) {
        onRefreshConfigurations(); // Refresh data via parent
      }
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

  // Loading state can be inferred if roomConfigurationTypes is undefined or null,
  // but NewAdminDashboard should ideally handle overall loading state.
  // For now, we'll check if roomConfigurationTypes is available.
  if (!roomConfigurationTypes) {
    return <div style={{color: 'white'}}>Loading configurations...</div>;
  }

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

      {/* Use roomConfigurationTypes prop directly */}
      {roomConfigurationTypes.length === 0 && <p>No room configuration types found. Click "Add New Type" to create one.</p>}
      
      {roomConfigurationTypes.length > 0 && (
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
            {/* Use roomConfigurationTypes prop directly */}
            {roomConfigurationTypes.map((config) => (
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
          message={`Are you sure you want to delete the configuration: \"${configToDelete.name}\"? This cannot be undone.`}
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
