import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { Home, Users, BedDouble, IndianRupee, Percent, ShieldCheck, ClipboardList, PlugZap, DatabaseBackup, Building } from 'lucide-react';
import UserManagement from './UserManagement';
import ComingSoon from './ComingSoon';
import RoomConfigurationModal from '../components/RoomConfigurationModal';
import RentSecurityTab from './RentSecurityTab';
import RoomsAndRentSetup from '../components/RoomsAndRentSetup';
import { 
  addRoomConfigurationType, 
  fetchRoomConfigurationTypes, 
  updateRoomConfigurationType, 
} from '../api';

// Define a basic RoomType, adjust as per your actual room model
interface RoomType {
  _id: string;
  name: string;
  location?: string;
  roomConfigurationType: string | RoomConfigType; // ID or populated object
  price: number;
  occupancy: {
    current: number;
    max: number;
  };
  // Add other room properties as needed
}

interface AdminConsoleProps {
  rooms?: RoomType[]; 
  onAddActualRoom?: (roomData: Omit<RoomType, '_id' | 'occupancy'> & { occupancy: { max: number } }) => Promise<void>;
  onEditActualRoom?: (room: RoomType) => void; 
  onDeleteActualRoom?: (roomId: string) => Promise<void>;
}

interface RoomConfigType {
  _id: string;
  name: string;
  baseSharingCapacity?: number;
  baseRent?: number;
  isConvertible?: boolean;
  convertedSharingCapacity?: number;
  convertedRent?: number;
  acStatus?: string;
  description?: string;
}

const MODULES = [
  {
    key: 'users',
    title: 'User Management',
    desc: 'Manage admin, staff, roles',
    icon: <Users className="w-7 h-7" />, 
    route: '/users',
  },
  {
    key: 'rooms',
    title: 'Room Configuration Types',
    desc: 'Define types of rooms (e.g., Single AC)',
    icon: <BedDouble className="w-7 h-7" />, 
    route: '/room-configurations',
  },
  {
    key: 'room-instance-management',
    title: 'Room & Bed Management',
    desc: 'Manage physical rooms, assign types, and view rent structures.',
    icon: <Building className="w-7 h-7" />,
    route: '/room-instance-management',
  },
  {
    key: 'discounts',
    title: 'Discounts & Offers',
    desc: 'Apply custom discounts',
    icon: <Percent className="w-7 h-7" />, 
    route: '/discounts',
  },
  {
    key: 'roles',
    title: 'Permission/Roles Setup',
    desc: 'Define user access rights',
    icon: <ShieldCheck className="w-7 h-7" />, 
    route: '/roles',
  },
  {
    key: 'policies',
    title: 'Policy & Notice Board',
    desc: 'Update rules and announcements',
    icon: <ClipboardList className="w-7 h-7" />, 
    route: '/policies',
  },
  {
    key: 'integrations',
    title: 'Integrations Setup',
    desc: 'Connect external services',
    icon: <PlugZap className="w-7 h-7" />, 
    route: '/integrations',
  },
  {
    key: 'backup',
    title: 'Backup & Restore',
    desc: 'Manage data backup',
    icon: <DatabaseBackup className="w-7 h-7" />, 
    route: '/backup',
  },
  {
    key: 'tenant-history',
    title: 'Tenant History',
    desc: 'View and manage tenant booking history',
    icon: <ClipboardList className="w-7 h-7" />, 
    route: '/tenant-history',
  },
  {
    key: 'rent-security',
    title: 'Rent & Security Deposits',
    desc: 'View rent forecasts and security deposits',
    icon: <IndianRupee className="w-7 h-7" />, 
    route: '/rent-security',
  },
];

