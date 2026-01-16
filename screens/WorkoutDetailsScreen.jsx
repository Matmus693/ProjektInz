import React from 'react';
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

const WorkoutDetailsScreen = ({ navigation, route }) => {
  const workout = route?.params?.workout;

  // Przykładowe dane treningu
  const workoutData = workout || {
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

  const totalSets = workoutData.exercises?.reduce((sum, ex) => sum + (ex.numSets || 0), 0) || 0;
  const totalVolume = workoutData.exercises?.reduce((sum, ex) => {
    const exerciseVolume = ex.sets?.reduce((vol, set) => {
      return vol + (parseFloat(set.weight || 0) * parseFloat(set.reps || 0));
    }, 0) || 0;
    return sum + exerciseVolume;
  }, 0) || 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
                    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleEdit = () => {
    navigation.navigate('WorkoutEditor', { workout: workoutData });
  };

  const handleDelete = () => {
    Alert.alert(
      'Usuń trening',
      'Czy na pewno chcesz usunąć ten trening?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            console.log('Deleting workout:', workoutData.id);
            navigation.goBack();
          },
        },
      ]
    );
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
        <Text style={styles.title}>Szczegóły Treningu</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
        >
          <Text style={styles.editButtonText}>Edytuj</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Info */}
        <View style={styles.workoutInfoCard}>
          <Text style={styles.workoutName}>{workoutData.name}</Text>
          <Text style={styles.workoutDate}>{formatDate(workoutData.date)}</Text>
          <Text style={styles.workoutTime}>Rozpoczęto o {workoutData.time}</Text>

          <View style={styles.workoutStats}>
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatValue}>{workoutData.duration}</Text>
              <Text style={styles.workoutStatLabel}>Czas trwania</Text>
            </View>
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatValue}>{workoutData.exercises?.length || 0}</Text>
              <Text style={styles.workoutStatLabel}>Ćwiczeń</Text>
            </View>
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatValue}>{totalSets}</Text>
              <Text style={styles.workoutStatLabel}>Serii</Text>
            </View>
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatValue}>
                {(totalVolume / 1000).toFixed(1)}t
              </Text>
              <Text style={styles.workoutStatLabel}>Objętość</Text>
            </View>
          </View>
        </View>

        {/* Exercises List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ĆWICZENIA</Text>

          {workoutData.exercises && workoutData.exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
              </View>

              <View style={styles.setsContainer}>
                {exercise.sets && exercise.sets.map((set, setIndex) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setLabel}>Seria {setIndex + 1}</Text>
                    <View style={styles.setValues}>
                      {set.weight && (
                        <Text style={styles.setValue}>
                          {set.weight} kg
                        </Text>
                      )}
                      {set.weight && set.reps && (
                        <Text style={styles.setDivider}>×</Text>
                      )}
                      {set.reps && (
                        <Text style={styles.setValue}>
                          {set.reps} rep
                        </Text>
                      )}
                      {!set.weight && !set.reps && (
                        <Text style={styles.setEmpty}>Pominięto</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Exercise summary */}
              <View style={styles.exerciseSummary}>
                <Text style={styles.exerciseSummaryText}>
                  Objętość: {exercise.sets.reduce((sum, set) =>
                    sum + (parseFloat(set.weight || 0) * parseFloat(set.reps || 0)), 0
                  ).toFixed(0)} kg
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteButtonText}>USUŃ TRENING</Text>
          </TouchableOpacity>
        </View>
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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
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
  workoutInfoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  workoutName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  workoutTime: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 20,
  },
  workoutStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  workoutStat: {
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  workoutStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  workoutStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
    letterSpacing: 0.5,
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
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    marginRight: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  setsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  setLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  setValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  setDivider: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginHorizontal: 8,
  },
  setEmpty: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  exerciseSummary: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  exerciseSummaryText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  actionButtons: {
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1,
  },
});

export default WorkoutDetailsScreen;