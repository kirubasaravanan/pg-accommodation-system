import React, { useState, useEffect, useCallback } from 'react';
import styles from './NewAdminDashboard.module.css';
import UserManagementConsole from '../components/UserManagementConsole';
import RoomConfigurationManagement from '../components/RoomConfigurationManagement';
import RoomsTab from './RoomsTab';
import EditRoomModal from '../components/EditRoomModal';
import SummaryCard from '../components/SummaryCard'; // Import SummaryCard
import { 
  fetchRooms, 
  fetchTenants, 
  fetchRoomConfigurationTypes,
  addRoom,
  updateRoom,
  deleteRoom,
  addTenant as addTenantApi, 
  updateTenant as updateTenantApi, 
  deleteTenant as deleteTenantApi
} from '../api';
import TenantsTab from './TenantsTab'; 
import TenantRegistrationForm from '../components/TenantRegistrationForm'; // Import the new form

// Define these constants, or ensure they are correctly sourced if defined elsewhere
const ACCOMMODATION_TYPES = ['Single', 'Shared', 'Premium', 'Private Mini','Private','Double Occupancy','Triple Occupancy','Four Occupancy','Five Occupancy']; // Example, adjust as needed
const RENT_STATUS = ['paid', 'due', 'partial', 'overdue']; // Example, adjust as needed


const NewAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currentDate, setCurrentDate] = useState('');
  const [showUserManagementConsole, setShowUserManagementConsole] = useState(false);
  const [showRoomConfigurationManagement, setShowRoomConfigurationManagement] = useState(false);

  // Function to handle tab changes and reset form for Registration tab
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'Registration') {
      // Reset tenant form to initial state for new registrations
      setCurrentTenantForm(initialTenantFormState);
      // Ensure editingTenantId is null so handleSaveTenant performs an add operation
      setEditingTenantId(null);
    }
    // Optional: If switching away from Tenants tab while an edit was in progress,
    // you might want to reset the form or ask for confirmation.
    // For now, we only explicitly handle the 'Registration' tab activation.
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
    moveInDate: '',
    preferredRoomType: '', // This is used in TenantsTab form
    emergencyContact: '',
    remarks: '',
    securityDeposit: { amount: '', refundableType: 'fully', conditions: '' },
    status: 'Active',
    accommodationType: 'Shared', // Default, ensure this matches available types
    rentPaidStatus: 'due', // Default
    intendedVacationDate: '',
    room: null,
  };
  const [currentTenantForm, setCurrentTenantForm] = useState(initialTenantFormState);
  const [editingTenantId, setEditingTenantId] = useState(null);

  const [dashboardSummary, setDashboardSummary] = useState({
    rentForecast: 0,
    rentReceived: 0,
    rentPending: 0,
    totalSecurityDeposits: 0,
    totalCapacity: 0, 
    totalOccupiedBeds: 0, 
    totalVacantBeds: 0, 
  });

  // Get token from localStorage
  const token = localStorage.getItem('token');

  const fetchData = useCallback(async () => {
    if (!token) {
      console.error("Authentication token not found. Please login.");
      // Optionally, redirect to login page
      return;
    }
    try {
      // Pass token to API calls
      const roomsRes = await fetchRooms(token);
      const fetchedRooms = roomsRes.data || [];
      setRooms(fetchedRooms);
      setFilteredRooms(fetchedRooms);

      const tenantsRes = await fetchTenants(token);
      const fetchedTenants = tenantsRes.data || [];
      setTenants(fetchedTenants);

      const roomConfigTypesRes = await fetchRoomConfigurationTypes(token);
      console.log('Fetched Room Config Types Response:', roomConfigTypesRes); // Log 1
      setRoomConfigurationTypes(roomConfigTypesRes.data || []);
      console.log('Room Config Types State after set:', roomConfigTypesRes.data || []); // Log 2
      
      let forecast = 0;
      let received = 0;
      let pending = 0;
      let security = 0;
      let capacity = 0; // Added
      let occupiedBeds = 0; // Added

      fetchedRooms.forEach(room => {
        const currentOccupancy = room.occupancy && typeof room.occupancy.current === 'number' ? room.occupancy.current : 0;
        const maxOccupancy = room.occupancy && typeof room.occupancy.max === 'number' ? room.occupancy.max : 0;
        const roomPrice = typeof room.price === 'number' ? room.price : 0;
        
        forecast += currentOccupancy * roomPrice;
        capacity += maxOccupancy;
        occupiedBeds += currentOccupancy;
      });

      fetchedTenants.forEach(tenant => {
        // Determine rent: use customRent if available and valid, else use room's price
        let tenantRent = 0;
        if (tenant.customRent && typeof tenant.customRent === 'number' && tenant.customRent > 0) {
          tenantRent = tenant.customRent;
        } else if (tenant.room && typeof tenant.room.price === 'number') { // tenant.room might be an ID or populated object
          // If tenant.room is just an ID, we need to find the room details
          const roomDetails = fetchedRooms.find(r => r._id === tenant.room || (tenant.room._id && r._id === tenant.room._id));
          if (roomDetails && typeof roomDetails.price === 'number') {
            tenantRent = roomDetails.price;
          }
        } else if (tenant.roomName) { // Fallback if tenant.room is not populated but roomName exists
            const roomDetails = fetchedRooms.find(r => r.name === tenant.roomName);
            if (roomDetails && typeof roomDetails.price === 'number') {
                tenantRent = roomDetails.price;
            }
        }

        if (tenant.rentPaidStatus === 'paid') {
          received += tenantRent;
        } else if (tenant.rentPaidStatus === 'due' || tenant.rentPaidStatus === 'partial') {
          pending += tenantRent;
        }
        if (tenant.securityDeposit && typeof tenant.securityDeposit.amount === 'number') {
          security += tenant.securityDeposit.amount;
        }
      });
      
      const vacantBeds = capacity - occupiedBeds; // Added

      setDashboardSummary({
        rentForecast: forecast,
        rentReceived: received,
        rentPending: pending, 
        totalSecurityDeposits: security,
        totalCapacity: capacity, // Added
        totalOccupiedBeds: occupiedBeds, // Added
        totalVacantBeds: vacantBeds, // Added
      });

    } catch (error) {
      console.error("Error fetching data or calculating summary:", error);
    }
  }, []); // Removed fetchedRooms from dependencies as it's defined inside

  useEffect(() => {
    fetchData();
    // Log roomConfigurationTypes state inside useEffect after fetchData is called, to see it post-fetch
    // console.log(\'Room Config Types State in useEffect (after fetchData call):\', roomConfigurationTypes); // Log 3 - Commented out for brevity
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    setCurrentDate(formattedDate);
  }, [fetchData]);

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

  const adminConsoleItems = [
    { id: 'userManagement', iconText: 'UM', title: 'User Management', description: 'Manage admin, staff, roles' },
    { id: 'roomConfiguration', iconText: 'RC', title: 'Room Configuration', description: 'Add and edit rooms, types' },
    { id: 'rentSetup', iconText: 'RS', title: 'Rent Setup', description: 'Configure rent amounts' },
    { id: 'discountsOffers', iconText: 'DO', title: 'Discounts & Offers', description: 'Apply custom discounts' },
    { id: 'permissionRoles', iconText: 'PR', title: 'Permission/Roles Setup', description: 'Define user access rights' },
    { id: 'policyNotice', iconText: 'PN', title: 'Policy & Notice Board', description: 'Update rules and announcements' },
    { id: 'integrationsSetup', iconText: 'IS', title: 'Integrations Setup', description: 'Connect external services' },
    { id: 'backupRestore', iconText: 'BR', title: 'Backup & Restore', description: 'Manage data backup' },
  ];

  const handleAdminConsoleCardClick = (itemId) => {
    setActiveTab('Admin Console');
    if (itemId === 'userManagement') {
      setShowUserManagementConsole(true);
      setShowRoomConfigurationManagement(false);
    } else if (itemId === 'roomConfiguration') {
      setShowRoomConfigurationManagement(true);
      setShowUserManagementConsole(false);
    }
  };
  
  const handleBackToAdminConsole = () => {
    setShowUserManagementConsole(false);
    setShowRoomConfigurationManagement(false);
    setActiveTab('Admin Console');
  };

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
      if (!prevRoom) return null; // Should not happen if modal is visible

      if (name === "roomConfigurationType") {
        const selectedConfig = roomConfigurationTypes.find(config => config._id === value);
        return {
          ...prevRoom,
          roomConfigurationType: value, // Store ID
          price: selectedConfig ? selectedConfig.baseRent : prevRoom.price,
          occupancy: {
            ...prevRoom.occupancy,
            max: selectedConfig ? selectedConfig.baseSharingCapacity : prevRoom.occupancy.max,
          }
        };
      } else if (name === "occupancy.max") { // Should be read-only, but handle defensively
          return {
              ...prevRoom,
              occupancy: { ...prevRoom.occupancy, max: parseInt(value, 10) || 0 }
          };
      } else {
        // For fields like 'name', 'location'
        return {
          ...prevRoom,
          [name]: value
        };
      }
    });
  };

  // Tenant Form Handlers
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

  const handleEditTenantClick = (tenant) => {
    setEditingTenantId(tenant._id);
    setCurrentTenantForm({
      name: tenant.name || '',
      contact: tenant.contact || '',
      email: tenant.email || '',
      aadharNumber: tenant.aadharNumber || '',
      moveInDate: tenant.moveInDate ? new Date(tenant.moveInDate).toISOString().split('T')[0] : '',
      preferredRoomType: tenant.preferredRoomType || '',
      emergencyContact: tenant.emergencyContact || '',
      remarks: tenant.remarks || '',
      securityDeposit: {
        amount: tenant.securityDeposit?.amount || '',
        refundableType: tenant.securityDeposit?.refundableType || 'fully',
        conditions: tenant.securityDeposit?.conditions || '',
      },
      status: tenant.status || 'Active',
      accommodationType: tenant.accommodationType || 'Shared',
      rentPaidStatus: tenant.rentPaidStatus || 'due',
      intendedVacationDate: tenant.intendedVacationDate ? new Date(tenant.intendedVacationDate).toISOString().split('T')[0] : '',
      room: tenant.room?._id || tenant.room || null,
      // Ensure all fields from initialTenantFormState are covered
      ...tenant // Spread tenant to include any other fields not explicitly listed
    });
  };

  const handleCancelEditTenant = () => {
    setEditingTenantId(null);
    setCurrentTenantForm(initialTenantFormState);
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      alert("Authentication error. Please login again.");
      return;
    }
    try {
      let tenantDataPayload = { ...currentTenantForm };

      if (!editingTenantId) { // Adding a new tenant
        tenantDataPayload.securityDeposit = {
          ...tenantDataPayload.securityDeposit,
          refundableType: 'fully',
          conditions: tenantDataPayload.securityDeposit?.conditions || 'Fully refundable subject to standard terms and conditions.' // Or just ''
        };
      }
      // Remove fields not expected by backend or handle them appropriately
      // For example, preferredRoomType might be for frontend logic, not direct model field
      // delete tenantDataPayload.preferredRoomType; 

      if (editingTenantId) {
        await updateTenantApi(editingTenantId, tenantDataPayload, currentToken);
        alert('Tenant updated successfully');
      } else {
        await addTenantApi(tenantDataPayload, currentToken);
        alert('Tenant added successfully');
      }
      fetchData(); // Refresh tenants list
      handleCancelEditTenant(); // Reset form
    } catch (error) {
      console.error("Error saving tenant:", error.response || error);
      alert(`Error saving tenant: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteTenantById = async (tenantId) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      alert("Authentication error. Please login again.");
      return;
    }
    try {
      await deleteTenantApi(tenantId, currentToken);
      alert('Tenant deleted successfully');
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error deleting tenant:", error.response || error);
      alert(`Error deleting tenant: ${error.response?.data?.message || error.message}`);
    }
  };


  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomConfigurationType) {
        alert("Please select a room configuration type.");
        return;
    }
    if (!token) {
        alert("Authentication error. Please login again.");
        return;
    }
    try {
      const payload = {
        name: roomForm.name,
        location: roomForm.location,
        price: roomForm.price, 
        occupancy: { max: roomForm.occupancy.max }, 
        roomConfigurationTypeId: roomForm.roomConfigurationType, // Changed to roomConfigurationTypeId
      };
      await addRoom(payload, token);
      fetchData();
      setRoomForm({ name: '', location: '', price: '', roomConfigurationType: '', occupancy: { current: 0, max: '' } });
      alert('Room added successfully!');
    } catch (error) {
      let alertMessage = "An unexpected error occurred.";
      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            alertMessage = error.response.data;
          } else if (error.response.data.message && typeof error.response.data.message === 'string') {
            alertMessage = error.response.data.message;
          } else {
            try {
              alertMessage = JSON.stringify(error.response.data);
            } catch (e) {
              alertMessage = "Could not parse error data.";
            }
          }
        } else if (error.response.statusText) {
          alertMessage = error.response.statusText;
        }
      } else if (error.message) {
        alertMessage = error.message;
      }
      console.error("Error adding room:", error.response ? error.response.data : error); // Log the full error object if possible
      alert(`Error adding room: ${alertMessage}`);
    }
  };

  const handleEditRoom = (room) => {
    console.log("NewAdminDashboard: handleEditRoom called with room:", room); // LOG A

    const roomConfigId = room.roomConfigurationType 
      ? (typeof room.roomConfigurationType === 'string' 
          ? room.roomConfigurationType 
          : room.roomConfigurationType._id) 
      : '';
    console.log("NewAdminDashboard: Determined roomConfigId for edit:", roomConfigId); // LOG B

    const selectedConfig = roomConfigurationTypes.find(config => config._id === roomConfigId);
    console.log("NewAdminDashboard: Found selectedConfig for edit:", selectedConfig); // LOG C

    const editingRoomData = {
      ...room,
      roomConfigurationType: roomConfigId, // Ensure this is just the ID for the select input
      price: selectedConfig ? selectedConfig.baseRent : room.price,
      occupancy: { 
        current: room.occupancy ? room.occupancy.current || 0 : 0, 
        max: selectedConfig 
              ? selectedConfig.baseSharingCapacity 
              : (room.occupancy ? room.occupancy.max : '') // Corrected ternary operator
      },
    };
    console.log("NewAdminDashboard: Prepared editingRoomData for modal:", editingRoomData); // LOG D

    setCurrentEditingRoom(editingRoomData);
    setShowEditRoomModal(true);
    console.log("NewAdminDashboard: setCurrentEditingRoom called, showEditRoomModal set to true."); // LOG E
  };

  useEffect(() => {
    if (showEditRoomModal) {
      console.log("NewAdminDashboard: EditRoomModal is now visible. currentEditingRoom state:", currentEditingRoom); // LOG F
    }
  }, [showEditRoomModal, currentEditingRoom]);

  const handleUpdateRoom = async (e) => {
    e.preventDefault(); // Ensure event is passed and used
    if (!currentEditingRoom) return;
    const currentToken = localStorage.getItem('token'); // Get fresh token
    if (!currentToken) {
        alert("Authentication error. Please login again.");
        return;
    }
    try {
      const { _id, name, location, roomConfigurationType } = currentEditingRoom; 
      const payload = {
        // id: _id, // id is part of _id, not needed explicitly in payload if passed as first arg to updateRoom
        name,
        location,
        price: currentEditingRoom.price, 
        occupancy: { max: currentEditingRoom.occupancy.max }, 
        roomConfigurationTypeId: roomConfigurationType, 
      };
      // Correctly pass roomId as the first argument, then roomData (payload), then token
      await updateRoom(_id, payload, currentToken); 
      fetchData();
      setShowEditRoomModal(false);
      alert('Room updated successfully!');
    } catch (error) {
      let alertMessage = "An unexpected error occurred.";
      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            alertMessage = error.response.data;
          } else if (error.response.data.message && typeof error.response.data.message === 'string') {
            alertMessage = error.response.data.message;
          } else {
            try {
              alertMessage = JSON.stringify(error.response.data);
            } catch (e) {
              alertMessage = "Could not parse error data.";
            }
          }
        } else if (error.response.statusText) {
          alertMessage = error.response.statusText;
        }
      } else if (error.message) {
        alertMessage = error.message;
      }
      console.error("Error updating room:", error.response ? error.response.data : error); // Log the full error object if possible
      alert(`Error updating room: ${alertMessage}`);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!token) {
        alert("Authentication error. Please login again.");
        return;
    }
    try {
      await deleteRoom(roomId, token);
      fetchData();
      alert('Room deleted successfully!');
    } catch (error) {
      let alertMessage = "An unexpected error occurred.";
      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            alertMessage = error.response.data;
          } else if (error.response.data.message && typeof error.response.data.message === 'string') {
            alertMessage = error.response.data.message;
          } else {
            try {
              alertMessage = JSON.stringify(error.response.data);
            } catch (e) {
              alertMessage = "Could not parse error data.";
            }
          }
        } else if (error.response.statusText) {
          alertMessage = error.response.statusText;
        }
      } else if (error.message) {
        alertMessage = error.message;
      }
      console.error("Error deleting room:", error.response ? error.response.data : error); // Log the full error object if possible
      alert(`Error deleting room: ${alertMessage}`);
    }
  };

  return (
    <div className={styles.dashboard}> {/* Ensure this is the top-level div with flex:row */}
      <nav className={styles.sidebar}>
        <ul className={styles.menu}>
          {menuItems.map(item => (
            <li key={item.name} className={styles.menuItem} onClick={() => handleTabChange(item.name)}> {/* Use handleTabChange */}
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.itemName}>{item.name}</span>
            </li>
          ))}
        </ul>
      </nav>
      <main className={styles.mainContent}> {/* This will be a flex column for header and active tab content */}
        <header className={styles.header}>
          <h1>Admin Dashboard</h1>
          <div className={styles.date}>{currentDate}</div>
        </header>
        
        {/* Wrap tab content in a div that can scroll if needed, using a class like styles.contentArea or styles.dashboardContent */}
        <div className={styles.contentArea}> {/* Use contentArea for consistent padding and scrolling */}
          {activeTab === 'Dashboard' && (
            <div className={styles.dashboardContent}> 
              <h2>Dashboard Summary</h2>
              {/* Apply the .summaryCards class here */}
              <div className={styles.summaryCards}> 
                <SummaryCard title="Rent Forecast" value={`$${dashboardSummary.rentForecast}`} />
                <SummaryCard title="Rent Received" value={`$${dashboardSummary.rentReceived}`} />
                <SummaryCard title="Rent Pending" value={`$${dashboardSummary.rentPending}`} />
                <SummaryCard title="Total Security Deposits" value={`$${dashboardSummary.totalSecurityDeposits}`} />
                <SummaryCard title="Total Capacity" value={dashboardSummary.totalCapacity} />
                <SummaryCard title="Total Occupied Beds" value={dashboardSummary.totalOccupiedBeds} />
                <SummaryCard title="Total Vacant Beds" value={dashboardSummary.totalVacantBeds} />
              </div>
            </div>
          )}
          {activeTab === 'Room Booking' && (
            <div className={styles.roomsTabContainer}> 
              <RoomsTab 
                rooms={filteredRooms} 
                handleEditRoom={handleEditRoom} 
                handleDeleteRoom={handleDeleteRoom} 
                // onAddRoom prop removed as RoomsTab handles its own add form
                roomForm={roomForm}
                roomConfigurationTypes={roomConfigurationTypes}
                handleRoomFormChange={handleRoomFormChange}
                handleAddRoom={handleAddRoom} // This is for the internal form in RoomsTab
                rentForecast={dashboardSummary.rentForecast}
                totalCapacity={dashboardSummary.totalCapacity}
                totalOccupiedBeds={dashboardSummary.totalOccupiedBeds}
                totalVacantBeds={dashboardSummary.totalVacantBeds}
                setRoomForm={setRoomForm}
                // getTenantsForRoom prop needs to be defined and passed if RoomsTab uses it.
                // Assuming getTenantsForRoom is not yet implemented or passed based on current context.
              />
            </div>
          )}
          {activeTab === 'Tenants' && (
            // Similar wrapping for TenantsTab
            <div className={styles.tenantsTabContainer}>
              <TenantsTab 
                tenants={tenants}
                rooms={rooms} 
                tenantForm={currentTenantForm} // For editing
                editingTenantId={editingTenantId} // For editing
                handleTenantFormChange={handleTenantFormChange} // For editing
                // handleAddTenant is removed as new registrations are in a separate tab
                handleUpdateTenant={handleSaveTenant} // For editing
                handleEditTenant={handleEditTenantClick} // For editing
                handleDeleteTenant={handleDeleteTenantById} // For editing
                handleCancelEditTenant={handleCancelEditTenant} // For editing
                ACCOMMODATION_TYPES={ACCOMMODATION_TYPES}
                RENT_STATUS={RENT_STATUS}
              />
            </div>
          )}
          {activeTab === 'Registration' && (
            <div className={styles.registrationTabContainer}> {/* Optional: Add specific styles if needed */}
              <TenantRegistrationForm
                tenantForm={currentTenantForm}
                handleTenantFormChange={handleTenantFormChange}
                handleSaveTenant={handleSaveTenant} // This will handle new tenant creation
                // roomConfigurationTypes={roomConfigurationTypes} // Pass if needed by the form
              />
            </div>
          )}
          {activeTab === 'Admin Console' && (
            <div className={styles.adminConsole}> {/* Main container for Admin Console tab content */}
              {showUserManagementConsole ? (
                <UserManagementConsole 
                  onBack={handleBackToAdminConsole} 
                  token={token} 
                  onUserAction={fetchData} // Refresh data on user action
                />
              ) : showRoomConfigurationManagement ? (
                <RoomConfigurationManagement 
                  onBack={handleBackToAdminConsole} 
                  token={token} 
                  roomConfigurationTypes={roomConfigurationTypes}
                  onRoomConfigAction={fetchData} // Refresh data on room config action
                />
              ) : (
                // This fragment renders when neither UserManagement nor RoomConfiguration is active
                <>
                  <h2>Admin Console</h2>
                  {/* Use adminConsoleGrid for the grid layout of cards */}
                  <div className={styles.adminConsoleGrid}> 
                    {adminConsoleItems.map(item => (
                      <div key={item.id} className={styles.adminCard} onClick={() => handleAdminConsoleCardClick(item.id)}>
                        <div className={styles.iconText}>{item.iconText}</div>
                        <div className={styles.adminInfo}>
                          <h3 className={styles.adminTitle}>{item.title}</h3>
                          <p className={styles.adminDescription}>{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </main>
      {showEditRoomModal && currentEditingRoom && (
        <EditRoomModal 
          editingRoom={currentEditingRoom} 
          tenants={tenants}
          handleCancelEditRoom={() => setShowEditRoomModal(false)} 
          handleSaveRoom={handleUpdateRoom} // Modal is for editing
          onFormChange={handleEditModalFormChange}
          roomConfigurationTypes={roomConfigurationTypes}
          // token prop removed as it's not used by EditRoomModal
        />
      )}
    </div>
  );
};

export default NewAdminDashboard;