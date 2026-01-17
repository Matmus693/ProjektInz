import React, { useState, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const TEMP_USER_ID = '65a000000000000000000001';

const ProgressScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [stats, setStats] = useState(null);
  const [exercisesList, setExercisesList] = useState([]);

  // Modals
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showTargetWeightModal, setShowTargetWeightModal] = useState(false);

  // Form State
  const [newWeight, setNewWeight] = useState('');
  const [newTargetWeight, setNewTargetWeight] = useState('');
  const [measurementsDetails, setMeasurementsDetails] = useState({
    chest: '', waist: '', biceps: '', thighs: ''
  });

  // Exercise Progress State
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseProgress, setExerciseProgress] = useState(null);
  const [loadingExerciseStats, setLoadingExerciseStats] = useState(false);
  const [showAllWeightHistory, setShowAllWeightHistory] = useState(false);
  const [exerciseFilter, setExerciseFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Main Progress (Weight, Measurements)
      const data = await api.getProgress();
      if (data) {
        setProgressData(data);
        // Pre-fill measurements form
        if (data.measurements) {
          setMeasurementsDetails({
            chest: data.measurements.chest?.toString() || '',
            waist: data.measurements.waist?.toString() || '',
            biceps: data.measurements.biceps?.toString() || '',
            thighs: data.measurements.thighs?.toString() || '',
          });
        }
      }

      // 2. Fetch Monthly Stats
      const statsData = await api.getStats();
      if (statsData) {
        setStats(statsData);
      }

      // 3. Fetch Exercises List (for picker)
      const exList = await api.getExercises();
      if (exList) {
        setExercisesList(exList);
      }

    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się pobrać danych');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchExerciseStats = async (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(false);
    setLoadingExerciseStats(true);
    setExerciseProgress(null); // Clear previous

    try {
      // Encoded name just in case
      const encodedName = encodeURIComponent(exercise.name);
      // api.request doesn't have a shortcut for this yet, using generic request
      const data = await api.request(`/progress/exercise/${encodedName}`);
      if (data) {
        setExerciseProgress(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExerciseStats(false);
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight) {
      Alert.alert('Błąd', 'Podaj wagę');
      return;
    }
    try {
      // api.addWeight handles formatting
      await api.addWeight(new Date().toISOString().split('T')[0], newWeight);
      setNewWeight('');
      setShowWeightModal(false);
      fetchData(); // Refresh
      Alert.alert('Sukces', 'Waga została dodana');
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nie udało się zapisać wagi');
    }
  };

  const handleUpdateMeasurements = async () => {
    try {
      const payload = {
        chest: parseFloat(measurementsDetails.chest) || 0,
        waist: parseFloat(measurementsDetails.waist) || 0,
        biceps: parseFloat(measurementsDetails.biceps) || 0,
        thighs: parseFloat(measurementsDetails.thighs) || 0
      };
      await api.updateMeasurements(payload);
      setShowMeasurementsModal(false);
      fetchData();
      Alert.alert('Sukces', 'Pomiary zaktualizowane');
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nie udało się zaktualizować pomiarów');
    }
  };

  const handleSetTargetWeight = async () => {
    if (!newTargetWeight) {
      Alert.alert('Błąd', 'Podaj wagę docelową');
      return;
    }
    try {
      await api.updateTargetWeight(newTargetWeight);
      setNewTargetWeight('');
      setShowTargetWeightModal(false);
      fetchData();
      Alert.alert('Sukces', 'Cel wagowy zaktualizowany');
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nie udało się ustawić celu');
    }
  };

  const handleDeleteWeight = async (weightId) => {
    Alert.alert(
      'Usuń pomiar',
      'Czy na pewno chcesz usunąć ten pomiar wagi?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteWeight(weightId);
              fetchData();
              Alert.alert('Sukces', 'Pomiar usunięty');
            } catch (err) {
              console.error(err);
              Alert.alert('Błąd', 'Nie udało się usunąć pomiaru');
            }
          },
        },
      ]
    );
  };

  // Helpers for display
  const currentWeight = progressData?.weight?.length > 0 ? progressData.weight[0].weight : '-';
  const targetWeight = progressData?.targetWeight || '-';

  // Calculate weight change (latest vs previous)
  const getWeightChange = () => {
    const history = progressData?.weight || [];
    if (history.length < 2) return 0;
    // Compare latest (index 0) with previous (index 1)
    return (history[0].weight - history[1].weight).toFixed(1);
  };
  const weightChange = getWeightChange();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

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
                <Text style={[styles.weightChangeText, parseFloat(weightChange) < 0 && styles.weightChangeNegative]}>
                  {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
                </Text>
                <Text style={styles.weightChangePeriod}>ostatnio</Text>
              </View>
            </View>

            <View style={styles.weightTarget}>
              <Text style={styles.weightTargetLabel}>Cel</Text>
              <TouchableOpacity onPress={() => {
                setNewTargetWeight(targetWeight.toString());
                setShowTargetWeightModal(true);
              }}>
                <Text style={styles.weightTargetValue}>{targetWeight} kg</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weightHistoryCard}>
            <Text style={styles.cardTitle}>Historia wagi</Text>
            {(progressData?.weight || []).slice(0, showAllWeightHistory ? undefined : 5).map((entry, index) => (
              <View key={entry._id || index} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {new Date(entry.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles.historyValue}>{entry.weight} kg</Text>
                  <TouchableOpacity onPress={() => handleDeleteWeight(entry._id)}>
                    <Text style={{ color: '#EF4444', fontSize: 18 }}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {(!progressData?.weight || progressData.weight.length === 0) && (
              <Text style={{ color: '#94A3B8', textAlign: 'center', padding: 10 }}>Brak pomiarów</Text>
            )}
            {(progressData?.weight?.length || 0) > 5 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllWeightHistory(!showAllWeightHistory)}
              >
                <Text style={styles.showMoreText}>
                  {showAllWeightHistory ? 'Pokaż mniej' : `Pokaż więcej (${progressData.weight.length - 5})`}
                </Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.addButtonText}>Edytuj</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.measurementsCard}>
            <View style={styles.measurementRow}>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Klatka</Text>
                <Text style={styles.measurementValue}>{progressData?.measurements?.chest || '-'} cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Talia</Text>
                <Text style={styles.measurementValue}>{progressData?.measurements?.waist || '-'} cm</Text>
              </View>
            </View>
            <View style={styles.measurementRow}>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Biceps</Text>
                <Text style={styles.measurementValue}>{progressData?.measurements?.biceps || '-'} cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Uda</Text>
                <Text style={styles.measurementValue}>{progressData?.measurements?.thighs || '-'} cm</Text>
              </View>
            </View>
            <Text style={styles.measurementUpdate}>
              Ostatnia aktualizacja: {progressData?.measurements?.lastUpdate || '-'}
            </Text>
          </View>
        </View>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STATYSTYKI (TEN MIESIĄC)</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.totalWorkouts || 0}</Text>
              <Text style={styles.statLabel}>Treningów</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {((stats?.totalVolume || 0) / 1000).toFixed(1)}t
              </Text>
              <Text style={styles.statLabel}>Objętość</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.totalSets || 0}</Text>
              <Text style={styles.statLabel}>Serii</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.avgWorkoutDuration || 0} min</Text>
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

          {loadingExerciseStats ? (
            <ActivityIndicator color="#3B82F6" />
          ) : selectedExercise ? (
            <View style={styles.exerciseProgressCard}>
              <Text style={styles.exerciseProgressName}>{selectedExercise.name}</Text>

              <View style={styles.exerciseStats}>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatLabel}>Aktualny max</Text>
                  <Text style={styles.exerciseStatValue}>
                    {exerciseProgress?.currentMax || 0} kg
                  </Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatLabel}>Poprzedni max</Text>
                  <Text style={styles.exerciseStatValue}>
                    {exerciseProgress?.previousMax || 0} kg
                  </Text>
                </View>
                <View style={styles.exerciseStat}>
                  <Text style={styles.exerciseStatLabel}>Postęp</Text>
                  <Text style={[styles.exerciseStatValue, styles.exerciseStatProgress]}>
                    +{((exerciseProgress?.currentMax || 0) - (exerciseProgress?.previousMax || 0)).toFixed(1)} kg
                  </Text>
                </View>
              </View>

              <View style={styles.exerciseHistory}>
                <Text style={styles.exerciseHistoryTitle}>Ostatnie sesje</Text>
                {(exerciseProgress?.history || []).slice(0, 5).map((entry, index) => (
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

      {/* Measurements Modal */}
      <Modal
        visible={showMeasurementsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMeasurementsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Aktualizuj pomiary</Text>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Klatka (cm)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  value={measurementsDetails.chest}
                  onChangeText={(t) => setMeasurementsDetails({ ...measurementsDetails, chest: t })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Talia (cm)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  value={measurementsDetails.waist}
                  onChangeText={(t) => setMeasurementsDetails({ ...measurementsDetails, waist: t })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Biceps (cm)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  value={measurementsDetails.biceps}
                  onChangeText={(t) => setMeasurementsDetails({ ...measurementsDetails, biceps: t })}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Uda (cm)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  value={measurementsDetails.thighs}
                  onChangeText={(t) => setMeasurementsDetails({ ...measurementsDetails, thighs: t })}
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
                  onPress={handleUpdateMeasurements}
                >
                  <Text style={styles.modalButtonConfirmText}>Zapisz</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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

            {/* Muscle Group Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScrollView}
              contentContainerStyle={styles.filterScrollContent}
            >
              {[
                { value: 'all', label: 'Wszystkie' },
                { value: 'Chest', label: 'Klatka' },
                { value: 'Back', label: 'Plecy' },
                { value: 'Legs', label: 'Nogi' },
                { value: 'Shoulders', label: 'Barki' },
                { value: 'Arms', label: 'Ramiona' },
                { value: 'Core', label: 'Brzuch' },
                { value: 'Full Body', label: 'FBW' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterChip,
                    exerciseFilter === filter.value && styles.filterChipActive
                  ]}
                  onPress={() => setExerciseFilter(filter.value)}
                >
                  <Text style={[
                    styles.filterChipText,
                    exerciseFilter === filter.value && styles.filterChipTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.exerciseList}>
              {exercisesList
                .filter(ex => exerciseFilter === 'all' || ex.muscleGroup === exerciseFilter)
                .map((exercise) => (
                  <TouchableOpacity
                    key={exercise._id}
                    style={styles.exerciseOption}
                    onPress={() => fetchExerciseStats(exercise)}
                  >
                    <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                    <Text style={styles.exerciseOptionCategory}>{exercise.muscleGroup}</Text>
                  </TouchableOpacity>
                ))}
              {exercisesList.filter(ex => exerciseFilter === 'all' || ex.muscleGroup === exerciseFilter).length === 0 && (
                <Text style={{ color: '#94A3B8', textAlign: 'center' }}>Brak ćwiczeń w tej kategorii</Text>
              )}
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

      {/* Target Weight Modal */}
      <Modal
        visible={showTargetWeightModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTargetWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ustaw cel wagowy</Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Waga docelowa (kg)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. 75"
                placeholderTextColor="#6B7280"
                value={newTargetWeight}
                onChangeText={setNewTargetWeight}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowTargetWeightModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleSetTargetWeight}
              >
                <Text style={styles.modalButtonConfirmText}>Zapisz</Text>
              </TouchableOpacity>
            </View>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center'
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
  showMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
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
  filterScrollView: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterScrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#334155',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseOptionCategory: {
    fontSize: 13,
    color: '#94A3B8',
  },
});

export default ProgressScreen;
