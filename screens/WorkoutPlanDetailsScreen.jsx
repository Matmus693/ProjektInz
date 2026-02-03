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

const WorkoutPlanDetailsScreen = ({ navigation, route }) => {
  const plan = route?.params?.plan;

  const planExercises = plan?.exercises || [];

  const totalSets = planExercises.reduce((sum, ex) => sum + (ex.numSets || 0), 0);

  const handleStartWorkout = () => {
    navigation.navigate('WorkoutEditor', { templatePlan: plan });
  };

  const handleEditPlan = () => {
    navigation.navigate('WorkoutPlanEditor', { plan: plan });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Szczegóły Planu</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditPlan}
        >
          <Text style={styles.editButtonText}>Edytuj</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {}
        <View style={styles.planInfoCard}>
          <Text style={styles.planName}>{plan?.name || 'Push'}</Text>
          <Text style={styles.planDescription}>
            {plan?.description || 'Klatka, ramiona, triceps'}
          </Text>
          <View style={styles.planStats}>
            <View style={styles.planStat}>
              <Text style={styles.planStatValue}>{planExercises.length}</Text>
              <Text style={styles.planStatLabel}>Ćwiczeń</Text>
            </View>
            <View style={styles.planStat}>
              <Text style={styles.planStatValue}>{totalSets}</Text>
              <Text style={styles.planStatLabel}>Serii</Text>
            </View>
            <View style={styles.planStat}>
              <Text style={styles.planStatValue}>
                ~{Math.round(totalSets * 2.5)}
              </Text>
              <Text style={styles.planStatLabel}>Minut</Text>
            </View>
          </View>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ĆWICZENIA</Text>

          {planExercises.map((exercise, index) => (
            <View key={`${exercise.id || exercise._id || 'ex'}-${index}`} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
              </View>
            </View>
          ))}
        </View>

        {}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartWorkout}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>ROZPOCZNIJ TRENING Z TEGO PLANU</Text>
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
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  planInfoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 20,
    fontWeight: '500',
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  planStat: {
    alignItems: 'center',
  },
  planStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  planStatLabel: {
    fontSize: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
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
  startButton: {
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
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

export default WorkoutPlanDetailsScreen;