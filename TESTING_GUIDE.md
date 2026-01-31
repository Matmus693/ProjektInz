# Przewodnik Testowania - StillResting App

## Spis Treści
1. [Uruchamianie Testów](#uruchamianie-testów)
2. [Struktura Testów](#struktura-testów)
3. [Pisanie Nowych Testów](#pisanie-nowych-testów)
4. [Najlepsze Praktyki](#najlepsze-praktyki)
5. [Debugowanie Testów](#debugowanie-testów)
6. [Integracja CI/CD](#integracja-ci/cd)

---

## Uruchamianie Testów

### Backend

```bash
# Przejdź do katalogu backend
cd backend

# Uruchom wszystkie testy
npm test

# Uruchom testy z pokryciem kodu
npm run test:coverage

# Uruchom testy w trybie watch (automatyczne ponowne uruchomienie)
npm run test:watch

# Uruchom konkretny plik testowy
npm test -- __tests__/models/User.test.js

# Uruchom testy bezpieczeństwa
npm run test:security

# Uruchom testy wydajnościowe
npm run test:performance
```

### Frontend

```bash
# Pozostań w głównym katalogu projektu
cd c:\Users\Natalia\IdeaProjects\ProjektInz\ProjektInz

# Najpierw zainstaluj zależności testowe (jednorazowo)
npm install

# Uruchom wszystkie testy
npm test

# Uruchom testy z pokryciem kodu
npm run test:coverage

# Uruchom testy w trybie watch
npm run test:watch
```

---

## Struktura Testów

### Backend (`backend/__tests__/`)

```
backend/
├── __tests__/
│   ├── setup.js                 # Konfiguracja środowiska testowego
│   ├── models/                  # Testy jednostkowe modeli
│   │   ├── User.test.js
│   │   ├── Exercise.test.js
│   │   ├── Workout.test.js
│   │   ├── WorkoutPlan.test.js
│   │   └── Progress.test.js
│   ├── routes/                  # Testy integracyjne API
│   │   ├── auth.test.js
│   │   ├── workouts.test.js
│   │   ├── workoutPlans.test.js
│   │   ├── exercises.test.js
│   │   ├── progress.test.js
│   │   └── insights.test.js
│   ├── middleware/              # Testy middleware
│   │   └── auth.test.js
│   ├── services/                # Testy serwisów
│   │   ├── smartInsights.test.js
│   │   └── workoutGenerator.test.js
│   ├── security/                # Testy bezpieczeństwa
│   │   └── auth.security.test.js
│   └── performance/             # Testy wydajnościowe
│       └── api.performance.test.js
├── jest.config.js               # Konfiguracja Jest
└── package.json
```

### Frontend (`__tests__/`)

```
frontend/
├── __tests__/
│   ├── setup.js                 # Konfiguracja testów React Native
│   ├── __mocks__/               # Mocki modułów
│   │   └── fileMock.js
│   ├── screens/                 # Testy ekranów
│   │   ├── LoginScreen.test.js
│   │   ├── RegisterScreen.test.js
│   │   ├── HomeScreen.test.js
│   │   └── WorkoutEditorScreen.test.js
│   ├── services/                # Testy serwisów
│   │   └── api.test.js
│   └── utils/                   # Narzędzia pomocnicze
│       └── testUtils.js
├── jest.config.js
└── package.json
```

---

## Pisanie Nowych Testów

### Szablon Testu Jednostkowego Modelu

```javascript
const mongoose = require('mongoose');
const ModelName = require('../../models/ModelName');

/**
 * Testy jednostkowe modelu ModelName (White-box testing)
 * Opis funkcjonalności testu
 */
describe('Model ModelName - Testy Jednostkowe', () => {
  
  describe('Walidacja pól wymaganych', () => {
    test('powinien utworzyć dokument z poprawnymi danymi', async () => {
      const data = {
        field1: 'value1',
        field2: 'value2',
      };

      const doc = await new ModelName(data).save();

      expect(doc._id).toBeDefined();
      expect(doc.field1).toBe(data.field1);
      expect(doc.field2).toBe(data.field2);
    });

    test('powinien zwrócić błąd gdy brakuje wymaganego pola', async () => {
      const data = {
        field1: 'value1',
        // brakuje field2
      };

      await expect(new ModelName(data).save()).rejects.toThrow();
    });
  });

  describe('Dodatkowa funkcjonalność', () => {
    // Dodaj więcej testów tutaj
  });
});
```

### Szablon Testu Integracyjnego API

```javascript
const request = require('supertest');
const express = require('express');
const router = require('../../routes/routeName');
const { createTestUser, generateTestToken } = require('../setup');

/**
 * Testy integracyjne dla tras /api/resource (Black-box testing)
 * Opis endpointów
 */

const app = express();
app.use(express.json());
app.use('/api/resource', router);

process.env.JWT_SECRET = 'test-secret-key';

describe('GET /api/resource - Opis funkcjonalności', () => {
  
  let testUser;
  let authToken;

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = generateTestToken(testUser._id);
  });

  test('powinien zwrócić poprawną odpowiedź', async () => {
    const response = await request(app)
      .get('/api/resource')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  test('powinien zwrócić błąd 401 bez autoryzacji', async () => {
    await request(app)
      .get('/api/resource')
      .expect(401);
  });
});
```

### Szablon Testu Komponentu React Native

```javascript
import React from 'react';
import { render, fireEvent, waitFor } = from '@testing-library/react-native';
import ComponentName from '../screens/ComponentName';

/**
 * Testy komponentu ComponentName
 */
describe('Komponent ComponentName', () => {
  
  test('powinien wyrenderować komponent', () => {
    const { getByText } = render(<ComponentName />);
    
    expect(getByText('Oczekiwany tekst')).toBeDefined();
  });

  test('powinien obsłużyć kliknięcie przycisku', async () => {
    const mockFunction = jest.fn();
    const { getByText } = render(<ComponentName onPress={mockFunction} />);
    
    fireEvent.press(getByText('Przycisk'));
    
    await waitFor(() => {
      expect(mockFunction).toHaveBeenCalled();
    });
  });
});
```

---

## Najlepsze Praktyki

### 1. Nazewnictwo Testów (Po Polsku)

```javascript
// ✅ DOBRZE - jasny opis po polsku
test('powinien utworzyć użytkownika z poprawnymi danymi', () => {});
test('powinien zwrócić błąd 400 gdy brakuje emaila', () => {});
test('nie powinien pozwolić na dostęp do treningu innego użytkownika', () => {});

// ❌ ŹLE - niejasny opis
test('test1', () => {});
test('it works', () => {});
test('should work correctly', () => {});
```

### 2. Organizacja Testów

```javascript
// ✅ DOBRZE - hierarchiczna struktura
describe('Model User - Testy Jednostkowe', () => {
  describe('Walidacja pól wymaganych', () => {
    test('powinien utworzyć użytkownika', () => {});
    test('powinien zwrócić błąd', () => {});
  });
  
  describe('Metoda comparePassword', () => {
    test('powinien zwrócić true dla poprawnego hasła', () => {});
    test('powinien zwrócić false dla niepoprawnego hasła', () => {});
  });
});

// ❌ ŹLE - płaska struktura
test('user test 1', () => {});
test('user test 2', () => {});
test('user test 3', () => {});
```

### 3. Czyszczenie Po Testach

```javascript
// ✅ DOBRZE - używaj beforeEach i afterEach
beforeEach(async () => {
  testUser = await createTestUser();
});

afterEach(async () => {
  // Czyszczenie jest automatyczne dzięki setup.js
});

// ❌ ŹLE - brak czyszczenia
test('test 1', async () => {
  const user = await createTestUser();
  // Brak czyszczenia - może wpłynąć na kolejne testy
});
```

### 4. Asercje (Assertions)

```javascript
// ✅ DOBRZE - sprawdzaj konkretne wartości
expect(user.email).toBe('test@example.com');
expect(response.body).toHaveProperty('token');
expect(workouts).toHaveLength(2);

// ❌ ŹLE - zbyt ogólne sprawdzenia
expect(user).toBeDefined();
expect(response).toBeTruthy();
```

### 5. Testowanie Przypadków Brzegowych

```javascript
// ✅ DOBRZE - testuj wszystkie przypadki
test('powinien zaakceptować hasło z 6 znakami', () => {}); // minimum
test('powinien zwrócić błąd dla 5 znaków', () => {}); // poniżej minimum
test('powinien zaakceptować długie hasło', () => {}); // maksimum
test('powinien zaakceptować wartość 0', () => {}); // wartość graniczna
test('powinien zaakceptować wartość 100', () => {}); // wartość graniczna
```

---

## Debugowanie Testów

### Uruchom Pojedynczy Test

```bash
# Uruchom tylko jeden plik
npm test -- __tests__/models/User.test.js

# Uruchom tylko testy pasujące do wzorca
npm test -- --testNamePattern="powinien utworzyć użytkownika"
```

### Dodaj Logi Debugowania

```javascript
test('test z logowaniem', async () => {
  const user = await createTestUser();
  
  console.log('Utworzony użytkownik:', user); // Debug log
  
  expect(user).toBeDefined();
});
```

### Zwiększ Timeout dla Powolnych Testów

```javascript
test('powolny test', async () => {
  // Ten test może trwać dłużej
}, 15000); // 15 sekund timeout

// Lub globalnie w jest.config.js:
// testTimeout: 10000
```

### Izoluj Nieudane Testy

Użyj `test.only()` aby uruchomić tylko jeden test:

```javascript
test.only('ten test będzie uruchomiony samodzielnie', () => {
  // ...
});

test('ten test zostanie pominięty', () => {
  // ...
});
```

---

## Integracja CI/CD

### GitHub Actions

Utwórz plik `.github/workflows/tests.yml`:

```yaml
name: Testy Automatyczne

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Zainstaluj zależności backend
      run: |
        cd backend
        npm install
    
    - name: Uruchom testy backend
      run: |
        cd backend
        npm test
    
    - name: Wygeneruj raport pokrycia
      run: |
        cd backend
        npm run test:coverage
    
    - name: Wyślij raport do Codecov
      uses: codecov/codecov-action@v2
      with:
        files: ./backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Zainstaluj zależności frontend
      run: npm install
    
    - name: Uruchom testy frontend
      run: npm test
```

### Pre-commit Hook

Zainstaluj i skonfiguruj Husky:

```bash
npm install --save-dev husky

# Dodaj do package.json:
{
  "scripts": {
    "prepare": "husky install"
  },
  "husky": {
    "hooks": {
      "pre-commit": "cd backend && npm test"
    }
  }
}
```

---

## Narzędzia Pomocnicze

### Generowanie Raportów HTML

```bash
cd backend
npm run test:coverage

# Raport HTML będzie dostępny w:
# backend/coverage/index.html
```

### Śledzenie Pokrycia w Czasie

Możesz użyć narzędzi jak:
- **Codecov**: https://codecov.io
- **Coveralls**: https://coveralls.io
- **SonarQube**: lokalna instalacja

---

## FAQ

### Q: Jak przyspieszć testy?

**A**: Użyj `--runInBand` (już domyślnie w konfiguracji) lub uruchamiaj tylko konkretne pliki podczas developmentu.

### Q: Dlaczego 1 test nie przechodzi?

**A**: Najprawdopodobniej problem z timeoutem lub specyficznym przypadkiem brzegowym. Zobacz sekcję Debugowanie Testów.

### Q: Jak testować kod asynchroniczny?

**A**: Użyj `async/await` w testach:

```javascript
test('test asynchroniczny', async () => {
  const user = await createTestUser();
  expect(user).toBeDefined();
});
```

### Q: Jak mockować moduły zewnętrzne?

**A**: Użyj `jest.mock()`:

```javascript
jest.mock('@react-native-async-storage/async-storage');

// Lub stwórz plik w __mocks__/
```

---

## Przydatne Linki

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Supertest**: https://github.com/visionmedia/supertest
- **React Native Testing Library**: https://callstack.github.io/react-native-testing-library/
- **MongoDB Memory Server**: https://github.com/nodkz/mongodb-memory-server

---

## Kontakt

Jeśli masz pytania dotyczące testów, skontaktuj się z zespołem deweloperskim.

**Data aktualizacji**: 2026-01-31  
**Wersja**: 1.0.0
