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
  deleteRoom 
} from '../api';

const NewAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currentDate, setCurrentDate] = useState('');
  const [showUserManagementConsole, setShowUserManagementConsole] = useState(false);
  const [showRoomConfigurationManagement, setShowRoomConfigurationManagement] = useState(false);

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
      setRoomConfigurationTypes(roomConfigTypesRes.data || []);

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

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomConfigurationType) {
        alert("Please select a room configuration type.");
        return;
    }
    if (!token) { // Check for token
        alert("Authentication error. Please login again.");
        return;
    }
    try {
      const payload = {
        name: roomForm.name,
        location: roomForm.location,
        price: roomForm.price, 
        occupancy: { max: roomForm.occupancy.max }, 
        roomConfigurationType: roomForm.roomConfigurationType, 
      };
      await addRoom(payload, token); // Pass token
      fetchData();
      setRoomForm({ name: '', location: '', price: '', roomConfigurationType: '', occupancy: { current: 0, max: '' } });
      alert('Room added successfully!');
    } catch (error) {
      console.error("Error adding room:", error.response ? error.response.data : error.message);
      alert(`Error adding room: ${error.response ? error.response.data.message || error.response.data : error.message}`);
    }
  };

  const handleEditRoom = (room) => {
    const roomConfigId = room.roomConfigurationType ? (typeof room.roomConfigurationType === 'string' ? room.roomConfigurationType : room.roomConfigurationType._id) : '';
    const selectedConfig = roomConfigurationTypes.find(config => config._id === roomConfigId);

    setCurrentEditingRoom({
      ...room,
      roomConfigurationType: roomConfigId,
      price: selectedConfig ? selectedConfig.baseRent : room.price,
      occupancy: { 
        current: room.occupancy.current || 0, 
        max: selectedConfig ? selectedConfig.baseSharingCapacity : room.occupancy.max 
      },
    });
    setShowEditRoomModal(true);
  };

  const handleEditModalFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingRoom(prevRoom => {
      if (name === "roomConfigurationType") {
        const selectedConfig = roomConfigurationTypes.find(config => config._id === value);
        return {
          ...prevRoom,
          roomConfigurationType: value,
          price: selectedConfig ? selectedConfig.baseRent : '',
          occupancy: {
            ...prevRoom.occupancy,
            max: selectedConfig ? selectedConfig.baseSharingCapacity : '',
          }
        };
      } else if (name === "occupancy.max") {
          return {
              ...prevRoom,
              occupancy: { ...prevRoom.occupancy, max: value }
          };
      } else {
        return {
          ...prevRoom,
          [name]: value,
        };
      }
    });
  };
  
      };
      await updateRoom(currentEditingRoom._id, payload);
      fetchData();
      setShowEditRoomModal(false);
      setCurrentEditingRoom(null);
      alert('Room updated successfully!');
    } catch (error) {
      console.error("Error updating room:", error.response ? error.response.data : error.message);
      alert(`Error updating room: ${error.response ? error.response.data.message || error.response.data : error.message}`);
    }
  };

  const handleCancelEditRoomModal = () => {
    setShowEditRoomModal(false);
    setCurrentEditingRoom(null);
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
        try {
            await deleteRoom(roomId);
            fetchData();
            alert('Room deleted successfully!');
        } catch (error) {
            console.error("Error deleting room:", error.response ? error.response.data : error.message);
            alert(`Error deleting room: ${error.response ? error.response.data.message || error.response.data : error.message}`);
        }
    }
  };
  
  const getTenantsForRoom = (roomName) => {
      return tenants.filter(tenant => tenant.roomName === roomName);
  };

  const renderTabContent = () => {
    if (activeTab === 'Dashboard') {
      return (
        <div className={styles.dashboardGrid}>
          <SummaryCard title="Rent Forecast" value={`₹${dashboardSummary.rentForecast.toLocaleString()}`} icon="📈" />
          <SummaryCard title="Rent Received" value={`₹${dashboardSummary.rentReceived.toLocaleString()}`} icon="✅" />
          <SummaryCard title="Rent Pending" value={`₹${dashboardSummary.rentPending.toLocaleString()}`} icon="⏳" />
          <SummaryCard title="Security Deposits" value={`₹${dashboardSummary.totalSecurityDeposits.toLocaleString()}`} icon="🛡️" />
        </div>
      );
    } else if (activeTab === 'Room Booking') {
      return (
        <RoomsTab
          rooms={rooms} // Changed from filteredRooms to rooms to ensure all rooms are passed for stats
          roomForm={roomForm}
          onFormChange={handleRoomFormChange}
          onAddRoom={handleAddRoom}
          onEditRoom={handleEditRoom}
          onDeleteRoom={handleDeleteRoom}
          roomConfigurationTypes={roomConfigurationTypes}
          getTenantsForRoom={getTenantsForRoom}
          // Pass new summary stats for rooms tab
          rentForecast={dashboardSummary.rentForecast}
          totalCapacity={dashboardSummary.totalCapacity}
          totalOccupiedBeds={dashboardSummary.totalOccupiedBeds}
          totalVacantBeds={dashboardSummary.totalVacantBeds}
          // Pass existing props that RoomsTab might use from the screenshot context
          setRoomForm={setRoomForm} // Assuming RoomsTab uses this for its clear form button
          // navigate and setShowAddRoomTypeModal are not directly available here
          // they were part of AdminDashboard.js. If RoomsTab needs them, 
          // they need to be passed down from a higher component or handled differently.
          // For now, focusing on summary data.
        />
      );
    } else if (activeTab === 'Admin Console') {
      if (showUserManagementConsole) {
        return <UserManagementConsole onBack={handleBackToAdminConsole} />;
      }
      if (showRoomConfigurationManagement) {
        return <RoomConfigurationManagement onBack={handleBackToAdminConsole} />;
      }
      return (
        <div className={styles.adminConsoleGrid}>
          {adminConsoleItems.map(item => (
            <div key={item.id} className={styles.adminCard} onClick={() => handleAdminConsoleCardClick(item.id)}>
              <div className={styles.adminCardIcon}>{item.iconText}</div>
              <div className={styles.adminCardTitle}>{item.title}</div>
              <p className={styles.adminCardDescription}>{item.description}</p>
            </div>
          ))}
        </div>
      );
    }
    // Add other tab content rendering here
    return <div>{activeTab} Content</div>;
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>PGMS</div>
        <nav className={styles.menu}>
          {menuItems.map(item => (
            <a
              key={item.name}
              href="#!"
              className={`${styles.menuItem} ${activeTab === item.name ? styles.active : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.name);
                // Reset specific views when switching main tabs
                if (item.name !== 'Admin Console') {
                  setShowUserManagementConsole(false);
                  setShowRoomConfigurationManagement(false);
                }
              }}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
      </aside>
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>{activeTab === 'Admin Console' && (showUserManagementConsole || showRoomConfigurationManagement) ? (showUserManagementConsole ? 'User Management' : 'Room Configuration') : activeTab}</h1>
          <div className={styles.headerRight}>
            <span>{currentDate}</span>
            <div className={styles.userProfileIcon}>👤</div>
          </div>
        </header>
        <section className={styles.contentArea}>
          {renderTabContent()}
        </section>
      </main>
      {showEditRoomModal && currentEditingRoom && (
        <EditRoomModal
          isOpen={showEditRoomModal}
          onClose={handleCancelEditRoomModal}
          roomData={currentEditingRoom}
          onFormChange={handleEditModalFormChange}
          onSubmit={handleSaveEditedRoom}
          roomConfigurationTypes={roomConfigurationTypes}
        />
      )}
    </div>
  );
};

export default NewAdminDashboard;
