# StillResting Backend

Backend API dla aplikacji StillResting - systemu śledzenia treningów.

## Wymagania

- Node.js (v14 lub nowszy)
- MongoDB (lokalnie lub MongoDB Atlas)

## Instalacja

1. Przejdź do folderu backend:
```bash
cd backend
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Utwórz plik `.env` na podstawie `.env.example`:
```bash
cp .env.example .env
```

4. Skonfiguruj zmienne środowiskowe w `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stillresting
JWT_SECRET=your-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

5. Upewnij się, że MongoDB jest uruchomione

## Uruchomienie

### Tryb deweloperski (z auto-reload):
```bash
npm run dev
```

### Tryb produkcyjny:
```bash
npm start
```

Serwer będzie dostępny pod adresem `http://localhost:5000`

## Endpoints API

### Autentykacja

- `POST /api/auth/register` - Rejestracja użytkownika
  - Body: `{ username, email, password }`
  - Zwraca: `{ token, user }`

- `POST /api/auth/login` - Logowanie
  - Body: `{ email, password }`
  - Zwraca: `{ token, user }`

### Treningi (Wymaga autentykacji - Header: `Authorization: Bearer <token>`)

- `GET /api/workouts` - Pobierz wszystkie treningi użytkownika
- `GET /api/workouts/:id` - Pobierz pojedynczy trening
- `POST /api/workouts` - Utwórz nowy trening
- `PUT /api/workouts/:id` - Zaktualizuj trening
- `DELETE /api/workouts/:id` - Usuń trening

### Plany treningowe (Wymaga autentykacji)

- `GET /api/workout-plans` - Pobierz wszystkie plany użytkownika
- `GET /api/workout-plans/:id` - Pobierz pojedynczy plan
- `POST /api/workout-plans` - Utwórz nowy plan
- `PUT /api/workout-plans/:id` - Zaktualizuj plan
- `DELETE /api/workout-plans/:id` - Usuń plan

### Postępy (Wymaga autentykacji)

- `GET /api/progress` - Pobierz dane postępów użytkownika
- `POST /api/progress/weight` - Dodaj wpis wagi
  - Body: `{ date, weight }`
- `PUT /api/progress/measurements` - Zaktualizuj pomiary ciała
  - Body: `{ chest, waist, biceps, thighs }`
- `PUT /api/progress/target-weight` - Ustaw cel wagowy
  - Body: `{ targetWeight }`
- `GET /api/progress/stats` - Pobierz statystyki miesięczne

## Struktura danych

### User
- username: String
- email: String
- password: String (haszowane)

### Workout
- userId: ObjectId
- name: String
- date: String
- time: String
- duration: String
- type: String (push, pull, legs, fullbody, other)
- exercises: Array of {
  - name: String
  - numSets: Number
  - sets: Array of { weight: String, reps: String }
}

### WorkoutPlan
- userId: ObjectId
- name: String
- description: String
- type: String (Szablon, Własny)
- isActive: Boolean
- exercises: Array (jak w Workout)

### Progress
- userId: ObjectId
- weight: Array of { date: String, weight: Number }
- measurements: { chest, waist, biceps, thighs, lastUpdate }
- targetWeight: Number
