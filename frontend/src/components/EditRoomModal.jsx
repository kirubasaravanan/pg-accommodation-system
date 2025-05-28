import React, { useState, useEffect, useCallback } from 'react';

const EditRoomModal = ({ 
  editingRoom, 
  tenants, // Expecting all tenants, including those not assigned to any room
  handleCancelEditRoom, 
  handleSaveRoom, 
  onFormChange, 
  roomConfigurationTypes 
}) => {
  if (!editingRoom) return null;

  const [isEffectivelyConverted, setIsEffectivelyConverted] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  // State to manage tenant assignments for each bed
  const [bedAssignments, setBedAssignments] = useState({});

  // Memoized onFormChange to ensure stability if the parent re-creates the function reference
  const memoizedOnFormChange = useCallback(onFormChange, [onFormChange]);

  useEffect(() => {
    // Part 1: Handle Room Configuration Type
    let configIdToUse = null;
    if (editingRoom && editingRoom.roomConfigurationType) {
      configIdToUse = typeof editingRoom.roomConfigurationType === 'object' && editingRoom.roomConfigurationType !== null
        ? editingRoom.roomConfigurationType._id
        : editingRoom.roomConfigurationType;
    }

    if (configIdToUse && roomConfigurationTypes && roomConfigurationTypes.length > 0) {
      const currentFullConfig = roomConfigurationTypes.find(config => config._id === configIdToUse);
      setSelectedConfig(currentFullConfig);

      if (currentFullConfig && currentFullConfig.isConvertible) {
        const isCurrentlyMatchingConverted =
          editingRoom.price === currentFullConfig.convertedRent &&
          editingRoom.occupancy?.max === currentFullConfig.convertedSharingCapacity;
        setIsEffectivelyConverted(isCurrentlyMatchingConverted);
      } else {
        setIsEffectivelyConverted(false);
      }
    } else {
      setSelectedConfig(null);
      setIsEffectivelyConverted(false);
    }

    // Part 2: Initialize bedAssignments
    if (editingRoom && editingRoom.occupancy && typeof editingRoom.occupancy.max === 'number') {
      const initialAssignments = {};
      // Prioritize editingRoom.bedAssignments if it exists and is an array (this comes from backend)
      if (Array.isArray(editingRoom.bedAssignments) && editingRoom.bedAssignments.length > 0) {
        console.log('[EditRoomModal useEffect] Initializing beds from editingRoom.bedAssignments:', editingRoom.bedAssignments);
        for (let i = 0; i < editingRoom.occupancy.max; i++) {
          // editingRoom.bedAssignments from backend is an array of tenant IDs or null/undefined
          initialAssignments[`bed_${i}`] = editingRoom.bedAssignments[i] || ''; 
        }
      } else if (tenants && editingRoom.name) {
        // Fallback: If editingRoom.bedAssignments is not available or empty,
        // populate based on tenants whose `room` property (a room NAME) matches the editingRoom's name.
        // This is a less direct way and assumes tenants are correctly associated by room name if direct bed assignments aren't provided.
        console.log(`[EditRoomModal useEffect] Fallback: Initializing beds by filtering tenants for room name: "${editingRoom.name}"`);
        const currentRoomTenantsByName = tenants.filter(
          t => t.room === editingRoom.name && t.status === 'Active'
        );
        console.log(`[EditRoomModal useEffect] Found ${currentRoomTenantsByName.length} active tenants in room "${editingRoom.name}" by name.`);
        
        for (let i = 0; i < editingRoom.occupancy.max; i++) {
          initialAssignments[`bed_${i}`] = currentRoomTenantsByName[i] ? currentRoomTenantsByName[i]._id : '';
        }
      } else {
        console.log('[EditRoomModal useEffect] No bed assignments from backend and not enough info for fallback (tenants/room name). Initializing beds as vacant.');
        for (let i = 0; i < editingRoom.occupancy.max; i++) {
          initialAssignments[`bed_${i}`] = '';
        }
      }
      setBedAssignments(initialAssignments);
      console.log('[EditRoomModal useEffect] Final initialAssignments state:', initialAssignments);
    } else {
      setBedAssignments({});
      console.log('[EditRoomModal useEffect] No occupancy info, bedAssignments set to empty object.');
    }

  }, [editingRoom, roomConfigurationTypes, tenants]); // editingRoom.roomConfigurationType is covered by editingRoom dependency

  const handleBedAssignmentChange = (bedIndex, tenantId) => {
    setBedAssignments(prev => ({
      ...prev,
      [`bed_${bedIndex}`]: tenantId
    }));
  };

  const handleRemoveTenantFromBed = (bedIndex) => {
    setBedAssignments(prev => ({
      ...prev,
      [`bed_${bedIndex}`]: '' // Set to empty string to signify vacant
    }));
  };


  const handleInternalSave = (e) => {
    e.preventDefault();
    // Pass bedAssignments along with other room data
    handleSaveRoom(editingRoom, bedAssignments);
  };

  const handleRoomConfigTypeChange = (e) => {
    const newConfigTypeId = e.target.value;
    memoizedOnFormChange(e); // Update editingRoom.roomConfigurationType in parent

    const newSelectedFullConfig = roomConfigurationTypes.find(config => config._id === newConfigTypeId);
    const oldMaxOccupancy = editingRoom.occupancy?.max || 0; // Get current max occupancy

    if (newSelectedFullConfig) {
      memoizedOnFormChange({ target: { name: 'price', value: newSelectedFullConfig.baseRent, type: 'number' } });
      memoizedOnFormChange({ target: { name: 'occupancy.max', value: newSelectedFullConfig.baseSharingCapacity, type: 'number' } });
      
      // Adjust bedAssignments if max occupancy changes
      const newMaxOccupancy = newSelectedFullConfig.baseSharingCapacity;
      if (newMaxOccupancy !== oldMaxOccupancy) {
        setBedAssignments(prevAssignments => {
          const updatedAssignments = {};
          for (let i = 0; i < newMaxOccupancy; i++) {
            updatedAssignments[`bed_${i}`] = prevAssignments[`bed_${i}`] || '';
          }
          // If newMaxOccupancy is less, tenants in removed beds are effectively unassigned from those specific beds.
          // The parent (NewAdminDashboard) and backend will handle the actual tenant.room update if needed.
          return updatedAssignments;
        });
      }
      setIsEffectivelyConverted(false); // Default to not converted when type changes
    } else {
      // Clear price/occupancy if config type is invalid or cleared
      memoizedOnFormChange({ target: { name: 'price', value: 0, type: 'number' } });
      memoizedOnFormChange({ target: { name: 'occupancy.max', value: 0, type: 'number' } });
      // Clear all bed assignments if config type is removed or invalid
      setBedAssignments({});
      setIsEffectivelyConverted(false);
    }
  };
  
  const handleConvertedToggleChange = (e) => {
    const isChecked = e.target.checked;
    setIsEffectivelyConverted(isChecked);
    const oldMaxOccupancy = editingRoom.occupancy?.max || 0; // Get current max occupancy

    if (selectedConfig && selectedConfig.isConvertible) {
      const newPrice = isChecked ? selectedConfig.convertedRent : selectedConfig.baseRent;
      const newMaxOccupancy = isChecked ? selectedConfig.convertedSharingCapacity : selectedConfig.baseSharingCapacity;

      memoizedOnFormChange({ target: { name: 'price', value: newPrice, type: 'number' } });
      memoizedOnFormChange({ target: { name: 'occupancy.max', value: newMaxOccupancy, type: 'number' } });

      // Adjust bedAssignments if max occupancy changes due to conversion
      if (newMaxOccupancy !== oldMaxOccupancy) {
        setBedAssignments(prevAssignments => {
          const updatedAssignments = {};
          for (let i = 0; i < newMaxOccupancy; i++) {
            updatedAssignments[`bed_${i}`] = prevAssignments[`bed_${i}`] || '';
          }
          return updatedAssignments;
        });
      }
    }
  };

  const modalStyle = {
    backgroundColor: '#6C8EBF', 
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
  };

  const bedLabelStyle = {
    color: 'white', 
    fontWeight: 'bold',
  };

  const bedValueStyle = {
    color: '#800000', 
    fontWeight: 'bold',
  };

  const removeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#FF0000', 
    fontWeight: 'bold',
    fontSize: '20px', 
    cursor: 'pointer',
    marginLeft: 4,
  };

  // Prepare list of available active tenants
  // Filter criteria:
  // 1. Tenant is "Active".
  // 2. Tenant's preferredRoomType matches the room's current roomConfigurationType.
  // 3. Tenant is "unassigned" (tenant.room is null or empty) OR tenant.status is 'Pending Allocation'.
  //    OR tenant is currently assigned to THIS room (to allow re-shuffling within the room).
  const availableTenantsForBeds = tenants && selectedConfig ? tenants.filter(tenant => {
    const isTenantActive = tenant.status === 'Active';
    const tenantPreferredType = tenant.preferredRoomType?._id || tenant.preferredRoomType;
    const roomConfigType = selectedConfig._id;
    const preferredTypeMatches = tenantPreferredType === roomConfigType;

    // Condition for being "unassigned" or pending
    const isUnassignedOrPending = !tenant.room || tenant.room === '' || tenant.status === 'Pending Allocation';
    
    // Condition for being assigned to the current editing room
    const isAssignedToThisRoom = tenant.room === editingRoom.name || tenant.room === editingRoom._id;

    return isTenantActive && preferredTypeMatches && (isUnassignedOrPending || isAssignedToThisRoom);
  }) : [];
  // console.log('[EditRoomModal] Available tenants for beds:', availableTenantsForBeds.map(t => ({name: t.name, id: t._id, preferred: t.preferredRoomType, room: t.room })));


  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ ...modalStyle, minWidth: 320, maxWidth: 500, boxShadow: '0 4px 32px rgba(0,0,0,0.12)' }}>
        <button
          onClick={handleCancelEditRoom}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: 'pointer',
            position: 'absolute',
            top: '10px',
            right: '10px',
          }}
        >
          &times;
        </button>
        <h3>Edit Room</h3>
        <form onSubmit={handleInternalSave} autoComplete="off"> {/* Changed to handleInternalSave */}
          <div style={{ marginBottom: 12 }}>
            <label>Name: <input name="name" value={editingRoom.name || ''} onChange={memoizedOnFormChange} style={{ marginLeft: 8, width: 'calc(100% - 60px)' }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Location: <input name="location" value={editingRoom.location || ''} onChange={memoizedOnFormChange} style={{ marginLeft: 8, width: 'calc(100% - 75px)' }} /></label>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label>Configuration Type:
              <select
                name="roomConfigurationType"
                value={(editingRoom.roomConfigurationType && typeof editingRoom.roomConfigurationType === 'object' ? editingRoom.roomConfigurationType._id : editingRoom.roomConfigurationType) || ''}
                onChange={handleRoomConfigTypeChange}
                style={{ marginLeft: 8, width: 'calc(100% - 140px)' }}
              >
                <option value="">Select Configuration Type</option>
                {roomConfigurationTypes && roomConfigurationTypes.map(config => (
                  <option key={config._id} value={config._id}>{config.name}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedConfig && selectedConfig.isConvertible && (
            <div style={{ marginBottom: 12, padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="isEffectivelyConverted"
                  checked={isEffectivelyConverted}
                  onChange={handleConvertedToggleChange}
                  style={{ marginRight: 8, transform: 'scale(1.2)' }}
                />
                Use Converted State
              </label>
              <div style={{ fontSize: '0.8em', color: 'lightcyan', marginTop: '5px', paddingLeft: '25px' }}>
                Base: Rent {selectedConfig.baseRent}, Capacity {selectedConfig.baseSharingCapacity}<br/>
                Converted: Rent {selectedConfig.convertedRent}, Capacity {selectedConfig.convertedSharingCapacity}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label>Price: <input type="number" name="price" value={editingRoom.price || ''} readOnly style={{ marginLeft: 8, background: '#eee', color: '#333', width: 'calc(100% - 50px)' }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Max Occupancy: <input type="number" name="occupancy.max" value={editingRoom.occupancy ? editingRoom.occupancy.max : ''} readOnly style={{ marginLeft: 8, background: '#eee', color: '#333', width: 'calc(100% - 120px)' }} /></label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Current Occupancy: <input type="number" value={editingRoom.occupancy ? editingRoom.occupancy.current : 0} readOnly style={{ marginLeft: 8, background: '#eee', color: '#333', width: 'calc(100% - 140px)' }} /></label>
          </div>

          {/* Bed Assignment Section */}
          {editingRoom.occupancy && typeof editingRoom.occupancy.max === 'number' && editingRoom.occupancy.max > 0 && (
            <div className="form-group">
              <label style={bedLabelStyle}>Bed Assignments:</label>
              {Array.from({ length: editingRoom.occupancy.max }).map((_, index) => {
                const currentTenantIdInBed = bedAssignments[`bed_${index}`];
                const currentTenantDetails = tenants.find(t => t._id === currentTenantIdInBed);

                return (
                  <div key={`bed-assignment-${index}`} className="bed-assignment-row" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                    <label htmlFor={`bed_${index}`} style={{ ...bedLabelStyle, marginRight: '10px', minWidth: '60px' }}>Bed {index + 1}:</label>
                    <select
                      id={`bed_${index}`}
                      name={`bed_${index}`}
                      value={currentTenantIdInBed || ''}
                      onChange={(e) => handleBedAssignmentChange(index, e.target.value)}
                      className="form-control"
                      style={{ flexGrow: 1 }}
                    >
                      <option value="">Vacant</option>
                      {/* Option for the currently assigned tenant (if any) */}
                      {currentTenantDetails && (
                        <option key={currentTenantDetails._id} value={currentTenantDetails._id}>
                          {currentTenantDetails.name} (Currently Assigned)
                        </option>
                      )}
                      {/* Options for other available tenants */}
                      {availableTenantsForBeds
                        .filter(t => 
                          t._id !== currentTenantIdInBed && // Don't show if already listed as "Currently Assigned"
                          (                                 // And tenant is either unassigned OR assigned to this bed
                            !t.room || t.room === '' || t.status === 'Pending Allocation' || t.room === editingRoom.name || t.room === editingRoom._id
                          ) &&
                          ( // And tenant is not assigned to another bed in this room already
                            !Object.values(bedAssignments).includes(t._id) || currentTenantIdInBed === t._id 
                          )
                        )
                        .map(tenant => (
                          <option key={tenant._id} value={tenant._id}>
                            {tenant.name} (Pref: {roomConfigurationTypes.find(rc => rc._id === (tenant.preferredRoomType?._id || tenant.preferredRoomType))?.name || 'N/A'})
                          </option>
                        ))}
                    </select>
                    {currentTenantIdInBed && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTenantFromBed(index)}
                        style={removeButtonStyle}
                        title="Remove Tenant from Bed"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* End Bed Assignment Section */}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" onClick={handleCancelEditRoom} style={{ padding: '8px 12px', background: 'grey', color: 'white', border: 'none', borderRadius: 4 }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 12px', background: 'green', color: 'white', border: 'none', borderRadius: 4 }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomModal;
