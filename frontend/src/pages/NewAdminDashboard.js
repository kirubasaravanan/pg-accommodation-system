import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './NewAdminDashboard.module.css';
import UserManagementConsole from '../components/UserManagementConsole';
import RoomConfigurationManagement from '../components/RoomConfigurationManagement';
import RoomsTab from './RoomsTab';
import EditRoomModal from '../components/EditRoomModal';
import SummaryCard from '../components/SummaryCard';
import TenantsTab from './TenantsTab';
import EditTenantModal from '../components/EditTenantModal';
import TenantRegistrationForm from '../components/TenantRegistrationForm';
import AllocateRoomModal from '../components/AllocateRoomModal';
import Sidebar from '../components/Sidebar';
import ComingSoon from './ComingSoon';
import ReportsPage from './ReportsPage';
import RoomBookingPage from './RoomBookingPage';
import AdminConsole from './AdminConsole.tsx'; // Import AdminConsole with .tsx extension

import { 
  fetchRooms, 
  fetchTenants, 
  fetchRoomConfigurationTypes, 
  addRoom, 
  updateRoom, 
  deleteRoom, 
  addTenant, 
  updateTenant, 
  deleteTenant 
} from '../api';

// Define these constants, or ensure they are correctly sourced if defined elsewhere
const ACCOMMODATION_TYPES = ['Single', 'Shared', 'Premium', 'Private Mini','Private','Double Occupancy','Triple Occupancy','Four Occupancy','Five Occupancy']; // Example, adjust as needed
const RENT_STATUS = ['paid', 'due', 'partial', 'overdue']; // Example, adjust as needed

// Helper to map path to tab name
const pathToTabName = (path) => {
  if (!path) return 'Dashboard';
  const lastSegment = path.substring(path.lastIndexOf('/') + 1);
  const queryParamsIndex = lastSegment.indexOf('?');
  const cleanSegment = queryParamsIndex === -1 ? lastSegment : lastSegment.substring(0, queryParamsIndex);

  switch (cleanSegment) {
    case 'dashboard': return 'Dashboard';
    case 'room-booking': return 'Room Booking';
    case 'tenants': return 'Tenants';
    case 'rent-payment': return 'Rent Payment';
    case 'reports': return 'Reports';
    case 'complaints': return 'Complaints';
    case 'ai-chatbot': return 'AI Chatbot';
    case 'registration': return 'Registration';
    case 'admin-console': return 'Admin Console';
    // Add cases for admin-console sub-pages if they should set a specific main tab
    // or handle them within the Admin Console section logic
    default:
      // If the path is just /new-dashboard or an unrecognized sub-path, default to Dashboard
      if (path === '/new-dashboard' || path === '/new-dashboard/') return 'Dashboard';
      // If it's a sub-page of admin-console, keep Admin Console tab active
      if (path.startsWith('/new-dashboard/admin-console/')) return 'Admin Console';
      return 'Dashboard'; // Fallback
  }
};

const NewAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize activeTab based on the current URL path
  const [activeTab, setActiveTab] = useState(() => pathToTabName(location.pathname));
  const [currentDate, setCurrentDate] = useState('');
  const [showRoomsAndRentSetup, setShowRoomsAndRentSetup] = useState(false); // New state

  // State for other tabs - these might become redundant if activeTab fully controls content
  // For now, let's keep them to see how they interact with the new routing logic
  const [showRoomBooking, setShowRoomBooking] = useState(activeTab === 'Room Booking');
  const [showRentPayment, setShowRentPayment] = useState(activeTab === 'Rent Payment');
  const [showReports, setShowReports] = useState(activeTab === 'Reports');
  const [showComplaints, setShowComplaints] = useState(activeTab === 'Complaints');
  const [showAIChatbot, setShowAIChatbot] = useState(activeTab === 'AI Chatbot');

  // State for EditTenantModal
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [currentEditingTenantData, setCurrentEditingTenantData] = useState(null);

  // Update activeTab when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const newTabName = pathToTabName(location.pathname);
    setActiveTab(newTabName);

    // Update visibility states based on the new tab name from URL
    setShowRoomsAndRentSetup(false);

  }, [location.pathname]);

  // Function to handle tab changes and reset form for Registration tab
  const handleTabChange = (tabName) => {
    // setActiveTab(tabName); // This will be set by useEffect when navigate changes location.pathname
    
    // Convert tab name to a URL-friendly path segment
    let pathSegment = tabName.toLowerCase().replace(/\s+/g, '-');
    if (tabName === 'Dashboard') {
        navigate('/new-dashboard/dashboard');
    } else {
        navigate(`/new-dashboard/${pathSegment}`);
    }

    // Reset specific view states when changing tabs - this might be partly handled by useEffect [location.pathname]
    // but explicit reset here can be useful for immediate UI feedback before navigation completes if needed.
    // REMOVE: setShowUserManagementConsole(false);
    // REMOVE: setShowRoomConfigurationManagement(false);
    // REMOVE: setShowRoomsAndRentSetup(false);
    // The individual showXYZ states might become less critical now as
    // the activeTab (derived from URL) will control rendering in renderMainContent.

    if (tabName === 'Registration') {
      setCurrentTenantForm(initialTenantFormState);
    }
    // The boolean flags like setShowRoomBooking(true) are less necessary now as
    // the activeTab (derived from URL) will control rendering in renderMainContent.
  };

  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [roomConfigurationTypes, setRoomConfigurationTypes] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [roomForm, setRoomForm] = useState({
    name: '',
    location: '',
    price: '',
    roomConfigurationType: '',
    occupancy: { current: 0, max: '' },
  });

  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [currentEditingRoom, setCurrentEditingRoom] = useState(null);

  // State for Tenant Management
  const initialTenantFormState = {
    name: '',
    contact: '',
    email: '',
    aadharNumber: '',
    dob: '', // Added Date of Birth
    moveInDate: '',
    preferredRoomType: '', // This is used in TenantsTab form
    emergencyContact: '',
    remarks: '',
    securityDeposit: { amount: '', refundableType: 'fully', conditions: '' },
    status: 'Active', // Default status
    accommodationType: 'monthly', 
    rentPaidStatus: 'due', // Default
    intendedVacationDate: '',
    room: null, // Will store room ID
    bedNumber: '', // Added Bed Number
  };
  const [currentTenantForm, setCurrentTenantForm] = useState(initialTenantFormState);
  // const [editingTenantId, setEditingTenantId] = useState(null); // Removed: No longer needed for inline editing

  // State for AllocateRoomModal
  const [showAllocateRoomModal, setShowAllocateRoomModal] = useState(false);
  const [tenantForAllocation, setTenantForAllocation] = useState(null); // { id, name, preferredRoomConfigId }

  const [dashboardSummary, setDashboardSummary] = useState({
    rentForecast: 0,
    rentReceived: 0,
    rentPending: 0,
    totalSecurityDeposits: 0,
    totalCapacity: 0, 
    totalOccupiedBeds: 0, 
    totalVacantBeds: 0, 
  });

  const getTenantsForRoom = useCallback((roomId) => {
    // Ensure tenants and rooms are loaded, and roomId is valid
    if (!tenants || tenants.length === 0 || !roomId) {
      return [];
    }
    // Filter tenants whose 'room' field (which should be a room ID) matches the roomId
    // Added a check for tenant being non-null before accessing tenant.room
    const foundTenants = tenants.filter(tenant => tenant && tenant.room === roomId);
    return foundTenants;
  }, [tenants]); // Removed rooms from dependency array as it\'s not directly used for filtering by ID


  const fetchData = useCallback(async () => {
    // Token is now handled by the Axios request interceptor in api.js
    // No need to get it from localStorage here for API calls.
    try {
      const roomsRes = await fetchRooms(); // Token no longer passed
      const fetchedRooms = roomsRes.data || [];
      setRooms(fetchedRooms);
      setFilteredRooms(fetchedRooms);

      const tenantsRes = await fetchTenants(); // Token no longer passed
      const fetchedTenants = tenantsRes.data || [];
      setTenants(fetchedTenants);

      const roomConfigTypesRes = await fetchRoomConfigurationTypes(); // Token no longer passed
      // Ensure that roomConfigTypesRes.data is an array, or default to an empty array.
      setRoomConfigurationTypes(Array.isArray(roomConfigTypesRes.data) ? roomConfigTypesRes.data : []);
      
      let forecast = 0;
      let received = 0;
      let pending = 0;
      let security = 0;
      let capacity = 0;
      let occupiedBeds = 0;

      // Calculate capacity and occupiedBeds from rooms
      fetchedRooms.forEach(room => {
        if (!room) {
          console.warn('[NewAdminDashboard fetchData] Encountered a null room object in fetchedRooms array.');
          return; // Skip this null room
        }
        const currentOccupancy = room.occupancy && typeof room.occupancy.current === 'number' ? room.occupancy.current : 0;
        const maxOccupancy = room.occupancy && typeof room.occupancy.max === 'number' ? room.occupancy.max : 0;
        
        capacity += maxOccupancy;
        occupiedBeds += currentOccupancy;
        // Note: Original forecast calculation based on room.price * currentOccupancy is removed from here.
      });

      // Calculate forecast, received, pending rent, and security from tenants
      fetchedTenants.forEach(tenant => {
        if (!tenant) { // Add this check for null tenant objects
          console.warn('[NewAdminDashboard fetchData] Encountered a null tenant object in fetchedTenants array.');
          return; // Skip this null tenant
        }
        // Total Security Deposits: Sum of security deposit amounts from all tenants.
        if (tenant.securityDeposit && typeof tenant.securityDeposit.amount === 'number') {
          security += tenant.securityDeposit.amount;
        }

        // For Rent Forecast, Rent Received, and Rent Pending, only consider Active tenants.
        if (tenant.status === 'Active') {
          let tenantRent = 0;
          if (tenant.customRent && typeof tenant.customRent === 'number' && tenant.customRent > 0) {
            tenantRent = tenant.customRent;
          } else if (tenant.room && typeof tenant.room === 'string') { // tenant.room is an ID
            const roomDetails = fetchedRooms.find(r => r && r._id === tenant.room); // Match by room ID, ensure r is not null
            if (roomDetails && typeof roomDetails.price === 'number') {
              tenantRent = roomDetails.price; // Assumes roomDetails.price is per occupant/bed
            } else {
              console.warn(`[NewAdminDashboard fetchData] Active Tenant: Could not find room details or price for room ID "${tenant.room}" (Tenant: "${tenant.name}"). Rent: 0.`);
            }
          } else if (tenant.room) { 
            console.warn(`[NewAdminDashboard fetchData] Active Tenant: "${tenant.name}" has invalid room ID ("${tenant.room}"). Rent: 0.`);
          }
          // If an active tenant has no room assigned or room price cannot be determined, their tenantRent remains 0.

          forecast += tenantRent; // Add this active tenant\'s rent to the forecast.

          if (tenant.rentPaidStatus === 'paid') {
            received += tenantRent;
          } else if (tenant.rentPaidStatus === 'due' || tenant.rentPaidStatus === 'partial') {
            // For \'partial\' status, the full tenantRent is added to pending, representing the total outstanding.
            pending += tenantRent;
          }
        }
      });
      
      const vacantBeds = capacity - occupiedBeds;

      setDashboardSummary({
        rentForecast: forecast,
        rentReceived: received,
        rentPending: pending, 
        totalSecurityDeposits: security,
        totalCapacity: capacity,
        totalOccupiedBeds: occupiedBeds,
        totalVacantBeds: vacantBeds,
      });

    } catch (error) {
      console.error("Error fetching data or calculating summary:", error);
      // Specific 401 handling is now done by the Axios interceptor.
      // If error is 401, redirection to login should have already been triggered.
      // You might want to add other error handling here if needed, e.g., for network errors.
      if (error.response && error.response.status !== 401) {
        // Handle non-401 errors, e.g., show a notification to the user
        alert("Failed to fetch dashboard data. Please try again later.");
      }
    }
  }, []); // Dependency array is empty

  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken || currentToken === 'undefined' || currentToken === 'null') {
      console.warn("[NewAdminDashboard useEffect] No token found, redirecting to login.");
      if (!window.location.pathname.includes('/login')) {
        navigate('/login'); // Use navigate for internal routing
      }
      return;
    }

    fetchData();
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    setCurrentDate(formattedDate);
  }, [fetchData, navigate]); // Added navigate to dependency array

  // Diagnostic useEffect to log data after updates
  useEffect(() => {
    if (rooms && rooms.length > 0 && tenants && tenants.length > 0) {
      console.log('[NewAdminDashboard DIAGNOSTIC] Rooms or Tenants state updated.');
      const firstRoom = rooms[0];
      if (firstRoom && firstRoom._id) {
        const tenantsInFirstRoom = getTenantsForRoom(firstRoom._id);
        console.log(`[NewAdminDashboard DIAGNOSTIC] Tenants in room '${firstRoom.name}' (ID: ${firstRoom._id}):`, 
          tenantsInFirstRoom.map(t => ({ name: t.name, id: t._id, roomId: t.room, bedNumber: t.bedNumber, status: t.status }))
        );
      } else {
        console.log('[NewAdminDashboard DIAGNOSTIC] No rooms available to check tenants for.');
      }
      console.log('[NewAdminDashboard DIAGNOSTIC] Dashboard Summary after rooms/tenants update:', dashboardSummary);
    }
  }, [rooms, tenants, getTenantsForRoom, dashboardSummary]);

  // Room Management Handlers
  const handleAddActualRoom = async (roomData) => { // RENAMED from handleAddRoom
    // Token is handled by Axios interceptor
    try {
      const apiPayload = {
        ...roomData,
        roomConfigurationTypeId: roomData.roomConfigurationType, 
      };
      delete apiPayload.roomConfigurationType;

      await addRoom(apiPayload); // Token no longer passed
      alert('Room added successfully');
      fetchData(); 
    } catch (error) {
      console.error("Error adding room:", error.response || error);
      alert(`Error adding room: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEditActualRoom = (room) => { // RENAMED from handleEditRoom
    const initialBedAssignments = {}; // This will be an object e.g., { bed_0: tenantId1, bed_1: '' }

    if (room.occupancy && typeof room.occupancy.max === 'number' && room.occupancy.max > 0) {
      // Get all active tenants currently assigned to this specific room ID
      const tenantsInThisRoom = tenants.filter(tenant =>
        tenant.status === 'Active' &&
        tenant.room === room._id // Match by room ID
      );

      for (let i = 0; i < room.occupancy.max; i++) {
        const bedKey = `bed_${i}`;
        const expectedBedNumber = String(i + 1); // Assuming bed numbers are "1", "2", ...

        // Find if any tenant in this room is assigned to this specific bed number
        const tenantAssignedToThisBed = tenantsInThisRoom.find(
          t => t.bedNumber === expectedBedNumber
        );

        if (tenantAssignedToThisBed) {
          initialBedAssignments[bedKey] = tenantAssignedToThisBed._id;
        } else {
          initialBedAssignments[bedKey] = ''; // Mark as vacant
        }
      }
    }

    console.log(`[NewAdminDashboard handleEditRoom] Initial bed assignments for room ${room.name} (ID: ${room._id}):`, initialBedAssignments);

    setCurrentEditingRoom({
      ...room,
      bedAssignments: initialBedAssignments // Pass the constructed object
    });
    setShowEditRoomModal(true);
  };

  const handleUpdateActualRoom = async (roomData, bedAssignmentsFromModal) => { // RENAMED from handleUpdateRoom
    // Token is handled by Axios interceptor
    try {
      const bedAssignmentsArray = [];
      if (roomData.occupancy && typeof roomData.occupancy.max === 'number') {
        for (let i = 0; i < roomData.occupancy.max; i++) {
          bedAssignmentsArray.push(bedAssignmentsFromModal[`bed_${i}`] || null); 
        }
      }

      const payload = {
        ...roomData,
        bedAssignments: bedAssignmentsArray, 
      };
      const roomId = roomData._id || currentEditingRoom?._id;
      if (!roomId) {
        alert("Error: Room ID is missing.");
        return;
      }

      await updateRoom(roomId, payload); // Token no longer passed
      alert('Room updated successfully');
      fetchData(); 
      setShowEditRoomModal(false);
      setCurrentEditingRoom(null);
    } catch (error) {
      console.error("Error updating room:", error.response || error);
      alert(`Error updating room: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteActualRoom = async (roomId) => { // RENAMED from handleDeleteRoom
    // Token is handled by Axios interceptor
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await deleteRoom(roomId); // Token no longer passed
        alert('Room deleted successfully');
        fetchData(); 
      } catch (error) {
        console.error("Error deleting room:", error.response || error);
        alert(`Error deleting room: ${error.response?.data?.error || error.message}`);
      }
    }
  };


  const menuItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Room Booking', icon: '🛏️' },
    { name: 'Tenants', icon: '👥' },
    { name: 'Rent Payment', icon: '💳' },
    { name: 'Reports', icon: '📄' },
    { name: 'Complaints', icon: '🗣️' },
    { name: 'AI Chatbot', icon: '🤖' },
    { name: 'Registration', icon: '📝' },
    { name: 'Admin Console', icon: '⚙️' },
  ];

  // adminConsoleItems is no longer needed here if AdminConsole.tsx defines its own modules
  // const adminConsoleItems = [...]; 

  // handleAdminConsoleCardClick and handleBackToAdminConsole are no longer needed here
  // as AdminConsole.tsx handles its own navigation and display logic.
  // const handleAdminConsoleCardClick = (path) => { ... };
  // const handleBackToAdminConsole = () => { ... };

  // ...existing form handlers: handleRoomFormChange, handleEditModalFormChange, handleTenantFormChange...
  // handleRoomFormChange is for the old inline RoomsTab form, may need review if RoomsTab is removed/changed
  const handleRoomFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "roomConfigurationType") {
      const selectedConfig = roomConfigurationTypes.find(config => config._id === value);
      setRoomForm(prevForm => ({
        ...prevForm,
        roomConfigurationType: value,
        price: selectedConfig ? selectedConfig.baseRent : '',
        occupancy: {
          ...prevForm.occupancy,
          max: selectedConfig ? selectedConfig.baseSharingCapacity : '',
        }
      }));
    } else if (name === "occupancy.max") { 
        setRoomForm(prevForm => ({
            ...prevForm,
            occupancy: { ...prevForm.occupancy, max: value }
        }));
    } else {
      setRoomForm(prevForm => ({
        ...prevForm,
        [name]: value,
      }));
    }
  };

  const handleEditModalFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingRoom(prevRoom => {
      if (!prevRoom) return null;

      if (name === "roomConfigurationType") {
        const selectedConfig = roomConfigurationTypes.find(config => config._id === value);
        return {
          ...prevRoom,
          roomConfigurationType: value,
          price: selectedConfig ? selectedConfig.baseRent : prevRoom.price,
          occupancy: {
            ...prevRoom.occupancy,
            max: selectedConfig ? selectedConfig.baseSharingCapacity : prevRoom.occupancy.max,
          }
        };
      } else if (name === "occupancy.max") {
          return {
              ...prevRoom,
              occupancy: { ...prevRoom.occupancy, max: parseInt(value, 10) || 0 }
          };
      } else {
        return {
          ...prevRoom,
          [name]: value
        };
      }
    });
  };

  const handleTenantFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    if (name.startsWith("securityDeposit.")) {
      const sdField = name.split('.')[1];
      setCurrentTenantForm(prevForm => ({
        ...prevForm,
        securityDeposit: { ...prevForm.securityDeposit, [sdField]: val }
      }));
    } else {
      setCurrentTenantForm(prevForm => ({ ...prevForm, [name]: val }));
    }
  };
  
  // New handlers for EditTenantModal
  const handleEditTenantTriggerModal = (tenant) => {
    const tenantDataForModal = {
      ...tenant,
      _id: tenant._id,
      name: tenant.name || '',
      contact: tenant.contact || '',
      email: tenant.email || '',
      aadharNumber: tenant.aadharNumber || '',
      dob: tenant.dob ? new Date(tenant.dob).toISOString().split('T')[0] : '',
      moveInDate: tenant.moveInDate ? new Date(tenant.moveInDate).toISOString().split('T')[0] : '',
      preferredRoomType: typeof tenant.preferredRoomType === 'object' && tenant.preferredRoomType !== null 
                         ? tenant.preferredRoomType._id 
                         : tenant.preferredRoomType || '',
      emergencyContact: tenant.emergencyContact || '',
      remarks: tenant.remarks || '',
      securityDeposit: {
        amount: tenant.securityDeposit?.amount || '',
        refundableType: tenant.securityDeposit?.refundableType || 'fully',
        conditions: tenant.securityDeposit?.conditions || '',
      },
      status: tenant.status || 'Active',
      accommodationType: tenant.accommodationType || 'monthly',
      rentPaidStatus: tenant.rentPaidStatus || 'due',
      intendedVacationDate: tenant.intendedVacationDate ? new Date(tenant.intendedVacationDate).toISOString().split('T')[0] : '',
      room: typeof tenant.room === 'object' && tenant.room !== null 
            ? tenant.room._id 
            : tenant.room || null,
      bedNumber: tenant.bedNumber || '',
      customRent: tenant.customRent || '',
    };
    console.log('[NewAdminDashboard] Data prepared for EditTenantModal:', tenantDataForModal);
    setCurrentEditingTenantData(tenantDataForModal);
    setShowEditTenantModal(true);
  };

  const handleCloseEditTenantModal = () => {
    console.log('[NewAdminDashboard] handleCloseEditTenantModal called');
    console.log('[NewAdminDashboard] showEditTenantModal before set: ', showEditTenantModal);
    setShowEditTenantModal(false);
    setCurrentEditingTenantData(null);
    // It's good practice to log the state *after* an async setter, but React might batch updates.
    // A useEffect hook watching showEditTenantModal would be more reliable for logging the after-state.
    // For now, this will at least confirm the function ran and tried to set it to false.
    console.log('[NewAdminDashboard] Attempted to set showEditTenantModal to false');
  };

  const handleSaveTenantInModal = async (updatedTenantData) => {
    // Token is handled by Axios interceptor
    if (!updatedTenantData || !updatedTenantData._id) {
      alert("Error: Tenant data or ID is missing for update.");
      return;
    }
    console.log('[NewAdminDashboard] Attempting to save tenant via Modal. Data to be sent to API:', JSON.stringify(updatedTenantData, null, 2));
    try {
      await updateTenant(updatedTenantData._id, updatedTenantData); // Token no longer passed
      alert('Tenant updated successfully');
      fetchData();
      handleCloseEditTenantModal();
    } catch (error) {
      console.error("Error updating tenant:", error.response || error);
      alert(`Error updating tenant: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleAddNewTenantViaModal = () => {
    // Open the EditTenantModal but without initial data, or with a clear "add mode" flag
    // For simplicity, we can reuse EditTenantModal if it can handle a null/empty initialTenantData for add mode
    // Or, have a separate AddTenantModal if logic differs significantly
    setCurrentEditingTenantData(initialTenantFormState); // Use initialTenantFormState for a new tenant
    setShowEditTenantModal(true);
  };

  const handleSaveNewTenantInModal = async (newTenantData) => {
    try {
      // Remove _id if it's empty or null, as it's a new tenant
      const { _id, ...dataToSave } = newTenantData;
      await addTenant(dataToSave);
      alert('Tenant added successfully');
      fetchData();
      handleCloseEditTenantModal();
    } catch (error) {
      console.error("Error adding new tenant:", error.response || error);
      alert(`Error adding new tenant: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteTenantInDashboard = async (tenantId) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await deleteTenant(tenantId);
        alert('Tenant deleted successfully');
        fetchData(); // Refresh tenant list
      } catch (error) {
        console.error('Error deleting tenant:', error.response || error);
        alert(`Error deleting tenant: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // Simplified handleSaveTenant for TenantRegistrationForm (if still used)
  const handleSaveTenant = async (tenantDataToSave) => {
    try {
      await addTenant(tenantDataToSave);
      alert('Tenant registered successfully!');
      fetchData();
      setCurrentTenantForm(initialTenantFormState); // Reset form
      // Optionally navigate away or clear form further
    } catch (error) {
      console.error("Error registering tenant:", error.response || error);
      alert(`Error registering tenant: ${error.response?.data?.error || error.message}`);
    }
  };

  // Placeholder for handleConfirmRoomAllocation if needed by AllocateRoomModal
  const handleConfirmRoomAllocation = async (tenantId, roomId, bedNumber) => {
    console.log("Confirming allocation:", { tenantId, roomId, bedNumber });
    // Implementation for updating tenant with room/bed and room occupancy
    // This would typically involve calling updateTenant and possibly updateRoom APIs
    // For now, just a placeholder
    alert('Room allocation confirmation logic to be implemented.');
    setShowAllocateRoomModal(false);
    fetchData(); // Refresh data after potential changes
  };

  // Render main content based on activeTab
  const renderMainContent = () => {
    if (activeTab === 'Dashboard') {
      return (
        <div className={styles.dashboardGrid}>
          <SummaryCard title="Rent Forecast" value={`₹${dashboardSummary.rentForecast.toLocaleString()}`} icon="💰" />
          <SummaryCard title="Rent Received" value={`₹${dashboardSummary.rentReceived.toLocaleString()}`} icon="✅" />
          <SummaryCard title="Rent Pending" value={`₹${dashboardSummary.rentPending.toLocaleString()}`} icon="⏳" />
          <SummaryCard title="Security Deposits" value={`₹${dashboardSummary.totalSecurityDeposits.toLocaleString()}`} icon="🛡️" />
          <SummaryCard title="Total Capacity" value={`${dashboardSummary.totalCapacity} Beds`} icon="🛌" />
          <SummaryCard title="Total Occupied" value={`${dashboardSummary.totalOccupiedBeds} Beds`} icon="🧑‍🤝‍🧑" />
          <SummaryCard title="Total Vacant" value={`${dashboardSummary.totalVacantBeds} Beds`} icon="🚪" />
        </div>
      );
    } else if (activeTab === 'Rooms') { // This 'Rooms' tab might be for a different purpose or can be removed if all room management is via Admin Console
      return (
        <div className={styles.roomsTabContainer}>
          <RoomsTab
            rooms={filteredRooms}
            onAddRoom={handleAddActualRoom} // Ensure this is the correct handler if this tab is kept
            onEditRoom={handleEditActualRoom} // Ensure this is the correct handler
            onDeleteRoom={handleDeleteActualRoom} // Ensure this is the correct handler
            roomForm={roomForm} 
            onFormChange={handleRoomFormChange}
            roomConfigurationTypes={roomConfigurationTypes}
            tenants={tenants}
            getTenantsForRoom={getTenantsForRoom}
          />
        </div>
      );
    } else if (activeTab === 'Tenants') {
      return (
        <div className={styles.tenantsTabContainer}>
          <TenantsTab 
            tenants={tenants}
            rooms={rooms} // Pass rooms data
            roomConfigurationTypes={roomConfigurationTypes} // Pass room config types
            onEditTenant={handleEditTenantTriggerModal} // Renamed prop
            onDeleteTenant={handleDeleteTenantInDashboard} // Pass the new handler
            onAddNewTenant={handleAddNewTenantViaModal} // Prop to open modal for new tenant
          />
        </div>
      );
    } else if (activeTab === 'Registration') {
      return (
        <div className={styles.registrationFormContainer}>
          <TenantRegistrationForm
            tenantForm={currentTenantForm}
            handleTenantFormChange={handleTenantFormChange}
            handleSaveTenant={handleSaveTenant}
            roomConfigurationTypes={roomConfigurationTypes}
          />
        </div>
      );
    } else if (activeTab === 'Admin Console') {
      // Render AdminConsole directly, passing necessary props
      return (
        <AdminConsole
          actualRoomsFromParent={rooms}
          onAddActualRoom={handleAddActualRoom}
          onEditActualRoom={handleEditActualRoom}
          onDeleteActualRoom={handleDeleteActualRoom}
          // roomConfigurationTypes will be fetched within AdminConsole itself
        />
      );
      // REMOVE old logic for showUserManagementConsole, showRoomConfigurationManagement, showRoomsAndRentSetup
      // if (showUserManagementConsole) { ... }
      // if (showRoomConfigurationManagement) { ... }
      // if (showRoomsAndRentSetup) { ... }
      // return ( <div className={styles.adminConsoleContainer}> ... old card grid ... </div> );
    } else if (activeTab === 'Room Booking') {
      return <div className={styles.roomBookingPageContainer}><RoomBookingPage rooms={rooms} tenants={tenants} roomConfigurationTypes={roomConfigurationTypes} /></div>;
    } else if (activeTab === 'Rent Payment') {
      return <div className={styles.comingSoonContainer}><ComingSoon pageTitle="Rent Payment" /></div>;
    } else if (activeTab === 'Reports') {
      return <div className={styles.reportsPageContainer}><ReportsPage tenants={tenants} rooms={rooms} dashboardSummary={dashboardSummary} /></div>;
    } else if (activeTab === 'Complaints') {
      return <div className={styles.comingSoonContainer}><ComingSoon pageTitle="Complaints" /></div>;
    } else if (activeTab === 'AI Chatbot') {
      return <div className={styles.comingSoonContainer}><ComingSoon pageTitle="AI Chatbot" /></div>;
    }
    // Fallback for any other activeTab value not explicitly handled above
    // console.warn(`Unhandled activeTab: ${activeTab}, rendering default dashboard.`);
    return (
      <div className={styles.dashboardGrid}>
          <SummaryCard title="Rent Forecast" value={`₹${dashboardSummary.rentForecast.toLocaleString()}`} icon="💰" />
          <SummaryCard title="Rent Received" value={`₹${dashboardSummary.rentReceived.toLocaleString()}`} icon="✅" />
          <SummaryCard title="Rent Pending" value={`₹${dashboardSummary.rentPending.toLocaleString()}`} icon="⏳" />
          <SummaryCard title="Security Deposits" value={`₹${dashboardSummary.totalSecurityDeposits.toLocaleString()}`} icon="🛡️" />
          <SummaryCard title="Total Capacity" value={`${dashboardSummary.totalCapacity} Beds`} icon="🛌" />
          <SummaryCard title="Total Occupied" value={`${dashboardSummary.totalOccupiedBeds} Beds`} icon="🧑‍🤝‍🧑" />
          <SummaryCard title="Total Vacant" value={`${dashboardSummary.totalVacantBeds} Beds`} icon="🚪" />
        </div>
    );
  }; // Correct placement of the closing brace for renderMainContent

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar menuItems={menuItems} activeTab={activeTab} onTabChange={handleTabChange} />
      <main className={styles.mainContentArea}>
        {renderMainContent()}
      </main>
      {showEditRoomModal && currentEditingRoom && (
        <EditRoomModal
          roomData={currentEditingRoom} // Pass the full room object
          roomConfigurationTypes={roomConfigurationTypes}
          onClose={() => {
            setShowEditRoomModal(false);
            setCurrentEditingRoom(null);
          }}
          onSave={handleUpdateActualRoom} // RENAMED from handleUpdateRoom
          onFormChange={handleEditModalFormChange} // Pass the handler for form changes within the modal
          tenants={tenants} // Pass tenants for bed assignment logic
        />
      )}
      {showEditTenantModal && (
        <EditTenantModal 
          editingTenant={currentEditingTenantData} // This can be a new tenant (initialTenantFormState) or existing
          rooms={rooms}
          allRoomConfigurationTypes={roomConfigurationTypes}
          allTenants={tenants} // Pass all tenants for bed conflict checking
          handleCancelEditTenant={handleCloseEditTenantModal}
          onSaveTenant={currentEditingTenantData?._id ? handleSaveTenantInModal : handleSaveNewTenantInModal} // Conditional save
          ACCOMMODATION_TYPES={ACCOMMODATION_TYPES} // Pass constants if needed by modal
          RENT_STATUS={RENT_STATUS} // Pass constants if needed by modal
        />
      )}
      {showAllocateRoomModal && tenantForAllocation && (
        <AllocateRoomModal
          tenant={tenantForAllocation}
          onClose={() => setShowAllocateRoomModal(false)}
          onConfirm={handleConfirmRoomAllocation}
          rooms={filteredRooms}
        />
      )}
    </div>
  );
};

export default NewAdminDashboard;