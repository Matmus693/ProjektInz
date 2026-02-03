const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');
require('dotenv').config();

const exercises = [
    
    {
        name: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Barbell',
        difficulty: 3,
        description: 'Classic flat bench press for overall chest development',
        muscleEngagement: {
            middleChest: 70,
            lowerChest: 20,
            frontDelts: 15,
            triceps: 25
        }
    },
    {
        name: 'Incline Barbell Bench Press',
        muscleGroup: 'Chest',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Barbell',
        difficulty: 3,
        description: 'Targets upper chest with inclined angle',
        muscleEngagement: {
            upperChest: 70,
            middleChest: 20,
            frontDelts: 20,
            triceps: 20
        }
    },
    {
        name: 'Decline Barbell Bench Press',
        muscleGroup: 'Chest',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Barbell',
        difficulty: 3,
        description: 'Emphasizes lower chest',
        muscleEngagement: {
            lowerChest: 70,
            middleChest: 20,
            frontDelts: 10,
            triceps: 20
        }
    },
    {
        name: 'Dumbbell Flyes',
        muscleGroup: 'Chest',
        type: 'Isolation',
        mechanics: 'Push',
        equipment: 'Dumbbells',
        difficulty: 2,
        description: 'Isolation exercise for chest stretch',
        muscleEngagement: {
            middleChest: 80,
            upperChest: 15,
            frontDelts: 10
        }
    },
    {
        name: 'Push-Ups',
        muscleGroup: 'Chest',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Bodyweight',
        difficulty: 2,
        description: 'Bodyweight chest and triceps exercise',
        muscleEngagement: {
            middleChest: 60,
            lowerChest: 15,
            triceps: 25,
            frontDelts: 15,
            upperAbs: 10
        }
    },

    {
        name: 'Deadlift',
        muscleGroup: 'Back',
        type: 'Compound',
        mechanics: 'Pull',
        equipment: 'Barbell',
        difficulty: 4,
        description: 'King of back exercises',
        muscleEngagement: {
            backLower: 70,
            backMiddle: 40,
            hamstrings: 50,
            glutes: 40,
            forearms: 20
        }
    },
    {
        name: 'Barbell Row',
        muscleGroup: 'Back',
        type: 'Compound',
        mechanics: 'Pull',
        equipment: 'Barbell',
        difficulty: 3,
        description: 'Bent-over row for back thickness',
        muscleEngagement: {
            backMiddle: 70,
            backWidth: 30,
            rearDelts: 20,
            biceps: 25
        }
    },
    {
        name: 'Pull-Ups',
        muscleGroup: 'Back',
        type: 'Compound',
        mechanics: 'Pull',
        equipment: 'Bodyweight',
        difficulty: 4,
        description: 'Vertical pull for lat development',
        muscleEngagement: {
            backWidth: 70,
            backMiddle: 30,
            biceps: 30,
            rearDelts: 15
        }
    },
    {
        name: 'Lat Pulldown',
        muscleGroup: 'Back',
        type: 'Compound',
        mechanics: 'Pull',
        equipment: 'Cable',
        difficulty: 2,
        description: 'Machine-based vertical pulling',
        muscleEngagement: {
            backWidth: 65,
            backMiddle: 25,
            biceps: 25,
            rearDelts: 10
        }
    },
    {
        name: 'Seated Cable Row',
        muscleGroup: 'Back',
        type: 'Compound',
        mechanics: 'Pull',
        equipment: 'Cable',
        difficulty: 2,
        description: 'Horizontal pulling for mid-back',
        muscleEngagement: {
            backMiddle: 70,
            backWidth: 20,
            rearDelts: 15,
            biceps: 20
        }
    },

    {
        name: 'Barbell Squat',
        muscleGroup: 'Legs',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Barbell',
        difficulty: 4,
        description: 'King of leg exercises',
        muscleEngagement: {
            quads: 70,
            glutes: 50,
            hamstrings: 30,
            lowerAbs: 15,
            upperAbs: 10
        }
    },
    {
        name: 'Romanian Deadlift',
        muscleGroup: 'Legs',
        type: 'Compound',
        mechanics: 'Pull',
        equipment: 'Barbell',
        difficulty: 3,
        description: 'Hamstring and glute focused',
        muscleEngagement: {
            hamstrings: 70,
            glutes: 60,
            backLower: 30
        }
    },
    {
        name: 'Leg Press',
        muscleGroup: 'Legs',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Machine',
        difficulty: 2,
        description: 'Machine-based quad exercise',
        muscleEngagement: {
            quads: 65,
            glutes: 40,
            hamstrings: 20
        }
    },
    {
        name: 'Leg Extension',
        muscleGroup: 'Legs',
        type: 'Isolation',
        mechanics: 'Push',
        equipment: 'Machine',
        difficulty: 1,
        description: 'Quad isolation',
        muscleEngagement: {
            quads: 90
        }
    },
    {
        name: 'Leg Curl',
        muscleGroup: 'Legs',
        type: 'Isolation',
        mechanics: 'Pull',
        equipment: 'Machine',
        difficulty: 1,
        description: 'Hamstring isolation',
        muscleEngagement: {
            hamstrings: 90
        }
    },
    {
        name: 'Walking Lunges',
        muscleGroup: 'Legs',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Dumbbells',
        difficulty: 3,
        description: 'Unilateral leg exercise',
        muscleEngagement: {
            quads: 60,
            glutes: 50,
            hamstrings: 30,
            lowerAbs: 10
        }
    },

    {
        name: 'Overhead Press',
        muscleGroup: 'Shoulders',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Barbell',
        difficulty: 3,
        description: 'Standing barbell shoulder press',
        muscleEngagement: {
            frontDelts: 70,
            sideDelts: 40,
            triceps: 30,
            upperAbs: 15
        }
    },
    {
        name: 'Dumbbell Shoulder Press',
        muscleGroup: 'Shoulders',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Dumbbells',
        difficulty: 3,
        description: 'Seated or standing dumbbell press',
        muscleEngagement: {
            frontDelts: 65,
            sideDelts: 35,
            triceps: 25
        }
    },
    {
        name: 'Lateral Raises',
        muscleGroup: 'Shoulders',
        type: 'Isolation',
        mechanics: 'Push',
        equipment: 'Dumbbells',
        difficulty: 2,
        description: 'Side delt isolation',
        muscleEngagement: {
            sideDelts: 85
        }
    },
    {
        name: 'Front Raises',
        muscleGroup: 'Shoulders',
        type: 'Isolation',
        mechanics: 'Push',
        equipment: 'Dumbbells',
        difficulty: 2,
        description: 'Front delt isolation',
        muscleEngagement: {
            frontDelts: 85
        }
    },
    {
        name: 'Rear Delt Flyes',
        muscleGroup: 'Shoulders',
        type: 'Isolation',
        mechanics: 'Pull',
        equipment: 'Dumbbells',
        difficulty: 2,
        description: 'Rear deltoid isolation',
        muscleEngagement: {
            rearDelts: 85,
            backMiddle: 15
        }
    },

    {
        name: 'Barbell Curl',
        muscleGroup: 'Arms',
        type: 'Isolation',
        mechanics: 'Pull',
        equipment: 'Barbell',
        difficulty: 2,
        description: 'Classic bicep builder',
        muscleEngagement: {
            biceps: 90,
            forearms: 15
        }
    },
    {
        name: 'Dumbbell Curl',
        muscleGroup: 'Arms',
        type: 'Isolation',
        mechanics: 'Pull',
        equipment: 'Dumbbells',
        difficulty: 2,
        description: 'Unilateral bicep curl',
        muscleEngagement: {
            biceps: 85,
            forearms: 15
        }
    },
    {
        name: 'Hammer Curl',
        muscleGroup: 'Arms',
        type: 'Isolation',
        mechanics: 'Pull',
        equipment: 'Dumbbells',
        difficulty: 2,
        description: 'Neutral grip bicep curl',
        muscleEngagement: {
            biceps: 70,
            forearms: 30
        }
    },
    {
        name: 'Tricep Dips',
        muscleGroup: 'Arms',
        type: 'Compound',
        mechanics: 'Push',
        equipment: 'Bodyweight',
        difficulty: 3,
        description: 'Bodyweight tricep exercise',
        muscleEngagement: {
            triceps: 75,
            lowerChest: 30,
            frontDelts: 20
        }
    },
    {
        name: 'Skull Crushers',
        muscleGroup: 'Arms',
        type: 'Isolation',
        mechanics: 'Push',
        equipment: 'Barbell',
        difficulty: 2,
        description: 'Lying tricep extension',
        muscleEngagement: {
            triceps: 90
        }
    },
    {
        name: 'Tricep Pushdown',
        muscleGroup: 'Arms',
        type: 'Isolation',
        mechanics: 'Push',
        equipment: 'Cable',
        difficulty: 2,
        description: 'Cable tricep isolation',
        muscleEngagement: {
            triceps: 85
        }
    },

    {
        name: 'Planks',
        muscleGroup: 'Core',
        type: 'Isolation',
        mechanics: 'Static',
        equipment: 'Bodyweight',
        difficulty: 2,
        description: 'Isometric core stabilization',
        muscleEngagement: {
            upperAbs: 60,
            lowerAbs: 60,
            obliques: 30
        }
    },
    {
        name: 'Russian Twists',
        muscleGroup: 'Core',
        type: 'Isolation',
        mechanics: 'Static',
        equipment: 'Bodyweight',
        difficulty: 2,
        description: 'Rotational core exercise',
        muscleEngagement: {
            obliques: 80,
            upperAbs: 30
        }
    },
    {
        name: 'Hanging Leg Raises',
        muscleGroup: 'Core',
        type: 'Isolation',
        mechanics: 'Pull',
        equipment: 'Bodyweight',
        difficulty: 3,
        description: 'Advanced lower ab exercise',
        muscleEngagement: {
            lowerAbs: 85,
            upperAbs: 25
        }
    },
    {
        name: 'Cable Crunches',
        muscleGroup: 'Core',
        type: 'Isolation',
        mechanics: 'Pull',
        equipment: 'Cable',
        difficulty: 2,
        description: 'Weighted ab crunch',
        muscleEngagement: {
            upperAbs: 85,
            lowerAbs: 20
        }
    }
];

async function seedExercises() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        await Exercise.deleteMany({});
        console.log('✓ Cleared existing exercises');

        const result = await Exercise.insertMany(exercises);
        console.log(`✓ Successfully seeded ${result.length} exercises with muscle engagement data`);

        const summary = exercises.reduce((acc, ex) => {
            acc[ex.muscleGroup] = (acc[ex.muscleGroup] || 0) + 1;
            return acc;
        }, {});

        console.log('\nExercise breakdown by muscle group:');
        Object.entries(summary).forEach(([group, count]) => {
            console.log(`  - ${group}: ${count} exercises`);
        });

        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    } catch (error) {
        console.error('✗ Error seeding exercises:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    seedExercises();
}

module.exports = seedExercises;
