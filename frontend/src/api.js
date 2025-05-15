import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const login = async (credentials) => {
  return axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
};

export const addRoom = async (roomData, token) => {
  return axios.post(`${API_BASE_URL}/api/rooms`, roomData, {
    headers: { Authorization: token },
  });
};

export const updateRoom = async (roomId, roomData, token) => {
  return axios.put(`${API_BASE_URL}/api/rooms/${roomId}`, roomData, {
    headers: { Authorization: token },
  });
};

export const deleteRoom = async (roomId, token) => {
  return axios.delete(`${API_BASE_URL}/api/rooms/${roomId}`, {
    headers: { Authorization: token },
  });
};

export const addUser = async (userData, token) => {
  return axios.post(`${API_BASE_URL}/api/auth/register`, userData, {
    headers: { Authorization: token },
  });
};