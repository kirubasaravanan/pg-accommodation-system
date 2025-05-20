import React from 'react';

const EditTenantModal = ({ editingTenant, rooms, handleCancelEditTenant, handleSaveTenant, setEditingTenant }) => {
  if (!editingTenant) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', position: 'relative' }}>
        <button
          onClick={handleCancelEditTenant}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 28,
            color: '#466fa6',
            cursor: 'pointer',
            fontWeight: 900,
            zIndex: 10
          }}
          aria-label="Close"
        >×</button>
        <h3>Edit Tenant</h3>
        <form onSubmit={handleSaveTenant} autoComplete="off">
          <div style={{ marginBottom: 12 }}>
            <label>Name: <input value={editingTenant.name} onChange={e => setEditingTenant({ ...editingTenant, name: e.target.value })} style={{ marginLeft: 8 }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Contact: <input value={editingTenant.contact} onChange={e => setEditingTenant({ ...editingTenant, contact: e.target.value })} style={{ marginLeft: 8 }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Room:
              <select value={editingTenant.room || ''} onChange={e => setEditingTenant({ ...editingTenant, room: e.target.value })} style={{ marginLeft: 8 }}>
                <option value="">Select Room</option>
                {rooms
                  .filter(r => (r.occupancy.max - r.occupancy.current > 0) || r.name === editingTenant.room)
                  .map(r => (
                    <option key={r._id} value={r.name}>
                      {r.name} ({r.type}, {r.location}) - {r.occupancy.max - r.occupancy.current + (editingTenant.room === r.name ? 1 : 0)} vacancy
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Status: <select value={editingTenant.status} onChange={e => setEditingTenant({ ...editingTenant, status: e.target.value })} style={{ marginLeft: 8 }}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Move In: <input type="date" value={editingTenant.moveInDate ? editingTenant.moveInDate.slice(0,10) : ''} onChange={e => setEditingTenant({ ...editingTenant, moveInDate: e.target.value })} style={{ marginLeft: 8 }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Move Out: <input type="date" value={editingTenant.moveOutDate ? editingTenant.moveOutDate.slice(0,10) : ''} onChange={e => setEditingTenant({ ...editingTenant, moveOutDate: e.target.value })} style={{ marginLeft: 8 }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Type: <select value={editingTenant.accommodationType} onChange={e => setEditingTenant({ ...editingTenant, accommodationType: e.target.value })} style={{ marginLeft: 8 }}>
              <option value="monthly">Monthly</option>
              <option value="daily">Daily</option>
            </select></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Rent Status: <select value={editingTenant.rentPaidStatus} onChange={e => setEditingTenant({ ...editingTenant, rentPaidStatus: e.target.value })} style={{ marginLeft: 8 }}>
              <option value="paid">Paid</option>
              <option value="due">Due</option>
              <option value="partial">Partial</option>
            </select></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Security Deposit: <input type="number" value={editingTenant.securityDeposit || ''} onChange={e => setEditingTenant({ ...editingTenant, securityDeposit: e.target.value })} style={{ marginLeft: 8 }} /></label>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="submit" style={{ background: '#6b8bbd', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Save</button>
            <button type="button" onClick={handleCancelEditTenant} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTenantModal;
