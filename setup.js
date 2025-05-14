const fs = require('fs');
const path = require('path');

// Define the folder structure and files
const structure = {
  backend: {
    'app.js': `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.get('/', (req, res) => {
  res.send('PG Accommodation System API');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
    '.env': `MONGO_URI=your_mongodb_connection_string`,
    models: {
      'PG.js': `const mongoose = require('mongoose');

const PGSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  amenities: [String],
});

module.exports = mongoose.model('PG', PGSchema);`,
    },
    controllers: {},
    routes: {},
    'package.json': `{
  "name": "pg-accommodation-backend",
  "version": "1.0.0",
  "description": "Backend for PG Accommodation Management System",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "mongoose": "^7.0.0"
  }
}`,
  },
  frontend: {
    src: {
      'App.js': `import React from 'react';

function App() {
  return (
    <div>
      <h1>PG Accommodation System</h1>
    </div>
  );
}

export default App;`,
      'index.js': `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`,
      components: {},
      pages: {},
    },
    public: {},
    'package.json': `{
  "name": "pg-accommodation-frontend",
  "version": "1.0.0",
  "description": "Frontend for PG Accommodation Management System",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-scripts": "5.0.0"
  }
}`,
  },
  'README.md': `# PG Accommodation Management System

This is a full-stack application for managing PG accommodations. It includes a backend built with Node.js and Express, and a frontend built with React.js.

## Folder Structure
\`\`\`
pg-accommodation-system/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── app.js
│   ├── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   ├── index.js
│   ├── package.json
\`\`\`

## Setup Instructions

### Backend
1. Navigate to the \`backend\` folder:
   \`\`\`bash
   cd backend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a \`.env\` file and add your MongoDB connection string:
   \`\`\`env
   MONGO_URI=your_mongodb_connection_string
   \`\`\`
4. Start the backend server:
   \`\`\`bash
   npm start
   \`\`\`

### Frontend
1. Navigate to the \`frontend\` folder:
   \`\`\`bash
   cd frontend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the frontend development server:
   \`\`\`bash
   npm start
   \`\`\`

## Features
- User registration and login
- Add and view PG listings
- Search PGs by location`,
};

// Function to create folders and files
function createStructure(basePath, structure) {
  for (const key in structure) {
    const value = structure[key];
    const fullPath = path.join(basePath, key);

    if (typeof value === 'string') {
      // Create file
      fs.writeFileSync(fullPath, value);
    } else {
      // Create folder
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
      }
      createStructure(fullPath, value);
    }
  }
}

// Run the script
createStructure(__dirname, structure);
console.log('Project structure created successfully!');