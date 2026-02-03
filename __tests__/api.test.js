global.fetch = jest.fn();

const mockAsyncStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
};

const ApiService = {
    API_URL: 'http://localhost:5000/api',

    async getToken() {
        try {
            return await mockAsyncStorage.getItem('@stillresting_token');
        } catch {
            return null;
        }
    },

    async setToken(token) {
        await mockAsyncStorage.setItem('@stillresting_token', token);
    },

    async removeToken() {
        await mockAsyncStorage.removeItem('@stillresting_token');
    },

    async setUser(user) {
        await mockAsyncStorage.setItem('@stillresting_user', JSON.stringify(user));
    },

    async getUser() {
        const user = await mockAsyncStorage.getItem('@stillresting_user');
        return user ? JSON.parse(user) : null;
    },

    async request(endpoint, options = {}) {
        const token = await this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        };

        const response = await fetch(`${this.API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) throw new Error('Request failed');
        return await response.json();
    },

    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
        await this.setToken(data.token);
        await this.setUser(data.user);
        return data;
    },

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        await this.setToken(data.token);
        await this.setUser(data.user);
        return data;
    },

    async logout() {
        await this.removeToken();
        await mockAsyncStorage.removeItem('@stillresting_user');
    },

    async getWorkouts() {
        return await this.request('/workouts');
    },

    async createWorkout(workoutData) {
        return await this.request('/workouts', {
            method: 'POST',
            body: JSON.stringify(workoutData),
        });
    },

    async updateWorkout(id, workoutData) {
        return await this.request(`/workouts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(workoutData),
        });
    },

    async deleteWorkout(id) {
        return await this.request(`/workouts/${id}`, {
            method: 'DELETE',
        });
    },
};

describe('ApiService - Testy Jednostkowe', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockAsyncStorage.getItem.mockClear();
        mockAsyncStorage.setItem.mockClear();
        mockAsyncStorage.removeItem.mockClear();
        fetch.mockClear();
    });

    describe('Zarządzanie tokenem', () => {
        test('powinien pobrać token', async () => {
            mockAsyncStorage.getItem.mockResolvedValue('test-token');
            const token = await ApiService.getToken();
            expect(token).toBe('test-token');
            expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@stillresting_token');
        });

        test('powinien zapisać token', async () => {
            await ApiService.setToken('new-token');
            expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@stillresting_token', 'new-token');
        });

        test('powinien usunąć token', async () => {
            await ApiService.removeToken();
            expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@stillresting_token');
        });
    });

    describe('Zarządzanie użytkownikiem', () => {
        test('powinien zapisać użytkownika', async () => {
            const user = { id: '1', username: 'test' };
            await ApiService.setUser(user);
            expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
                '@stillresting_user',
                JSON.stringify(user)
            );
        });

        test('powinien pobrać użytkownika', async () => {
            const user = { id: '1', username: 'test' };
            mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(user));
            const result = await ApiService.getUser();
            expect(result).toEqual(user);
        });
    });

    describe('Wykonywanie zapytań HTTP', () => {
        test('powinien dodać token do nagłówków', async () => {
            mockAsyncStorage.getItem.mockResolvedValue('test-token');
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: 'test' }),
            });

            await ApiService.request('/test');

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token',
                    }),
                })
            );
        });

        test('powinien rzucić błąd przy nieudanym zapytaniu', async () => {
            mockAsyncStorage.getItem.mockResolvedValue(null);
            fetch.mockResolvedValue({
                ok: false,
            });

            await expect(ApiService.request('/test')).rejects.toThrow();
        });
    });

    describe('Autoryzacja', () => {
        test('register powinien zarejestrować użytkownika', async () => {
            const responseData = {
                token: 'new-token',
                user: { id: '1', username: 'test' },
            };

            mockAsyncStorage.getItem.mockResolvedValue(null);
            fetch.mockResolvedValue({
                ok: true,
                json: async () => responseData,
            });

            await ApiService.register('test', 'test@example.com', 'pass123');

            expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@stillresting_token', 'new-token');
        });

        test('login powinien zalogować użytkownika', async () => {
            const responseData = {
                token: 'login-token',
                user: { id: '2', username: 'user' },
            };

            mockAsyncStorage.getItem.mockResolvedValue(null);
            fetch.mockResolvedValue({
                ok: true,
                json: async () => responseData,
            });

            await ApiService.login('test@example.com', 'pass123');

            expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@stillresting_token', 'login-token');
        });

        test('logout powinien usunąć dane', async () => {
            await ApiService.logout();

            expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@stillresting_token');
            expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@stillresting_user');
        });
    });

    describe('Operacje na treningach', () => {
        beforeEach(() => {
            mockAsyncStorage.getItem.mockResolvedValue('token');
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            });
        });

        test('getWorkouts powinien pobrać treningi', async () => {
            await ApiService.getWorkouts();
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/workouts',
                expect.any(Object)
            );
        });

        test('createWorkout powinien utworzyć trening', async () => {
            const workoutData = { name: 'Test Workout' };
            await ApiService.createWorkout(workoutData);

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/workouts',
                expect.objectContaining({ method: 'POST' })
            );
        });

        test('updateWorkout powinien zaktualizować trening', async () => {
            await ApiService.updateWorkout('123', { name: 'Updated' });

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/workouts/123',
                expect.objectContaining({ method: 'PUT' })
            );
        });

        test('deleteWorkout powinien usunąć trening', async () => {
            await ApiService.deleteWorkout('456');

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/workouts/456',
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });
});
