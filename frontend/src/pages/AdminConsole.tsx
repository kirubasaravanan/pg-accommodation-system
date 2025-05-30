import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { Home, Users, BedDouble, IndianRupee, Percent, ShieldCheck, ClipboardList, PlugZap, DatabaseBackup, Building, Edit3, PlusCircle, Trash2 } from 'lucide-react'; // Added Edit3, PlusCircle, Trash2
import UserManagement from './UserManagement';
import ComingSoon from './ComingSoon';
import RoomConfigurationModal from '../components/RoomConfigurationModal';
import RentSecurityTab from './RentSecurityTab';
import RoomsAndRentSetup from '../components/RoomsAndRentSetup';
import styles from './AdminConsole.module.css'; // Ensure this is imported
import { 
  addRoomConfigurationType, 
  fetchRoomConfigurationTypes, 
  updateRoomConfigurationType, 
  deleteRoomConfigurationType, // Import the delete function
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

  // New props for room configuration types
  roomConfigurationTypesFromParent: RoomConfigType[];
  isLoadingRoomConfigsFromParent: boolean;
  onRefreshRoomConfigurationTypes: () => Promise<void>;
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
  // Destructure new props
  roomConfigurationTypesFromParent,
  isLoadingRoomConfigsFromParent,
  onRefreshRoomConfigurationTypes,
}) => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext) as { user: any };
  const [openModuleKey, setOpenModuleKey] = useState<string | null>(null);
  // Removed: const [roomConfigs, setRoomConfigs] = useState<RoomConfigType[]>([]);
  const [editingRoomConfig, setEditingRoomConfig] = useState<RoomConfigType | null>(null);
  const [showRoomConfigModal, setShowRoomConfigModal] = useState(false);
  // Removed: const [isLoadingRoomConfigs, setIsLoadingRoomConfigs] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<RoomConfigType | null>(null);
  const [roomConfigOperationError, setRoomConfigOperationError] = useState<string | null>(null);


  // Removed: loadRoomConfigs useCallback

  useEffect(() => {
    if (!user) {
      console.log('[AdminConsole] No user context, potentially redirect to login.');
      // Consider if navigation here is appropriate or should be handled by a parent router/auth guard
      // navigate('/login'); 
    } else if (user.role !== 'admin') {
      console.log('[AdminConsole] User is not admin, navigating to dashboard. User:', user.username, 'Role:', user.role);
      navigate('/dashboard');
    }
    // Initial loading of room configs is now handled by the parent.
  }, [user, navigate]);
  
  const escListener = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpenModuleKey(null);
      setShowRoomConfigModal(false);
      setEditingRoomConfig(null);
      setShowDeleteConfirmModal(false); // Close delete confirm modal on ESC
      setConfigToDelete(null);
    }
  }, []);

  useEffect(() => {
    if (openModuleKey || showRoomConfigModal) {
      window.addEventListener('keydown', escListener);
      return () => window.removeEventListener('keydown', escListener);
    }
  }, [openModuleKey, showRoomConfigModal, escListener, showDeleteConfirmModal]); // Added showDeleteConfirmModal

  const handleOpenRoomConfigModal = (config: RoomConfigType | null = null) => {
    setEditingRoomConfig(config);
    setShowRoomConfigModal(true);
    // setOpenModuleKey(null); // Keep the module key if we are showing the modal as part of the module view
  };

  const handleCloseRoomConfigModal = () => {
    setShowRoomConfigModal(false);
    setEditingRoomConfig(null);
  };

  const handleSaveRoomConfiguration = async (configData: Omit<RoomConfigType, '_id'>, configId?: string) => {
    setRoomConfigOperationError(null); // Clear previous errors
    try {
      if (configId) {
        await updateRoomConfigurationType(configId, configData);
      } else {
        await addRoomConfigurationType(configData);
      }
      await onRefreshRoomConfigurationTypes(); // Call parent's refresh
      handleCloseRoomConfigModal();
    } catch (error) {
      console.error("Error saving room configuration:", error.response ? error.response.data : error.message);
      const errorMessage = error.response?.data?.message || `Failed to save room configuration.`;
      setRoomConfigOperationError(errorMessage);
      throw error; // Re-throw for modal if it handles it
    }
  };
  
  const handleGenericModuleClick = (moduleKey: string) => {
    setRoomConfigOperationError(null); // Clear errors when switching modules or opening one
    if (moduleKey === 'rooms') {
      // If data is not loaded and not currently loading, try to refresh.
      if (!roomConfigurationTypesFromParent || roomConfigurationTypesFromParent.length === 0 && !isLoadingRoomConfigsFromParent) {
        console.log('[AdminConsole] "rooms" module clicked. No configs from parent or empty, and not loading. Triggering onRefreshRoomConfigurationTypes. Timestamp:', Date.now());
        onRefreshRoomConfigurationTypes(); // Request parent to refresh
      }
    }
    setOpenModuleKey(moduleKey);
    setShowRoomConfigModal(false); // Ensure modal is closed if switching modules
  };
  
  const handleCloseGenericModule = () => {
    setOpenModuleKey(null);
  };

  const handleDeleteRoomConfig = async (configId: string) => {
    setRoomConfigOperationError(null); // Clear previous errors
    try {
      await deleteRoomConfigurationType(configId);
      await onRefreshRoomConfigurationTypes(); // Call parent's refresh
      setShowDeleteConfirmModal(false);
      setConfigToDelete(null);
    } catch (error) {
      console.error("Error deleting room configuration type:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete room configuration type.";
      setRoomConfigOperationError(errorMessage);
    }
  };

  const openDeleteConfirm = (config: RoomConfigType) => {
    setConfigToDelete(config);
    setShowDeleteConfirmModal(true);
  };


  const renderModulePanelContent = (): React.ReactElement | null => {
    if (!openModuleKey) return null;
    const module = MODULES.find(m => m.key === openModuleKey);
    if (!module) return null;

    const CloseButton = () => (
      <button
        onClick={handleCloseGenericModule}
        className={styles.closeButton} // Use CSS module style
        title="Close (ESC)"
      >
        &times;
      </button>
    );

    switch (module.key) {
      case 'users':
        return <UserManagement onClose={handleCloseGenericModule} />;
      
      case 'rooms': // Room Configuration Types
        console.log(`[AdminConsole] RENDERING "rooms" module panel. Timestamp: ${Date.now()}`);
        console.log('[AdminConsole] Current isLoadingRoomConfigsFromParent state:', isLoadingRoomConfigsFromParent);
        console.log('[AdminConsole] Current roomConfigurationTypesFromParent state (length):', roomConfigurationTypesFromParent?.length, 'Data:', roomConfigurationTypesFromParent);

        return (
          <div>
            <div className={styles.moduleHeader}> {/* Apply CSS module style */}
              <h2 className="text-xl font-semibold">Room Configuration Types</h2>
              <div>
                <button
                  onClick={() => handleOpenRoomConfigModal(null)}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                >
                  <PlusCircle size={18} className="mr-2" /> Add New Type
                </button>
                <CloseButton />
              </div>
            </div>
            {roomConfigOperationError && <p className="text-red-500 bg-red-100 p-3 my-3 rounded-md">Error: {roomConfigOperationError}</p>}
            {isLoadingRoomConfigsFromParent ? (
              <p>Loading configurations...</p>
            ) : (!roomConfigurationTypesFromParent || roomConfigurationTypesFromParent.length === 0) ? (
              <p>No room configuration types found. Click "Add New Type" to create one.</p>
            ) : (
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">Base Sharing</th>
                    <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">Base Rent</th>
                    <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">AC Status</th>
                    <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roomConfigurationTypesFromParent.map(config => (
                    <tr key={config._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">{config.name}</td>
                      <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">{config.baseSharingCapacity}</td>
                      <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">{config.baseRent}</td>
                      <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">{config.acStatus}</td>
                      <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                        <button 
                          onClick={() => handleOpenRoomConfigModal(config)} 
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => openDeleteConfirm(config)} 
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                           <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case 'room-instance-management':
        console.log(`[AdminConsole] RENDERING 'room-instance-management' module panel. Timestamp: ${Date.now()}`);
        console.log('[AdminConsole] actualRoomsFromParent PROPS (length):', actualRoomsFromParent.length);
        if (actualRoomsFromParent.length > 0) {
            console.log('[AdminConsole] actualRoomsFromParent first room sample name:', actualRoomsFromParent[0]?.name, 'ID:', actualRoomsFromParent[0]?._id);
            console.log('[AdminConsole] Full actualRoomsFromParent data:', JSON.stringify(actualRoomsFromParent));
        } else {
            console.log('[AdminConsole] actualRoomsFromParent is empty.');
        }
        // Also log the rooms prop passed to RoomsAndRentSetup
        console.log('[AdminConsole] Passing to RoomsAndRentSetup rooms (length):', actualRoomsFromParent.length);

        return (
          <div>
            <CloseButton />
            <RoomsAndRentSetup
              onBack={handleCloseGenericModule}
              rooms={actualRoomsFromParent}
              roomConfigurationTypes={roomConfigurationTypesFromParent} // Use prop
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
    return null; // Add a default return for renderModulePanelContent
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Admin Console</h1>
      {/* Parent component should manage overall loading state; this local loading is for when module is open */}
      {/* Example: {isLoadingRoomConfigsFromParent && openModuleKey === null && <p className="text-center">Loading admin data...</p>} */}
      <div className={styles.grid}> {/* Use CSS module style */}
        {MODULES.map(mod => (
          <button
            key={mod.key}
            className={`${styles.tile} hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-150 ease-in-out group`}
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

      {openModuleKey && !showRoomConfigModal && ( // Ensure module panel doesn't overlap with room config modal if it's managed separately
        <div className={styles.modulePanelOverlay}>
          <div className={styles.modulePanel}>
            {renderModulePanelContent()}
          </div>
        </div>
      )}

      {showRoomConfigModal && (
        <div className={styles.modalOverlay}>
          <RoomConfigurationModal 
            onClose={handleCloseRoomConfigModal} 
            existingConfiguration={editingRoomConfig}
            onSave={handleSaveRoomConfiguration} 
          />
        </div>
      )}

      {showDeleteConfirmModal && configToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmationDialogContent} > {/* Apply CSS module style */}
            <h3 className="text-lg font-medium leading-6 text-gray-900">Confirm Deletion</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the room configuration type "{configToDelete.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mr-3"
                onClick={() => handleDeleteRoomConfig(configToDelete._id)}
              >
                Delete
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={() => { setShowDeleteConfirmModal(false); setConfigToDelete(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
