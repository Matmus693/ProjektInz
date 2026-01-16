# StillResting

Aplikacja do śledzenia treningów i postępów.

## Instalacja

### Frontend

1. Zainstaluj zależności:
```bash
npm install
```

2. Uruchom aplikację:
```bash
npm start
```

### Backend

Zobacz [backend/README.md](./backend/README.md) dla szczegółów instalacji backendu.

## Konfiguracja

### Frontend - Konfiguracja API

Plik `services/api.js` zawiera konfigurację URL API. Domyślnie używa:
- Development: `http://localhost:5000/api`
- Production: (należy zaktualizować)

Aby zmienić URL API, edytuj zmienną `API_BASE_URL` w pliku `services/api.js`.

**Ważne:** Dla aplikacji mobilnych (Android/iOS) w trybie development, możesz potrzebować użyć IP komputera zamiast localhost. Na przykład:
- Android Emulator: `http://10.0.2.2:5000/api`
- iOS Simulator: `http://localhost:5000/api`
- Fizyczne urządzenie: `http://<IP_TWOJEGO_KOMPUTERA>:5000/api`

### Backend

Upewnij się, że MongoDB jest uruchomione i skonfigurowane w pliku `backend/.env`.

## Uruchomienie

1. Uruchom backend:
```bash
cd backend
npm install
npm run dev
```

2. W innym terminalu uruchom frontend:
```bash
npm start
```

## Struktura projektu

- `screens/` - Ekrany aplikacji
- `services/` - Serwisy API
- `navigation/` - Konfiguracja nawigacji
- `backend/` - Backend API (Node.js/Express/MongoDB)

## Aktualizacja ekranów do używania API

Ekrany LoginScreen i RegisterScreen zostały już zaktualizowane do używania API. Inne ekrany należy zaktualizować podobnie:

1. Importuj serwis API:
```javascript
import api from '../services/api';
```

2. Użyj metod API zamiast mock danych:
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await api.getWorkouts();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

3. Dodaj obsługę błędów i stanów ładowania.

## Funkcjonalności

- ✅ Rejestracja i logowanie użytkowników
- ✅ Zarządzanie treningami
- ✅ Zarządzanie planami treningowymi
- ✅ Śledzenie postępów (waga, pomiary)
- ✅ Statystyki treningowe
