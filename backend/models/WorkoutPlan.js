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
    // true = wygenerowany automatycznie (tymczasowy, można usunąć)
    // false = stworzony przez użytkownika (trwały)
  },
  temporary: {
    type: Boolean,
    default: false,
    // true = plan tymczasowy (usuwany po użyciu w treningu)
    // false = plan stały (szablon)
  },
  exercises: [exerciseSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
