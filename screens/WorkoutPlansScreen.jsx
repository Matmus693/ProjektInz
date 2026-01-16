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

const WorkoutPlansScreen = ({ navigation }) => {
  // Przykładowe dane planów treningowych
  const workoutPlans = [
    {
      id: 1,
      name: 'Push',
      type: 'Szablon',
      exercises: 6,
      description: 'Klatka, ramiona, triceps',
      isActive: true,
      exercisesList: [
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
        {
          id: 4,
          name: 'Overhead Press',
          numSets: 4,
          sets: [
            { id: 1, weight: '50', reps: '8' },
            { id: 2, weight: '50', reps: '8' },
            { id: 3, weight: '50', reps: '7' },
            { id: 4, weight: '45', reps: '8' },
          ]
        },
        {
          id: 5,
          name: 'Lateral Raises',
          numSets: 3,
          sets: [
            { id: 1, weight: '12', reps: '12' },
            { id: 2, weight: '12', reps: '12' },
            { id: 3, weight: '12', reps: '10' },
          ]
        },
        {
          id: 6,
          name: 'Tricep Pushdown',
          numSets: 3,
          sets: [
            { id: 1, weight: '25', reps: '12' },
            { id: 2, weight: '25', reps: '12' },
            { id: 3, weight: '25', reps: '10' },
          ]
        },
      ],
    },
    {
      id: 2,
      name: 'Pull',
      type: 'Szablon',
      exercises: 6,
      description: 'Plecy, biceps, martwy ciąg',
      isActive: false,
      exercisesList: [
        {
          id: 1,
          name: 'Deadlift',
          numSets: 4,
          sets: [
            { id: 1, weight: '120', reps: '6' },
            { id: 2, weight: '120', reps: '6' },
            { id: 3, weight: '120', reps: '5' },
            { id: 4, weight: '110', reps: '6' },
          ]
        },
        {
          id: 2,
          name: 'Pull-ups',
          numSets: 4,
          sets: [
            { id: 1, weight: '0', reps: '8' },
            { id: 2, weight: '0', reps: '8' },
            { id: 3, weight: '0', reps: '7' },
            { id: 4, weight: '0', reps: '6' },
          ]
        },
        {
          id: 3,
          name: 'Barbell Row',
          numSets: 4,
          sets: [
            { id: 1, weight: '70', reps: '8' },
            { id: 2, weight: '70', reps: '8' },
            { id: 3, weight: '70', reps: '7' },
            { id: 4, weight: '65', reps: '8' },
          ]
        },
        {
          id: 4,
          name: 'Face Pulls',
          numSets: 3,
          sets: [
            { id: 1, weight: '20', reps: '15' },
            { id: 2, weight: '20', reps: '15' },
            { id: 3, weight: '20', reps: '12' },
          ]
        },
        {
          id: 5,
          name: 'Barbell Curl',
          numSets: 3,
          sets: [
            { id: 1, weight: '30', reps: '10' },
            { id: 2, weight: '30', reps: '9' },
            { id: 3, weight: '28', reps: '10' },
          ]
        },
        {
          id: 6,
          name: 'Hammer Curl',
          numSets: 3,
          sets: [
            { id: 1, weight: '16', reps: '12' },
            { id: 2, weight: '16', reps: '12' },
            { id: 3, weight: '16', reps: '10' },
          ]
        },
      ],
    },
    {
      id: 3,
      name: 'Legs',
      type: 'Szablon',
      exercises: 6,
      description: 'Nogi, pośladki, łydki',
      isActive: false,
      exercisesList: [
        {
          id: 1,
          name: 'Squat',
          numSets: 4,
          sets: [
            { id: 1, weight: '100', reps: '8' },
            { id: 2, weight: '100', reps: '8' },
            { id: 3, weight: '100', reps: '7' },
            { id: 4, weight: '95', reps: '8' },
          ]
        },
        {
          id: 2,
          name: 'Romanian Deadlift',
          numSets: 4,
          sets: [
            { id: 1, weight: '80', reps: '10' },
            { id: 2, weight: '80', reps: '10' },
            { id: 3, weight: '80', reps: '9' },
            { id: 4, weight: '75', reps: '10' },
          ]
        },
        {
          id: 3,
          name: 'Leg Press',
          numSets: 3,
          sets: [
            { id: 1, weight: '150', reps: '12' },
            { id: 2, weight: '150', reps: '12' },
            { id: 3, weight: '150', reps: '10' },
          ]
        },
        {
          id: 4,
          name: 'Leg Curl',
          numSets: 3,
          sets: [
            { id: 1, weight: '40', reps: '12' },
            { id: 2, weight: '40', reps: '12' },
            { id: 3, weight: '40', reps: '10' },
          ]
        },
        {
          id: 5,
          name: 'Leg Extension',
          numSets: 3,
          sets: [
            { id: 1, weight: '50', reps: '12' },
            { id: 2, weight: '50', reps: '12' },
            { id: 3, weight: '50', reps: '10' },
          ]
        },
        {
          id: 6,
          name: 'Calf Raises',
          numSets: 4,
          sets: [
            { id: 1, weight: '60', reps: '15' },
            { id: 2, weight: '60', reps: '15' },
            { id: 3, weight: '60', reps: '12' },
            { id: 4, weight: '60', reps: '12' },
          ]
        },
      ],
    },
    {
      id: 4,
      name: 'Full Body Workout',
      type: 'Własny',
      exercises: 8,
      description: 'Kompleksowy trening całego ciała',
      isActive: false,
      exercisesList: [
        {
          id: 1,
          name: 'Squat',
          numSets: 4,
          sets: [
            { id: 1, weight: '100', reps: '8' },
            { id: 2, weight: '100', reps: '8' },
            { id: 3, weight: '100', reps: '7' },
            { id: 4, weight: '95', reps: '8' },
          ]
        },
        {
          id: 2,
          name: 'Bench Press',
          numSets: 4,
          sets: [
            { id: 1, weight: '80', reps: '8' },
            { id: 2, weight: '80', reps: '8' },
            { id: 3, weight: '80', reps: '7' },
            { id: 4, weight: '75', reps: '8' },
          ]
        },
        {
          id: 3,
          name: 'Barbell Row',
          numSets: 4,
          sets: [
            { id: 1, weight: '70', reps: '8' },
            { id: 2, weight: '70', reps: '8' },
            { id: 3, weight: '70', reps: '7' },
            { id: 4, weight: '65', reps: '8' },
          ]
        },
        {
          id: 4,
          name: 'Overhead Press',
          numSets: 3,
          sets: [
            { id: 1, weight: '50', reps: '10' },
            { id: 2, weight: '50', reps: '9' },
            { id: 3, weight: '45', reps: '10' },
          ]
        },
        {
          id: 5,
          name: 'Romanian Deadlift',
          numSets: 3,
          sets: [
            { id: 1, weight: '80', reps: '10' },
            { id: 2, weight: '80', reps: '9' },
            { id: 3, weight: '75', reps: '10' },
          ]
        },
        {
          id: 6,
          name: 'Pull-ups',
          numSets: 3,
          sets: [
            { id: 1, weight: '0', reps: '8' },
            { id: 2, weight: '0', reps: '7' },
            { id: 3, weight: '0', reps: '6' },
          ]
        },
        {
          id: 7,
          name: 'Dips',
          numSets: 3,
          sets: [
            { id: 1, weight: '0', reps: '10' },
            { id: 2, weight: '0', reps: '9' },
            { id: 3, weight: '0', reps: '8' },
          ]
        },
        {
          id: 8,
          name: 'Plank',
          numSets: 3,
          sets: [
            { id: 1, weight: '0', reps: '60' },
            { id: 2, weight: '0', reps: '60' },
            { id: 3, weight: '0', reps: '45' },
          ]
        },
      ],
    },
  ];

  const handleDeletePlan = (planId, planName) => {
    Alert.alert(
      'Usuń plan',
      `Czy na pewno chcesz usunąć plan "${planName}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            console.log('Deleting plan:', planId);
            // Tutaj logika usunięcia
          },
        },
      ]
    );
  };

  const handleSetActivePlan = (planId, planName) => {
    Alert.alert(
      'Ustaw jako aktywny',
      `Czy chcesz ustawić plan "${planName}" jako aktywny?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Ustaw',
          onPress: () => {
            console.log('Setting active plan:', planId);
            // Tutaj logika ustawienia aktywnego planu
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
        <Text style={styles.title}>Plany Treningowe</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('WorkoutPlanEditor')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Plan */}
        {workoutPlans.some((plan) => plan.isActive) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AKTYWNY PLAN</Text>
            {workoutPlans
              .filter((plan) => plan.isActive)
              .map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.activePlanCard}
                  onPress={() =>
                    navigation.navigate('WorkoutPlanDetails', { plan })
                  }
                >
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>AKTYWNY</Text>
                  </View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                  <View style={styles.planStats}>
                    <View style={styles.planStat}>
                      <Text style={styles.planStatValue}>{plan.exercises}</Text>
                      <Text style={styles.planStatLabel}>Ćwiczeń</Text>
                    </View>
                    <View style={styles.planStat}>
                      <Text style={styles.planStatValue}>{plan.type}</Text>
                      <Text style={styles.planStatLabel}>Typ</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* All Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WSZYSTKIE PLANY</Text>
          {workoutPlans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <TouchableOpacity
                style={styles.planCardContent}
                onPress={() =>
                  navigation.navigate('WorkoutPlanDetails', { plan })
                }
              >
                <View style={styles.planHeader}>
                  <View style={styles.planInfo}>
                    <Text style={styles.planCardName}>{plan.name}</Text>
                    <Text style={styles.planCardDescription}>
                      {plan.description}
                    </Text>
                  </View>
                  {plan.isActive && (
                    <View style={styles.activeIndicator}>
                      <Text style={styles.activeIndicatorDot}>●</Text>
                    </View>
                  )}
                </View>

                <View style={styles.planCardStats}>
                  <Text style={styles.planCardStat}>
                    {plan.exercises} ćwiczeń
                  </Text>
                  <Text style={styles.planCardDivider}>•</Text>
                  <Text style={styles.planCardStat}>{plan.type}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.planActions}>
                {!plan.isActive && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetActivePlan(plan.id, plan.name)}
                  >
                    <Text style={styles.actionButtonText}>Ustaw aktywny</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    navigation.navigate('WorkoutPlanEditor', { plan })
                  }
                >
                  <Text style={styles.actionButtonText}>Edytuj</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeletePlan(plan.id, plan.name)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteText]}>
                    Usuń
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {workoutPlans.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateText}>Brak planów treningowych</Text>
            <Text style={styles.emptyStateSubtext}>
              Dodaj nowy plan lub użyj szablonu
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  activePlanCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    position: 'relative',
  },
  activeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    marginRight: 80,
  },
  planDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
    fontWeight: '500',
  },
  planStats: {
    flexDirection: 'row',
    gap: 24,
  },
  planStat: {
    alignItems: 'center',
  },
  planStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  planStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  planCardContent: {
    padding: 18,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planCardDescription: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activeIndicator: {
    marginLeft: 12,
  },
  activeIndicatorDot: {
    fontSize: 16,
    color: '#3B82F6',
  },
  planCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planCardStat: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  planCardDivider: {
    fontSize: 13,
    color: '#334155',
    marginHorizontal: 8,
  },
  planActions: {
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

export default WorkoutPlansScreen;