import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const TEMP_USER_ID = '65a000000000000000000001';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState({
    totalWorkouts: 0,
    avgWorkoutDuration: 0,
    totalVolume: 0,
    totalSets: 0
  });
  const [lastWorkout, setLastWorkout] = useState(null);
  const [insight, setInsight] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Monthly Stats
      // 1. Fetch Monthly Stats
      const stats = await api.getStats();
      if (stats && stats.current) {
        setMonthlyStats(stats.current);
      } else if (stats) {
        setMonthlyStats(stats);
      }

      // 2. Fetch Last Workout
      const workouts = await api.getWorkouts();
      if (workouts && workouts.length > 0) {
        setLastWorkout(workouts[0]); // Sorted by date desc in backend
      } else {
        setLastWorkout(null);
      }

      // 3. Fetch Insight
      const insightData = await api.getInsight();
      if (insightData) {
        setInsight({
          message: insightData.reason || `Sugerowany trening: ${insightData.type}`,
          type: 'suggestion'
        });
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  };

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Witaj!</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
        </View>

        {/* AI Insight */}
        {insight && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>💡</Text>
              <Text style={styles.insightTitle}>Insight</Text>
            </View>
            <Text style={styles.insightMessage}>{insight.message}</Text>
          </View>
        )}

        {/* Monthly Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MIESIĘCZNE PODSUMOWANIE</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.totalWorkouts || 0}</Text>
              <Text style={styles.statLabel}>Treningów</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.avgWorkoutDuration || 0}m</Text>
              <Text style={styles.statLabel}>Śr. Czas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {((monthlyStats.totalVolume || 0) / 1000).toFixed(1)}t
              </Text>
              <Text style={styles.statLabel}>Podniesione</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.totalSets || 0}</Text>
              <Text style={styles.statLabel}>Setów</Text>
            </View>
          </View>
        </View>

        {/* Last Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OSTATNI TRENING</Text>
          {lastWorkout ? (
            <View style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.workoutName}>{lastWorkout.name}</Text>
                  <Text style={styles.workoutDate}>
                    {new Date(lastWorkout.date).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                    ,{' '}
                    {lastWorkout.time || new Date(lastWorkout.date).toLocaleTimeString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.workoutDuration}>
                  <Text style={styles.durationText}>{lastWorkout.duration || '-'}</Text>
                </View>
              </View>

              <View style={styles.exercisesList}>
                {(lastWorkout.exercises || []).slice(0, 3).map((exercise, index) => {
                  // Calculate avg stats
                  const validSets = exercise.sets.filter(s => s.weight && s.reps);
                  const avgWeight = validSets.length > 0
                    ? validSets.reduce((sum, set) => sum + parseFloat(set.weight || 0), 0) / validSets.length
                    : 0;
                  const avgReps = validSets.length > 0
                    ? validSets.reduce((sum, set) => sum + parseFloat(set.reps || 0), 0) / validSets.length
                    : 0;

                  return (
                    <View key={index} style={styles.exerciseItem}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseSets}>{exercise.numSets} serie</Text>
                      </View>
                      <Text style={styles.exerciseWeight}>
                        ~{avgWeight.toFixed(0)}kg × {avgReps.toFixed(0)}
                      </Text>
                    </View>
                  );
                })}
                {lastWorkout.exercises.length > 3 && (
                  <Text style={{ color: '#94A3B8', marginTop: 5, fontSize: 12 }}>+ {lastWorkout.exercises.length - 3} więcej...</Text>
                )}
              </View>

              {/* Since we don't have WorkoutDetails screen code in context, I'll assume it exists or disable the button action if not needed yet. 
                    The plan didn't explicitily mention creating details screen, but user workflow might rely on it.
                    I'll keep the navigation call. */}
              <TouchableOpacity style={styles.viewDetailsButton} onPress={() => navigation.navigate('WorkoutDetails', { workout: lastWorkout })}>
                <Text style={styles.viewDetailsText}>Zobacz szczegóły</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.workoutCard, { alignItems: 'center', padding: 30 }]}>
              <Text style={{ color: '#94A3B8' }}>Brak historii treningów</Text>
            </View>
          )}
        </View>

        {/* Start Workout Button */}
        <TouchableOpacity
          style={styles.startWorkoutButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('WorkoutEditor')}
        >
          <Text style={styles.startWorkoutText}>ROZPOCZNIJ TRENING</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView >
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  insightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  insightMessage: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 22,
    fontWeight: '500',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '47%',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  workoutCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  workoutDuration: {
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
  exercisesList: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseSets: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  exerciseWeight: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '700',
  },
  viewDetailsButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '700',
  },
  startWorkoutButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startWorkoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

export default HomeScreen;