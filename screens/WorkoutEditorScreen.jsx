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
  FlatList,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { MUSCLE_GROUPS } from '../constants/MuscleAnatomy';

const WorkoutEditorScreen = ({ navigation, route }) => {
  const isEditing = route?.params?.workout !== undefined;
  const existingWorkout = route?.params?.workout;
  const templatePlan = route?.params?.templatePlan; // Plan to start workout from

  const [workoutName, setWorkoutName] = useState(() => {
    if (existingWorkout?.name) return existingWorkout.name;
    if (templatePlan?.name) return templatePlan.name;
    return '';
  });

  const [exercises, setExercises] = useState(() => {
    // Przy edycji: załaduj istniejące ćwiczenia
    if (existingWorkout?.exercises) {
      return existingWorkout.exercises.map((ex, idx) => ({
        ...ex,
        id: ex.id || (Date.now() + idx),
        sets: ex.sets ? ex.sets.map((s, sIdx) => ({
          ...s,
          id: s.id || (sIdx + 1)
        })) : []
      }));
    }
    // Przy starcie z szablonu: useEffect pociągnie ćwiczenia i historię
    // Pusta tablica na start - czekamy na załadowanie danych
    return [];
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(() => {
    if (existingWorkout?.duration) {
      // Parsuj format MM:SS
      const parts = existingWorkout.duration.split(':');
      if (parts.length === 2) {
        return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
      }
    }
    return 0;
  }); // w sekundach
  const [timerRunning, setTimerRunning] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [availableExercises, setAvailableExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseFilter, setExerciseFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Ręczna edycja czasu
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualSeconds, setManualSeconds] = useState('');

  // Tworzenie nowego ćwiczenia
  const [exerciseModalTab, setExerciseModalTab] = useState('list'); // 'list' or 'create'
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('Chest');
  const [selectedSubMuscles, setSelectedSubMuscles] = useState([]);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState({}); // { nazwaGrupy: [idPodmiesni] }
  const [expandedSecondaryGroups, setExpandedSecondaryGroups] = useState([]);
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [isBodyweight, setIsBodyweight] = useState(false);

  // Flaga: czy załadowano już ćwiczenia z szablonu
  const templateLoadedRef = React.useRef(false);

  // Licznik czasu
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

  // Formatowanie czasu (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start licznika (wznów od obecnego czasu)
  const startTimer = () => {
    setStartTime(Date.now() - (elapsedTime * 1000)); // Adjust start time based on elapsed
    setTimerRunning(true);
  };

  // Zatrzymaj licznik (pauza)
  const stopTimer = () => {
    setTimerRunning(false);
  };

  // Pobierz szablony z bazy
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
    fetchExercises();
  }, []);

  // Załaduj historię dla ćwiczeń z szablonu (autouzupełnianie ciężarów)
  useEffect(() => {
    if (!templatePlan?.exercises || templateLoadedRef.current) return;

    const loadTemplateWithHistory = async () => {
      const exercisesWithHistory = await Promise.all(
        templatePlan.exercises.map(async (ex, idx) => {
          const timestamp = Date.now() + idx;
          let initialSets = Array(ex.numSets || 3).fill(null).map((_, i) => ({
            id: `${timestamp}_${i}`,
            weight: '',
            reps: ''
          }));
          let initialNumSets = ex.numSets || 3;

          // Próba pobrania historii dla danego ćwiczenia
          try {
            const history = await api.getLastExerciseLog(ex.name);
            if (history && history.sets && history.sets.length > 0) {
              initialSets = history.sets.map((s, index) => ({
                id: `${timestamp}_hist_${index}`,
                weight: s.weight || '',
                reps: s.reps || '',
              }));
              initialNumSets = history.sets.length;
            }
          } catch (e) {
            console.log('Failed to load history for', ex.name, e);
          }

          return {
            id: timestamp,
            name: ex.name,
            numSets: initialNumSets,
            sets: initialSets
          };
        })
      );

      setExercises(exercisesWithHistory);
      templateLoadedRef.current = true;
    };

    loadTemplateWithHistory();
  }, [templatePlan]);

  const handleManualTimeUpdate = () => {
    const mins = parseInt(manualMinutes) || 0;
    const secs = parseInt(manualSeconds) || 0;
    const totalSeconds = (mins * 60) + secs;

    setElapsedTime(totalSeconds);
    if (timerRunning) {
      setStartTime(Date.now() - (totalSeconds * 1000));
    }
    setShowTimeModal(false);
    setManualMinutes('');
    setManualSeconds('');
  };

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      const data = await api.getExercises();
      if (data) {
        setAvailableExercises(data);
      }
    } catch (err) {
      console.log('Error fetching exercises', err);
    } finally {
      setLoadingExercises(false);
    }
  };

  // Wczytaj wybrany szablon
  const loadTemplate = async (template) => {
    setWorkoutName(template.name);

    // Załaduj ćwiczenia, próbując od razu podpiąć historię
    const exercisesWithHistory = await Promise.all(
      template.exercises.map(async (ex, idx) => {
        const timestamp = Date.now() + idx;
        let initialSets = Array.from({ length: ex.numSets || 3 }, (_, i) => ({
          id: `${timestamp}_${i}`,
          weight: '',
          reps: ''
        }));
        let initialNumSets = ex.numSets || 3;

        // Próba pobrania historii
        try {
          const history = await api.getLastExerciseLog(ex.name);
          if (history && history.sets && history.sets.length > 0) {
            initialSets = history.sets.map((s, index) => ({
              id: `${timestamp}_hist_${index}`,
              weight: s.weight || '',
              reps: s.reps || '',
            }));
            initialNumSets = history.sets.length;
          }
        } catch (e) {
          console.log('Failed to load history for', ex.name, e);
        }

        return {
          id: timestamp,
          name: ex.name,
          numSets: initialNumSets,
          sets: initialSets
        };
      })
    );

    setExercises(exercisesWithHistory);
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
    setExercises([...exercises, newExercise]);
  };



  const openCreateModal = () => {
    setExerciseModalTab('create');
    setNewExerciseName('');
    setNewExerciseMuscle('Chest');
    setSelectedSubMuscles([]);
    setSelectedSecondaryMuscles({});
    setExpandedSecondaryGroups([]);
    setShowExerciseModal(true);
  };

  const toggleSubMuscle = (subId) => {
    if (selectedSubMuscles.includes(subId)) {
      setSelectedSubMuscles(selectedSubMuscles.filter(id => id !== subId));
    } else {
      setSelectedSubMuscles([...selectedSubMuscles, subId]);
    }
  };

  const toggleSecondaryGroup = (group) => {
    if (expandedSecondaryGroups.includes(group)) {
      setExpandedSecondaryGroups(expandedSecondaryGroups.filter(g => g !== group));
    } else {
      setExpandedSecondaryGroups([...expandedSecondaryGroups, group]);
    }
  };

  const toggleSecondarySubMuscle = (group, subMuscleId) => {
    const currentSubs = selectedSecondaryMuscles[group] || [];
    if (currentSubs.includes(subMuscleId)) {
      const updated = currentSubs.filter(id => id !== subMuscleId);
      if (updated.length === 0) {
        const { [group]: _, ...rest } = selectedSecondaryMuscles;
        setSelectedSecondaryMuscles(rest);
      } else {
        setSelectedSecondaryMuscles({ ...selectedSecondaryMuscles, [group]: updated });
      }
    } else {
      setSelectedSecondaryMuscles({
        ...selectedSecondaryMuscles,
        [group]: [...currentSubs, subMuscleId]
      });
    }
  };

  const handleCreateExercise = async () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę ćwiczenia');
      return;
    }

    // Sprawdź czy wybrano główne partie mięśniowe (wymagane, chyba że FBW)
    if (newExerciseMuscle !== 'Full Body' && selectedSubMuscles.length === 0) {
      Alert.alert('Błąd', 'Zaznacz przynajmniej jedną część mięśnia');
      return;
    }

    try {
      setCreatingExercise(true);

      // Przygotuj obiekt zaangażowania mięśni
      const engagement = {};
      if (selectedSubMuscles.length > 0) {
        // Uproszczenie: 100% zaangażowania dla zaznaczonych partii
        selectedSubMuscles.forEach(sub => {
          engagement[sub] = 100;
        });
      }

      // Zbuduj strukturę mięśni pomocniczych
      const secondaryMusclesPayload = Object.entries(selectedSecondaryMuscles).map(([group, subIds]) => ({
        group,
        subMuscles: subIds
      }));

      const payload = {
        name: newExerciseName,
        muscleGroup: newExerciseMuscle,
        secondaryMuscles: secondaryMusclesPayload,
        muscleEngagement: engagement,
        equipment: isBodyweight ? 'Bodyweight' : 'Other',
        type: 'Isolation'
      };

      const created = await api.createExercise(payload);
      if (created) {
        setAvailableExercises([...availableExercises, created]);
        // await addExerciseFromBase(created); // Czekaj jeśli asynchroniczne
        // Prościej dodać ręcznie, bo i tak nie ma historii
        const newEx = {
          localId: Date.now().toString(),
          name: created.name,
          muscleGroup: created.muscleGroup,
          numSets: 3,
          sets: [
            { id: Date.now().toString(), weight: '', reps: '' },
            { id: (Date.now() + 1).toString(), weight: '', reps: '' },
            { id: (Date.now() + 2).toString(), weight: '', reps: '' },
          ],
          isCustom: true
        };
        setExercises(prev => [...prev, newEx]);

        // Reset form
        setNewExerciseName('');
        setNewExerciseMuscle('Chest');
        setSelectedSubMuscles([]);
        setSelectedSecondaryMuscles({});
        setExpandedSecondaryGroups([]);
        setExerciseModalTab('list');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nie udało się utworzyć ćwiczenia');
    } finally {
      setCreatingExercise(false);
    }
  };

  const handleDeleteExercise = async (id, name) => {
    Alert.alert(
      'Usuń ćwiczenie',
      `Czy na pewno chcesz usunąć ćwiczenie "${name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteExercise(id);
              // Usuń z listy lokalnej
              setAvailableExercises(prev => prev.filter(e => e._id !== id));
            } catch (err) {
              console.error(err);
              Alert.alert('Błąd', 'Nie udało się usunąć ćwiczenia');
            }
          }
        }
      ]
    );
  };

  const addExerciseFromBase = async (exerciseDef) => {
    // Sprawdź historię dla tego ćwiczenia
    const timestamp = Date.now();
    let initialSets = [
      { id: `${timestamp}_0`, weight: '', reps: '' },
      { id: `${timestamp}_1`, weight: '', reps: '' },
      { id: `${timestamp}_2`, weight: '', reps: '' },
    ];
    let initialNumSets = 3;

    try {
      const history = await api.getLastExerciseLog(exerciseDef.name);
      if (history && history.sets && history.sets.length > 0) {
        // Zmapuj serie z historii na nowe obiekty
        initialSets = history.sets.map((s, index) => ({
          id: `${timestamp}_hist_${index}`,
          weight: s.weight || '',
          reps: s.reps || '',
        }));
        initialNumSets = history.sets.length;

        // Optional: Notify user
      }
    } catch (e) {
      console.log('Failed to load history', e);
    }

    const newExercise = {
      localId: `${timestamp}_ex`,
      name: exerciseDef.name,
      muscleGroup: exerciseDef.muscleGroup,
      numSets: initialNumSets,
      sets: initialSets,
      isCustom: exerciseDef.isCustom
    };

    setExercises([...exercises, newExercise]);
    setShowExerciseModal(false);
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
    // Pozwól na pusty string (czyszczenie pola)
    if (numSets === '') {
      setExercises(
        exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, numSets: '' } : ex
        )
      );
      return;
    }

    const num = parseInt(numSets) || 0;
    if (num < 0 || num > 99) return; // Limit do 99 serii

    setExercises(
      exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const newSets = [];
          for (let i = 0; i < num; i++) {
            // Zachowaj wpisane już dane, jeśli istnieją
            newSets.push(ex.sets[i] || { id: Date.now() + i, weight: '', reps: '' });
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
        date: isEditing ? existingWorkout.date : new Date().toISOString().split('T')[0],
        time: isEditing ? existingWorkout.time : new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        duration: formatTime(elapsedTime),
        exercises: exercises.map(ex => ({
          name: ex.name,
          numSets: parseInt(ex.numSets) || ex.sets.length,
          sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps }))
        }))
      };

      if (isEditing) {
        await api.updateWorkout(existingWorkout._id, workoutData);
      } else {
        await api.createWorkout(workoutData);
      }
      stopTimer(); // Zatrzymaj licznik przy zapisie
      navigation.goBack();
    } catch (e) {
      console.error('Workout save error:', e);
      Alert.alert('Błąd', 'Nie udało się zapisać treningu');
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
          <TouchableOpacity onPress={() => setShowTimeModal(true)}>
            <Text style={styles.timerText}>
              {formatTime(elapsedTime)}
            </Text>
          </TouchableOpacity>

          {!isEditing && (
            !timerRunning ? (
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
            )
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
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => setShowExerciseModal(true)}
              >
                <Text style={styles.addExerciseText}>+ Z Bazy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={openCreateModal}
              >
                <Text style={styles.addExerciseText}>+ Własne</Text>
              </TouchableOpacity>
            </View>
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

      {/* Exercise Picker Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Wybierz ćwiczenie</Text>
            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
              <Text style={styles.closeModalText}>Zamknij</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.modalTabs}>
            <TouchableOpacity
              style={[styles.modalTab, exerciseModalTab === 'list' && styles.modalTabActive]}
              onPress={() => setExerciseModalTab('list')}
            >
              <Text style={[styles.modalTabText, exerciseModalTab === 'list' && styles.modalTabTextActive]}>
                Lista
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalTab, exerciseModalTab === 'create' && styles.modalTabActive]}
              onPress={() => setExerciseModalTab('create')}
            >
              <Text style={[styles.modalTabText, exerciseModalTab === 'create' && styles.modalTabTextActive]}>
                Stwórz nowe
              </Text>
            </TouchableOpacity>
          </View>

          {exerciseModalTab === 'list' ? (
            <>
              {/* Search Bar */}
              <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                <TextInput
                  style={{
                    backgroundColor: '#0F172A',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: '#334155',
                  }}
                  placeholder="Szukaj ćwiczenia..."
                  placeholderTextColor="#6B7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Muscle Group Filters */}
              <View style={{ marginBottom: 10 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
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
              </View>

              {loadingExercises ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
              ) : (
                <FlatList
                  data={availableExercises.filter(ex =>
                    (exerciseFilter === 'all' || ex.muscleGroup === exerciseFilter) &&
                    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={{ padding: 20 }}
                  renderItem={({ item }) => (
                    <View style={styles.exerciseOptionRow}>
                      <TouchableOpacity
                        style={styles.exerciseOption}
                        onPress={() => addExerciseFromBase(item)}
                      >
                        <View>
                          <Text style={styles.exerciseOptionName}>{item.name}</Text>
                          <Text style={styles.exerciseOptionDetail}>{item.muscleGroup} • {item.equipment}</Text>
                        </View>
                        <Text style={styles.addIcon}>+</Text>
                      </TouchableOpacity>

                      {/* Delete button for custom exercises */}
                      {item.isCustom && (
                        <TouchableOpacity
                          style={styles.deleteExerciseButton}
                          onPress={() => handleDeleteExercise(item._id, item.name)}
                        >
                          <Text style={styles.deleteExerciseIcon}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                />
              )}
            </>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.label}>NAZWA ĆWICZENIA</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Wyciskanie hantli"
                placeholderTextColor="#6B7280"
                value={newExerciseName}
                onChangeText={setNewExerciseName}
              />

              {/* Bodyweight Checkbox */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 16,
                  backgroundColor: '#1E293B',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isBodyweight ? '#3B82F6' : '#334155'
                }}
                onPress={() => setIsBodyweight(!isBodyweight)}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: isBodyweight ? '#3B82F6' : '#94A3B8',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  backgroundColor: isBodyweight ? '#3B82F6' : 'transparent'
                }}>
                  {isBodyweight && <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                </View>
                <View>
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>Ćwiczenie Bodyweight</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Automatycznie dodaje wagę ciała</Text>
                </View>
              </TouchableOpacity>

              <Text style={[styles.label, { marginTop: 20 }]}>PARTIA MIĘŚNIOWA</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {Object.keys(MUSCLE_GROUPS).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterChip,
                      newExerciseMuscle === key && styles.filterChipActive
                    ]}
                    onPress={() => {
                      setNewExerciseMuscle(key);
                      setSelectedSubMuscles([]); // Reset sub-muscles on change
                    }}
                  >
                    <Text style={[
                      styles.filterChipText,
                      newExerciseMuscle === key && styles.filterChipTextActive
                    ]}>
                      {MUSCLE_GROUPS[key].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sub-Muscles Section */}
              {MUSCLE_GROUPS[newExerciseMuscle]?.subMuscles?.length > 0 && (
                <>
                  <Text style={[styles.label, { marginTop: 20 }]}>ANGAŻOWANE CZĘŚCI (WYMAGANE)</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {MUSCLE_GROUPS[newExerciseMuscle].subMuscles.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={[
                          styles.filterChip,
                          { backgroundColor: '#0F172A', borderColor: '#475569' },
                          selectedSubMuscles.includes(sub.id) && { backgroundColor: '#2ca4bf', borderColor: '#2ca4bf' }
                        ]}
                        onPress={() => toggleSubMuscle(sub.id)}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedSubMuscles.includes(sub.id) && { color: '#FFF' }
                        ]}>
                          {sub.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Secondary Muscle Groups Section */}
              <Text style={[styles.label, { marginTop: 20 }]}>DODATKOWE MIĘŚNIE (OPCJONALNE)</Text>
              <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 10 }}>
                Rozwiń grupę i zaznacz konkretne części wspomagające
              </Text>
              {Object.keys(MUSCLE_GROUPS)
                .filter(key => key !== newExerciseMuscle && key !== 'Full Body') // Exclude primary and Full Body
                .map((groupKey) => {
                  const groupData = MUSCLE_GROUPS[groupKey];
                  const isExpanded = expandedSecondaryGroups.includes(groupKey);
                  const selectedCount = (selectedSecondaryMuscles[groupKey] || []).length;

                  return (
                    <View key={groupKey} style={{ marginBottom: 12 }}>
                      {/* Group Header */}
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          { backgroundColor: '#1E293B', borderColor: '#475569', width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
                          isExpanded && { borderColor: '#8B5CF6' }
                        ]}
                        onPress={() => toggleSecondaryGroup(groupKey)}
                      >
                        <Text style={[styles.filterChipText]}>
                          {groupData.label} {selectedCount > 0 && `(${selectedCount})`}
                        </Text>
                        <Text style={{ color: '#8B5CF6', fontSize: 16 }}>{isExpanded ? '▼' : '▶'}</Text>
                      </TouchableOpacity>

                      {/* Sub-muscles (if expanded) */}
                      {isExpanded && groupData.subMuscles && groupData.subMuscles.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingLeft: 10 }}>
                          {groupData.subMuscles.map((sub) => {
                            const isSelected = (selectedSecondaryMuscles[groupKey] || []).includes(sub.id);
                            return (
                              <TouchableOpacity
                                key={sub.id}
                                style={[
                                  styles.filterChip,
                                  { backgroundColor: '#0F172A', borderColor: '#475569' },
                                  isSelected && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }
                                ]}
                                onPress={() => toggleSecondarySubMuscle(groupKey, sub.id)}
                              >
                                <Text style={[
                                  styles.filterChipText,
                                  isSelected && { color: '#FFF' }
                                ]}>
                                  {sub.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}

              <TouchableOpacity
                style={[styles.saveButton, { marginTop: 40 }, creatingExercise && { opacity: 0.7 }]}
                onPress={handleCreateExercise}
                disabled={creatingExercise}
              >
                {creatingExercise ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Stwórz i Dodaj</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Manual Time Input Modal */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ustaw czas</Text>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
              <View key="minutes">
                <Text style={styles.label}>Minuty</Text>
                <TextInput
                  style={[styles.input, { width: 80, textAlign: 'center' }]}
                  placeholder="00"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={manualMinutes}
                  onChangeText={setManualMinutes}
                />
              </View>
              <Text key="separator" style={{ fontSize: 30, color: '#FFF', alignSelf: 'center', paddingTop: 15 }}>:</Text>
              <View key="seconds">
                <Text style={styles.label}>Sekundy</Text>
                <TextInput
                  style={[styles.input, { width: 80, textAlign: 'center' }]}
                  placeholder="00"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={manualSeconds}
                  onChangeText={setManualSeconds}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleManualTimeUpdate}
            >
              <Text style={styles.saveButtonText}>Zatwierdź</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowTimeModal(false)}
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  closeModalText: {
    color: '#3B82F6',
    fontSize: 16
  },
  exerciseOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flex: 1, // Take remaining space
  },
  exerciseOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  deleteExerciseButton: {
    padding: 10,
    marginLeft: 5,
  },
  deleteExerciseIcon: {
    fontSize: 18,
  },
  exerciseOptionName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  exerciseOptionDetail: {
    color: '#94A3B8',
    fontSize: 13
  },
  modalTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  modalTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modalTabActive: {
    borderBottomColor: '#3B82F6',
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalTabTextActive: {
    color: '#3B82F6',
  },
  addIcon: {
    color: '#3B82F6',
    fontSize: 24,
    fontWeight: 'bold'
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  }
});

export default WorkoutEditorScreen;