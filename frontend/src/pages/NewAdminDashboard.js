import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './NewAdminDashboard.module.css';
// import UserManagementConsole from '../components/UserManagementConsole'; // Not directly used in Admin Console view
// import RoomConfigurationManagement from '../components/RoomConfigurationManagement'; // Not directly used
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
import AdminConsole from './AdminConsole.tsx';

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

const RENT_STATUS = ['paid', 'due', 'partial'];
const ACCOMMODATION_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'daily', label: 'Daily' }
]; 

const pathToTabName = (path) => {
  if (!path) return 'Dashboard';
  const pathWithoutHashAndQuery = path.split('#')[0].split('?')[0];
  const lastSegment = pathWithoutHashAndQuery.substring(pathWithoutHashAndQuery.lastIndexOf('/') + 1);
  const cleanSegment = lastSegment;

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
    default:
      if (pathWithoutHashAndQuery === '/new-dashboard' || pathWithoutHashAndQuery === '/new-dashboard/') {
        return 'Dashboard';
      }
      if (pathWithoutHashAndQuery.startsWith('/new-dashboard/admin-console')) {
        return 'Admin Console';
      }
      return 'Dashboard'; 
  }
};

// Define menuItems for the Sidebar
const menuItems = [
  { name: 'Dashboard', path: '/new-dashboard/dashboard' }, 
  { name: 'Room Booking', path: '/new-dashboard/room-booking' },
  { name: 'Tenants', path: '/new-dashboard/tenants' },
  { name: 'Registration', path: '/new-dashboard/registration' }, 
  { name: 'Rent Payment', path: '/new-dashboard/rent-payment' },
  { name: 'Reports', path: '/new-dashboard/reports' },
  { name: 'Complaints', path: '/new-dashboard/complaints' },
  { name: 'AI Chatbot', path: '/new-dashboard/ai-chatbot' },
  { name: 'Admin Console', path: '/new-dashboard/admin-console' },
];

const NewAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize activeTab based on the current URL path
  const [activeTab, setActiveTab] = useState(() => pathToTabName(location.pathname));
  const [currentDate, setCurrentDate] = useState('');

  // State for EditTenantModal
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [currentEditingTenantData, setCurrentEditingTenantData] = useState(null);

  // State for room configuration types, now managed here
  const [roomConfigurationTypes, setRoomConfigurationTypes] = useState([]);
  const [isLoadingRoomConfigs, setIsLoadingRoomConfigs] = useState(false);

  // Update activeTab when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const newTabName = pathToTabName(location.pathname);
    setActiveTab(newTabName);

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

  // New function to fetch/refresh room configuration types
  const refreshRoomConfigurationTypes = useCallback(async () => {
    console.log('[NewAdminDashboard] refreshRoomConfigurationTypes CALLED. Timestamp:', Date.now());
    setIsLoadingRoomConfigs(true);
    try {
      const response = await fetchRoomConfigurationTypes(); // API call
      console.log('[NewAdminDashboard] fetchRoomConfigurationTypes API response STATUS:', response.status);
      console.log('[NewAdminDashboard] fetchRoomConfigurationTypes API response.data:', response.data);
      const dataToSet = Array.isArray(response.data) ? response.data : [];
      setRoomConfigurationTypes(dataToSet);
      console.log('[NewAdminDashboard] roomConfigurationTypes STATE SET with (length):', dataToSet.length, 'Data:', dataToSet, 'Timestamp:', Date.now());
    } catch (error) {
      console.error("[NewAdminDashboard] Error fetching room configuration types:", error.response ? error.response.data : error.message, error);
      setRoomConfigurationTypes([]); // Set to empty array on error
      // Optionally, set an error state to display to the user
    } finally {
      setIsLoadingRoomConfigs(false);
      console.log('[NewAdminDashboard] refreshRoomConfigurationTypes FINISHED. isLoadingRoomConfigs is now false. Timestamp:', Date.now());
    }
  }, []); // Empty dependency array as it uses no external state other than setters

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

      // Call the new refresh function for room configs
      await refreshRoomConfigurationTypes();
      
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
}, [refreshRoomConfigurationTypes]); // Added refreshRoomConfigurationTypes to dependency array

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

  // Tenant Management Handlers
  const handleOpenAddTenantModal = () => {
    console.log('[NewAdminDashboard] handleOpenAddTenantModal called');
    setCurrentEditingTenantData(initialTenantFormState); // Use initialTenantFormState for a new tenant
    setShowEditTenantModal(true);
  };

  const handleEditTenant = (tenant) => {
    console.log('[NewAdminDashboard] handleEditTenant called with:', tenant);
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
      aadharFileName: tenant.aadharFileName || '', // Ensure aadharFileName is included
    };
    console.log('[NewAdminDashboard] Data prepared for EditTenantModal:', tenantDataForModal);
    setCurrentEditingTenantData(tenantDataForModal); 
    setShowEditTenantModal(true);
  };

  const handleCancelEditTenant = () => {
    console.log('[NewAdminDashboard] handleCancelEditTenant called');
    setShowEditTenantModal(false);
    setCurrentEditingTenantData(null); 
  };

  // This is the primary save handler for tenants, used by EditTenantModal
  const handleSaveTenant = async (tenantData, aadharFile) => {
    console.log('[NewAdminDashboard] handleSaveTenant (for Modal) called with tenantData:', tenantData, 'Aadhar File:', aadharFile);
    
    // Log the critical fields from tenantData received by this handler
    console.log('[NewAdminDashboard] handleSaveTenant - Received tenantData.name:', tenantData?.name);
    console.log('[NewAdminDashboard] handleSaveTenant - Received tenantData.contact:', tenantData?.contact);
    console.log('[NewAdminDashboard] handleSaveTenant - Received tenantData.email:', tenantData?.email);

    try {
      const formData = new FormData();

      for (const key in tenantData) {
        if (tenantData.hasOwnProperty(key)) {
          if (key === 'securityDeposit' && typeof tenantData[key] === 'object' && tenantData[key] !== null) {
            formData.append(key, JSON.stringify(tenantData[key]));
          } else if (tenantData[key] !== null && tenantData[key] !== undefined) {
            formData.append(key, tenantData[key]);
          }
        }
      }

      if (aadharFile) {
        formData.append('aadharFile', aadharFile);
      }
      
      console.log("[NewAdminDashboard] FormData to be sent:");
      for (let pair of formData.entries()) {
        console.log(pair[0]+ '=' + (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
      }

      if (tenantData._id) {
        console.log(`[NewAdminDashboard] Updating tenant with ID: ${tenantData._id}`);
        await updateTenant(tenantData._id, formData);
      } else {
        console.log("[NewAdminDashboard] Adding new tenant.");
        await addTenant(formData);
      }

      alert(tenantData._id ? 'Tenant updated successfully' : 'Tenant added successfully');
      fetchData(); 
      setShowEditTenantModal(false);
      setCurrentEditingTenantData(null);
    } catch (error) {
      console.error("Error saving tenant:", error.response || error);
      alert(`Error saving tenant: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteExistingTenant = async (tenantId) => { 
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await deleteTenant(tenantId); 
        alert('Tenant deleted successfully');
        fetchData(); 
      } catch (error) {
        console.error("Error deleting tenant:", error.response || error);
        alert(`Error deleting tenant: ${error.response?.data?.error || error.message}`);
      }
    }
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
  
  const handleRegisterTenant = async (tenantDataToSave) => {
    try {
      await addTenant(tenantDataToSave);
      alert('Tenant registered successfully!');
      fetchData();
      setCurrentTenantForm(initialTenantFormState);
    } catch (error) {
      console.error('Error registering tenant:', error.response || error);
      alert(`Error registering tenant: ${error.response?.data?.error || error.message}`);
    }
  };

  // Dummy handlers for props that might be expected by child components but not fully implemented
  const handleRoomFormChange = (e) => {
    const { name, value } = e.target;
    setRoomForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditModalFormChange = (updatedRoomData) => {
    // This function is meant to update the state of the currently editing room
    // based on changes in the EditRoomModal.
    // It might be more complex if the modal directly manipulates a local state
    // and only calls onSave with the final data.
    // For now, let's assume it updates currentEditingRoom.
    setCurrentEditingRoom(prev => ({ ...prev, ...updatedRoomData }));
  };
  
  const handleConfirmRoomAllocation = (tenantId, roomId, bedNumber) => {
    // Placeholder for room allocation logic
    console.log(`Allocating room ${roomId}, bed ${bedNumber} to tenant ${tenantId}`);
    // This would typically involve an API call and then fetchData()
    setShowAllocateRoomModal(false);
    setTenantForAllocation(null);
  };


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
    } else if (activeTab === 'Rooms') {
      return (
        <div className={styles.roomsTabContainer}>
          <RoomsTab
            rooms={filteredRooms}
            onAddRoom={handleAddActualRoom}
            onEditRoom={handleEditActualRoom}
            onDeleteRoom={handleDeleteActualRoom}
            roomForm={roomForm} 
            onFormChange={handleRoomFormChange} // Added
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
            rooms={rooms}
            roomConfigurationTypes={roomConfigurationTypes}
            onEditTenant={handleEditTenant}
            onDeleteTenant={handleDeleteExistingTenant}
            onAddNewTenant={handleOpenAddTenantModal}
          />
        </div>
      );
    } else if (activeTab === 'Registration') {
      return (
        <div className={styles.registrationFormContainer}>
          <TenantRegistrationForm
            tenantForm={currentTenantForm}
            handleTenantFormChange={handleTenantFormChange}
            handleSaveTenant={handleRegisterTenant}
            roomConfigurationTypes={roomConfigurationTypes}
            rooms={rooms}
          />
        </div>
      );
    } else if (activeTab === 'Admin Console') {
      return (
        <AdminConsole
          rooms={rooms}
          onAddActualRoom={handleAddActualRoom}
          onEditActualRoom={handleEditActualRoom}
          onDeleteActualRoom={handleDeleteActualRoom}
          // Pass room configuration types and management props
          roomConfigurationTypesFromParent={roomConfigurationTypes}
          isLoadingRoomConfigsFromParent={isLoadingRoomConfigs}
          onRefreshRoomConfigurationTypes={refreshRoomConfigurationTypes}
          // Pass other necessary props if AdminConsole needs them, e.g., tenants for some views
          // tenants={tenants} // This was passed before, check if AdminConsole still needs it directly
        />
      );
    } else if (activeTab === 'Room Booking') {
      return <div className={styles.roomBookingPageContainer}><RoomBookingPage rooms={rooms} tenants={tenants} roomConfigurationTypes={roomConfigurationTypes}/></div>;
    } else if (activeTab === 'Rent Payment') {
      return <div className={styles.comingSoonContainer}><ComingSoon pageTitle="Rent Payment" /></div>;
    } else if (activeTab === 'Reports') {
      return <div className={styles.reportsPageContainer}><ReportsPage tenants={tenants} rooms={rooms} dashboardSummary={dashboardSummary} /></div>;
    } else if (activeTab === 'Complaints') {
      return <div className={styles.comingSoonContainer}><ComingSoon pageTitle="Complaints" /></div>;
    } else if (activeTab === 'AI Chatbot') {
      return <div className={styles.comingSoonContainer}><ComingSoon pageTitle="AI Chatbot" /></div>;
    }
    return ( // Fallback to Dashboard content
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
          roomData={currentEditingRoom}
          roomConfigurationTypes={roomConfigurationTypes}
          onClose={() => {
            setShowEditRoomModal(false);
            setCurrentEditingRoom(null);
          }}
          onSave={handleUpdateActualRoom}
          onFormChange={handleEditModalFormChange} 
          tenants={tenants}
        />
      )}
      {showEditTenantModal && (
        <EditTenantModal 
          editingTenant={currentEditingTenantData} 
          rooms={rooms} 
          handleCancelEditTenant={handleCancelEditTenant} 
          onSaveTenant={handleSaveTenant}
          ACCOMMODATION_TYPES={ACCOMMODATION_TYPES} 
          RENT_STATUS={RENT_STATUS} 
          allRoomConfigurationTypes={roomConfigurationTypes}
          allTenants={tenants} 
        />
      )}
      {showAllocateRoomModal && tenantForAllocation && (
        <AllocateRoomModal
          show={showAllocateRoomModal}
          onClose={() => {
              setShowAllocateRoomModal(false);
              setTenantForAllocation(null); 
          }}
          tenantId={tenantForAllocation._id}
          tenantName={tenantForAllocation.name}
          preferredRoomConfigId={tenantForAllocation.preferredRoomType}
          allRoomConfigs={roomConfigurationTypes}
          onAllocationSuccess={() => {
              fetchData(); 
              setShowAllocateRoomModal(false); 
              setTenantForAllocation(null);
          }}
        />
      )}
    </div>
  );
};

export default NewAdminDashboard;