const AdminConsole: React.FC<AdminConsoleProps> = ({
  rooms: actualRoomsFromParent = [], // Default to empty array if not provided
  onAddActualRoom,
  onEditActualRoom,
  onDeleteActualRoom,
}) => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext) as { user: any };
  const [openModuleKey, setOpenModuleKey] = useState<string | null>(null);
  const [roomConfigs, setRoomConfigs] = useState<RoomConfigType[]>([]);
  const [editingRoomConfig, setEditingRoomConfig] = useState<RoomConfigType | null>(null);
  const [showRoomConfigModal, setShowRoomConfigModal] = useState(false);
  const [isLoadingRoomConfigs, setIsLoadingRoomConfigs] = useState(false);

  const loadRoomConfigs = useCallback(async () => {
    setIsLoadingRoomConfigs(true);
    try {
      const response = await fetchRoomConfigurationTypes();
      setRoomConfigs(response.data || []);
    } catch (error) {
      console.error("Error fetching room configuration types:", error);
    } finally {
      setIsLoadingRoomConfigs(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadRoomConfigs();
    } else if (!user) {
      // navigate('/login'); 
    } else if (user.role !== 'admin'){
        navigate('/dashboard');
    }
  }, [user, navigate, loadRoomConfigs]);
  
  const escListener = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpenModuleKey(null);
      setShowRoomConfigModal(false);
      setEditingRoomConfig(null);
    }
  }, []);

  useEffect(() => {
    if (openModuleKey || showRoomConfigModal) {
      window.addEventListener('keydown', escListener);
      return () => window.removeEventListener('keydown', escListener);
    }
  }, [openModuleKey, showRoomConfigModal, escListener]);

  const handleOpenRoomConfigModal = (config: RoomConfigType | null = null) => {
    setEditingRoomConfig(config);
    setShowRoomConfigModal(true);
    setOpenModuleKey(null); 
  };

  const handleCloseRoomConfigModal = () => {
    setShowRoomConfigModal(false);
    setEditingRoomConfig(null);
  };

  const handleSaveRoomConfiguration = async (configData: Omit<RoomConfigType, '_id'>, configId?: string) => {
    try {
      if (configId) {
        await updateRoomConfigurationType(configId, configData);
      } else {
        await addRoomConfigurationType(configData);
      }
      loadRoomConfigs(); 
      handleCloseRoomConfigModal();
    } catch (error) {
      console.error("Error saving room configuration:", error);
      alert(`Failed to save room configuration: ${error.response?.data?.error || error.message}`);
    }
  };
  
  const handleGenericModuleClick = (moduleKey: string) => {
    if (moduleKey === 'rooms') {
      handleOpenRoomConfigModal(); 
    } else {
      setOpenModuleKey(moduleKey);
      setShowRoomConfigModal(false); 
    }
  };
  
  const handleCloseGenericModule = () => {
    setOpenModuleKey(null);
  };

  const renderModulePanelContent = (): React.ReactElement | null => {
    if (!openModuleKey) return null;
    const module = MODULES.find(m => m.key === openModuleKey);
    if (!module) return null;

    const CloseButton = () => (
      <button
        onClick={handleCloseGenericModule}
        style={{
          background: 'none', border: 'none', color: '#333',
          fontSize: '24px', fontWeight: 'bold', cursor: 'pointer',
          position: 'absolute', top: '15px', right: '15px'
        }}
        title="Close (ESC)"
      >
        &times;
      </button>
    );

    switch (module.key) {
      case 'users':
        return <UserManagement onClose={handleCloseGenericModule} />;
      
      case 'room-instance-management':
        return (
          <div>
            <CloseButton />
            <RoomsAndRentSetup
              onBack={handleCloseGenericModule}
              rooms={actualRoomsFromParent}
              roomConfigurationTypes={roomConfigs}
              handleAddRoom={async (roomData) => {
                if (onAddActualRoom) {
                  try {
                    await onAddActualRoom(roomData);
                  } catch (error) {
                    console.error("Error adding actual room from AdminConsole:", error);
                  }
                } else {
                  console.warn('onAddActualRoom prop is not provided to AdminConsole');
                  alert('Add room functionality is not configured.');
                }
              }}
              handleEditRoom={(room) => {
                if (onEditActualRoom) {
                  onEditActualRoom(room);
                } else {
                  console.warn('onEditActualRoom prop is not provided to AdminConsole');
                  alert('Edit room functionality is not configured.');
                }
              }}
              handleDeleteRoom={async (roomId) => {
                if (onDeleteActualRoom) {
                  try {
                    await onDeleteActualRoom(roomId);
                  } catch (error) {
                    console.error("Error deleting actual room from AdminConsole:", error);
                  }
                } else {
                  console.warn('onDeleteActualRoom prop is not provided to AdminConsole');
                  alert('Delete room functionality is not configured.');
                }
              }}
            />
          </div>
        );
      case 'integrations':
        return (
          <div>
            <CloseButton />
            <h2 className="text-xl font-semibold mb-4">Chatbot & WhatsApp Integration</h2>
            <ComingSoon title="Chatbot & WhatsApp Integration" />
          </div>
        );
      case 'discounts':
        return (
          <div>
            <CloseButton />
            <h2 className="text-xl font-semibold mb-4">Discounts & Offers</h2>
            <ComingSoon title="Discounts & Offers" />
          </div>
        );
      case 'roles':
        return (
          <div>
            <CloseButton />
            <h2 className="text-xl font-semibold mb-4">Permission/Roles Setup</h2>
            <ComingSoon title="Permission/Roles Setup" />
          </div>
        );
      case 'policies':
        return (
          <div>
            <CloseButton />
            <h2 className="text-xl font-semibold mb-4">Policy & Notice Board</h2>
            <ComingSoon title="Policy & Notice Board" />
          </div>
        );
      case 'backup':
        return (
          <div>
            <CloseButton />
            <h2 className="text-xl font-semibold mb-4">Backup & Restore</h2>
            <ComingSoon title="Backup & Restore" />
          </div>
        );
      case 'tenant-history':
        return (
          <div>
            <CloseButton />
            <h2 className="text-xl font-semibold mb-4">Tenant History</h2>
            <ComingSoon title="Tenant History" />
          </div>
        );
      case 'rent-security':
        return (
          <div>
            <CloseButton />
            <h2 className="text-xl font-semibold mb-4">{module.title}</h2>
            <RentSecurityTab />
          </div>
        );
      default:
        return (
          <div>
            <CloseButton />
            <h2 className="text-xl font-semibold mb-4">{module.title}</h2>
            <ComingSoon title={module.title} />
          </div>
        );
    }
  };

  const tileStyle: React.CSSProperties = {
    backgroundColor: '#6C8EBF', 
    color: 'white',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'left',
    margin: '0', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    minHeight: '180px',
    width: '100%', 
    cursor: 'pointer',
    border: '1px solid #5A7FAF',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px', 
    padding: '10px',
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Admin Console</h1>
      {isLoadingRoomConfigs && <p className="text-center">Loading room configurations...</p>}
      <div style={gridStyle}>
        {MODULES.map(mod => (
          <button
            key={mod.key}
            style={tileStyle}
            className="hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-150 ease-in-out group"
            onClick={() => handleGenericModuleClick(mod.key)}
            tabIndex={0}
          >
            <div className="mb-4 text-blue-100 group-hover:text-white transition-colors duration-150">{React.cloneElement(mod.icon, { className: "w-8 h-8" })}</div>
            <div>
              <div className="font-semibold text-xl text-white mb-1 group-hover:text-yellow-300 transition-colors duration-150">{mod.title}</div>
              <div className="text-blue-100 text-sm group-hover:text-gray-50 transition-colors duration-150">{mod.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {openModuleKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px 30px', width: 'auto', minWidth: '400px', maxWidth: 'calc(100vw - 40px)', maxHeight: 'calc(100vh - 40px)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', position: 'relative', overflowY: 'auto' }}>
            {renderModulePanelContent()}
          </div>
        </div>
      )}

      {showRoomConfigModal && (
        <RoomConfigurationModal 
          onClose={handleCloseRoomConfigModal} 
          existingConfiguration={editingRoomConfig}
          onSave={handleSaveRoomConfiguration} 
        />
      )}
    </div>
  );
};

export default AdminConsole;
