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

const WorkoutEditorScreen = ({ navigation, route }) => {
  const isEditing = route?.params?.workout !== undefined;
  const existingWorkout = route?.params?.workout;

  const [workoutName, setWorkoutName] = useState(existingWorkout?.name || '');
  const [exercises, setExercises] = useState(existingWorkout?.exercises || []);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Szablony treningów
  const templates = {
    push: {
      name: 'Push A',
      exercises: [
        {
          id: 1,
          name: 'Bench Press',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
        {
          id: 2,
          name: 'Incline DB Press',
          numSets: 3,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
          ]
        },
        {
          id: 3,
          name: 'Cable Flyes',
          numSets: 3,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
          ]
        },
        {
          id: 4,
          name: 'Overhead Press',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
      ],
    },
    pull: {
      name: 'Pull A',
      exercises: [
        {
          id: 1,
          name: 'Deadlift',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
        {
          id: 2,
          name: 'Pull-ups',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
        {
          id: 3,
          name: 'Barbell Row',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
      ],
    },
    legs: {
      name: 'Legs A',
      exercises: [
        {
          id: 1,
          name: 'Squat',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
        {
          id: 2,
          name: 'Romanian Deadlift',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
        {
          id: 3,
          name: 'Leg Press',
          numSets: 3,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
          ]
        },
      ],
    },
    fbw: {
      name: 'FBW',
      exercises: [
        {
          id: 1,
          name: 'Squat',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
        {
          id: 2,
          name: 'Bench Press',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
        {
          id: 3,
          name: 'Barbell Row',
          numSets: 4,
          sets: [
            { id: 1, weight: '', reps: '' },
            { id: 2, weight: '', reps: '' },
            { id: 3, weight: '', reps: '' },
            { id: 4, weight: '', reps: '' },
          ]
        },
      ],
    },
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

  const loadTemplate = (templateKey) => {
    const template = templates[templateKey];
    setWorkoutName(template.name);
    setExercises(template.exercises);
    setShowTemplateModal(false);
  };

  const handleSave = () => {
    if (!workoutName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę treningu');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Błąd', 'Dodaj przynajmniej jedno ćwiczenie');
      return;
    }

    // Tutaj logika zapisu do bazy/state
    console.log('Saving workout:', { name: workoutName, exercises });
    Alert.alert('Sukces', 'Trening został zapisany', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edytuj Trening' : 'Nowy Trening'}
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Zapisz</Text>
        </TouchableOpacity>
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

            <TouchableOpacity
              style={styles.templateOption}
              onPress={() => loadTemplate('push')}
            >
              <Text style={styles.templateOptionIcon}>💪</Text>
              <View style={styles.templateOptionInfo}>
                <Text style={styles.templateOptionTitle}>Push</Text>
                <Text style={styles.templateOptionDesc}>
                  Klatka, ramiona, triceps
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.templateOption}
              onPress={() => loadTemplate('pull')}
            >
              <Text style={styles.templateOptionIcon}>🏋️</Text>
              <View style={styles.templateOptionInfo}>
                <Text style={styles.templateOptionTitle}>Pull</Text>
                <Text style={styles.templateOptionDesc}>
                  Plecy, biceps, martwy ciąg
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.templateOption}
              onPress={() => loadTemplate('legs')}
            >
              <Text style={styles.templateOptionIcon}>🦵</Text>
              <View style={styles.templateOptionInfo}>
                <Text style={styles.templateOptionTitle}>Legs</Text>
                <Text style={styles.templateOptionDesc}>
                  Nogi, pośladki, łydki
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.templateOption}
              onPress={() => loadTemplate('fbw')}
            >
              <Text style={styles.templateOptionIcon}>🔥</Text>
              <View style={styles.templateOptionInfo}>
                <Text style={styles.templateOptionTitle}>FBW</Text>
                <Text style={styles.templateOptionDesc}>
                  Full Body Workout
                </Text>
              </View>
            </TouchableOpacity>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
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