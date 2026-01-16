import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

const HomeScreen = ({ navigation }) => {
  // Przykładowe dane - później można podpiąć API/state
  const monthlyStats = {
    workouts: 12,
    duration: '8h 45m',
    totalWeight: 24500,
    sets: 156,
  };

  const lastWorkout = {
    id: 1,
    name: 'Push A',
    date: '2024-01-12',
    time: '14:30',
    duration: '52 min',
    exercises: [
      {
        id: 1,
        name: 'Bench Press',
        numSets: 4,
        sets: [
          { id: 1, weight: '80', reps: '10' },
          { id: 2, weight: '80', reps: '9' },
          { id: 3, weight: '80', reps: '8' },
          { id: 4, weight: '75', reps: '10' },
        ]
      },
      {
        id: 2,
        name: 'Incline DB Press',
        numSets: 3,
        sets: [
          { id: 1, weight: '32', reps: '10' },
          { id: 2, weight: '32', reps: '9' },
          { id: 3, weight: '30', reps: '10' },
        ]
      },
      {
        id: 3,
        name: 'Cable Flyes',
        numSets: 3,
        sets: [
          { id: 1, weight: '15', reps: '12' },
          { id: 2, weight: '15', reps: '12' },
          { id: 3, weight: '15', reps: '10' },
        ]
      },
    ],
  };

  const aiInsight = {
    message: 'Zwiększamy objętość pleców, bo ostatnie 3 treningi były wykonane bez spadku wydajności',
    type: 'progress', // progress, warning, suggestion
  };

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
            <Text style={styles.date}>Poniedziałek, 12 Stycznia</Text>
          </View>
        </View>

        {/* AI Insight */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightTitle}>Insight</Text>
          </View>
          <Text style={styles.insightMessage}>{aiInsight.message}</Text>
        </View>

        {/* Monthly Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MIESIĘCZNE PODSUMOWANIE</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.workouts}</Text>
              <Text style={styles.statLabel}>Treningów</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.duration}</Text>
              <Text style={styles.statLabel}>Czas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {(monthlyStats.totalWeight / 1000).toFixed(1)}t
              </Text>
              <Text style={styles.statLabel}>Podniesione</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.sets}</Text>
              <Text style={styles.statLabel}>Setów</Text>
            </View>
          </View>
        </View>

        {/* Last Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OSTATNI TRENING</Text>
          <View style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View>
                <Text style={styles.workoutName}>{lastWorkout.name}</Text>
                <Text style={styles.workoutDate}>{lastWorkout.date}</Text>
              </View>
              <View style={styles.workoutDuration}>
                <Text style={styles.durationText}>{lastWorkout.duration}</Text>
              </View>
            </View>

            <View style={styles.exercisesList}>
              {lastWorkout.exercises.map((exercise, index) => {
                // Oblicz średnią wagę i reps z setów
                const avgWeight = exercise.sets.reduce((sum, set) => sum + parseFloat(set.weight || 0), 0) / exercise.sets.length;
                const avgReps = exercise.sets.reduce((sum, set) => sum + parseFloat(set.reps || 0), 0) / exercise.sets.length;

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
            </View>

            <TouchableOpacity style={styles.viewDetailsButton} onPress={() => navigation.navigate('WorkoutDetails', { workout: lastWorkout })}>
              <Text style={styles.viewDetailsText}>Zobacz szczegóły</Text>
            </TouchableOpacity>
          </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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