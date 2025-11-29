require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase, seedUsers } = require('./database');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const userRoutes = require('./routes/users');
const { registerWebsocket } = require('./websocket');
const seedData = require('./seed');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await initDatabase();
    
    const app = express();
    app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
    app.use(bodyParser.json());

    registerWebsocket(app);

    app.use('/api/auth', authRoutes);
    app.use('/api/notes', noteRoutes);
    app.use('/api/users', userRoutes);

    app.get('/api/health', (req, res) => {
      res.json({ ok: true, time: new Date().toISOString() });
    });

    // Start server first so Render detects the port
    app.listen(PORT, () => {
      console.log(`Backend API running on port ${PORT}`);
      
      // Seed users in the background after server starts
      const forceReseed = process.env.FORCE_RESEED === 'true';
      seedUsers(seedData, forceReseed).catch(err => {
        console.error('Error seeding users:', err);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

