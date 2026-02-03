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
        
        upperChest: { type: Number, default: 0, min: 0, max: 100 },
        middleChest: { type: Number, default: 0, min: 0, max: 100 },
        lowerChest: { type: Number, default: 0, min: 0, max: 100 },

        backWidth: { type: Number, default: 0, min: 0, max: 100 },
        backMiddle: { type: Number, default: 0, min: 0, max: 100 },
        backLower: { type: Number, default: 0, min: 0, max: 100 },

        frontDelts: { type: Number, default: 0, min: 0, max: 100 },
        sideDelts: { type: Number, default: 0, min: 0, max: 100 },
        rearDelts: { type: Number, default: 0, min: 0, max: 100 },

        biceps: { type: Number, default: 0, min: 0, max: 100 },
        triceps: { type: Number, default: 0, min: 0, max: 100 },
        forearms: { type: Number, default: 0, min: 0, max: 100 },

        quads: { type: Number, default: 0, min: 0, max: 100 },
        hamstrings: { type: Number, default: 0, min: 0, max: 100 },
        glutes: { type: Number, default: 0, min: 0, max: 100 },
        calves: { type: Number, default: 0, min: 0, max: 100 },

        upperAbs: { type: Number, default: 0, min: 0, max: 100 },
        lowerAbs: { type: Number, default: 0, min: 0, max: 100 },
        obliques: { type: Number, default: 0, min: 0, max: 100 }
    },
    secondaryMuscles: [{
        group: { type: String },
        subMuscles: [{ type: String }]
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
    description: {
        type: String,
        default: '',
    },
    isCustom: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Exercise', exerciseSchema);
