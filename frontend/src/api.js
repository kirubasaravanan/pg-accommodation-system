import axios from 'axios';

// Use local backend for development. Change this to your remote backend URL when you deploy.
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

export const fetchRooms = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/rooms`);
  console.log('fetchRooms response:', res.data); // Debug: log fetched rooms
  return res;
};

export const fetchTenants = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/tenants`);
  console.log('fetchTenants response:', res.data); // Debug: log fetched tenants
  return res;
};