# PG Accommodation Management System

A full-stack web application for managing PG (Paying Guest) accommodations. Built with Node.js/Express (backend) and React.js (frontend).

---

## Features
- User registration and login (tenants, admin)
- Add, edit, and view PG room listings
- Search PGs by location, type, and availability
- Assign tenants to rooms and manage occupancy
- Track rent and security deposit payments
- View and update tenant booking history (monthly/daily)
- Admin Dashboard with:
  - Modular tabs for Rooms, Tenants, and Rent/Security
  - Inline editing and modals for room/tenant management
  - Real-time summary cards (total rooms, vacant, capacity)
  - Scoped, maintainable CSS using CSS Modules
- Responsive, modern UI

---

## Project Structure
```
pg-accommodation-system/
├── backend/
│   ├── controllers/         # Express controllers (auth, room, tenant, etc.)
│   ├── models/              # Mongoose models (Room, Tenant, Booking, User)
│   ├── routes/              # Express routes
│   ├── .env                 # Environment variables (MongoDB URI, etc.)
│   ├── app.js               # Main Express app
│   ├── package.json
│   └── ...
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components (modals, forms, cards)
│   │   ├── pages/           # Page-level components (AdminDashboard, tabs)
│   │   ├── App.js
│   │   ├── index.js
│   ├── package.json
│   └── ...
├── README.md
└── ...
```

### Key Frontend Files
- `src/pages/AdminDashboard.js` – Main admin dashboard, now modular
- `src/pages/RoomsTab.js` – Room management tab (add/edit/delete rooms)
- `src/pages/TenantsTab.js` – Tenant management tab (add/edit/delete tenants)
- `src/pages/RentSecurityTab.js` – Rent & security deposit tracking
- `src/pages/AdminDashboard.module.css` – Scoped CSS for dashboard UI
- `src/components/` – Modals, forms, summary cards, etc.

---

## Setup Instructions

### Backend
1. Navigate to the `backend` folder:
   ```powershell
   cd backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Create a `.env` file and add your MongoDB connection string:
   ```env
   MONGO_URI=your_mongodb_connection_string
   ```
4. Start the backend server:
   ```powershell
   npm start
   ```

### Frontend
1. Navigate to the `frontend` folder:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the frontend development server:
   ```powershell
   npm start
   ```

---

## Extending & Best Practices
- **Component-based UI:** All major dashboard features are split into focused components (see `src/pages/` and `src/components/`).
- **Scoped CSS:** Use CSS modules (e.g., `AdminDashboard.module.css`) for maintainable, conflict-free styles.
- **Add new features:** Create new components in `src/components/` and import them into the relevant page/tab.
- **API endpoints:** Update or add Express routes/controllers in `backend/` as needed.
- **Environment variables:** Store secrets (like DB URIs) in `.env` (never commit this file).

---

## Scripts & Utilities
- Backend seeding: `backend/seed.js`, `populateRooms.js`, `populateTenants.js`, etc.
- Admin user creation: `backend/createAdminUser.js`
- Booking utilities: `backend/populateBookings.js`, `printBookings.js`

---

## License
MIT