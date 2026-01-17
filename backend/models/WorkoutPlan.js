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

const workoutPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['Szablon', 'Własny'],
    default: 'Własny',
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isGenerated: {
    type: Boolean,
    default: false,
    // true = algorithm-generated (temporary, can be auto-deleted)
    // false = user-created (permanent, manual deletion only)
  },
  exercises: [exerciseSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
