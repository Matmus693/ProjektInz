import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure API URL based on platform
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com/api';
  }
  
  // For development
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:5000/api';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:5000/api';
  } else {
    // Web or other platforms
    return 'http://localhost:5000/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Storage key for token
const TOKEN_KEY = '@stillresting_token';
const USER_KEY = '@stillresting_user';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get stored token
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Store token
  async setToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  // Remove token
  async removeToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Store user
  async setUser(user) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  // Get stored user
  async getUser() {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Make API request
  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
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

  // Auth methods
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

  // Workout methods
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

  // Workout Plan methods
  async getWorkoutPlans() {
    return this.request('/workout-plans');
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

  // Progress methods
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

  async getStats() {
    return this.request('/progress/stats');
  }
}

export default new ApiService();
