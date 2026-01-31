import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
}));

// Mock expo modules
jest.mock('expo-status-bar', () => ({
    StatusBar: 'StatusBar',
}));

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock navigation
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: jest.fn(),
        goBack: jest.fn(),
        reset: jest.fn(),
    }),
    useRoute: () => ({
        params: {},
    }),
}));

// Global test timeout
jest.setTimeout(10000);
