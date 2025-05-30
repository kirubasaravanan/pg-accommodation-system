import React, { useState, useEffect, useMemo } from 'react';
// import axios from 'axios'; // No longer directly used for financial summary
import styles from './TenantsTab.module.css'; // Import CSS module
import SummaryCard from '../components/SummaryCard';
import TenantHistoryModal from '../components/TenantHistoryModal';
import { getTenantHistory, fetchRoomConfigurationTypes } from '../api'; // Removed fetchTenants from here, will be passed as prop

// Helper function to get badge style based on value
const getBadgeStyle = (value, type) => {
  if (type === 'status') {
    return value === 'Active' ? styles.badgeActive : styles.badgeVacated;
  }
  if (type === 'stay') {
    return value === 'Monthly' ? styles.badgeMonthly : styles.badgeDaily;
  }
  return styles.badgeRoomType; // Default or for room type
};

const TenantsTab = ({
  tenants, // Renamed from initialTenants to tenants for clarity
  rooms, // Pass rooms data for room name and type resolution
  roomConfigurationTypes, // Pass room configuration types
  onEditTenant, // Renamed from handleEditTenant for clarity and to match new prop name
  onDeleteTenant, // Renamed from handleDeleteTenant
  onAddNewTenant, // Prop to trigger opening the Add/Edit Tenant Modal in "add" mode
  // Removed activeTab as this component is now solely for tenants
  // Removed financial summary related props, will be calculated internally or passed differently if needed
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStayType, setFilterStayType] = useState('all');
  const [showTenantHistoryModal, setShowTenantHistoryModal] = useState(false);
  const [selectedTenantForHistory, setSelectedTenantForHistory] = useState(null);
  const [tenantHistoryData, setTenantHistoryData] = useState({ tenant: null, bookings: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  // const [localRoomConfigurationTypes, setLocalRoomConfigurationTypes] = useState([]);

  // useEffect(() => {
  //   const loadRoomConfigs = async () => {
  //     try {
  //       const res = await fetchRoomConfigurationTypes();
  //       setLocalRoomConfigurationTypes(res.data || []);
  //     } catch (error) {
  //       console.error("Error fetching room configuration types in TenantsTab:", error);
  //       setLocalRoomConfigurationTypes([]);
  //     }
  //   };
  //   loadRoomConfigs();
  // }, []);

  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant => {
      const matchesSearchTerm = 
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.contact.includes(searchTerm) ||
        (tenant.room?.name && tenant.room.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStayType = 
        filterStayType === 'all' || 
        (tenant.accommodationType && tenant.accommodationType.toLowerCase() === filterStayType.toLowerCase());

      return matchesSearchTerm && matchesStayType;
    });
  }, [tenants, searchTerm, filterStayType]);

  const allocatedTenants = useMemo(() => filteredTenants.filter(t => t.room && t.room._id), [filteredTenants]);
  const unallocatedTenants = useMemo(() => filteredTenants.filter(t => !t.room || !t.room._id), [filteredTenants]);


  const handleViewHistory = async (tenant) => {
    setSelectedTenantForHistory(tenant);
    setShowTenantHistoryModal(true);
    setHistoryLoading(true);
    try {
      const response = await getTenantHistory(tenant._id);
      setTenantHistoryData(response.data);
    } catch (error) {
      console.error("Error fetching tenant history:", error);
      alert("Failed to fetch tenant history.");
      setTenantHistoryData({ tenant: null, bookings: [] });
    }
    setHistoryLoading(false);
  };

  const handleCloseTenantHistoryModal = () => {
    setShowTenantHistoryModal(false);
    setSelectedTenantForHistory(null);
    setTenantHistoryData({ tenant: null, bookings: [] });
  };

  const getRoomTypeName = (roomConfigId) => {
    if (!roomConfigurationTypes || roomConfigurationTypes.length === 0 || !roomConfigId) return 'N/A';
    const config = roomConfigurationTypes.find(rc => rc._id === roomConfigId);
    return config ? config.name : 'N/A';
  };

  const getRoomRent = (roomConfigId) => {
    if (!roomConfigurationTypes || roomConfigurationTypes.length === 0 || !roomConfigId) return 'N/A';
    const config = roomConfigurationTypes.find(rc => rc._id === roomConfigId);
    return config ? `₹${config.baseRent}` : 'N/A';
  };

  // Render Tenant Row for Table
  const renderTenantRow = (tenant) => {
    let roomName = 'N/A';
    let roomTypeName = 'N/A';
    let rentAmountDisplay = 'N/A';
    let roomObject = null; // Define roomObject here to use it for rent calculation

    if (tenant.room && rooms && rooms.length > 0) {
      roomObject = rooms.find(r => r._id === tenant.room); // tenant.room is expected to be an ID
      if (roomObject) {
        roomName = roomObject.name;
        const roomConfigId = typeof roomObject.roomConfigurationType === 'object' && roomObject.roomConfigurationType !== null
                           ? roomObject.roomConfigurationType._id
                           : roomObject.roomConfigurationType;
        roomTypeName = getRoomTypeName(roomConfigId);
        
        // Updated rent calculation logic
        if (tenant.customRent) {
          rentAmountDisplay = `₹${tenant.customRent} (Custom)`;
        } else if (roomObject.price !== undefined && roomObject.price !== null && !isNaN(parseFloat(roomObject.price))) {
          rentAmountDisplay = `₹${parseFloat(roomObject.price)}`;
        } else {
          rentAmountDisplay = getRoomRent(roomConfigId); // Falls back to baseRent from room config type
        }
      } else {
        console.warn(`Tenant ${tenant.name} has room ID ${tenant.room} but no matching room found in props.`);
        // If roomObject is not found, but tenant has customRent
        if (tenant.customRent) {
          rentAmountDisplay = `₹${tenant.customRent} (Custom)`;
        }
      }
    } else if (tenant.customRent) { // Case where tenant might have custom rent but no room
        rentAmountDisplay = `₹${tenant.customRent} (Custom)`;
    }


    return (
      <tr key={tenant._id}>
        <td><input type="checkbox" /></td>
        <td>{tenant.name}</td>
        <td>{tenant.contact}</td>
        <td>{tenant.aadharNumber ? `**** **** ${tenant.aadharNumber.slice(-4)}` : 'N/A'}</td>
        <td>{tenant.email || 'N/A'}</td>
        <td><span className={`${styles.badge} ${getBadgeStyle(roomName !== 'N/A' ? 'Assigned' : 'Unassigned')}`}>{roomName}</span></td>
        <td><span className={`${styles.badge} ${getBadgeStyle(tenant.accommodationType, 'stay')}`}>{tenant.accommodationType || 'N/A'}</span></td>
        <td><span className={`${styles.badge} ${styles.badgeRoomType}`}>{roomTypeName}</span></td>
        <td>{rentAmountDisplay}</td>
        <td><span className={`${styles.badge} ${getBadgeStyle(tenant.status, 'status')}`}>{tenant.status}</span></td>
        <td className={styles.actionCell}>
          <button onClick={() => onEditTenant(tenant)} className={`${styles.actionButton} ${styles.editButton}`}>✏️ Edit/Assign Room</button>
          <button onClick={() => onDeleteTenant(tenant._id)} className={`${styles.actionButton} ${styles.deleteButton}`}>🗑️ Delete</button>
          <button onClick={() => handleViewHistory(tenant)} className={`${styles.actionButton} ${styles.historyButton}`}>📜 History</button>
          <button onClick={() => alert(`Rent Payment for ${tenant.name}`)} className={`${styles.actionButton} ${styles.rentPaymentButton}`}>💰 Rent Payment</button>
        </td>
      </tr>
    );
  };

  // Render Tenant Card for Mobile
  const renderTenantCard = (tenant) => {
    let roomName = 'N/A';
    let roomTypeName = 'N/A';
    let rentAmountDisplay = 'N/A';
    let roomObject = null; // Define roomObject here

    if (tenant.room && rooms && rooms.length > 0) {
      roomObject = rooms.find(r => r._id === tenant.room);
      if (roomObject) {
        roomName = roomObject.name;
        const roomConfigId = typeof roomObject.roomConfigurationType === 'object' && roomObject.roomConfigurationType !== null
                           ? roomObject.roomConfigurationType._id
                           : roomObject.roomConfigurationType;
        roomTypeName = getRoomTypeName(roomConfigId);

        // Updated rent calculation logic
        if (tenant.customRent) {
          rentAmountDisplay = `₹${tenant.customRent} (Custom)`;
        } else if (roomObject.price !== undefined && roomObject.price !== null && !isNaN(parseFloat(roomObject.price))) {
          rentAmountDisplay = `₹${parseFloat(roomObject.price)}`;
        } else {
          rentAmountDisplay = getRoomRent(roomConfigId); // Falls back to baseRent from room config type
        }
      } else {
        console.warn(`Tenant ${tenant.name} (card view) has room ID ${tenant.room} but no matching room found in props.`);
        // If roomObject is not found, but tenant has customRent
        if (tenant.customRent) {
          rentAmountDisplay = `₹${tenant.customRent} (Custom)`;
        }
      }
    } else if (tenant.customRent) { // Case where tenant might have custom rent but no room
        rentAmountDisplay = `₹${tenant.customRent} (Custom)`;
    }

    return (
      <div key={tenant._id} className={styles.tenantCard}>
        <div className={styles.tenantCardHeader}>
          <h3>{tenant.name}</h3>
          <span className={`${styles.badge} ${getBadgeStyle(tenant.status, 'status')}`}>{tenant.status}</span>
        </div>
        <p><strong>Phone:</strong> {tenant.contact}</p>
        <p><strong>Aadhar:</strong> {tenant.aadharNumber ? `**** **** ${tenant.aadharNumber.slice(-4)}` : 'N/A'}</p>
        <p><strong>Email:</strong> {tenant.email || 'N/A'}</p>
        <p><strong>Room:</strong> <span className={`${styles.badge} ${getBadgeStyle(roomName !== 'N/A' ? 'Assigned' : 'Unassigned')}`}>{roomName}</span></p>
        <p><strong>Stay Type:</strong> <span className={`${styles.badge} ${getBadgeStyle(tenant.accommodationType, 'stay')}`}>{tenant.accommodationType || 'N/A'}</span></p>
        <p><strong>Room Type:</strong> <span className={`${styles.badge} ${styles.badgeRoomType}`}>{roomTypeName}</span></p>
        <p><strong>Rent:</strong> {rentAmountDisplay}</p>
        <div className={styles.tenantCardActions}>
          <button onClick={() => onEditTenant(tenant)} className={`${styles.actionButton} ${styles.editButton}`}>✏️ Edit/Assign Room</button>
          <button onClick={() => onDeleteTenant(tenant._id)} className={`${styles.actionButton} ${styles.deleteButton}`}>🗑️ Delete</button>
          <button onClick={() => handleViewHistory(tenant)} className={`${styles.actionButton} ${styles.historyButton}`}>📜 History</button>
          <button onClick={() => alert(`Rent Payment for ${tenant.name}`)} className={`${styles.actionButton} ${styles.rentPaymentButton}`}>💰 Rent Payment</button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.tenantsTabContainer}>
      <h2 className={styles.pageTitle}>Tenants</h2> {/* Added Page Title */}
      {/* Top Bar: Search, Filter, Add New Tenant Button */}
      <div className={styles.topBar}>
        <div className={styles.searchAndFilters}>
          <input 
            type="text" 
            placeholder="Search by name, phone, room..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className={styles.filterSelect}
            value={filterStayType}
            onChange={(e) => setFilterStayType(e.target.value)}
          >
            <option value="all">All Stay Types</option>
            <option value="Monthly">Monthly</option>
            <option value="Daily">Daily</option>
          </select>
        </div>
        <button onClick={onAddNewTenant} className={styles.addNewTenantButton}>
          ➕ Add Tenant
        </button>
      </div>

      {/* Tenants Table (Desktop) */}
      <div className={styles.tenantsTableContainer}>
        <table className={styles.tenantsTable}>
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Name</th>
              <th>Phone</th>
              <th>Aadhar (Last 4)</th>
              <th>Email</th>
              <th>Room Name</th> {/* Changed from Room Assigned */}
              <th>Stay Type</th>
              <th>Room Type</th>
              <th>Rent Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocatedTenants.map(renderTenantRow)}
          </tbody>
        </table>
      </div>

      {/* Tenants Cards (Mobile) */}
      <div className={styles.tenantsCardsContainer}>
        {allocatedTenants.map(renderTenantCard)}
      </div>

      {/* Unallocated Tenants Section */}
      {unallocatedTenants.length > 0 && (
        <div className={styles.unallocatedSection}>
          <h3>Unallocated Tenants ({unallocatedTenants.length})</h3>
          <ul className={styles.unallocatedList}>
            {unallocatedTenants.map(tenant => (
              <li key={tenant._id}>
                {tenant.name} ({tenant.contact}) - Preferred Type: {getRoomTypeName(tenant.preferredRoomType)}
                <button onClick={() => onEditTenant(tenant)} style={{ marginLeft: '10px'}} className={`${styles.actionButton} ${styles.editButton}`}>✏️ Assign Room / Edit</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tenant History Modal */}
      {showTenantHistoryModal && selectedTenantForHistory && (
        <TenantHistoryModal 
          isOpen={showTenantHistoryModal}
          onClose={handleCloseTenantHistoryModal}
          tenant={selectedTenantForHistory} 
          historyData={tenantHistoryData}
          isLoading={historyLoading}
        />
      )}
    </div>
  );
};

export default TenantsTab;
