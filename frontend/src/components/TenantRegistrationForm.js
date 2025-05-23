import React from 'react';

const TenantRegistrationForm = ({
  tenantForm,
  handleTenantFormChange,
  handleSaveTenant,
  // roomConfigurationTypes, // Pass this if preferredRoomType needs to be dynamic from fetched configs
}) => {

  // Example static list for preferred room types. 
  // Replace with dynamic mapping if roomConfigurationTypes prop is used.
  const PREFERRED_ROOM_TYPES = [
    'Private Mini', 
    'Private', 
    'Double Occupancy', 
    'Triple Occupancy', 
    'Four Occupancy', 
    'Five Occupancy'
  ];

  return (
    <form onSubmit={handleSaveTenant} style={{ marginBottom: 20, padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>New Tenant Registration</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
          <input id="name" name="name" placeholder="Full Name" value={tenantForm.name} onChange={handleTenantFormChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label htmlFor="contact" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contact Number:</label>
          <input id="contact" name="contact" placeholder="Contact Number" value={tenantForm.contact} onChange={handleTenantFormChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input id="email" name="email" type="email" placeholder="Email Address" value={tenantForm.email || ''} onChange={handleTenantFormChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label htmlFor="aadharNumber" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Aadhaar Number:</label>
          <input id="aadharNumber" name="aadharNumber" placeholder="Aadhaar Number" value={tenantForm.aadharNumber || ''} onChange={handleTenantFormChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label htmlFor="moveInDate" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Joining Date:</label>
          <input id="moveInDate" name="moveInDate" type="date" value={tenantForm.moveInDate} onChange={handleTenantFormChange} title="Date when tenant joins" required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label htmlFor="preferredRoomType" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Preferred Room Type:</label>
          <select id="preferredRoomType" name="preferredRoomType" value={tenantForm.preferredRoomType || ''} onChange={handleTenantFormChange} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Select Preferred Room Type</option>
            {PREFERRED_ROOM_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="emergencyContact" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Emergency Contact (Optional):</label>
          <input id="emergencyContact" name="emergencyContact" placeholder="Emergency Contact" value={tenantForm.emergencyContact || ''} onChange={handleTenantFormChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label htmlFor="securityDeposit.amount" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Security Deposit Amount:</label>
          <input 
            id="securityDeposit.amount" 
            name="securityDeposit.amount" 
            type="number" 
            placeholder="Security Deposit Amount" 
            value={tenantForm.securityDeposit?.amount || ''} 
            onChange={handleTenantFormChange} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="remarks" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Remarks (Optional):</label>
          <textarea id="remarks" name="remarks" placeholder="Any remarks..." value={tenantForm.remarks || ''} onChange={handleTenantFormChange} style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
      </div>
      <button type="submit" style={{ marginTop: '20px', padding: '12px 25px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>Register Tenant</button>
    </form>
  );
};

export default TenantRegistrationForm;
