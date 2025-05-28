import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'YOUR_PRODUCTION_API_URL' // Replace with your actual production URL
    : 'http://172.20.10.2:5000'; // Your local network IP for development

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the token in headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response, // Simply return the response if it's successful
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      console.error("API Error: 401 Unauthorized. Token might be invalid or expired.", error.config.url);
      localStorage.removeItem('token'); // Clear the invalid token
      localStorage.removeItem('user'); // Clear user data
      // Redirect to login page
      // Ensure this doesn't cause a loop if the login page itself makes API calls that could 401
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error); // Propagate the error so it can be caught by the calling code
  }
);


export const login = async (credentials) => {
  return apiClient.post('/api/auth/login', credentials);
};

export const addRoom = async (roomData) => { // Removed token param
  return apiClient.post('/api/rooms', roomData);
};

export const updateRoom = async (roomId, roomData) => { // Removed token param
  return apiClient.put(`/api/rooms/${roomId}`, roomData);
};

export const deleteRoom = async (roomId) => { // Removed token param
  return apiClient.delete(`/api/rooms/${roomId}`);
};

export const addUser = async (userData) => { // Removed token param
  return apiClient.post('/api/auth/register', userData);
};

export const fetchRooms = async () => { // Removed token param
  return apiClient.get('/api/rooms');
};

export const fetchTenants = async () => { // Removed token param
  const res = await apiClient.get('/api/tenants');
  console.log('fetchTenants response:', res.data); // Debug: log fetched tenants
  return res;
};

export const fetchRoomConfigurationTypes = async () => { // Removed token param
  const res = await apiClient.get('/api/room-configurations');
  // console.log('fetchRoomConfigurationTypes response:', res.data); // Optional debug
  return res;
};

export const fetchUsers = async () => { // Removed token param
  return apiClient.get('/api/users');
};

export const deleteUser = async (userId) => { // Removed token param
  return apiClient.delete(`/api/users/${userId}`);
};

// Tenant specific API calls
export const addTenant = async (tenantData) => { // Removed token param
  return apiClient.post('/api/tenants', tenantData);
};

export const updateTenant = async (tenantId, tenantData) => { // Removed token param
  return apiClient.put(`/api/tenants/${tenantId}`, tenantData);
};

export const deleteTenant = async (tenantId) => { // Removed token param
  return apiClient.delete(`/api/tenants/${tenantId}`);
};

export const getTenantHistory = async (tenantId) => { // Removed token param
  return apiClient.get(`/api/tenants/${tenantId}/history`);
};

export const allocateRoomToTenantApi = async (tenantId, roomId) => { // Removed token param, simplified body
  return apiClient.put(`/api/tenants/${tenantId}/allocate-room/${roomId}`, {});
};

export const deleteRoomConfigurationType = async (configId) => { // Removed token param
  return apiClient.delete(`/api/room-configurations/${configId}`);
};

export const addRoomConfigurationType = async (configData) => { // Removed token param
  return apiClient.post('/api/room-configurations', configData);
};

export const updateRoomConfigurationType = async (configId, configData) => { // Removed token param
  return apiClient.put(`/api/room-configurations/${configId}`, configData);
};

// Booking specific API calls
export const createBooking = async (bookingData) => {
  return apiClient.post('/api/bookings', bookingData);
};