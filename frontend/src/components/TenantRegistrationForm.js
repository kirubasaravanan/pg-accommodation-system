import React from 'react';

const TenantRegistrationForm = ({
  tenantForm,
  handleTenantFormChange,
  handleSaveTenant,
  roomConfigurationTypes, // Destructure the new prop
}) => {

  return (
    <form onSubmit={handleSaveTenant} style={{ marginBottom: 20, padding: '20px', background: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>New Tenant Registration</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Name:</label>
          <input id="name" name="name" placeholder="Full Name" value={tenantForm.name} onChange={handleTenantFormChange} required style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="contact" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Contact Number:</label>
          <input id="contact" name="contact" placeholder="Contact Number" value={tenantForm.contact} onChange={handleTenantFormChange} required style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Email:</label>
          <input id="email" name="email" type="email" placeholder="Email Address" value={tenantForm.email || ''} onChange={handleTenantFormChange} required style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="aadharNumber" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Aadhaar Number:</label>
          <input id="aadharNumber" name="aadharNumber" placeholder="Aadhaar Number" value={tenantForm.aadharNumber || ''} onChange={handleTenantFormChange} style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="dob" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Date of Birth:</label>
          <input id="dob" name="dob" type="date" value={tenantForm.dob || ''} onChange={handleTenantFormChange} style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="moveInDate" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Joining Date:</label>
          <input id="moveInDate" name="moveInDate" type="date" value={tenantForm.moveInDate} onChange={handleTenantFormChange} title="Date when tenant joins" required style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="preferredRoomType" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Preferred Room Type:</label>
          <select 
            id="preferredRoomType" 
            name="preferredRoomType" 
            value={tenantForm.preferredRoomType || ''} 
            onChange={handleTenantFormChange} 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: 'white' }}
          >
            <option value="">Select Preferred Room Type</option>
            {/* Use roomConfigurationTypes to populate options */}
            {roomConfigurationTypes && roomConfigurationTypes.map(config => (
              <option key={config._id} value={config._id}>{config.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="emergencyContact" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Emergency Contact (Optional):</label>
          <input id="emergencyContact" name="emergencyContact" placeholder="Emergency Contact" value={tenantForm.emergencyContact || ''} onChange={handleTenantFormChange} style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label htmlFor="securityDeposit.amount" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Security Deposit Amount:</label>
          <input 
            id="securityDeposit.amount" 
            name="securityDeposit.amount" 
            type="number" 
            placeholder="Security Deposit Amount" 
            value={tenantForm.securityDeposit?.amount || ''} 
            onChange={handleTenantFormChange} 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="accommodationType" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Accommodation Type:</label>
          <select 
            id="accommodationType" 
            name="accommodationType" 
            value={tenantForm.accommodationType || 'monthly'} 
            onChange={handleTenantFormChange} 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: 'white' }}
          >
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="remarks" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Remarks (Optional):</label>
          <textarea id="remarks" name="remarks" placeholder="Any remarks..." value={tenantForm.remarks || ''} onChange={handleTenantFormChange} style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
      </div>
      <button type="submit" style={{ marginTop: '25px', padding: '12px 30px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>Register Tenant</button>
    </form>
  );
};

export default TenantRegistrationForm;
