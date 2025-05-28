import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api'; // Import apiClient

function RoomDetails() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    // Use apiClient for the request
    apiClient.get(`/api/rooms/${id}`)
      .then((response) => setRoom(response.data)) // Assuming response.data contains the room object directly
      .catch((error) => console.error('Error fetching room details:', error));
  }, [id]);

  if (!room) return <p>Loading...</p>;

  return (
    <div>
      <h1>{room.name}</h1>
      <p>Location: {room.location}</p>
      <p>Price: ${room.price}</p>
      <p>Description: {room.description}</p>
      {/* Add a check for room.amenities before calling join */}
      {room.amenities && room.amenities.length > 0 && (
        <p>Amenities: {room.amenities.join(', ')}</p>
      )}
    </div>
  );
}

export default RoomDetails;
