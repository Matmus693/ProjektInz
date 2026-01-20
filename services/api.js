import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Konfiguracja URL API w zależności od platformy
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com/api';
  }

  // Twoje lokalne IP
  const LOCAL_IP = '192.168.55.105';

  // Dla wszystkich platform w trybie development używamy lokalnego IP
  return `http://${LOCAL_IP}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Klucze do storage'a (token, user)
const TOKEN_KEY = '@stillresting_token';
const USER_KEY = '@stillresting_user';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Pobierz token
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Zapisz token
  async setToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  // Usuń token (wylogowanie)
  async removeToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Zapisz dane użytkownika
  async setUser(user) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  // Pobierz dane użytkownika
  async getUser() {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Wykonaj zapytanie do API
  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Metody autoryzacji
  async register(username, email, password) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    await this.setToken(response.token);
    await this.setUser(response.user);
    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await this.setToken(response.token);
    await this.setUser(response.user);
    return response;
  }

  async logout() {
    await this.removeToken();
  }

  // Metody Treningów
  async getWorkouts() {
    return this.request('/workouts');
  }

  async getWorkout(id) {
    return this.request(`/workouts/${id}`);
  }

  async createWorkout(workout) {
    return this.request('/workouts', {
      method: 'POST',
      body: JSON.stringify(workout),
    });
  }

  async updateWorkout(id, workout) {
    return this.request(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workout),
    });
  }

  async deleteWorkout(id) {
    return this.request(`/workouts/${id}`, {
      method: 'DELETE',
    });
  }

  // Metody Planów Treningowych
  async getWorkoutPlans() {
    return this.request('/workout-plans');
  }

  async getWorkoutTemplates() {
    return this.request('/workout-plans/templates');
  }

  async getWorkoutPlan(id) {
    return this.request(`/workout-plans/${id}`);
  }

  async createWorkoutPlan(plan) {
    return this.request('/workout-plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async updateWorkoutPlan(id, plan) {
    return this.request(`/workout-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    });
  }

  async deleteWorkoutPlan(id) {
    return this.request(`/workout-plans/${id}`, {
      method: 'DELETE',
    });
  }

  // Metody Postępu
  async getProgress() {
    return this.request('/progress');
  }

  async addWeight(date, weight) {
    return this.request('/progress/weight', {
      method: 'POST',
      body: JSON.stringify({ date, weight: parseFloat(weight) }),
    });
  }

  async updateMeasurements(measurements) {
    return this.request('/progress/measurements', {
      method: 'PUT',
      body: JSON.stringify(measurements),
    });
  }

  async updateTargetWeight(targetWeight) {
    return this.request('/progress/target-weight', {
      method: 'PUT',
      body: JSON.stringify({ targetWeight: parseFloat(targetWeight) }),
    });
  }

  async deleteWeight(weightId) {
    return this.request(`/progress/weight/${weightId}`, {
      method: 'DELETE',
    });
  }

  async getStats() {
    return this.request('/progress/stats');
  }

  // Metody Insight (Rekomendacje)
  async getInsight() {
    return this.request('/insights/suggest');
  }

  // Metody Ćwiczeń
  async getExercises() {
    return this.request('/exercises');
  }

  async createExercise(exercise) {
    return this.request('/exercises', {
      method: 'POST',
      body: JSON.stringify(exercise),
    });
  }

  async deleteExercise(id) {
    return this.request(`/exercises/${id}`, {
      method: 'DELETE',
    });
  }

  async repairExercises() {
    return this.request('/exercises/repair', {
      method: 'POST',
    });
  }

  async getLastExerciseLog(exerciseName) {
    if (!exerciseName) return null;
    try {
      return await this.request(`/workouts/history/last?exerciseName=${encodeURIComponent(exerciseName)}`);
    } catch (e) {
      if (e.status === 404) return null; // No history
      throw e;
    }
  }

  // Endpointy Postępu (szczegółowe)
  async getExerciseProgress(exerciseName) {
    if (!exerciseName) return null;
    try {
      return await this.request(`/progress/exercise/${encodeURIComponent(exerciseName)}`);
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async getLatestUserWeight() {
    try {
      const data = await this.request('/progress/latest-weight');
      return data.weight || 75; // Default
    } catch (e) {
      return 75; // Default on error
    }
  }

  // Metody Insight
  async getInsight(userId) {
    return this.request(`/insights/suggest?userId=${userId}`);
  }

  // Metody Seedowania (wypełniania danych)
  async seedWorkoutPlans(userId) {
    return this.request('/workout-plans/seed', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async seedExercises() {
    return this.request('/exercises/seed', {
      method: 'POST',
    });
  }

  // Generator Treningów
  async generateWorkoutPlan(targetMuscles, trainingType = 'CUSTOM', maxExercises = 6) {
    return this.request('/workout-generator/generate', {
      method: 'POST',
      body: JSON.stringify({ targetMuscles, trainingType, maxExercises }),
    });
  }

  async validateWorkout(exercises) {
    return this.request('/workout-generator/validate', {
      method: 'POST',
      body: JSON.stringify({ exercises }),
    });
  }

  async getMuscleGroups() {
    return this.request('/workout-generator/muscle-groups');
  }

  async getTrainingTypes() {
    return this.request('/workout-generator/training-types');
  }
}

export default new ApiService();