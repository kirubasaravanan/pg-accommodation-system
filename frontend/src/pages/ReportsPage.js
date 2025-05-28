import React, { useState } from 'react';
import styles from './ReportsPage.module.css';
// Placeholder for charting library - you can choose Chart.js, Recharts, ApexCharts, etc.
// import { Bar } from 'react-chartjs-2'; // Example for Chart.js

// Placeholder for toast notifications
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

const ReportsPage = () => {
  const [activeReportTab, setActiveReportTab] = useState('Rent'); // Default to 'Rent' tab

  const reportTabs = [
    { key: 'Rent', label: 'Rent Repository' },
    { key: 'Financials', label: 'Financial Reports' },
    { key: 'Rooms', label: 'Room Utilization' },
    { key: 'Tenants', label: 'Tenant Behavior' },
    { key: 'Documents', label: 'Documents & Uploads' },
    { key: 'Complaints', label: 'Maintenance/Complaints' },
    { key: 'Trends', label: 'Analytics & Trends' },
    { key: 'Logs', label: 'Login & Access Logs' },
    { key: 'Messages', label: 'Notification History' },
  ];

  const summaryCardsData = [
    { title: 'Total Rent Collected', value: '₹1,25,000', color: 'green' },
    { title: 'Pending Rent', value: '₹15,000', color: 'orange' },
    { title: 'Vacant Rooms', value: '5', color: 'green' }, // Assuming 'green' for vacant if it implies availability
    { title: 'Open Complaints', value: '2', color: 'red' },
    { title: 'Total Tenants', value: '45', color: 'blue' }, // Using blue for neutral/info
  ];

  // Placeholder function for simulating notifications
  const showNotification = (message, type = 'success') => {
    // Using console.log as a placeholder for actual toast notifications
    console.log(`Notification (${type}): ${message}`);
    // Example with react-toastify:
    // if (type === 'success') toast.success(message);
    // else if (type === 'warning') toast.warn(message);
    // else if (type === 'error') toast.error(message);
    // else toast.info(message);
  };

  const renderActiveReportContent = () => {
    // This function will render content based on activeReportTab
    // For now, it's a placeholder
    return (
      <div className={styles.reportContent}>
        <h3>{reportTabs.find(tab => tab.key === activeReportTab)?.label}</h3>
        <p>Detailed report content for {activeReportTab} will be displayed here.</p>
        {/* Example: Simulate a notification */}
        {activeReportTab === 'Rent' && (
          <button onClick={() => showNotification('Rent Received: ₹8,000 from John Doe', 'success')}>
            Test Rent Payment Notification
          </button>
        )}
        {/* Placeholder for Table */}
        <div className={styles.reportTablePlaceholder}>
          <h4>Report Table Area</h4>
          <p>Data table relevant to {activeReportTab} will appear here.</p>
          {/* Example Table Structure based on your layout */}
          <table className={styles.styledTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Tenant Name</th>
                <th>Room No</th>
                <th>Rent Amount</th>
                <th>Status</th>
                <th>Document Status</th>
                <th>Complaint Status</th>
                <th>Action Buttons</th>
              </tr>
            </thead>
            <tbody>
              {/* Example Row - replace with dynamic data */}
              <tr>
                <td>27-05-2025</td>
                <td>Jane Doe</td>
                <td>101A</td>
                <td>₹5000</td>
                <td>Paid</td>
                <td>Uploaded</td>
                <td>N/A</td>
                <td>
                  <button className={styles.actionButton}>View</button>
                  <button className={styles.actionButton}>Download</button>
                </td>
              </tr>
              {/* Add more rows as needed */}
            </tbody>
          </table>
        </div>

        {/* Placeholder for Charts - conditionally render if active tab is Trends or similar */}
        {activeReportTab === 'Trends' && (
          <div className={styles.chartsSectionPlaceholder}>
            <h4>Charts & Visualizations Area</h4>
            <p>Bar charts, pie charts, etc., will be displayed here.</p>
            {/* Example: <Bar data={...} options={...} /> */}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.reportsPageContainer}>
      {/* <ToastContainer autoClose={5000} hideProgressBar /> */}
      
      <div className={styles.topNavTabs}>
        {reportTabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tabButton} ${activeReportTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveReportTab(tab.key)}
          >
            {tab.label.split(' ')[0]} {/* Show only the first word for brevity in tabs */}
          </button>
        ))}
      </div>

      <div className={styles.commonFilters}>
        <input type="search" placeholder="Search tenant, room, date..." className={styles.globalSearch} />
        <div className={styles.datePickers}>
          <input type="date" aria-label="From Date" />
          <span>-</span>
          <input type="date" aria-label="To Date" />
        </div>
        <select aria-label="Room Type Filter" className={styles.roomTypeFilter}>
          <option value="">All Room Types</option>
          <option value="Single">Single</option>
          <option value="Double">Double</option>
          <option value="Triple">Triple</option>
        </select>
        <div className={styles.exportToggleButtons}>
          <button className={styles.actionButton}>Export PDF</button>
          <button className={styles.actionButton}>Export Excel</button>
          <button className={styles.actionButton}>Print</button>
          <select aria-label="Toggle View" className={styles.toggleView}>
            <option value="list">List View</option>
            <option value="table">Table View</option>
            <option value="chart">Chart View</option>
          </select>
        </div>
      </div>

      <div className={styles.summaryCards}>
        {summaryCardsData.map(card => (
          <div key={card.title} className={`${styles.summaryCard} ${styles[card.color]}`}>
            <h4>{card.title}</h4>
            <p>{card.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.mainReportArea}>
        {renderActiveReportContent()}
      </div>
      
    </div>
  );
};

export default ReportsPage;
