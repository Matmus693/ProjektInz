const MUSCLE_TRANSLATIONS = {
    // English -> Polish
    'chest': 'Klatka',
    'back': 'Plecy',
    'shoulders': 'Barki',
    'arms': 'Ramiona',
    'legs': 'Nogi',
    'core': 'Brzuch',
    'full body': 'Całe Ciało',

    // Specific parts
    'upperChest': 'górna klatka',
    'middleChest': 'środkowa klatka',
    'lowerChest': 'dolna klatka',

    'backWidth': 'szerokość pleców',
    'backMiddle': 'środek pleców',
    'backLower': 'dół pleców',

    'frontDelts': 'przednie aktony barków',
    'sideDelts': 'boczne aktony barków',
    'rearDelts': 'tylne aktony barków',

    'biceps': 'biceps',
    'triceps': 'triceps',
    'forearms': 'przedramiona',

    'quads': 'czworogłowe',
    'hamstrings': 'dwugłowe',
    'glutes': 'pośladki',
    'calves': 'łydki',

    'upperAbs': 'górny brzuch',
    'lowerAbs': 'dolny brzuch',
    'obliques': 'skosy'
};

/**
 * Tłumaczy nazwę mięśnia na polski.
 * @param {string} key - Klucz nazwy mięśnia (np. 'chest', 'upperChest')
 * @returns {string} - Tłumaczenie lub oryginalny klucz
 */
function getPolishMuscleName(key) {
    if (!key) return '';
    return MUSCLE_TRANSLATIONS[key] || key;
}

/**
 * Tłumaczy listę mięśni i łączy je w ciąg znaków po przecinku.
 * @param {Array<string>} list - Lista kluczy mięśni
 * @returns {string} - "Klatka, Plecy, Nogi"
 */
function translateMuscleList(list) {
    if (!list || !Array.isArray(list)) return '';
    return list.map(item => getPolishMuscleName(item)).join(', ');
}

module.exports = {
    MUSCLE_TRANSLATIONS,
    getPolishMuscleName,
    translateMuscleList
};
