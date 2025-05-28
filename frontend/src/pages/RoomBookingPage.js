import React, { useState, useEffect } from 'react';
import styles from './RoomBookingPage.module.css';
import { fetchRooms, createBooking } from '../api';

const RoomBookingPage = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    tenantName: '',
    checkInDate: '',
    checkOutDate: '',
    // Add other relevant booking fields
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAvailableRooms = async () => {
      setIsLoading(true);
      try {
        const response = await fetchRooms(); // API call
        setAvailableRooms(response.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load available rooms.');
        setAvailableRooms([]);
      }
      setIsLoading(false);
    };
    loadAvailableRooms();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prevDetails => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    // Potentially pre-fill some booking details based on room
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Ensure selectedRoom and its _id are available
      if (!selectedRoom || !selectedRoom._id) {
        setError('No room selected or room ID is missing.');
        setIsLoading(false);
        return;
      }
      const bookingData = { 
        ...bookingDetails, 
        roomId: selectedRoom._id, 
        roomName: selectedRoom.name, // Optionally pass room name if your backend expects/uses it
        // Ensure date formats match backend expectations, e.g., ISO strings
        checkInDate: new Date(bookingDetails.checkInDate).toISOString(),
        checkOutDate: new Date(bookingDetails.checkOutDate).toISOString(),
      }; 
      await createBooking(bookingData); 
      alert('Booking successful!');
      // Reset form or redirect
      setSelectedRoom(null);
      setBookingDetails({ tenantName: '', checkInDate: '', checkOutDate: ''});
      // Optionally, refresh available rooms if a booking affects availability
      // loadAvailableRooms(); // You would need to define loadAvailableRooms or refactor useEffect
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create booking.');
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.roomBookingContainer}>
      <header className={styles.header}>
        <h1>Room Booking</h1>
        <p>Find and book available rooms.</p>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <section className={styles.mainContent}>
        <div className={styles.roomSelectionArea}>
          <h2>Available Rooms</h2>
          {isLoading && <p>Loading rooms...</p>}
          {!isLoading && availableRooms.length === 0 && !error && <p>No rooms available currently.</p>}
          {error && <p className={styles.errorText}>{error}</p>}
          {availableRooms.map(room => (
            <div key={room._id} className={`${styles.roomCard} ${selectedRoom && selectedRoom._id === room._id ? styles.selected : ''}`} onClick={() => handleRoomSelect(room)}>
              <h3>{room.name}</h3>
              <p>Type: {room.roomConfigurationType?.name || 'N/A'}</p>
              <p>Price: ₹{room.price}/month</p>
            </div>
          ))}
          {/* <div className={styles.roomCardPlaceholder}>Room Card 1 (Placeholder)</div>
          <div className={styles.roomCardPlaceholder}>Room Card 2 (Placeholder)</div> */}
        </div>

        <div className={styles.bookingFormArea}>
          <h2>Booking Form</h2>
          {selectedRoom ? (
            <form onSubmit={handleSubmitBooking}>
              <div className={styles.formField}>
                <label htmlFor="selectedRoomInfo">Selected Room:</label>
                <input type="text" id="selectedRoomInfo" value={selectedRoom.name || 'N/A'} readOnly className={styles.readOnlyInput} />
              </div>
              <div className={styles.formField}>
                <label htmlFor="tenantName">Tenant Name:</label>
                <input
                  type="text"
                  id="tenantName"
                  name="tenantName"
                  value={bookingDetails.tenantName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="checkInDate">Check-in Date:</label>
                <input
                  type="date"
                  id="checkInDate"
                  name="checkInDate"
                  value={bookingDetails.checkInDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="checkOutDate">Check-out Date:</label>
                <input
                  type="date"
                  id="checkOutDate"
                  name="checkOutDate"
                  value={bookingDetails.checkOutDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {/* Add more form fields as needed */}
              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Book Room'}
              </button>
            </form>
          ) : (
            <p>Please select a room to proceed with booking.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default RoomBookingPage;
