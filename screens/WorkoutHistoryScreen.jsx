import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const WorkoutHistoryScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, push, pull, legs
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const data = await api.getWorkouts();
      if (data) {
        setWorkouts(data);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać historii treningów');
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { key: 'all', label: 'Wszystkie' },
    { key: 'push', label: 'Push' },
    { key: 'pull', label: 'Pull' },
    { key: 'legs', label: 'Legs' },
  ];

  useFocusEffect(
    React.useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const filteredWorkouts =
    selectedFilter === 'all'
      ? workouts
      : workouts.filter((w) => w.type === selectedFilter);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Dzisiaj';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Wczoraj';
    } else {
      const day = date.getDate();
      const months = [
        'Sty',
        'Lut',
        'Mar',
        'Kwi',
        'Maj',
        'Cze',
        'Lip',
        'Sie',
        'Wrz',
        'Paź',
        'Lis',
        'Gru',
      ];
      return `${day} ${months[date.getMonth()]}`;
    }
  };

  const handleDeleteWorkout = (workoutId, workoutName) => {
    Alert.alert(
      'Usuń trening',
      `Czy na pewno chcesz usunąć trening "${workoutName}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteWorkout(workoutId);
              fetchWorkouts();
            } catch (err) {
              console.error(err);
              Alert.alert('Błąd', 'Nie udało się usunąć treningu');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (workout) => {
    navigation.navigate('WorkoutDetails', { workout });
  };

  const handleEditWorkout = (workout) => {
    navigation.navigate('WorkoutEditor', { workout });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historia Treningów</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('WorkoutEditor')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Workouts List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredWorkouts.map((workout, index) => (
          <View key={workout._id ? String(workout._id) : (workout.id ? String(workout.id) : String(index))} style={styles.workoutCard}>
            <TouchableOpacity
              style={styles.workoutCardContent}
              activeOpacity={0.7}
              onPress={() => handleViewDetails(workout)}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.workoutMainInfo}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <View style={styles.workoutMeta}>
                    <Text style={styles.workoutDate}>
                      {workout.date ? formatDate(workout.date) : ''}
                    </Text>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.workoutTime}>{workout.time || '-'}</Text>
                  </View>
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{workout.duration || '-'}</Text>
                </View>
              </View>

              <View style={styles.workoutStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{workout.exercises ? workout.exercises.length : 0}</Text>
                  <Text style={styles.statLabel}>Ćwiczeń</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {workout.exercises ? workout.exercises.reduce((sum, ex) => sum + (ex.numSets || 0), 0) : 0}
                  </Text>
                  <Text style={styles.statLabel}>Setów</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {workout.exercises ? (workout.exercises.reduce((sum, ex) => {
                      const exerciseVolume = ex.sets ? ex.sets.reduce((vol, set) => {
                        return vol + (parseFloat(set.weight || 0) * parseFloat(set.reps || 0));
                      }, 0) : 0;
                      return sum + exerciseVolume;
                    }, 0) / 1000).toFixed(1) : '0.0'}t
                  </Text>
                  <Text style={styles.statLabel}>Objętość</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.workoutActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditWorkout(workout)}
              >
                <Text style={styles.actionButtonText}>Edytuj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteWorkout(workout._id || workout.id, workout.name)}
              >
                <Text style={[styles.actionButtonText, styles.deleteText]}>
                  Usuń
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredWorkouts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateText}>Brak treningów</Text>
            <Text style={styles.emptyStateSubtext}>
              Zmień filtr lub dodaj nowy trening
            </Text>
          </View>
        )}
      </ScrollView>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 32,
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  workoutCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  workoutCardContent: {
    padding: 18,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  workoutMainInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDate: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  metaDivider: {
    fontSize: 14,
    color: '#334155',
    marginHorizontal: 8,
  },
  workoutTime: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  durationBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
  },
  workoutActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  deleteButton: {
    borderRightWidth: 0,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  deleteText: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

export default WorkoutHistoryScreen;