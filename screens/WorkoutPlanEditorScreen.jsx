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
  ActivityIndicator,
  FlatList,
} from 'react-native';



import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { MUSCLE_GROUPS } from '../constants/MuscleAnatomy';

const TEMP_USER_ID = '65a000000000000000000001';

const WorkoutPlanEditorScreen = ({ navigation, route }) => {
  const isEditing = route?.params?.plan !== undefined;
  // Handle suggestion passing type or full plan
  const existingPlan = route?.params?.plan;
  const suggestedType = route?.params?.type; // validation: from insights

  const [planName, setPlanName] = useState(existingPlan?.name || (suggestedType ? `${suggestedType} Plan` : ''));
  const [planDescription, setPlanDescription] = useState(
    existingPlan?.description || ''
  );
  const [exercises, setExercises] = useState(existingPlan?.exercises || []); // Aligned to backend schema
  // Backend schema: exercises: [{name, numSets, sets: [{weight, reps}] }]
  // Let's assume we align to backend schema now.

  const [availableExercises, setAvailableExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseFilter, setExerciseFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  // Exercise Creation
  const [exerciseModalTab, setExerciseModalTab] = useState('list'); // 'list' or 'create'
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('Chest');
  const [selectedSubMuscles, setSelectedSubMuscles] = useState([]);
  const [selectedSecondaryMuscles, setSelectedSecondaryMuscles] = useState({}); // { groupName: [subMuscleIds] }
  const [expandedSecondaryGroups, setExpandedSecondaryGroups] = useState([]);
  const [creatingExercise, setCreatingExercise] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);

      let data = await api.getExercises();

      // Auto-seed if empty (optional safety)
      if (data && data.length === 0) {
        await api.seedExercises();
        data = await api.getExercises();
      }

      if (data) {
        setAvailableExercises(data);
      }
    } catch (err) {
      console.log('Error fetching exercises', err);
      // Fallback or alert
    } finally {
      setLoadingExercises(false);
    }
  }

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

    // Validate primary sub-muscles (required, except for Full Body)
    if (newExerciseMuscle !== 'Full Body' && selectedSubMuscles.length === 0) {
      Alert.alert('Błąd', 'Zaznacz przynajmniej jedną część mięśnia');
      return;
    }

    try {
      setCreatingExercise(true);

      // Construct muscleEngagement
      const engagement = {};
      if (selectedSubMuscles.length > 0) {
        selectedSubMuscles.forEach(sub => {
          engagement[sub] = 100;
        });
      }

      // Build secondaryMuscles with sub-muscle details
      const secondaryMusclesPayload = Object.entries(selectedSecondaryMuscles).map(([group, subIds]) => ({
        group,
        subMuscles: subIds
      }));

      const payload = {
        name: newExerciseName,
        muscleGroup: newExerciseMuscle,
        secondaryMuscles: secondaryMusclesPayload,
        muscleEngagement: engagement,
        equipment: 'Other',
        type: 'Isolation'
      };

      const created = await api.createExercise(payload);
      if (created) {
        setAvailableExercises([...availableExercises, created]);
        addExerciseFromBase(created);
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
              // Remove from list
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

  const handleRepair = async () => {
    try {
      setLoadingExercises(true);
      await api.repairExercises();
      // Refresh
      fetchExercises();
      Alert.alert('Sukces', 'Baza ćwiczeń została naprawiona');
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nie udało się naprawić bazy');
    } finally {
      setLoadingExercises(false);
    }
  };

  const addExerciseFromBase = async (exerciseDef) => {

    const timestamp = Date.now();
    // Default sets
    let initialSets = [
      { id: `${timestamp}_0`, weight: '', reps: '' },
      { id: `${timestamp}_1`, weight: '', reps: '' }
    ];
    let initialNumSets = 2; // Default for plans? or 3

    try {
      const history = await api.getLastExerciseLog(exerciseDef.name);
      if (history && history.sets && history.sets.length > 0) {
        initialSets = history.sets.map((s, idx) => ({
          id: `${timestamp}_hist_${idx}`,
          weight: s.weight || '',
          reps: s.reps || ''
        }));
        initialNumSets = history.sets.length;
      }
    } catch (e) {
      console.log('Failed to fetch history', e);
    }

    const newExercise = {
      // If we are using MongoDB embedded docs, id might be _id, but for frontend list key we use timestamp or random
      localId: `${timestamp}_ex`, // Used for rendering key
      name: exerciseDef.name,
      muscleGroup: exerciseDef.muscleGroup,
      numSets: initialNumSets,
      sets: initialSets,
      isCustom: exerciseDef.isCustom
    };

    setExercises([...exercises, newExercise]);
    setShowExerciseModal(false);
  };



  const removeExercise = (indexToRemove) => {
    setExercises(exercises.filter((_, index) => index !== indexToRemove));
  };

  const updateExerciseName = (index, name) => {
    // Just for manual override if needed
    const updated = [...exercises];
    updated[index].name = name;
    setExercises(updated);
  };

  const updateNumSets = (index, numSetsStr) => {
    const num = parseInt(numSetsStr) || 0;
    if (num < 1 || num > 10) return;

    const updated = [...exercises];
    const currentSets = updated[index].sets;
    const newSets = [];
    for (let i = 0; i < num; i++) {
      // preserve existing values if increasing count
      if (i < currentSets.length) {
        newSets.push(currentSets[i]);
      } else {
        newSets.push({ id: i + 1, weight: '', reps: '' });
      }
    }
    updated[index].numSets = num;
    updated[index].sets = newSets;
    setExercises(updated);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  const handleSave = async () => {
    if (!planName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę planu');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Błąd', 'Dodaj przynajmniej jedno ćwiczenie');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: planName,
        description: planDescription,
        exercises: exercises.map(ex => ({
          name: ex.name,
          numSets: ex.numSets,
          sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps }))
        })),
        type: 'Szablon', // User-created plans are templates
      };

      let response;

      if (isEditing) {
        response = await api.updateWorkoutPlan(existingPlan._id, payload);
      } else {
        // api.createWorkoutPlan returns the data directly if successful, or throws
        response = await api.createWorkoutPlan(payload);
      }

      // If we reach here, it means success (since api.js throws on error)
      Alert.alert('Sukces', 'Plan został zapisany', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert('Błąd', 'Wystąpił problem z połączeniem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edytuj Plan' : 'Nowy Plan'}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Zapisz</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.label}>NAZWA PLANU</Text>
          <TextInput
            style={styles.input}
            placeholder="np. Push, Pull, Legs"
            placeholderTextColor="#6B7280"
            value={planName}
            onChangeText={setPlanName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>OPIS</Text>
          <TextInput
            style={styles.input}
            placeholder="np. Klatka, ramiona, triceps"
            placeholderTextColor="#6B7280"
            value={planDescription}
            onChangeText={setPlanDescription}
            autoCapitalize="sentences"
          />
        </View>

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
            <View key={exercise.localId || index} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExercise(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.exerciseInput}
                placeholder="Nazwa ćwiczenia"
                placeholderTextColor="#6B7280"
                value={exercise.name}
                onChangeText={(value) => updateExerciseName(index, value)}
                editable={true}
              />

              <View style={styles.numSetsContainer}>
                <Text style={styles.numSetsLabel}>Liczba serii:</Text>
                <TextInput
                  style={styles.numSetsInput}
                  placeholder="3"
                  placeholderTextColor="#6B7280"
                  defaultValue={exercise.numSets.toString()}
                  onEndEditing={(e) => updateNumSets(index, e.nativeEvent.text)}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <Text style={styles.setNumber}>{setIndex + 1}</Text>
                    <View style={styles.setInputs}>
                      <View style={styles.setInputGroup}>
                        <TextInput
                          style={styles.setInput}
                          placeholder="kg"
                          placeholderTextColor="#6B7280"
                          value={set.weight}
                          onChangeText={(value) =>
                            updateSet(index, setIndex, 'weight', value)
                          }
                          keyboardType="numeric"
                        />
                        <Text style={styles.setInputUnit}>kg</Text>
                      </View>
                      <Text style={styles.setInputDivider}>×</Text>
                      <View style={styles.setInputGroup}>
                        <TextInput
                          style={styles.setInput}
                          placeholder="reps"
                          placeholderTextColor="#6B7280"
                          value={set.reps}
                          onChangeText={(value) =>
                            updateSet(index, setIndex, 'reps', value)
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
                Dodaj ćwiczenie z bazy danych lub własne
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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
                  data={availableExercises.filter(ex => exerciseFilter === 'all' || ex.muscleGroup === exerciseFilter)}
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

              {/* Repair Button (Temporary/Utility) */}
              {exerciseModalTab === 'list' && (
                <TouchableOpacity
                  style={{ alignItems: 'center', padding: 15 }}
                  onPress={handleRepair}
                >
                  <Text style={{ color: '#64748B', fontSize: 12 }}>Brak ćwiczeń? Napraw bazę</Text>
                </TouchableOpacity>
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
                      setSelectedSubMuscles([]);
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

    </SafeAreaView >
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
    minWidth: 80,
    alignItems: 'center'
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF'
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

export default WorkoutPlanEditorScreen;