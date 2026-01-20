import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const TEMP_USER_ID = '65a000000000000000000001';

const WorkoutPlansScreen = ({ navigation }) => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlansAndInsights = async () => {
    try {
      setLoading(true);

      // 1. Fetch Plans
      try {
        const data = await api.getWorkoutPlans();
        if (data) {
          setWorkoutPlans(data);
        }
      } catch (err) {
        console.log('Error fetching plans:', err);
      }

      // 2. Fetch Insights
      try {
        const insightData = await api.getInsight();
        if (insightData) {
          setSuggestion(insightData);
        }
      } catch (err) {
        console.log('Error fetching insights:', err);
      }

    } catch (error) {
      console.error('General fetch error:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać danych z serwera');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlansAndInsights();
    }, [])
  );

  const handleDeletePlan = (planId, planName) => {
    Alert.alert(
      'Usuń plan',
      `Czy na pewno chcesz usunąć plan "${planName}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteWorkoutPlan(planId);
              fetchPlansAndInsights();
            } catch (err) {
              console.error(err);
            }
          },
        },
      ]
    );
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Plany Treningowe</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => navigation.navigate('WorkoutGenerator')}
          >
            <Text style={styles.generateButtonText}>📊 AGP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('WorkoutPlanEditor')}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Insights Suggestion */}
        {suggestion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUGEROWANY TRENING (INSIGHTS)</Text>
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionTitle}>
                {suggestion.type}
              </Text>
              <Text style={styles.suggestionReason}>
                {suggestion.reason}
              </Text>
              {suggestion.suggestedPlan ? (
                <TouchableOpacity
                  style={styles.suggestionAction}
                  onPress={() => navigation.navigate('WorkoutPlanDetails', { plan: suggestion.suggestedPlan })}
                >
                  <Text style={styles.suggestionActionText}>Zobacz Plan: {suggestion.suggestedPlan.name}</Text>
                </TouchableOpacity>
              ) : suggestion.type !== 'Odpoczynek' && (
                <TouchableOpacity
                  style={styles.suggestionAction}
                  onPress={() => navigation.navigate('WorkoutPlanEditor', { type: suggestion.type })}
                >
                  <Text style={styles.suggestionActionText}>Stwórz Plan {suggestion.type}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* All Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WSZYSTKIE PLANY</Text>
          {workoutPlans.map((plan) => (
            <View key={plan._id} style={styles.planCard}>
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

                </View>

                <View style={styles.planCardStats}>
                  <Text style={styles.planCardStat}>
                    {plan.exercises?.length || 0} ćwiczeń
                  </Text>
                  <Text style={styles.planCardDivider}>•</Text>
                  <Text style={styles.planCardStat}>{plan.type}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.planActions}>

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
                  onPress={() => handleDeletePlan(plan._id, plan.name)}
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
              Dodaj nowy plan lub migruj szablony
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  generateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
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
  suggestionCard: {
    backgroundColor: '#1E293B', // Dark card
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B981', // Emerald green border for positive suggestion
    marginBottom: 10
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8
  },
  suggestionReason: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 16
  },
  suggestionAction: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center'
  },
  suggestionActionText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  }
});

export default WorkoutPlansScreen;