const express = require('express');
const multer = require('multer'); // Import multer
const { getTenants, addTenant, updateTenant, deleteTenant, allocateTenant, getTenantHistory, updateSecurityDeposit, allocateRoomToTenant } = require('../controllers/tenantController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/aadhar'); // Make sure this directory exists or is created
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs only
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Not an image or PDF!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  },
  fileFilter: fileFilter 
});

// Define the fields multer should expect for tenant routes
const tenantUploadFields = [
  { name: 'name', maxCount: 1 },
  { name: 'contact', maxCount: 1 },
  { name: 'email', maxCount: 1 },
  { name: 'room', maxCount: 1 },
  { name: 'status', maxCount: 1 },
  { name: 'moveInDate', maxCount: 1 },
  { name: 'moveOutDate', maxCount: 1 },
  { name: 'accommodationType', maxCount: 1 },
  { name: 'rentPaidStatus', maxCount: 1 },
  { name: 'rentDueDate', maxCount: 1 },
  { name: 'rentPaymentDate', maxCount: 1 },
  { name: 'aadharNumber', maxCount: 1 },
  { name: 'securityDeposit', maxCount: 1 }, // Expect a single stringified JSON field
  { name: 'remarks', maxCount: 1 },
  { name: 'intendedVacationDate', maxCount: 1 },
  { name: 'customRent', maxCount: 1 }
  // { name: 'aadharFile', maxCount: 1 } // Temporarily removed
];

router.get('/', protect, getTenants);
// Use multer middleware for addTenant. upload.fields() for multiple fields
router.post('/', protect, upload.fields(tenantUploadFields), addTenant);
// Use multer middleware for updateTenant
router.put('/:id', protect, upload.fields(tenantUploadFields), updateTenant);
router.delete('/:id', protect, deleteTenant);
router.post('/allocate', protect, admin, allocateTenant);
router.put('/:tenantId/allocate-room/:roomId', protect, admin, allocateRoomToTenant);
router.get('/:id/history', protect, getTenantHistory);
router.put('/:id/security-deposit', protect, updateSecurityDeposit); // This might also need multer if it involves FormData

module.exports = router;
