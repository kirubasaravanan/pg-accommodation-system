import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { Home, Users, BedDouble, IndianRupee, Percent, ShieldCheck, ClipboardList, PlugZap, DatabaseBackup } from 'lucide-react';
import UserManagement from './UserManagement';
import ComingSoon from './ComingSoon';
import ChatbotWhatsAppIntegration from './ChatbotWhatsAppIntegration';
import RoomConfigurationModal from '../components/RoomConfigurationModal';

const MODULES = [
  {
    key: 'users',
    title: 'User Management',
    desc: 'Manage admin, staff, roles',
    icon: <Users className="w-7 h-7 text-gray-700" />, 
    route: '/users',
  },
  {
    key: 'rooms',
    title: 'Room Configuration',
    desc: 'Add and edit rooms, types',
    icon: <BedDouble className="w-7 h-7 text-gray-700" />, 
    route: '/rooms',
  },
  {
    key: 'rent-setup',
    title: 'Rent Setup',
    desc: 'Configure rent amounts',
    icon: <IndianRupee className="w-7 h-7 text-gray-700" />, 
    route: '/rent-setup',
  },
  {
    key: 'discounts',
    title: 'Discounts & Offers',
    desc: 'Apply custom discounts',
    icon: <Percent className="w-7 h-7 text-gray-700" />, 
    route: '/discounts',
  },
  {
    key: 'roles',
    title: 'Permission/Roles Setup',
    desc: 'Define user access rights',
    icon: <ShieldCheck className="w-7 h-7 text-gray-700" />, 
    route: '/roles',
  },
  {
    key: 'policies',
    title: 'Policy & Notice Board',
    desc: 'Update rules and announcements',
    icon: <ClipboardList className="w-7 h-7 text-gray-700" />, 
    route: '/policies',
  },
  {
    key: 'integrations',
    title: 'Integrations Setup',
    desc: 'Connect external services',
    icon: <PlugZap className="w-7 h-7 text-gray-700" />, 
    route: '/integrations',
  },
  {
    key: 'backup',
    title: 'Backup & Restore',
    desc: 'Manage data backup',
    icon: <DatabaseBackup className="w-7 h-7 text-gray-700" />, 
    route: '/backup',
  },
];

const AdminConsole = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext) as { user: any };
  const [openModule, setOpenModule] = useState(null as null | typeof MODULES[number]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // ESC key closes the panel
  const escListener = useCallback((e) => {
    if (e.key === 'Escape') setOpenModule(null);
  }, []);
  useEffect(() => {
    if (openModule) {
      window.addEventListener('keydown', escListener);
      return () => window.removeEventListener('keydown', escListener);
    }
  }, [openModule, escListener]);

  // Render the selected module in a side panel/modal
  const renderModulePanel = () => {
    if (!openModule) return null;
    let content: React.ReactNode = null;
    if (openModule.key === 'users') content = <UserManagement />;
    else if (openModule.key === 'rooms') content = <RoomConfigurationModal onClose={() => setOpenModule(null)} />;
    else if (openModule.key === 'integrations') content = (
      <>
        <ChatbotWhatsAppIntegration />
        <div className="mt-8 text-center text-gray-500 font-semibold text-lg">This module is under development. Please check back soon!</div>
      </>
    );
    else content = <ComingSoon title={openModule.title} />;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 360, maxWidth: '90vw', maxHeight: '90vh', boxShadow: '0 4px 32px rgba(0,0,0,0.12)', position: 'relative', overflowY: 'auto', zIndex: 101 }}>
          {/* The close button is now handled by the modal component for rooms */}
          <div style={{ paddingTop: 24 }}>{content}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      
      <h1 className="text-3xl font-bold mb-8">Admin Console</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {MODULES.map(mod => (
          <button
            key={mod.key}
            className="bg-white text-black rounded-xl shadow-sm hover:shadow-lg transition border border-gray-200 cursor-pointer flex flex-col items-start p-8 min-h-[160px] w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-300 group"
            style={{ fontFamily: 'Inter, Arial, sans-serif', fontWeight: 600 }}
            onClick={() => setOpenModule(mod)}
            tabIndex={0}
          >
            <div className="mb-3 group-hover:scale-110 transition-transform text-[#466fa6]">{mod.icon}</div>
            <div className="font-bold text-lg text-gray-900 mb-1">{mod.title}</div>
            <div className="text-gray-500 text-sm">{mod.desc}</div>
          </button>
        ))}
      </div>
      {/* Modal overlay, rendered above but does not hide the grid */}
      {openModule && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 360, maxWidth: '90vw', maxHeight: '90vh', boxShadow: '0 4px 32px rgba(0,0,0,0.12)', position: 'relative', overflowY: 'auto', zIndex: 101 }}>
            {/* The close button is now handled by the modal component for rooms */}
            <div style={{ paddingTop: 24 }}>{renderModulePanel()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
