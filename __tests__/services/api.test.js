import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../services/api';

/**
 * Testy jednostkowe serwisu API (White-box testing)
 */

global.fetch = jest.fn();

describe('ApiService - Testy Jednostkowe', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        AsyncStorage.getItem.mockClear();
        AsyncStorage.setItem.mockClear();
        AsyncStorage.removeItem.mockClear();
        fetch.mockClear();
    });

    describe('Zarządzanie tokenem', () => {
        test('powinien pobrać token z AsyncStorage', async () => {
            const testToken = 'test-jwt-token';
            AsyncStorage.getItem.mockResolvedValue(testToken);

            const token = await ApiService.getToken();

            expect(AsyncStorage.getItem).toHaveBeenCalledWith('@stillresting_token');
            expect(token).toBe(testToken);
        });

        test('powinien zapisać token', async () => {
            await ApiService.setToken('new-token');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stillresting_token', 'new-token');
        });

        test('powinien usunąć token', async () => {
            await ApiService.removeToken();
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@stillresting_token');
        });

        test('powinien obsłużyć błąd przy pobieraniu', async () => {
            AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
            console.error = jest.fn();

            const token = await ApiService.getToken();
            expect(token).toBeNull();
        });
    });

    describe('Zarządzanie użytkownikiem', () => {
        test('powinien zapisać dane użytkownika', async () => {
            const user = { id: '123', username: 'test' };
            await ApiService.setUser(user);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@stillresting_user',
                JSON.stringify(user)
            );
        });

        test('powinien pobrać dane użytkownika', async () => {
            const user = { id: '123', username: 'test' };
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify(user));

            const result = await ApiService.getUser();
            expect(result).toEqual(user);
        });
    });

    describe('HTTP Request', () => {
        test('powinien dodać token do nagłówków', async () => {
            AsyncStorage.getItem.mockResolvedValue('test-token');
            fetch.mockResolvedValue({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({ success: true }),
            });

            await ApiService.request('/test');

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token',
                    }),
                })
            );
        });

        test('powinien zwrócić dane JSON', async () => {
            const data = { id: 1, name: 'Test' };
            AsyncStorage.getItem.mockResolvedValue(null);
            fetch.mockResolvedValue({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => data,
            });

            const result = await ApiService.request('/test');
            expect(result).toEqual(data);
        });

        test('powinien rzucić błąd przy niepowodzeniu', async () => {
            AsyncStorage.getItem.mockResolvedValue(null);
            fetch.mockResolvedValue({
                ok: false,
                status: 400,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({ message: 'Error' }),
            });

            await expect(ApiService.request('/test')).rejects.toThrow();
        });
    });

    describe('Metody autoryzacji', () => {
        test('register - powinien zarejestrować użytkownika', async () => {
            const response = { token: 'token123', user: { id: '1' } };
            AsyncStorage.getItem.mockResolvedValue(null);
            fetch.mockResolvedValue({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => response,
            });

            await ApiService.register('user', 'test@example.com', 'pass123');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/register'),
                expect.objectContaining({ method: 'POST' })
            );
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('@stillresting_token', 'token123');
        });

        test('login - powinien zalogować użytkownika', async () => {
            const response = { token: 'login-token', user: { id: '2' } };
            AsyncStorage.getItem.mockResolvedValue(null);
            fetch.mockResolvedValue({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => response,
            });

            await ApiService.login('test@example.com', 'pass123');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/login'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        test('logout - powinien usunąć dane', async () => {
            await ApiService.logout();
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@stillresting_token');
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@stillresting_user');
        });
    });

    describe('Metody treningów', () => {
        beforeEach(() => {
            AsyncStorage.getItem.mockResolvedValue('token');
            fetch.mockResolvedValue({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({}),
            });
        });

        test('getWorkouts - powinien pobrać treningi', async () => {
            await ApiService.getWorkouts();
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/workouts'),
                expect.any(Object)
            );
        });

        test('createWorkout - powinien utworzyć trening', async () => {
            const data = { name: 'Test' };
            await ApiService.createWorkout(data);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/workouts'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        test('updateWorkout - powinien zaktualizować', async () => {
            await ApiService.updateWorkout('123', { name: 'Updated' });
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/workouts/123'),
                expect.objectContaining({ method: 'PUT' })
            );
        });

        test('deleteWorkout - powinien usunąć', async () => {
            await ApiService.deleteWorkout('456');
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/workouts/456'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    describe('Metody postępu', () => {
        beforeEach(() => {
            AsyncStorage.getItem.mockResolvedValue('token');
            fetch.mockResolvedValue({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({}),
            });
        });

        test('addWeight - powinien dodać wagę', async () => {
            await ApiService.addWeight('2026-01-31', 75);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/progress/weight'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        test('updateMeasurements - powinien zaktualizować wymiary', async () => {
            const measurements = { chest: 100 };
            await ApiService.updateMeasurements(measurements);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/progress/measurements'),
                expect.objectContaining({ method: 'PUT' })
            );
        });

        test('getStats - powinien pobrać statystyki', async () => {
            await ApiService.getStats();
            expect(fetch).toHaveBeenCalled();
        });
    });

    describe('Planowanie treningów', () => {
        beforeEach(() => {
            AsyncStorage.getItem.mockResolvedValue('token');
            fetch.mockResolvedValue({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({}),
            });
        });

        test('getWorkoutPlans - powinien pobrać plany', async () => {
            await ApiService.getWorkoutPlans();
            expect(fetch).toHaveBeenCalled();
        });

        test('createWorkoutPlan - powinien utworzyć plan', async () => {
            await ApiService.createWorkoutPlan({ name: 'Plan' });
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/workout-plans'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        test('deleteWorkoutPlan - powinien usunąć plan', async () => {
            await ApiService.deleteWorkoutPlan('789');
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/workout-plans/789'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    describe('Ćwiczenia', () => {
        beforeEach(() => {
            AsyncStorage.getItem.mockResolvedValue('token');
            fetch.mockResolvedValue({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({}),
            });
        });

        test('getExercises - powinien pobrać ćwiczenia', async () => {
            await ApiService.getExercises();
            expect(fetch).toHaveBeenCalled();
        });

        test('createExercise - powinien utworzyć ćwiczenie', async () => {
            await ApiService.createExercise({ name: 'Exercise' });
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/exercises'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });
});
