const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weight: [{
    date: String,
    weight: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  measurements: {
    chest: Number,
    waist: Number,
    biceps: Number,
    thighs: Number,
    lastUpdate: String,
  },
  targetWeight: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Progress', progressSchema);
