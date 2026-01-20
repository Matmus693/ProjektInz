export const MUSCLE_GROUPS = {
    Chest: {
        label: 'Klatka',
        subMuscles: [
            { id: 'upperChest', label: 'Góra' },
            { id: 'middleChest', label: 'Środek' },
            { id: 'lowerChest', label: 'Dół' },
        ]
    },
    Back: {
        label: 'Plecy',
        subMuscles: [
            { id: 'backWidth', label: 'Szeroki' },
            { id: 'backMiddle', label: 'Środek' },
            { id: 'backLower', label: 'Dół' },
        ]
    },
    Shoulders: {
        label: 'Barki',
        subMuscles: [
            { id: 'frontDelts', label: 'Przód' },
            { id: 'sideDelts', label: 'Bok' },
            { id: 'rearDelts', label: 'Tył' },
        ]
    },
    Arms: {
        label: 'Ramiona',
        subMuscles: [
            { id: 'biceps', label: 'Biceps' },
            { id: 'triceps', label: 'Triceps' },
            { id: 'forearms', label: 'Przedramię' },
        ]
    },
    Legs: {
        label: 'Nogi',
        subMuscles: [
            { id: 'quads', label: 'Czworogłowe' },
            { id: 'hamstrings', label: 'Dwugłowe' },
            { id: 'glutes', label: 'Pośladki' },
            { id: 'calves', label: 'Łydki' },
        ]
    },
    Core: {
        label: 'Brzuch',
        subMuscles: [
            { id: 'upperAbs', label: 'Góra' },
            { id: 'lowerAbs', label: 'Dół' },
            { id: 'obliques', label: 'Skośne' },
        ]
    },
    'Full Body': {
        label: 'FBW',
        subMuscles: []
    }
};
