import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';

const ProgressScreen = ({ navigation }) => {
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  
  const [newWeight, setNewWeight] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Przykładowe dane
  const currentWeight = 78.5;
  const targetWeight = 75.0;
  const weightChange = -2.3;

  const bodyMeasurements = {
    chest: 102,
    waist: 85,
    biceps: 38,
    thighs: 58,
    lastUpdate: '2024-01-10',
  };

  const weightHistory = [
    { date: '2024-01-12', weight: 78.5 },
    { date: '2024-01-05', weight: 79.2 },
    { date: '2023-12-29', weight: 80.1 },
    { date: '2023-12-22', weight: 80.8 },
  ];

  const exercisesList = [
    { id: 1, name: 'Bench Press', category: 'Push' },
    { id: 2, name: 'Squat', category: 'Legs' },
    { id: 3, name: 'Deadlift', category: 'Pull' },
    { id: 4, name: 'Overhead Press', category: 'Push' },
    { id: 5, name: 'Barbell Row', category: 'Pull' },
  ];

  const exerciseProgress = {
    'Bench Press': {
      currentMax: 80,
      previousMax: 75,
      totalVolume: 12450,
      sessions: 15,
      history: [
        { date: '2024-01-12', maxWeight: 80, volume: 3090 },
        { date: '2024-01-08', maxWeight: 80, volume: 2980 },
        { date: '2024-01-04', maxWeight: 77.5, volume: 2850 },
        { date: '2023-12-30', maxWeight: 75, volume: 2750 },
      ],
    },
  };

  const monthlyStats = {
    totalWorkouts: 16,
    totalVolume: 48500,
    totalSets: 192,
    avgWorkoutDuration: 54,
  };

  const handleAddWeight = () => {
    if (!newWeight) {
      Alert.alert('Błąd', 'Podaj wagę');
      return;
    }
    console.log('Adding weight:', newWeight);
    setNewWeight('');
    setShowWeightModal(false);
    Alert.alert('Sukces', 'Waga została dodana');
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Postępy</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Body Weight Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>WAGA CIAŁA</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowWeightModal(true)}
            >
              <Text style={styles.addButtonText}>+ Dodaj</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weightCard}>
            <View style={styles.weightMain}>
              <Text style={styles.weightLabel}>Aktualna waga</Text>
              <Text style={styles.weightValue}>{currentWeight} kg</Text>
              <View style={styles.weightChange}>
                <Text style={[styles.weightChangeText, weightChange < 0 && styles.weightChangeNegative]}>
                  {weightChange > 0 ? '+' : ''}{weightChange} kg
                </Text>
                <Text style={styles.weightChangePeriod}>w tym miesiącu</Text>
              </View>
            </View>

            <View style={styles.weightTarget}>
              <Text style={styles.weightTargetLabel}>Cel</Text>
              <Text style={styles.weightTargetValue}>{targetWeight} kg</Text>
            </View>
          </View>

          <View style={styles.weightHistoryCard}>
            <Text style={styles.cardTitle}>Historia wagi</Text>
            {weightHistory.map((entry, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                <Text style={styles.historyValue}>{entry.weight} kg</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Body Measurements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>POMIARY CIAŁA</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowMeasurementsModal(true)}
            >
              <Text style={styles.addButtonText}>+ Dodaj</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.measurementsCard}>
            <View style={styles.measurementRow}>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Klatka</Text>
                <Text style={styles.measurementValue}>{bodyMeasurements.chest} cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Talia</Text>
                <Text style={styles.measurementValue}>{bodyMeasurements.waist} cm</Text>
              </View>
            </View>
            <View style={styles.measurementRow}>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Biceps</Text>
                <Text style={styles.measurementValue}>{bodyMeasurements.biceps} cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Uda</Text>
                <Text style={styles.measurementValue}>{bodyMeasurements.thighs} cm</Text>
              </View>
            </View>
            <Text style={styles.measurementUpdate}>
              Ostatnia aktualizacja: {bodyMeasurements.lastUpdate}
            </Text>
          </View>
        </View>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STATYSTYKI (TEN MIESIĄC)</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Treningów</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {(monthlyStats.totalVolume / 1000).toFixed(1)}t
              </Text>
              <Text style={styles.statLabel}>Objętość</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.totalSets}</Text>
              <Text style={styles.statLabel}>Serii</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.avgWorkoutDuration} min</Text>
              <Text style={styles.statLabel}>Śr. czas</Text>
            </View>
          </View>
        </View>

        {/* Exercise Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>POSTĘP ĆWICZEŃ</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowExerciseModal(true)}
            >
              <Text style={styles.addButtonText}>Wybierz</Text>
            </TouchableOpacity>
          </View>

          {selectedExercise ? (
            <View style={styles.exerciseProgressCard}>
              <Text style={styles.exerciseProgressName}>{selectedExercise.name}</Text>
              
              <View style={styles.exerciseStats}>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatLabel}>Aktualny max</Text>
                  <Text style={styles.exerciseStatValue}>
                    {exerciseProgress[selectedExercise.name]?.currentMax || 0} kg
                  </Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatLabel}>Poprzedni max</Text>
                  <Text style={styles.exerciseStatValue}>
                    {exerciseProgress[selectedExercise.name]?.previousMax || 0} kg
                  </Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatLabel}>Postęp</Text>
                  <Text style={[styles.exerciseStatValue, styles.exerciseStatProgress]}>
                    +{((exerciseProgress[selectedExercise.name]?.currentMax || 0) - 
                       (exerciseProgress[selectedExercise.name]?.previousMax || 0))} kg
                  </Text>
                </View>
              </View>

              <View style={styles.exerciseHistory}>
                <Text style={styles.exerciseHistoryTitle}>Historia</Text>
                {exerciseProgress[selectedExercise.name]?.history.map((entry, index) => (
                  <View key={index} style={styles.exerciseHistoryItem}>
                    <Text style={styles.exerciseHistoryDate}>{entry.date}</Text>
                    <View style={styles.exerciseHistoryStats}>
                      <Text style={styles.exerciseHistoryValue}>Max: {entry.maxWeight} kg</Text>
                      <Text style={styles.exerciseHistoryValue}>Vol: {entry.volume} kg</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📊</Text>
              <Text style={styles.emptyStateText}>Wybierz ćwiczenie</Text>
              <Text style={styles.emptyStateSubtext}>
                aby zobaczyć postępy
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Weight Modal */}
      <Modal
        visible={showWeightModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dodaj wagę</Text>
            
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Waga (kg)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. 78.5"
                placeholderTextColor="#6B7280"
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowWeightModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleAddWeight}
              >
                <Text style={styles.modalButtonConfirmText}>Dodaj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Measurements Modal */}
      <Modal
        visible={showMeasurementsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMeasurementsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dodaj pomiary</Text>
            
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Klatka (cm)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. 102"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Talia (cm)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. 85"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Biceps (cm)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. 38"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Uda (cm)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. 58"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowMeasurementsModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={() => {
                  console.log('Adding measurements');
                  setShowMeasurementsModal(false);
                  Alert.alert('Sukces', 'Pomiary zostały dodane');
                }}
              >
                <Text style={styles.modalButtonConfirmText}>Dodaj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Select Exercise Modal */}
      <Modal
        visible={showExerciseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wybierz ćwiczenie</Text>
            
            <ScrollView style={styles.exerciseList}>
              {exercisesList.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.exerciseOption}
                  onPress={() => handleSelectExercise(exercise)}
                >
                  <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                  <Text style={styles.exerciseOptionCategory}>{exercise.category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={() => setShowExerciseModal(false)}
            >
              <Text style={styles.modalButtonCancelText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  weightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightMain: {
    flex: 1,
  },
  weightLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  weightChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightChangeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  weightChangeNegative: {
    color: '#10B981',
  },
  weightChangePeriod: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  weightTarget: {
    alignItems: 'center',
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
  },
  weightTargetLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  weightTargetValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  weightHistoryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  historyDate: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  historyValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  measurementsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  measurementRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  measurementItem: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 6,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  measurementUpdate: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  exerciseProgressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  exerciseProgressName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  exerciseStat: {
    flex: 1,
    alignItems: 'center',
  },
  exerciseStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  exerciseStatProgress: {
    color: '#10B981',
  },
  exerciseHistory: {
    marginTop: 8,
  },
  exerciseHistoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  exerciseHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseHistoryDate: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  exerciseHistoryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  exerciseHistoryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exerciseList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  exerciseOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  exerciseOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseOptionCategory: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

export default ProgressScreen;
