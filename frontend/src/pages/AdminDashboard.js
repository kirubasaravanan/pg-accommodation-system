import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import originalStyles from './AdminDashboard.module.css'; // Import as originalStyles
import RoomsTab from './RoomsTab';
import TenantsTab from './TenantsTab';
import RentSecurityTab from './RentSecurityTab';

// CONSTANTS that were in the original AdminDashboard context
const ACCOMMODATION_TYPES = ['monthly', 'daily'];
const RENT_STATUS = ['paid', 'due', 'partial'];

const styles = originalStyles || {}; // Ensure styles is an object, defaults to empty if originalStyles is undefined/null

console.log('AdminDashboard.js: Component file loaded, top level log.');

const AdminDashboard = ({ onLogout }) => {
  console.log('AdminDashboard: Component function body STARTED.');

  // Test useEffect - THIS IS THE MOST IMPORTANT LOG TO CHECK FOR
  useEffect(() => {
    console.log('AdminDashboard: VERY SIMPLE useEffect fired!');
  }, []); // Empty dependency array, should run once on mount

  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('tenants');
  console.log(`AdminDashboard: activeTab state initialized to: \"${activeTab}\"`);
  const [tenants, setTenants] = useState([]);
  const [tenantForm, setTenantForm] = useState({
    id: null, name: '', contact: '', email: '', aadhaar: '',
    preferredRoomType: '', emergencyContact: '', remarks: '', room: '',
    status: 'Active', moveInDate: '', moveOutDate: '',
    accommodationType: 'monthly', rentPaidStatus: 'due', rentDueDate: '',
    rentPaymentDate: '', bookingHistory: [], customRent: '',
    securityDeposit: { amount: 0, refundableType: 'fully', conditions: '' }
  });
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [roomForm, setRoomForm] = useState({ name: '', location: '', price: '', type: '', occupancy: { current: 0, max: '' } });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [error, setError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [assignTenantState, setAssignTenantState] = useState({});
  const [showAssignButton, setShowAssignButton] = useState({});
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTenantBookings, setSelectedTenantBookings] = useState([]);
  const [selectedTenantName, setSelectedTenantName] = useState('');
  const [editingRoomRowId, setEditingRoomRowId] = useState(null);
  const [editingRoomForm, setEditingRoomForm] = useState({});
  const [editingTenantRowId, setEditingTenantRowId] = useState(null);
  const [editingTenantForm, setEditingTenantForm] = useState({});
  const [showTariffPage, setShowTariffPage] = useState(false);
  const [showAddRoomTypeModal, setShowAddRoomTypeModal] = useState(false);
  const [newTenantId, setNewTenantId] = useState('');
  const [showRoomSelect, setShowRoomSelect] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');

  const navigate = useNavigate();

  console.log('AdminDashboard: State initialized. Before data fetching useEffect hooks.');

  // Original useEffect for rooms
  useEffect(() => {
    console.log('AdminDashboard: Rooms useEffect - CALLBACK START.');
    const token = localStorage.getItem('token');
    console.log('AdminDashboard (Rooms useEffect): Token:', token ? 'found' : 'NOT FOUND');
    axios.get('http://localhost:5000/api/rooms', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        console.log('AdminDashboard: Rooms fetched. Data:', JSON.stringify(response.data, null, 2));
        setRooms(response.data);
      })
      .catch((err) => {
        console.error('AdminDashboard: Failed to fetch rooms.', err.response ? err.response.data : err.message);
        setError('Failed to fetch rooms.');
      });
    console.log('AdminDashboard: Rooms useEffect - CALLBACK END.');
  }, []);

  // Original useEffect for tenants
  useEffect(() => {
    console.log(`AdminDashboard: Tenants useEffect - CALLBACK START. activeTab: \"${activeTab}\"`);
    const token = localStorage.getItem('token');
    console.log('AdminDashboard (Tenants useEffect): Token:', token ? 'found' : 'NOT FOUND');
    if (activeTab === 'tenants') {
      console.log('AdminDashboard: activeTab is "tenants", fetching tenants...');
      axios.get('http://localhost:5000/api/tenants', { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {
          console.log('AdminDashboard: Tenants fetched. Data:', JSON.stringify(response.data, null, 2));
          setTenants(response.data);
        })
        .catch((err) => {
          console.error('AdminDashboard: Error fetching tenants.', err.response ? err.response.data : err.message);
          setTenants([]);
        });
    } else {
      console.log(`AdminDashboard: activeTab is \"${activeTab}\", skipping tenant fetch.`);
    }
    console.log('AdminDashboard: Tenants useEffect - CALLBACK END.');
  }, [activeTab]);

  // Placeholder handlers - ensure these are implemented or correctly passed if needed by child tabs
  const handleTabChange = (tab) => {
    console.log('AdminDashboard: Changing tab to', tab);
    setActiveTab(tab);
  };

  const handleTenantFormChange = (e) => {
    const { name, value } = e.target;
    // Handle nested securityDeposit fields
    if (name.startsWith('securityDeposit.')) {
      const field = name.split('.')[1];
      setTenantForm(prevForm => ({
        ...prevForm,
        securityDeposit: {
          ...prevForm.securityDeposit,
          [field]: value
        }
      }));
    } else {
      setTenantForm(prevForm => ({ ...prevForm, [name]: value }));
    }
  };
  
  const handleAddTenant = async (e) => { e.preventDefault(); console.log('handleAddTenant called'); /* Placeholder */ };
  const handleEditTenant = (tenant) => { console.log('handleEditTenant called with:', tenant); /* Placeholder */ };
  const handleUpdateTenant = async (e) => { e.preventDefault(); console.log('handleUpdateTenant called'); /* Placeholder */ };
  const handleDeleteTenant = (id) => { console.log('handleDeleteTenant called for id:', id); /* Placeholder */ };
  const handleCancelEditTenant = () => { console.log('handleCancelEditTenant called'); /* Placeholder */ };
  const getAvailableRooms = () => { console.log('getAvailableRooms called'); return []; /* Placeholder */};
  const handleAddBooking = () => { console.log('handleAddBooking called'); /* Placeholder */};
  const handleCloseBookingModal = () => { console.log('handleCloseBookingModal called'); /* Placeholder */};
  const getTenantsForRoom = (roomName) => { console.log('getTenantsForRoom called for:', roomName); return []; /* Placeholder */ };


  console.log('AdminDashboard: Component body END, before return statement.');
  return (
    <div className={styles.adminDashboard} style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}> {/* Ensure flex column and full height */}
      <div className={styles.sidebar}>
        <div className={styles.pgTitle}>PG Accommodatio</div>
        <ul>
          {/* Example: Update to use NavLink or similar for better active state handling if needed */}
          <li className={activeTab === 'dashboard' ? styles.active : ''} onClick={() => handleTabChange('dashboard')}>Dashboard</li>
          <li className={activeTab === 'rooms' ? styles.active : ''} onClick={() => handleTabChange('rooms')}>Rooms</li>
          <li className={activeTab === 'tenants' ? styles.active : ''} onClick={() => handleTabChange('tenants')}>Tenants</li>
          <li className={activeTab === 'rent-security' ? styles.active : ''} onClick={() => handleTabChange('rent-security')}>Rent & Security</li>
          {/* Add other navigation items as per your original AdminDashboard sidebar */}
        </ul>
        {onLogout && <button onClick={onLogout} style={{ margin: '10px', padding: '8px'}}>Logout</button>}
      </div>
      {/* Ensure mainContent can scroll independently */}
      <div className={styles.mainContent} style={{ flexGrow: 1, overflowY: 'auto' }}> 
        {error && <p className={styles.error} style={{color: 'red'}}>{error}</p>}
        {roomError && <p className={styles.error} style={{color: 'red'}}>{roomError}</p>}
        {registrationSuccess && <p className={styles.success} style={{color: 'green'}}>{registrationSuccess}</p>}

        {activeTab === 'rooms' && (
          <RoomsTab
            rooms={rooms}
            // Ensure all necessary props for RoomsTab are passed
            // Example:
            // roomForm={roomForm}
            // editingRoomId={editingRoomId}
            // handleRoomFormChange={handleRoomFormChange}
            // handleAddRoom={handleAddRoom}
            // handleEditRoom={handleEditRoom}
            // handleUpdateRoom={handleUpdateRoom}
            // handleDeleteRoom={handleDeleteRoom}
            // getTenantsForRoom={getTenantsForRoom}
            // ...etc
          />
        )}
        {activeTab === 'tenants' && (
          <TenantsTab
            activeTab={activeTab}
            tenants={tenants}
            rooms={rooms}
            tenantForm={tenantForm}
            editingTenantId={editingTenantId}
            editingTenantRowId={editingTenantRowId} // Pass state
            editingTenantForm={editingTenantForm} // Pass state
            handleTenantFormChange={handleTenantFormChange}
            handleAddTenant={handleAddTenant} // This is the AdminDashboard's handleAddTenant
            handleUpdateTenant={handleUpdateTenant}
            handleEditTenant={handleEditTenant}
            handleDeleteTenant={handleDeleteTenant}
            handleCancelEditTenant={handleCancelEditTenant}
            ACCOMMODATION_TYPES={ACCOMMODATION_TYPES}
            RENT_STATUS={RENT_STATUS}
            getAvailableRooms={getAvailableRooms} // Pass the function from AdminDashboard
            handleAddBooking={handleAddBooking} // Pass the function from AdminDashboard
            showBookingModal={showBookingModal} // Pass state
            selectedTenantBookings={selectedTenantBookings} // Pass state
            selectedTenantName={selectedTenantName} // Pass state
            handleCloseBookingModal={handleCloseBookingModal} // Pass the function from AdminDashboard
            setEditingTenantRowId={setEditingTenantRowId} // Pass state setter
            setEditingTenantForm={setEditingTenantForm} // Pass state setter
          />
        )}
        {activeTab === 'rent-security' && <RentSecurityTab />}
        {activeTab === 'dashboard' && <div>Dashboard Content Placeholder</div>}

        {/* Fallback if no tab is matched or for default content */}
        {/* {activeTab !== 'rooms' && activeTab !== 'tenants' && activeTab !== 'rent-security' && activeTab !== 'dashboard' && (
          <div>Select a tab</div>
        )} */}
      </div>
    </div>
  );
};

export default AdminDashboard;