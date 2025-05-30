import React, { useState, useEffect, useCallback } from 'react';
import styles from './AllocateRoomModal.module.css'; 
import { fetchRooms, allocateRoomToTenantApi } from '../api'; 

const AllocateRoomModal = ({
  show,
  onClose,
  tenantId,
  tenantName,
  preferredRoomConfigId, 
  allRoomConfigs, 
  onAllocationSuccess
}) => {
  const [currentStep, setCurrentStep] = useState('initialCheck'); 
  const [selectedRoomConfigId, setSelectedRoomConfigId] = useState(null); 
  const [availableRooms, setAvailableRooms] = useState([]);
  const [alternativeRoomTypesToShow, setAlternativeRoomTypesToShow] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const preferredRoomConfig = allRoomConfigs.find(rc => rc._id === preferredRoomConfigId);
  const preferredRoomConfigName = preferredRoomConfig ? preferredRoomConfig.name : 'the specified preferred type';

  // Initial search: based on the tenant's preferred room type ID
  const performInitialRoomSearch = useCallback(async (initialPreferredConfigId) => {
    if (!initialPreferredConfigId) {
      setMessage('No preferred room type specified by the tenant.');
      setCurrentStep('error');
      return;
    }
    setIsLoading(true);
    // Find the name of the preferred config for messages
    const currentPreferredConfigDetails = allRoomConfigs.find(rc => rc._id === initialPreferredConfigId);
    const currentPreferredConfigName = currentPreferredConfigDetails ? currentPreferredConfigDetails.name : 'the preferred type';
    setMessage(`Checking availability for your preferred room type: '${currentPreferredConfigName}'...`);

    try {
      const roomsResponse = await fetchRooms(); // Token no longer passed
      const allFetchedRooms = roomsResponse.data || [];
      
      // Filter rooms that match the preferred room configuration ID and have vacancy
      const matchedRooms = allFetchedRooms.filter(room => {
        // Ensure room.roomConfigurationType is treated as an ID string for comparison
        const roomConfigTypeID = typeof room.roomConfigurationType === 'object' && room.roomConfigurationType !== null
                               ? room.roomConfigurationType._id
                               : room.roomConfigurationType;
        return roomConfigTypeID === initialPreferredConfigId &&
               room.occupancy.current < room.occupancy.max &&
               !room.isBooked;
      });

      if (matchedRooms.length > 0) {
        setAvailableRooms(matchedRooms);
        setCurrentStep('showAvailableRooms');
        setMessage(`Found available rooms of your preferred type: '${currentPreferredConfigName}'. Please select one:`);
      } else {
        const alternativeTypes = allRoomConfigs.filter(rc => rc._id !== initialPreferredConfigId);
        setAlternativeRoomTypesToShow(alternativeTypes);
        setCurrentStep('showAlternatives');
        setMessage(`Sorry, no rooms of your preferred type ('${currentPreferredConfigName}') are currently available. You can choose an alternative type below or check if other criteria (like capacity) led to this:`);
      }
    } catch (error) {
      console.error("Error during initial room search:", error);
      setMessage(`Error finding rooms: ${error.message}`);
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [allRoomConfigs]); // Removed token from dependencies

  // Search for rooms of a specific alternative type chosen by the user from the list
  const findRoomsForSelectedAlternative = useCallback(async (alternativeConfigId) => {
    if (!alternativeConfigId) {
      setMessage('Please select an alternative room type to check.');
      return; 
    }
    setIsLoading(true);
    const selectedAlternativeConfigDetails = allRoomConfigs.find(rc => rc._id === alternativeConfigId);
    const selectedAlternativeName = selectedAlternativeConfigDetails ? selectedAlternativeConfigDetails.name : 'the selected type';
    setMessage(`Checking availability for '${selectedAlternativeName}'...`);

    try {
      const roomsResponse = await fetchRooms(); // Token no longer passed
      const allFetchedRooms = roomsResponse.data || [];
      
      const roomsOfExactType = allFetchedRooms.filter(room => {
        if (!room.roomConfigurationType) return false;
        const typeId = typeof room.roomConfigurationType === 'object' && room.roomConfigurationType !== null
                       ? room.roomConfigurationType._id.toString()
                       : room.roomConfigurationType.toString();
        return typeId === alternativeConfigId;
      });

      const vacantRoomsOfExactType = roomsOfExactType.filter(room => 
        room.occupancy.current < room.occupancy.max && !room.isBooked
      );

      if (vacantRoomsOfExactType.length > 0) {
        setAvailableRooms(vacantRoomsOfExactType);
        // selectedRoomConfigId (state) is already set by handleAlternativeTypeSelect
        setCurrentStep('showAvailableRooms');
        setMessage(`Available rooms for type '${selectedAlternativeName}':`);
      } else {
        setAvailableRooms([]); 
        setMessage(`No rooms currently available for type '${selectedAlternativeName}'. Please try another alternative or close.`);
        // Stay in 'showAlternatives' step
      }
    } catch (error) {
      console.error("Error fetching rooms for selected alternative:", error);
      setMessage(`Error finding rooms: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [allRoomConfigs]); // Removed token from dependencies

  useEffect(() => {
    if (show && tenantId && preferredRoomConfigId) {
      setCurrentStep('initialCheck'); 
      setSelectedRoomConfigId(null); // Reset selected alternative from previous modal use
      setAvailableRooms([]);
      setSelectedRoomId(''); 
      setMessage(''); 
      performInitialRoomSearch(preferredRoomConfigId);
    }
  }, [show, tenantId, preferredRoomConfigId, performInitialRoomSearch]);

  const handleAlternativeTypeSelect = (configId) => {
    setSelectedRoomConfigId(configId); // Set the ID of the alternative type selected via radio button
  };

  const handleCheckAlternativeNow = () => {
    // selectedRoomConfigId (state) holds the ID of the type chosen from radio buttons
    if (selectedRoomConfigId) {
      findRoomsForSelectedAlternative(selectedRoomConfigId);
    } else {
      setMessage("Please select an alternative room type from the list first.");
    }
  };

  const handleAllocateRoom = async () => {
    if (!selectedRoomId || !tenantId) {
      setMessage("No room selected or tenant ID missing.");
      setCurrentStep('error');
      return;
    }
    setIsLoading(true);
    console.log('Allocating Room - Tenant ID:', tenantId, 'Room ID:', selectedRoomId); // Log IDs
    try {
      await allocateRoomToTenantApi(tenantId, selectedRoomId); // Token no longer passed
      const roomDetails = availableRooms.find(r => r._id === selectedRoomId);
      setMessage(`Room ${roomDetails ? roomDetails.name : selectedRoomId} allocated to ${tenantName} successfully!`);
      setCurrentStep('allocated');
      if(onAllocationSuccess) onAllocationSuccess(); 
    } catch (error) {
      console.error("Error allocating room:", error);
      setMessage(`Error allocating room: ${error.response?.data?.message || error.message}`);
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.closeButton}>X</button>
        <h2>Room Allocation for {tenantName}</h2>
        {isLoading && <p>Loading...</p>}
        <p>{message}</p>

        {currentStep === 'showAlternatives' && (
          <div>
            {alternativeRoomTypesToShow.map(config => (
              <div key={config._id}>
                <input
                  type="radio"
                  id={config._id}
                  name="alternativeRoomType"
                  value={config._id}
                  checked={selectedRoomConfigId === config._id}
                  onChange={() => handleAlternativeTypeSelect(config._id)}
                />
                <label htmlFor={config._id}>{config.name} (Capacity: {config.baseSharingCapacity}, Rent: {config.baseRent})</label>
              </div>
            ))}
            <button onClick={handleCheckAlternativeNow} disabled={isLoading || !selectedRoomConfigId || selectedRoomConfigId === preferredRoomConfigId}>Check Availability for Selected Type</button>
          </div>
        )}

        {currentStep === 'showAvailableRooms' && availableRooms.length > 0 && (
          <div>
            <h3>Select a Room:</h3>
            {availableRooms.map(room => (
              <div key={room._id}>
                <input
                  type="radio"
                  id={room._id}
                  name="availableRoom"
                  value={room._id}
                  checked={selectedRoomId === room._id}
                  onChange={() => setSelectedRoomId(room._id)}
                />
                <label htmlFor={room._id}>{room.name} (Location: {room.location}, Price: {room.price})</label>
              </div>
            ))}
            <button onClick={handleAllocateRoom} disabled={isLoading || !selectedRoomId}>Allocate Selected Room</button>
          </div>
        )}
        
        {currentStep === 'allocated' && (
            <button onClick={onClose}>Close</button>
        )}

        {currentStep === 'error' && (
            <button onClick={onClose}>Close</button>
        )}
      </div>
    </div>
  );
};

export default AllocateRoomModal;
