import React from 'react';
import styles from './TenantHistoryModal.module.css'; // We'll create this CSS module next

const TenantHistoryModal = ({ isOpen, onClose, tenant, historyData, isLoading }) => {
  if (!isOpen) {
    return null;
  }

  const displayTenant = historyData?.tenant || tenant; // Use full data if available, else fallback

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2>Tenant History: {displayTenant ? displayTenant.name : 'Loading...'}</h2>
        
        {isLoading ? (
          <p>Loading history...</p>
        ) : !displayTenant ? (
          <p>No tenant data available.</p>
        ) : (
          <>
            {displayTenant && (
              <div className={styles.tenantDetails}>
                <p><strong>Contact:</strong> {displayTenant.contact || 'N/A'}</p>
                <p><strong>Email:</strong> {displayTenant.email || 'N/A'}</p>
                <p><strong>Status:</strong> {displayTenant.status || 'N/A'}</p>
                <p><strong>Monthly Cycle Preference:</strong> {displayTenant.monthlyRentCyclePreference || 'N/A'}</p>
                <p><strong>Estimated Monthly Daily Stays:</strong> {displayTenant.estimatedMonthlyDailyStays || 0}</p>
                {displayTenant.securityDeposit && (
                  <p>
                    <strong>Security Deposit:</strong> 
                    ₹{displayTenant.securityDeposit.amount || 0} ({displayTenant.securityDeposit.refundableType || 'N/A'})
                  </p>
                )}
              </div>
            )}

            <h3>Bookings:</h3>
            {historyData?.bookings && historyData.bookings.length > 0 ? (
              <ul className={styles.bookingList}>
                {historyData.bookings.map((booking) => (
                  <li key={booking._id} className={styles.bookingItem}>
                    <p><strong>Room:</strong> {booking.room || 'N/A'}</p>
                    <p><strong>Period:</strong> {formatDate(booking.startDate)} - {formatDate(booking.endDate)}</p>
                    <p><strong>Type:</strong> {booking.accommodationType || 'N/A'}</p>
                    <p><strong>Rent Amount:</strong> ₹{booking.rentAmount ? booking.rentAmount.toLocaleString() : 'N/A'}</p>
                    <p><strong>Rent Status:</strong> {booking.rentPaidStatus || 'N/A'}</p>
                    {booking.rentDetails && (
                      <div className={styles.rentDetails}>
                        <p><strong>Final Rent for Booking:</strong> ₹{booking.rentDetails.finalRentAmount ? booking.rentDetails.finalRentAmount.toLocaleString() : 'N/A'}</p>
                        {booking.rentDetails.proRated && <p><em>(Pro-rated)</em></p>}
                        {booking.rentDetails.rentType === 'daily' && (
                          <p>Daily Rate: ₹{booking.rentDetails.dailyRate}, Days: {booking.rentDetails.numberOfDays}</p>
                        )}
                        {booking.rentDetails.rentType === 'monthly' && (
                           <p>Monthly Rate: ₹{booking.rentDetails.monthlyRate}, Months: {booking.rentDetails.numberOfMonths}</p>
                        )}
                      </div>
                    )}
                    {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No booking history found for this tenant.</p>
            )}
          </>
        )}
        <button onClick={onClose} className={styles.actionButton}>Close</button>
      </div>
    </div>
  );
};

export default TenantHistoryModal;
