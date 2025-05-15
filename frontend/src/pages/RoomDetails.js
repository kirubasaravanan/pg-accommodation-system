import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function RoomDetails() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/rooms/${id}`)
      .then((response) => setRoom(response.data))
      .catch((error) => console.error('Error fetching room details:', error));
  }, [id]);

  if (!room) return <p>Loading...</p>;

  return (
    <div>
      <h1>{room.name}</h1>
      <p>Location: {room.location}</p>
      <p>Price: ${room.price}</p>
      <p>Description: {room.description}</p>
      <p>Amenities: {room.amenities.join(', ')}</p>
    </div>
  );
}

export default RoomDetails;
