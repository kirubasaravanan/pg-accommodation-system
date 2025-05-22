import React from 'react';

// Placeholder for styles - these can be defined later in a CSS module or global CSS
// For now, we'll use some generic class names that you can target with CSS later.

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) {
    return null;
  }

  // Basic inline styles for visibility, can be replaced by CSS classes
  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalStyles = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    minWidth: '300px',
    maxWidth: '500px',
    textAlign: 'center',
  };

  const buttonStyles = {
    padding: '10px 15px',
    margin: '0 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const confirmButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#007bff', // Example blue
    color: 'white',
  };

  const cancelButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#6c757d', // Example gray
    color: 'white',
  };


  return (
    <div style={overlayStyles} onClick={onCancel} className="confirmation-modal-overlay">
      <div style={modalStyles} onClick={(e) => e.stopPropagation()} className="confirmation-modal-content">
        <div className="confirmation-modal-header">
          <h3>{title || 'Confirm Action'}</h3>
        </div>
        <div className="confirmation-modal-body">
          <p>{message || 'Are you sure?'}</p>
        </div>
        <div className="confirmation-modal-footer">
          <button style={cancelButtonStyles} className="modal-button cancel-button" onClick={onCancel}>
            {cancelText}
          </button>
          <button style={confirmButtonStyles} className="modal-button confirm-button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

/*
Example Usage:

You can import and use this component in any other component like this:

import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal'; // Adjust path as needed
// If you create a ConfirmationModal.css or similar, import it here:
// import './ConfirmationModal.css'; 

function MyComponentUsingModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleConfirmAction = () => {
    console.log('Action confirmed!');
    // Perform the actual action here (e.g., API call, state update)
    handleCloseModal();
  };

  return (
    <div>
      <button onClick={handleOpenModal}>Show Confirmation Modal</button>
      <ConfirmationModal
        isOpen={isModalOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={handleConfirmAction}
        onCancel={handleCloseModal}
        confirmText="Yes, Delete"
        cancelText="No, Keep it"
      />
    </div>
  );
}

export default MyComponentUsingModal;
*/
