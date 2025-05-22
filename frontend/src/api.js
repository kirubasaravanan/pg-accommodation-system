import axios from 'axios';

// Use localhost for backend API calls in development
const API_BASE_URL = 'http://localhost:5000';

export const login = async (credentials) => {
  return axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
};

export const addRoom = async (roomData, token) => {
  return axios.post(`${API_BASE_URL}/api/rooms`, roomData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateRoom = async (roomId, roomData, token) => {
  return axios.put(`${API_BASE_URL}/api/rooms/${roomId}`, roomData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteRoom = async (roomId, token) => {
  return axios.delete(`${API_BASE_URL}/api/rooms/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const addUser = async (userData, token) => {
  return axios.post(`${API_BASE_URL}/api/auth/register`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchRooms = async (token) => {
  const res = await axios.get(`${API_BASE_URL}/api/rooms`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('fetchRooms response:', res.data); // Debug: log fetched rooms
  return res;
};

export const fetchTenants = async (token) => {
  const res = await axios.get(`${API_BASE_URL}/api/tenants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('fetchTenants response:', res.data); // Debug: log fetched tenants
  return res;
};

export const fetchRoomConfigurationTypes = async (token) => {
  const res = await axios.get(`${API_BASE_URL}/api/room-configurations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // console.log('fetchRoomConfigurationTypes response:', res.data); // Optional debug
  return res;
};

export const fetchUsers = async (token) => {
  return axios.get(`${API_BASE_URL}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteUser = async (userId, token) => {
  return axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};