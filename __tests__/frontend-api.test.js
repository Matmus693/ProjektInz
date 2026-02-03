global.fetch = jest.fn();

const AsyncStorageMock = {
    storage: {},
    async getItem(key) {
        return this.storage[key] || null;
    },
    async setItem(key, value) {
        this.storage[key] = value;
    },
    async removeItem(key) {
        delete this.storage[key];
    },
    clear() {
        this.storage = {};
    }
};

class ApiService {
    constructor() {
        this.API_URL = 'http://localhost:5000/api';
    }

    async getToken() {
        return await AsyncStorageMock.getItem('@stillresting_token');
    }

    async setToken(token) {
        await AsyncStorageMock.setItem('@stillresting_token', token);
    }

    async removeToken() {
        await AsyncStorageMock.removeItem('@stillresting_token');
    }

    async request(endpoint, options = {}) {
        const token = await this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };

        const response = await fetch(`${this.API_URL}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    }

    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
        await this.setToken(data.token);
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        await this.setToken(data.token);
        return data;
    }

    async logout() {
        await this.removeToken();
        await AsyncStorageMock.removeItem('@stillresting_user');
    }

    async getWorkouts() {
        return await this.request('/workouts');
    }

    async createWorkout(workoutData) {
        return await this.request('/workouts', {
            method: 'POST',
            body: JSON.stringify(workoutData),
        });
    }
}

describe('Frontend API Service - Testy Integracyjne', () => {
    let apiService;

    beforeEach(() => {
        apiService = new ApiService();
        AsyncStorageMock.clear();
        jest.clearAllMocks();
        fetch.mockClear();
    });

    describe('Zarządzanie Tokenem', () => {
        test('powinien zapisać i pobrać token', async () => {
            await apiService.setToken('test-token-123');
            const token = await apiService.getToken();
            expect(token).toBe('test-token-123');
        });

        test('powinien usunąć token', async () => {
            await apiService.setToken('token-to-remove');
            await apiService.removeToken();
            const token = await apiService.getToken();
            expect(token).toBeNull();
        });

        test('powinien zwrócić null gdy brak tokena', async () => {
            const token = await apiService.getToken();
            expect(token).toBeNull();
        });
    });

    describe('HTTP Requests', () => {
        test('powinien dodać token do nagłówków', async () => {
            await apiService.setToken('auth-token');
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });

            await apiService.request('/test');

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer auth-token',
                    }),
                })
            );
        });

        test('powinien rzucić błąd przy niepowodzeniu', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 401,
            });

            await expect(apiService.request('/test')).rejects.toThrow('HTTP 401');
        });

        test('powinien parsować JSON odpowiedź', async () => {
            const mockData = { id: 1, name: 'Test' };
            fetch.mockResolvedValue({
                ok: true,
                json: async () => mockData,
            });

            const result = await apiService.request('/test');
            expect(result).toEqual(mockData);
        });
    });

    describe('Rejestracja i Logowanie', () => {
        test('register - powinien zarejestrować użytkownika', async () => {
            const mockResponse = {
                token: 'new-user-token',
                user: { id: '1', username: 'newuser' },
            };

            fetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await apiService.register('newuser', 'new@example.com', 'password123');

            expect(result.token).toBe('new-user-token');
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/auth/register',
                expect.objectContaining({ method: 'POST' })
            );

            const savedToken = await apiService.getToken();
            expect(savedToken).toBe('new-user-token');
        });

        test('login - powinien zalogować użytkownika', async () => {
            const mockResponse = {
                token: 'login-token',
                user: { id: '2', email: 'user@example.com' },
            };

            fetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await apiService.login('user@example.com', 'password123');

            expect(result.token).toBe('login-token');
            const savedToken = await apiService.getToken();
            expect(savedToken).toBe('login-token');
        });

        test('logout - powinien usunąć dane użytkownika', async () => {
            await apiService.setToken('token-to-clear');
            await apiService.logout();

            const token = await apiService.getToken();
            expect(token).toBeNull();
        });
    });

    describe('Operacje Treningów', () => {
        beforeEach(async () => {
            await apiService.setToken('valid-token');
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });
        });

        test('getWorkouts - powinien pobrać listę treningów', async () => {
            const mockWorkouts = [
                { id: '1', name: 'Trening A' },
                { id: '2', name: 'Trening B' },
            ];

            fetch.mockResolvedValue({
                ok: true,
                json: async () => mockWorkouts,
            });

            const workouts = await apiService.getWorkouts();

            expect(workouts).toHaveLength(2);
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/workouts',
                expect.any(Object)
            );
        });

        test('createWorkout - powinien utworzyć nowy trening', async () => {
            const newWorkout = {
                name: 'Nowy Trening',
                date: '2026-01-31',
                exercises: [],
            };

            const mockResponse = { id: '3', ...newWorkout };
            fetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await apiService.createWorkout(newWorkout);

            expect(result.id).toBe('3');
            expect(result.name).toBe('Nowy Trening');
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/workouts',
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    describe('Obsługa Błędów', () => {
        test('powinien obsłużyć błąd sieci', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            await expect(apiService.getWorkouts()).rejects.toThrow('Network error');
        });

        test('powinien obsłużyć błąd 500', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
            });

            await expect(apiService.getWorkouts()).rejects.toThrow('HTTP 500');
        });

        test('powinien obsłużyć brak autoryzacji', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 401,
            });

            await expect(apiService.getWorkouts()).rejects.toThrow('HTTP 401');
        });
    });
});
