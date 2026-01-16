const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  weight: {
    type: String,
    default: '',
  },
  reps: {
    type: String,
    default: '',
  },
});

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  numSets: {
    type: Number,
    required: true,
  },
  sets: [setSchema],
});

const workoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['push', 'pull', 'legs', 'fullbody', 'other'],
    default: 'other',
  },
  exercises: [exerciseSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Workout', workoutSchema);
