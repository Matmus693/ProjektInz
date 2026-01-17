import React, { useState, useEffect } from 'react';
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
import api from '../services/api';

const WorkoutEditorScreen = ({ navigation, route }) => {
  const isEditing = route?.params?.workout !== undefined;
  const existingWorkout = route?.params?.workout;

  const [workoutName, setWorkoutName] = useState(existingWorkout?.name || '');
  const [exercises, setExercises] = useState(existingWorkout?.exercises || []);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [timerRunning, setTimerRunning] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Timer effect
  React.useEffect(() => {
    let interval = null;
    if (timerRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, startTime]);

  // Format elapsed time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start timer (continue from current elapsed time)
  const startTimer = () => {
    setStartTime(Date.now() - (elapsedTime * 1000)); // Adjust start time based on elapsed
    setTimerRunning(true);
  };

  // Stop timer (pause, don't reset)
  const stopTimer = () => {
    setTimerRunning(false);
  };

  // Fetch templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const data = await api.getWorkoutTemplates();
        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Load template by ID
  const loadTemplate = (template) => {
    setWorkoutName(template.name);
    setExercises(
      template.exercises.map((ex, idx) => ({
        id: Date.now() + idx,
        name: ex.name,
        numSets: ex.numSets || 3,
        sets: Array.from({ length: ex.numSets || 3 }, (_, i) => ({
          id: i + 1,
          weight: '',
          reps: ''
        }))
      }))
    );
    setShowTemplateModal(false);
  };

  const addExercise = () => {
    const newExercise = {
      id: Date.now(),
      name: '',
      numSets: 3,
      sets: [
        { id: 1, weight: '', reps: '' },
        { id: 2, weight: '', reps: '' },
        { id: 3, weight: '', reps: '' },
      ],
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (id) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const updateExerciseName = (id, name) => {
    setExercises(
      exercises.map((ex) => (ex.id === id ? { ...ex, name } : ex))
    );
  };

  const updateNumSets = (exerciseId, numSets) => {
    const num = parseInt(numSets) || 0;
    if (num < 1 || num > 10) return; // Limit 1-10 sets

    setExercises(
      exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const newSets = [];
          for (let i = 0; i < num; i++) {
            newSets.push(ex.sets[i] || { id: i + 1, weight: '', reps: '' });
          }
          return { ...ex, numSets: num, sets: newSets };
        }
        return ex;
      })
    );
  };

  const updateSet = (exerciseId, setId, field, value) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((set) =>
              set.id === setId ? { ...set, [field]: value } : set
            ),
          };
        }
        return ex;
      })
    );
  };

  const handleSave = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę treningu');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Błąd', 'Dodaj przynajmniej jedno ćwiczenie');
      return;
    }

    // Tutaj logika zapisu do bazy/state
    try {
      const workoutData = {
        name: workoutName,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        duration: formatTime(elapsedTime), // Save actual duration
        exercises: exercises.map(ex => ({
          name: ex.name,
          numSets: ex.numSets,
          sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps }))
        }))
      };

      if (isEditing) {
        await api.updateWorkout(existingWorkout._id, workoutData);
      } else {
        await api.createWorkout(workoutData);
      }
      stopTimer(); // Stop timer when saving
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się zapisał treningu');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Edytuj Trening' : 'Nowy Trening'}
        </Text>

        <View style={styles.headerControls}>
          <Text style={styles.timerText}>
            {formatTime(elapsedTime)}
          </Text>

          {!timerRunning ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={startTimer}
            >
              <Text style={styles.startButtonText}>▶</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopTimer}
            >
              <Text style={styles.stopButtonText}>⏸</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Zapisz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                'Anuluj trening',
                'Czy na pewno chcesz anulować? Wszystkie niezapisane zmiany zostaną utracone.',
                [
                  { text: 'Nie', style: 'cancel' },
                  {
                    text: 'Tak, anuluj',
                    style: 'destructive',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            }}
          >
            <Text style={styles.cancelButtonText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Name */}
        <View style={styles.section}>
          <Text style={styles.label}>NAZWA TRENINGU</Text>
          <TextInput
            style={styles.input}
            placeholder="np. Push A, Pull B..."
            placeholderTextColor="#6B7280"
            value={workoutName}
            onChangeText={setWorkoutName}
            autoCapitalize="words"
          />
        </View>

        {/* Template Button */}
        {!isEditing && exercises.length === 0 && (
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => setShowTemplateModal(true)}
          >
            <Text style={styles.templateIcon}>📋</Text>
            <Text style={styles.templateButtonText}>
              Użyj szablonu treningu
            </Text>
          </TouchableOpacity>
        )}

        {/* Exercises List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>ĆWICZENIA ({exercises.length})</Text>
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={addExercise}
            >
              <Text style={styles.addExerciseText}>+ Dodaj</Text>
            </TouchableOpacity>
          </View>

          {exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExercise(exercise.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.exerciseInput}
                placeholder="Nazwa ćwiczenia"
                placeholderTextColor="#6B7280"
                value={exercise.name}
                onChangeText={(value) =>
                  updateExerciseName(exercise.id, value)
                }
              />

              {/* Number of Sets Selector */}
              <View style={styles.numSetsContainer}>
                <Text style={styles.numSetsLabel}>Liczba serii:</Text>
                <TextInput
                  style={styles.numSetsInput}
                  placeholder="3"
                  placeholderTextColor="#6B7280"
                  value={exercise.numSets.toString()}
                  onChangeText={(value) =>
                    updateNumSets(exercise.id, value)
                  }
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              {/* Individual Sets */}
              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{setIndex + 1}</Text>
                    <View style={styles.setInputs}>
                      <View style={styles.setInputGroup}>
                        <TextInput
                          style={styles.setInput}
                          placeholder="Ciężar"
                          placeholderTextColor="#6B7280"
                          value={set.weight}
                          onChangeText={(value) =>
                            updateSet(exercise.id, set.id, 'weight', value)
                          }
                          keyboardType="numeric"
                        />
                        <Text style={styles.setInputUnit}>kg</Text>
                      </View>
                      <Text style={styles.setInputDivider}>×</Text>
                      <View style={styles.setInputGroup}>
                        <TextInput
                          style={styles.setInput}
                          placeholder="Reps"
                          placeholderTextColor="#6B7280"
                          value={set.reps}
                          onChangeText={(value) =>
                            updateSet(exercise.id, set.id, 'reps', value)
                          }
                          keyboardType="numeric"
                        />
                        <Text style={styles.setInputUnit}>rep</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {exercises.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💪</Text>
              <Text style={styles.emptyStateText}>Brak ćwiczeń</Text>
              <Text style={styles.emptyStateSubtext}>
                Dodaj ćwiczenie lub użyj szablonu
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Template Modal */}
      <Modal
        visible={showTemplateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wybierz szablon</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {loadingTemplates ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#94A3B8' }}>Ładowanie...</Text>
                </View>
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <TouchableOpacity
                    key={template._id}
                    style={styles.templateOption}
                    onPress={() => loadTemplate(template)}
                  >
                    <Text style={styles.templateOptionIcon}>📋</Text>
                    <View style={styles.templateOptionInfo}>
                      <Text style={styles.templateOptionTitle}>{template.name}</Text>
                      <Text style={styles.templateOptionDesc}>
                        {template.description || `${template.exercises?.length || 0} ćwiczeń`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#94A3B8', textAlign: 'center' }}>
                    Brak szablonów.{'\n'}Stwórz plan w sekcji "Plany" z typem "Szablon"
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowTemplateModal(false)}
            >
              <Text style={styles.modalCancelText}>Anuluj</Text>
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
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 8,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    minWidth: 60,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stopButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  templateButton: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  templateIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  templateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  addExerciseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  addExerciseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  exerciseCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    backgroundColor: '#334155',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 14,
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    borderRadius: 14,
  },
  removeButtonText: {
    fontSize: 24,
    color: '#EF4444',
    fontWeight: '600',
    lineHeight: 28,
  },
  exerciseInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    fontWeight: '600',
  },
  numSetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  numSetsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginRight: 12,
  },
  numSetsInput: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  setsContainer: {
    gap: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    width: 30,
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  setInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  setInput: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  setInputUnit: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginLeft: 6,
    width: 30,
  },
  setInputDivider: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
    marginHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  templateOptionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  templateOptionInfo: {
    flex: 1,
  },
  templateOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  templateOptionDesc: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalCancelButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default WorkoutEditorScreen;