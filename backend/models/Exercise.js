const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    muscleGroup: {
        type: String,
        required: true,
        enum: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Other'],
    },
    muscleEngagement: {
        // Chest (0-100%)
        upperChest: { type: Number, default: 0, min: 0, max: 100 },
        middleChest: { type: Number, default: 0, min: 0, max: 100 },
        lowerChest: { type: Number, default: 0, min: 0, max: 100 },

        // Back (0-100%)
        backWidth: { type: Number, default: 0, min: 0, max: 100 },
        backMiddle: { type: Number, default: 0, min: 0, max: 100 },
        backLower: { type: Number, default: 0, min: 0, max: 100 },

        // Shoulders (0-100%)
        frontDelts: { type: Number, default: 0, min: 0, max: 100 },
        sideDelts: { type: Number, default: 0, min: 0, max: 100 },
        rearDelts: { type: Number, default: 0, min: 0, max: 100 },

        // Arms (0-100%)
        biceps: { type: Number, default: 0, min: 0, max: 100 },
        triceps: { type: Number, default: 0, min: 0, max: 100 },
        forearms: { type: Number, default: 0, min: 0, max: 100 },

        // Legs (0-100%)
        quads: { type: Number, default: 0, min: 0, max: 100 },
        hamstrings: { type: Number, default: 0, min: 0, max: 100 },
        glutes: { type: Number, default: 0, min: 0, max: 100 },
        calves: { type: Number, default: 0, min: 0, max: 100 },

        // Core (0-100%)
        upperAbs: { type: Number, default: 0, min: 0, max: 100 },
        lowerAbs: { type: Number, default: 0, min: 0, max: 100 },
        obliques: { type: Number, default: 0, min: 0, max: 100 }
    },
    secondaryMuscles: [{
        type: String,
    }],
    type: {
        type: String,
        enum: ['Compound', 'Isolation', 'Cardio', 'Stretching'],
        default: 'Compound',
    },
    mechanics: {
        type: String,
        enum: ['Push', 'Pull', 'Static', 'N/A'],
        default: 'N/A',
    },
    equipment: {
        type: String,
        default: 'Bodyweight',
    },
    difficulty: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
    },
    description: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Exercise', exerciseSchema);
