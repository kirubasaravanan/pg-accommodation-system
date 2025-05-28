import React, { useState } from 'react';
// import styles from './RoomsAndRentSetup.module.css'; // Optional: Create and use specific styles

const RoomsAndRentSetup = ({
  onBack,
  rooms, // List of all rooms
  // tenants, // Not directly used in this simplified room setup, but available if needed
  roomConfigurationTypes, // For the dropdown in add/edit room forms
  // fetchData, // To refresh data after actions - handleAddRoom etc. should do this
  handleAddRoom, // Function to add a new room
  handleEditRoom, // Function to set current editing room and show modal
  // handleUpdateRoom, // This is typically called by the EditRoomModal, not directly here
  handleDeleteRoom, // Function to delete a room
  // getTenantsForRoom, // Not directly used here
  // token // Not directly used here if all API calls are via passed handlers
}) => {

  const initialNewRoomFormState = {
    name: '',
    location: '',
    roomConfigurationType: '', // This will be the ID of the room configuration type
    // price and max occupancy will be derived from roomConfigurationType or set in modal
  };
  const [newRoomForm, setNewRoomForm] = useState(initialNewRoomFormState);
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);

  const handleNewRoomFormChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...newRoomForm, [name]: value };

    if (name === "roomConfigurationType") {
      const selectedConfig = roomConfigurationTypes.find(config => config._id === value);
      updatedForm = {
        ...updatedForm,
        // Optional: auto-fill price/max occupancy if needed directly in this form
        // price: selectedConfig ? selectedConfig.baseRent : '',
        // occupancyMax: selectedConfig ? selectedConfig.baseSharingCapacity : '',
      };
    }
    setNewRoomForm(updatedForm);
  };

  const handleAddNewRoomSubmit = async (e) => {
    e.preventDefault();
    if (!newRoomForm.name || !newRoomForm.roomConfigurationType) {
      alert('Please fill in all required fields (Room Name, Room Configuration Type).');
      return;
    }
    // The handleAddRoom prop expects the full roomData, including price and occupancy.max
    // These are typically set based on roomConfigurationType in the backend or main dashboard logic.
    // For now, we pass what we have; ensure handleAddRoom in NewAdminDashboard correctly sets these.
    // Or, ensure the modal used for adding (if any) or the direct API call populates these.
    // The current handleAddRoom in NewAdminDashboard expects roomData.roomConfigurationType (ID)
    // and then maps it to roomConfigurationTypeId. It also expects price and occupancy.max.
    // Let's ensure the payload is compatible or adjust.

    const selectedConfig = roomConfigurationTypes.find(config => config._id === newRoomForm.roomConfigurationType);

    const roomPayload = {
        name: newRoomForm.name,
        location: newRoomForm.location,
        roomConfigurationType: newRoomForm.roomConfigurationType, // This is the ID
        price: selectedConfig ? selectedConfig.baseRent : 0, // Get from selected config
        occupancy: {
            current: 0, // New rooms start with 0 current occupants
            max: selectedConfig ? selectedConfig.baseSharingCapacity : 0 // Get from selected config
        }
    };

    try {
      await handleAddRoom(roomPayload); // handleAddRoom is passed from NewAdminDashboard
      setNewRoomForm(initialNewRoomFormState);
      setShowAddRoomForm(false);
      // fetchData(); // Data is refreshed by handleAddRoom in NewAdminDashboard
    } catch (error) {
      console.error("Error adding room from RoomsAndRentSetup:", error);
      // Alert is likely handled within handleAddRoom itself
    }
  };

  return (
    <div style={{ padding: '20px' }}> {/* Basic styling */}
      <button onClick={onBack} style={{ marginBottom: '20px' }}>Back to Admin Console</button>
      <h2>Rooms and Rent Setup</h2>
      
      <section style={{ marginBottom: '30px' }}>
        <h3>Room Setup</h3>
        <button onClick={() => setShowAddRoomForm(!showAddRoomForm)} style={{ marginBottom: '10px' }}>
          {showAddRoomForm ? 'Cancel Adding Room' : 'Add New Room'}
        </button>

        {showAddRoomForm && (
          <form onSubmit={handleAddNewRoomSubmit} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
            <div>
              <label>Room Name/Number: </label>
              <input type="text" name="name" value={newRoomForm.name} onChange={handleNewRoomFormChange} required />
            </div>
            <div style={{ marginTop: '10px' }}>
              <label>Location (e.g., Floor, Wing): </label>
              <input type="text" name="location" value={newRoomForm.location} onChange={handleNewRoomFormChange} />
            </div>
            <div style={{ marginTop: '10px' }}>
              <label>Room Configuration Type: </label>
              <select name="roomConfigurationType" value={newRoomForm.roomConfigurationType} onChange={handleNewRoomFormChange} required>
                <option value="">Select Type</option>
                {roomConfigurationTypes && roomConfigurationTypes.map(config => (
                  <option key={config._id} value={config._id}>{config.name} (Max: {config.baseSharingCapacity}, Rent: ${config.baseRent})</option>
                ))}
              </select>
            </div>
            {/* Price and Max Occupancy are derived from selected Room Configuration Type */}
            {newRoomForm.roomConfigurationType && roomConfigurationTypes.find(rc => rc._id === newRoomForm.roomConfigurationType) && (
                <div style={{ marginTop: '10px', fontStyle: 'italic' }}>
                    <p>Base Rent: ${roomConfigurationTypes.find(rc => rc._id === newRoomForm.roomConfigurationType).baseRent}</p>
                    <p>Max Occupancy: {roomConfigurationTypes.find(rc => rc._id === newRoomForm.roomConfigurationType).baseSharingCapacity}</p>
                </div>
            )}
            <button type="submit" style={{ marginTop: '15px' }}>Save New Room</button>
          </form>
        )}

        <h4>Existing Rooms:</h4>
        {(!rooms || rooms.length === 0) && <p>No rooms created yet.</p>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Location</th>
              <th style={tableHeaderStyle}>Type</th>
              <th style={tableHeaderStyle}>Price</th>
              <th style={tableHeaderStyle}>Max Occupancy</th>
              <th style={tableHeaderStyle}>Current Occupancy</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms && rooms.map(room => {
              const config = room.roomConfigurationType && typeof room.roomConfigurationType === 'object' 
                             ? room.roomConfigurationType 
                             : roomConfigurationTypes.find(rc => rc._id === room.roomConfigurationType);
              return (
                <tr key={room._id}>
                  <td style={tableCellStyle}>{room.name}</td>
                  <td style={tableCellStyle}>{room.location}</td>
                  <td style={tableCellStyle}>{config ? config.name : 'N/A'}</td>
                  <td style={tableCellStyle}>${room.price}</td>
                  <td style={tableCellStyle}>{room.occupancy ? room.occupancy.max : 'N/A'}</td>
                  <td style={tableCellStyle}>{room.occupancy ? room.occupancy.current : 'N/A'}</td>
                  <td style={tableCellStyle}>
                    <button onClick={() => handleEditRoom(room)} style={{ marginRight: '5px' }}>Edit</button>
                    <button onClick={() => handleDeleteRoom(room._id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <hr style={{ margin: '20px 0' }} />

      <section>
        <h3>Rent Setup</h3>
        <p>Rent details for specific occupancy types (based on Room Configuration Types):</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Occupancy Type (Config Name)</th>
              <th style={tableHeaderStyle}>Monthly Rent (Base)</th>
              <th style={tableHeaderStyle}>Daily Rent (Calculated)</th>
            </tr>
          </thead>
          <tbody>
            {roomConfigurationTypes && roomConfigurationTypes
              .filter(rc => ['Private Mini', 'Private', 'Double Occupancy', 'Triple Occupancy', 'Four Occupancy', 'Five Occupancy'].includes(rc.name))
              .map(config => (
                <tr key={config._id}>
                  <td style={tableCellStyle}>{config.name}</td>
                  <td style={tableCellStyle}>{config.baseRent ? `$${config.baseRent.toFixed(2)}` : 'N/A'}</td>
                  <td style={tableCellStyle}>{config.baseRent ? `$${(config.baseRent / 30).toFixed(2)}` : 'N/A'}</td> 
                </tr>
            ))}
            {roomConfigurationTypes && roomConfigurationTypes.filter(rc => !['Private Mini', 'Private', 'Double Occupancy', 'Triple Occupancy', 'Four Occupancy', 'Five Occupancy'].includes(rc.name)).length > 0 && (
                <tr><td colSpan="3" style={{paddingTop: '10px', fontStyle: 'italic'}}>Other configuration types exist but are not listed here.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

// Basic styles for the table (can be moved to a CSS module)
const tableHeaderStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
  backgroundColor: '#f2f2f2',
};

const tableCellStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
};

export default RoomsAndRentSetup;
