import React from 'react';

const TenantsTab = ({
  tenants,
  rooms,
  tenantForm,
  editingTenantId,
  editingTenantRowId,
  editingTenantForm,
  handleTenantFormChange,
  handleAddTenant,
  handleUpdateTenant,
  handleEditTenant,
  handleDeleteTenant,
  handleCancelEditTenant,
  ACCOMMODATION_TYPES,
  RENT_STATUS,
  getAvailableRooms,
  handleAddBooking,
  showBookingModal,
  selectedTenantBookings,
  selectedTenantName,
  handleCloseBookingModal,
  setEditingTenantRowId,
  setEditingTenantForm
}) => (
  <>
    <form onSubmit={editingTenantId ? handleUpdateTenant : handleAddTenant} style={{ marginBottom: 20 }}>
      <input name="name" placeholder="Name" value={tenantForm.name} onChange={handleTenantFormChange} required />
      <input name="contact" placeholder="Contact Number" value={tenantForm.contact} onChange={handleTenantFormChange} required />
      <input name="email" placeholder="Email (kept in DB)" value={tenantForm.email} onChange={handleTenantFormChange} required style={{ display: 'none' }} />
      <select name="room" value={tenantForm.room} onChange={handleTenantFormChange}>
        <option value="">Select Room</option>
        {rooms
          .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
          .filter(room => room.occupancy.current < room.occupancy.max)
          .map(room => (
            <option key={room._id} value={room.name}>
              {room.name} ({room.type}, {room.location}) - {room.occupancy.max - room.occupancy.current} vacancy
            </option>
          ))}
      </select>
      <select name="status" value={tenantForm.status} onChange={handleTenantFormChange}>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
      <input name="moveInDate" type="date" placeholder="Move In Date (when tenant joins)" value={tenantForm.moveInDate} onChange={handleTenantFormChange} title="Date when tenant moves in" />
      <input name="moveOutDate" type="date" placeholder="Move Out Date (when tenant leaves)" value={tenantForm.moveOutDate} onChange={handleTenantFormChange} title="Date when tenant moves out" />
      <select name="accommodationType" value={tenantForm.accommodationType} onChange={handleTenantFormChange}>
        {ACCOMMODATION_TYPES.map(type => (
          <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
        ))}
      </select>
      <select name="rentPaidStatus" value={tenantForm.rentPaidStatus} onChange={handleTenantFormChange}>
        {RENT_STATUS.map(status => (
          <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
        ))}
      </select>
      {/* Booking history for daily/weekly tenants */}
      {tenantForm.accommodationType === 'daily' && (
        <div style={{ margin: '10px 0', border: '1px solid #ccc', padding: 10, borderRadius: 4 }}>
          <div><b>Booking History</b></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select name="bookingRoom" value={tenantForm.bookingRoom || ''} onChange={handleTenantFormChange}>
              <option value="">Room</option>
              {getAvailableRooms().map(room => (
                <option key={room._id} value={room.name}>{room.name}</option>
              ))}
            </select>
            <input name="bookingStartDate" type="date" placeholder="Booking Start Date" value={tenantForm.bookingStartDate || ''} onChange={handleTenantFormChange} />
            <input name="bookingEndDate" type="date" placeholder="Booking End Date" value={tenantForm.bookingEndDate || ''} onChange={handleTenantFormChange} />
            <select name="bookingRentPaidStatus" value={tenantForm.bookingRentPaidStatus || 'due'} onChange={handleTenantFormChange}>
              {RENT_STATUS.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
            <input name="bookingRentDueDate" type="date" placeholder="Booking Rent Due Date" value={tenantForm.bookingRentDueDate || ''} onChange={handleTenantFormChange} />
            <input name="bookingRentPaymentDate" type="date" placeholder="Booking Rent Payment Date" value={tenantForm.bookingRentPaymentDate || ''} onChange={handleTenantFormChange} />
            <button type="button" onClick={handleAddBooking}>Add Booking</button>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {tenantForm.bookingHistory.map((b, idx) => (
              <li key={idx} style={{ fontSize: 13 }}>
                {b.room} | {b.startDate} to {b.endDate} | Status: {b.rentPaidStatus} | Due: {b.rentDueDate || '-'} | Paid: {b.rentPaymentDate || '-'}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="submit">{editingTenantId ? 'Update Tenant' : 'Add Tenant'}</button>
      {editingTenantId && <button type="button" onClick={handleCancelEditTenant} style={{ marginLeft: 8 }}>Cancel</button>}
    </form>
    {/* Table and modal code can be split further if needed */}
  </>
);

export default TenantsTab;
