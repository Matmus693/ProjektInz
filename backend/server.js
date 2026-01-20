require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Połączenie z MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ProjektInz')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routing (Ścieżki API)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/workout-plans', require('./routes/workoutPlans'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/workout-generator', require('./routes/workoutGenerator'));

// Sprawdzenie stanu serwera (Health check)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});