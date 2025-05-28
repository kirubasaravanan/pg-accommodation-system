import React, { useState, useEffect } from 'react';

const EditTenantModal = ({ 
  editingTenant: initialTenantData,
  rooms, 
  handleCancelEditTenant, 
  onSaveTenant,
  ACCOMMODATION_TYPES,
  RENT_STATUS,
  allRoomConfigurationTypes,
  allTenants // Added allTenants prop
}) => {
  const [tenantData, setTenantData] = useState(null);
  const [filteredRoomsForTenant, setFilteredRoomsForTenant] = useState([]);
  const [availableBedsInSelectedRoom, setAvailableBedsInSelectedRoom] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [aadharFile, setAadharFile] = useState(null); // New state for the file object

  // Log received props when component mounts or props change
  useEffect(() => {
    console.log('[EditTenantModal] Props received on mount/update:', { 
      editingTenant: initialTenantData, 
      rooms, 
      handleCancelEditTenant, 
      onSaveTenant, 
      ACCOMMODATION_TYPES, 
      RENT_STATUS, 
      allRoomConfigurationTypes,
      allTenants // Log allTenants
    });
    console.log('[EditTenantModal] Type of onSaveTenant prop on mount/update:', typeof onSaveTenant);
  }, [initialTenantData, rooms, handleCancelEditTenant, onSaveTenant, ACCOMMODATION_TYPES, RENT_STATUS, allRoomConfigurationTypes, allTenants]); // Added allTenants to dependency array

  useEffect(() => {
    if (initialTenantData) {
      console.log('[EditTenantModal] Initializing with tenantData:', JSON.stringify(initialTenantData, null, 2));
      
      let currentRoomId = '';
      if (initialTenantData.room) { 
          if (typeof initialTenantData.room === 'object' && initialTenantData.room._id) {
              currentRoomId = initialTenantData.room._id;
          } else if (typeof initialTenantData.room === 'string') {
              // If initialTenantData.room is a room name, find its ID
              if (rooms && rooms.length > 0) {
                  const roomObject = rooms.find(r => r.name === initialTenantData.room);
                  if (roomObject) {
                      currentRoomId = roomObject._id;
                  } else {
                      console.warn(`[EditTenantModal] Current room name "${initialTenantData.room}" not found in provided rooms list during init. 'No Room Assigned' will be selected.`);
                  }
              } else {
                  console.warn(`[EditTenantModal] Rooms list is not available or empty during init while trying to map room name "${initialTenantData.room}" to an ID. 'No Room Assigned' will be selected.`);
              }
          } else {
            console.warn(`[EditTenantModal] initialTenantData.room is neither a recognized object with _id nor a string:`, initialTenantData.room);
          }
      }

      let autoPreferredRoomTypeId = initialTenantData.preferredRoomType?._id || initialTenantData.preferredRoomType || '';
      if (currentRoomId && !autoPreferredRoomTypeId && rooms && allRoomConfigurationTypes) {
        const currentRoomDetails = rooms.find(r => r._id === currentRoomId);
        if (currentRoomDetails && currentRoomDetails.roomConfigurationType) {
          const roomConfigId = typeof currentRoomDetails.roomConfigurationType === 'object' 
            ? currentRoomDetails.roomConfigurationType._id 
            : currentRoomDetails.roomConfigurationType;
          if (allRoomConfigurationTypes.some(config => config._id === roomConfigId)) {
            autoPreferredRoomTypeId = roomConfigId;
            console.log(`[EditTenantModal] Auto-populating preferredRoomType to ${autoPreferredRoomTypeId} based on current room.`);
          }
        }
      }

      setTenantData({
        ...initialTenantData,
        room: currentRoomId, 
        moveInDate: initialTenantData.moveInDate ? initialTenantData.moveInDate.split('T')[0] : '',
        moveOutDate: initialTenantData.moveOutDate ? initialTenantData.moveOutDate.split('T')[0] : '',
        intendedVacationDate: initialTenantData.intendedVacationDate ? initialTenantData.intendedVacationDate.split('T')[0] : '',
        securityDeposit: initialTenantData.securityDeposit || { amount: '', refundableType: 'fully', conditions: '' },
        preferredRoomType: autoPreferredRoomTypeId,
        bedNumber: initialTenantData.bedNumber || '', // Ensure bedNumber is initialized
        aadharFileName: initialTenantData.aadharFileName || '', // Initialize aadharFileName
      });
    }
  }, [initialTenantData, rooms, allRoomConfigurationTypes]);

  // Effect to filter rooms based on selected preferredRoomType
  useEffect(() => {
    if (tenantData?.preferredRoomType && rooms && allRoomConfigurationTypes) {
      const preferredTypeObj = allRoomConfigurationTypes.find(rt => rt._id === tenantData.preferredRoomType);
      if (preferredTypeObj) {
        const filtered = rooms.filter(room => {
          const roomConfigType = room.roomConfigurationType?._id || room.roomConfigurationType;
          const hasVacancy = room.occupancy.max - room.occupancy.current > 0;
          const isCurrentRoomOfTenant = room._id === tenantData.room; // Check if it is the tenant's current room
          // A room is suitable if its type matches preferred and (it has vacancy OR it's the tenant's current room)
          return roomConfigType === tenantData.preferredRoomType && (hasVacancy || isCurrentRoomOfTenant);
        });
        setFilteredRoomsForTenant(filtered);
      } else {
        setFilteredRoomsForTenant(rooms?.filter(room => (room.occupancy.max - room.occupancy.current > 0) || room._id === tenantData.room) || []);
      }
    } else {
      setFilteredRoomsForTenant(rooms?.filter(room => (room.occupancy.max - room.occupancy.current > 0) || room._id === tenantData.room) || []);
    }
  }, [tenantData?.preferredRoomType, tenantData?.room, rooms, allRoomConfigurationTypes]);

  // Effect to update available beds when selected room changes
  useEffect(() => {
    if (tenantData?.room && rooms && allTenants) { // Added allTenants to condition
      const selectedRoomDetails = rooms.find(r => r._id === tenantData.room);
      if (selectedRoomDetails && selectedRoomDetails.occupancy?.max > 0) {
        const beds = [];
        // Ensure t is not null and compare room IDs
        const tenantsInSelectedRoom = allTenants.filter(t => 
          t && 
          t.room === selectedRoomDetails._id && // Compare with selectedRoomDetails._id
          t._id !== tenantData?._id
        );
        
        for (let i = 1; i <= selectedRoomDetails.occupancy.max; i++) {
          const bedNumberString = String(i);
          const isOccupiedByOther = tenantsInSelectedRoom.some(t => t.bedNumber === bedNumberString);
          beds.push({
            number: bedNumberString,
            isOccupied: isOccupiedByOther
          }); 
        }
        setAvailableBedsInSelectedRoom(beds);
      } else {
        setAvailableBedsInSelectedRoom([]);
      }
    } else {
      setAvailableBedsInSelectedRoom([]);
    }
  }, [tenantData?.room, rooms, allTenants, tenantData?._id]); // Added allTenants and tenantData._id to dependency array


  if (!tenantData) return null;

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (name === "aadharFile") {
      if (files && files[0]) {
        setAadharFile(files[0]);
        setTenantData(prev => ({ ...prev, aadharFileName: files[0].name }));
      } else {
        setAadharFile(null);
        setTenantData(prev => ({ ...prev, aadharFileName: '' }));
      }
      return; 
    }

    if (name.startsWith('securityDeposit.')) {
      const field = name.split('.')[1];
      setTenantData(prev => ({ 
        ...prev, 
        securityDeposit: { ...prev.securityDeposit, [field]: value } 
      }));
    } else {
      setTenantData(prev => ({ ...prev, [name]: value }));
    }

    // If room selection changes, reset bed number if the new room is different
    // or if no room is selected.
    if (name === 'room') {
        // Only reset bedNumber if the selected room actually changes to a different room or to 'No Room Assigned'
        // And if the tenantData already exists to avoid issues on initial load.
        if (tenantData && tenantData.room !== value) { 
            setTenantData(prev => ({ ...prev, bedNumber: '' }));
        }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[EditTenantModal] handleSubmit called.');
    console.log('[EditTenantModal] Value of onSaveTenant in handleSubmit:', onSaveTenant);
    console.log('[EditTenantModal] Type of onSaveTenant in handleSubmit:', typeof onSaveTenant);

    if (typeof onSaveTenant === 'function') {
      const dataToSave = {
        ...tenantData,
        // Ensure room is just the ID string or null
        room: tenantData.room || null, 
        // Ensure preferredRoomType is just the ID string or null
        preferredRoomType: tenantData.preferredRoomType || null,
      };
      // Remove _id if it's for a new tenant and it's an empty string from initialTenantFormState
      if (!dataToSave._id) {
        delete dataToSave._id;
      }

      // If an Aadhar file is selected, it should be handled here.
      // Typically, this would involve FormData if uploading directly,
      // or passing the file object to a handler that manages uploads.
      // For now, we're just logging it. The actual upload mechanism
      // would require more extensive changes (e.g., API endpoint, FormData).
      if (aadharFile) {
        console.log('[EditTenantModal] Aadhar file selected:', aadharFile.name);
        // dataToSave.aadharFile = aadharFile; // Don't add the file object directly to JSON
      }
      
      onSaveTenant(dataToSave);
    } else {
      console.error('[EditTenantModal] ERROR: onSaveTenant is not a function inside handleSubmit!');
      alert('Save operation failed: onSaveTenant is not correctly configured.');
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Personal Info
        return (
          <>
            <label style={labelStyle}>Full Name:</label>
            <input name="name" value={tenantData.name} onChange={handleChange} style={inputStyle} required />
            
            <label style={labelStyle}>Phone Number:</label>
            <input name="contact" value={tenantData.contact} onChange={handleChange} style={inputStyle} required />
            
            <label style={labelStyle}>Aadhaar Card Number:</label>
            <input name="aadharNumber" value={tenantData.aadharNumber || ''} onChange={handleChange} style={inputStyle} />
            
            <label style={labelStyle}>Upload Aadhaar Card (PDF/Image):</label>
            <input 
              type="file" 
              name="aadharFile" 
              onChange={handleChange} 
              style={inputStyle} 
              accept=".pdf,.jpg,.jpeg,.png" 
            />
            {tenantData.aadharFileName && <p style={{fontSize: '0.9em', color: '#555'}}>Selected file: {tenantData.aadharFileName}</p>}


            <label style={labelStyle}>Email ID:</label>
            <input name="email" type="email" value={tenantData.email || ''} onChange={handleChange} style={inputStyle} />

            <label style={labelStyle}>Date of Birth:</label>
            <input name="dob" type="date" value={tenantData.dob ? tenantData.dob.split('T')[0] : ''} onChange={handleChange} style={inputStyle} />

            <label style={labelStyle}>Emergency Contact:</label>
            <input name="emergencyContact" placeholder="Emergency Contact (Optional)" value={tenantData.emergencyContact || ''} onChange={handleChange} style={inputStyle} />

            <label style={labelStyle}>Remarks:</label>
            <textarea name="remarks" placeholder="Remarks (Optional)" value={tenantData.remarks || ''} onChange={handleChange} style={{...inputStyle, height: '80px'}} />
          </>
        );
      case 2: // Stay Info
        return (
          <>
            <label style={labelStyle}>Stay Type (Accommodation Type):</label>
            <select name="accommodationType" value={tenantData.accommodationType} onChange={handleChange} style={selectStyle}>
              {ACCOMMODATION_TYPES.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>

            <label style={labelStyle}>Room Type Preference:</label>
            <select name="preferredRoomType" value={tenantData.preferredRoomType || ''} onChange={handleChange} style={selectStyle}>
              <option value="">Select Preferred Room Type</option>
              {allRoomConfigurationTypes && allRoomConfigurationTypes.map(type => (
                <option key={type._id} value={type._id}>{type.name}</option>
              ))}
            </select>

            <label style={labelStyle}>Move In Date:</label>
            <input name="moveInDate" type="date" value={tenantData.moveInDate} onChange={handleChange} style={inputStyle} />
            
            <label style={labelStyle}>Move Out Date:</label>
            <input name="moveOutDate" type="date" value={tenantData.moveOutDate} onChange={handleChange} style={inputStyle} disabled={tenantData.status === 'Active'} />
            
            <label style={labelStyle}>Intended Vacation Date:</label>
            <input name="intendedVacationDate" type="date" value={tenantData.intendedVacationDate} onChange={handleChange} style={inputStyle} disabled={tenantData.status === 'Active'} />

            <label style={labelStyle}>Status:</label>
            <select name="status" value={tenantData.status} onChange={handleChange} style={selectStyle}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <label style={labelStyle}>Rent Status:</label>
            <select name="rentPaidStatus" value={tenantData.rentPaidStatus} onChange={handleChange} style={selectStyle}>
              {RENT_STATUS.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>

            <label style={labelStyle}>Security Deposit Amount:</label>
            <input name="securityDeposit.amount" type="number" placeholder="Amount" value={tenantData.securityDeposit.amount} onChange={handleChange} style={inputStyle} />
            
            <label style={labelStyle}>Security Deposit Type:</label>
            <select name="securityDeposit.refundableType" value={tenantData.securityDeposit.refundableType} onChange={handleChange} style={selectStyle}>
              <option value="fully">Fully Refundable</option>
              <option value="partial">Partially Refundable</option>
              <option value="non-refundable">Non-Refundable</option>
            </select>
            
            <label style={labelStyle}>Security Deposit Conditions:</label>
            <input name="securityDeposit.conditions" placeholder="Conditions (Optional)" value={tenantData.securityDeposit.conditions} onChange={handleChange} style={inputStyle} />

          </>
        );
      case 3: // Room Allocation
        return (
          <>
            <label style={labelStyle}>Assign Room:</label>
            <select name="room" value={tenantData.room || ''} onChange={handleChange} style={selectStyle}>
              <option value="">No Room Assigned</option>
              {filteredRoomsForTenant
                .map(r => {
                  const roomConfig = allRoomConfigurationTypes.find(rc => rc._id === (r.roomConfigurationType?._id || r.roomConfigurationType));
                  const roomTypeName = roomConfig ? roomConfig.name : 'N/A';
                  const currentOccupants = allTenants.filter(t => t.room === r.name).length;
                  const vacancy = r.occupancy.max - currentOccupants;
                  // If this room is the tenant's current room, vacancy calculation should reflect that this tenant is already counted.
                  // However, the logic for `displayVacancy` was complex and might be better handled by just showing max capacity and current occupants.
                  const displayInfo = `${r.name} (${roomTypeName}, ${r.location}) - Occupancy: ${currentOccupants}/${r.occupancy.max}`;
                  return (
                    <option key={r._id} value={r._id}>
                      {displayInfo}
                    </option>
                  );
                })}
            </select>

            {tenantData.room && availableBedsInSelectedRoom.length > 0 && (
              <>
                <label style={labelStyle}>Assign Bed Number:</label>
                <select name="bedNumber" value={tenantData.bedNumber || ''} onChange={handleChange} style={selectStyle}>
                  <option value="">Select Bed</option>
                  {availableBedsInSelectedRoom.map(bed => (
                    <option key={bed.number} value={bed.number} disabled={bed.isOccupied && tenantData.bedNumber !== bed.number}>
                      Bed {bed.number}{bed.isOccupied && tenantData.bedNumber !== bed.number ? ' (Occupied by other)' : ''}
                    </option>
                  ))}
                </select>
              </>
            )}
            {!tenantData.room && <p>Select a room to see available beds.</p>}
            {tenantData.room && availableBedsInSelectedRoom.length === 0 && <p>Selected room has no beds defined or an issue with bed data.</p>}

            <label style={labelStyle}>Custom Rent (Optional):</label>
            <input name="customRent" type="number" placeholder="Leave blank for default room rent" value={tenantData.customRent || ''} onChange={handleChange} style={inputStyle} />
          </>
        );
      case 4: // Confirmation
        const roomDetails = rooms.find(r => r._id === tenantData.room);
        const roomConfigDetails = roomDetails ? allRoomConfigurationTypes.find(rc => rc._id === (roomDetails.roomConfigurationType?._id || roomDetails.roomConfigurationType)) : null;
        const rentAmount = tenantData.customRent || (roomDetails ? roomDetails.price : 'N/A');

        return (
          <div style={{ lineHeight: '1.8' }}>
            <h4>Confirm Details:</h4>
            <p><strong>Name:</strong> {tenantData.name}</p>
            <p><strong>Contact:</strong> {tenantData.contact}</p>
            <p><strong>Email:</strong> {tenantData.email || 'N/A'}</p>
            <p><strong>Aadhaar:</strong> {tenantData.aadharNumber || 'N/A'}</p>
            <p><strong>DOB:</strong> {tenantData.dob ? new Date(tenantData.dob).toLocaleDateString() : 'N/A'}</p>
            <hr />
            <p><strong>Stay Type:</strong> {tenantData.accommodationType}</p>
            <p><strong>Preferred Room Type:</strong> {allRoomConfigurationTypes.find(rt => rt._id === tenantData.preferredRoomType)?.name || 'N/A'}</p>
            <p><strong>Move-in Date:</strong> {tenantData.moveInDate ? new Date(tenantData.moveInDate).toLocaleDateString() : 'N/A'}</p>
            <hr />
            <p><strong>Assigned Room:</strong> {roomDetails ? `${roomDetails.name} (${roomConfigDetails?.name || 'N/A'})` : 'Not Assigned'}</p>
            <p><strong>Bed Number:</strong> {tenantData.bedNumber || 'N/A'}</p>
            <p><strong>Rent Amount:</strong> ₹{rentAmount}</p>
            <hr />
            <p><strong>Status:</strong> {tenantData.status}</p>
            <p><strong>Security Deposit:</strong> ₹{tenantData.securityDeposit.amount || '0'} ({tenantData.securityDeposit.refundableType})</p>
          </div>
        );
      default:
        return <p>Unknown step</p>;
    }
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: '#f0f4f8',
    color: '#333',
    padding: '25px',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '700px', // Increased width for multi-step form
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555'
  };

  const selectStyle = { ...inputStyle };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: '28px',
    fontWeight: 'bold',
    cursor: 'pointer',
  };

  const buttonStyle = {
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    fontWeight: 600,
    cursor: 'pointer'
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#007bff' }}>{initialTenantData?._id ? 'Edit Tenant Details' : 'Add New Tenant'} - Step {currentStep} of 4</h3>
          <button onClick={handleCancelEditTenant} style={closeButtonStyle} aria-label="Close">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          {renderStepContent()}
          <div style={{ display: 'flex', gap: '12px', marginTop: '30px', justifyContent: 'space-between' }}>
            <div>
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} style={{ ...buttonStyle, background: '#6c757d', color: '#fff' }}>
                  Previous
                </button>
              )}
            </div>
            <div>
              {currentStep < 4 && (
                <button type="button" onClick={nextStep} style={{ ...buttonStyle, background: '#28a745', color: '#fff' }}>
                  Next
                </button>
              )}
              {currentStep === 4 && (
                <button type="submit" style={{ ...buttonStyle, background: '#007bff', color: '#fff' }}>
                  {initialTenantData?._id ? 'Save Changes' : 'Confirm & Add Tenant'}
                </button>
              )}
            </div>
          </div>
           <div style={{textAlign: 'right', marginTop: '10px'}}>
             <button type="button" onClick={handleCancelEditTenant} style={{ ...buttonStyle, background: 'transparent', color: '#dc3545', padding: '5px 0' }}>Cancel</button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default EditTenantModal;
