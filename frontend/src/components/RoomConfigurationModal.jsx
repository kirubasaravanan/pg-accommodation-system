import React, { useState, useEffect } from 'react';

const RoomConfigurationModal = ({ onClose, existingConfiguration, onSave }) => {
  const [configurationName, setConfigurationName] = useState('');
  const [baseSharingCapacity, setBaseSharingCapacity] = useState('');
  const [baseRent, setBaseRent] = useState('');
  const [isConvertible, setIsConvertible] = useState(false);
  const [convertedSharingCapacity, setConvertedSharingCapacity] = useState('');
  const [convertedRent, setConvertedRent] = useState('');
  const [acStatus, setAcStatus] = useState('Non-AC (Standard)'); // Default AC Status
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const isEditing = Boolean(existingConfiguration);

  useEffect(() => {
    if (isEditing && existingConfiguration) {
      setConfigurationName(existingConfiguration.name || '');
      setBaseSharingCapacity(existingConfiguration.baseSharingCapacity?.toString() || '');
      setBaseRent(existingConfiguration.baseRent?.toString() || '');
      setIsConvertible(existingConfiguration.isConvertible || false);
      setConvertedSharingCapacity(existingConfiguration.convertedSharingCapacity?.toString() || '');
      setConvertedRent(existingConfiguration.convertedRent?.toString() || '');
      setAcStatus(existingConfiguration.acStatus || 'Non-AC (Standard)');
      setDescription(existingConfiguration.description || '');
    }
  }, [existingConfiguration, isEditing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!configurationName.trim()) {
      setError('Configuration Name is required.');
      return;
    }
    if (!baseSharingCapacity || isNaN(Number(baseSharingCapacity)) || Number(baseSharingCapacity) <= 0) {
      setError('Valid Base Sharing Capacity is required.');
      return;
    }
    if (!baseRent || isNaN(Number(baseRent)) || Number(baseRent) <= 0) {
      setError('Valid Base Rent is required.');
      return;
    }
    if (isConvertible) {
      if (!convertedSharingCapacity || isNaN(Number(convertedSharingCapacity)) || Number(convertedSharingCapacity) <= 0) {
        setError('Valid Converted Sharing Capacity is required when convertible.');
        return;
      }
      if (!convertedRent || isNaN(Number(convertedRent)) || Number(convertedRent) < 0) { // Allow 0 for rent if needed
        setError('Valid Converted Rent is required when convertible.');
        return;
      }
    }

    const configurationData = {
      name: configurationName,
      baseSharingCapacity: Number(baseSharingCapacity),
      baseRent: Number(baseRent),
      isConvertible,
      convertedSharingCapacity: isConvertible ? Number(convertedSharingCapacity) : null,
      convertedRent: isConvertible ? Number(convertedRent) : null,
      acStatus, // Ensure acStatus is included
      description,
    };

    // In a real app, you'd call an API to save this data.
    // For now, we'll use the onSave prop if provided, or log to console.
    if (onSave) {
      onSave(configurationData, existingConfiguration?._id);
    } else {
      console.log('Room Configuration Data:', configurationData);
      alert(isEditing ? 'Configuration Updated (see console)!' : 'Configuration Created (see console)!');
    }
    onClose(); // Close modal on successful submission
  };

  // Style for the form elements to be more visible on the blue background
  const inputStyle = {
    backgroundColor: 'white',
    color: 'black',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%',
    marginBottom: '10px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  };

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  };

  const checkboxStyle = {
    marginRight: '8px',
  };

  return (
    <div style={{ backgroundColor: '#6C8EBF', color: 'white', padding: '20px', borderRadius: '8px', minWidth: '400px', maxWidth: '500px', position: 'relative' }}>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          position: 'absolute',
          top: '10px',
          right: '15px',
        }}
        title="Close (ESC)"
      >
        &times;
      </button>
      <h2 className="text-xl font-bold mb-6 text-center">{isEditing ? 'Edit Room Configuration' : 'Add New Room Configuration'}</h2>
      
      {error && <div style={{ color: 'red', backgroundColor: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label style={labelStyle} htmlFor="configurationName">Configuration Name / Type Label:</label>
          <input
            style={inputStyle}
            type="text"
            id="configurationName"
            value={configurationName}
            onChange={(e) => setConfigurationName(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="baseSharingCapacity">Base Sharing Capacity:</label>
          <input
            style={inputStyle}
            type="number"
            id="baseSharingCapacity"
            value={baseSharingCapacity}
            onChange={(e) => setBaseSharingCapacity(e.target.value)}
            min="1"
            required
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="baseRent">Base Rent (per person):</label>
          <input
            style={inputStyle}
            type="number"
            id="baseRent"
            value={baseRent}
            onChange={(e) => setBaseRent(e.target.value)}
            min="0"
            required
          />
        </div>

        <div style={checkboxLabelStyle}>
          <input
            style={checkboxStyle}
            type="checkbox"
            id="isConvertible"
            checked={isConvertible}
            onChange={(e) => setIsConvertible(e.target.checked)}
          />
          <label htmlFor="isConvertible">Is Convertible?</label>
        </div>

        {isConvertible && (
          <>
            <div>
              <label style={labelStyle} htmlFor="convertedSharingCapacity">Converted Sharing Capacity:</label>
              <input
                style={inputStyle}
                type="number"
                id="convertedSharingCapacity"
                value={convertedSharingCapacity}
                onChange={(e) => setConvertedSharingCapacity(e.target.value)}
                min="1"
                required={isConvertible}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="convertedRent">Converted Rent (per person):</label>
              <input
                style={inputStyle}
                type="number"
                id="convertedRent"
                value={convertedRent}
                onChange={(e) => setConvertedRent(e.target.value)}
                min="0"
                required={isConvertible}
              />
            </div>
          </>
        )}

        <div>
          <label style={labelStyle} htmlFor="acStatus">AC Status:</label>
          <select
            style={inputStyle}
            id="acStatus"
            value={acStatus}
            onChange={(e) => setAcStatus(e.target.value)}
            required
          >
            <option value="Non-AC (Standard)">Non-AC (Standard)</option>
            <option value="Non-AC (Cooler Space)">Non-AC (Cooler Space)</option>
            <option value="AC (Standard)">AC (Standard)</option>
            <option value="AC (Customizable)">AC (Customizable)</option>
          </select>
        </div>

        <div>
          <label style={labelStyle} htmlFor="description">Description / Notes:</label>
          <textarea
            style={{...inputStyle, height: '80px'}}
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ padding: '10px 15px', marginRight: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {isEditing ? 'Save Changes' : 'Create Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomConfigurationModal;
