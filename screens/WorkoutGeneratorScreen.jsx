import React, { useState, useEffect } from 'react';
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
import api from '../services/api';

const WorkoutGeneratorScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedMuscles, setSelectedMuscles] = useState([]);
    const [trainingType, setTrainingType] = useState('CUSTOM');
    const [generatedPlan, setGeneratedPlan] = useState(null);

    // Muscle group definitions with Polish labels
    const muscleGroups = {
        chest: {
            label: 'Klatka',
            muscles: [
                { key: 'upperChest', label: 'Górna' },
                { key: 'middleChest', label: 'Środkowa' },
                { key: 'lowerChest', label: 'Dolna' }
            ]
        },
        back: {
            label: 'Plecy',
            muscles: [
                { key: 'backWidth', label: 'Szerokość' },
                { key: 'backMiddle', label: 'Środek' },
                { key: 'backLower', label: 'Dolne' }
            ]
        },
        shoulders: {
            label: 'Barki',
            muscles: [
                { key: 'frontDelts', label: 'Przednie' },
                { key: 'sideDelts', label: 'Boczne' },
                { key: 'rearDelts', label: 'Tylne' }
            ]
        },
        arms: {
            label: 'Ramiona',
            muscles: [
                { key: 'biceps', label: 'Biceps' },
                { key: 'triceps', label: 'Triceps' },
                { key: 'forearms', label: 'Przedramiona' }
            ]
        },
        legs: {
            label: 'Nogi',
            muscles: [
                { key: 'quads', label: 'Czworogłowy' },
                { key: 'hamstrings', label: 'Dwugłowy' },
                { key: 'glutes', label: 'Pośladki' },
                { key: 'calves', label: 'Łydki' }
            ]
        },
        core: {
            label: 'Brzuch',
            muscles: [
                { key: 'upperAbs', label: 'Górny' },
                { key: 'lowerAbs', label: 'Dolny' },
                { key: 'obliques', label: 'Skośne' }
            ]
        }
    };

    const trainingTypes = [
        { key: 'CUSTOM', label: 'Własny wybór' },
        { key: 'FBW', label: 'FBW (Full Body)' },
        { key: 'PPL_PUSH', label: 'PPL - Push' },
        { key: 'PPL_PULL', label: 'PPL - Pull' },
        { key: 'PPL_LEGS', label: 'PPL - Legs' }
    ];

    const toggleMuscle = (muscleKey) => {
        setSelectedMuscles(prev =>
            prev.includes(muscleKey)
                ? prev.filter(m => m !== muscleKey)
                : [...prev, muscleKey]
        );
    };

    const selectMuscleGroup = (group) => {
        const groupMuscles = muscleGroups[group].muscles.map(m => m.key);
        const allSelected = groupMuscles.every(m => selectedMuscles.includes(m));

        if (allSelected) {
            // Deselect all
            setSelectedMuscles(prev => prev.filter(m => !groupMuscles.includes(m)));
        } else {
            // Select all
            setSelectedMuscles(prev => [...new Set([...prev, ...groupMuscles])]);
        }
    };

    const handleGenerate = async () => {
        if (selectedMuscles.length === 0) {
            Alert.alert('Błąd', 'Wybierz przynajmniej jedną partię mięśniową');
            return;
        }

        setGenerating(true);
        try {
            const result = await api.generateWorkoutPlan(selectedMuscles, trainingType, 6);

            if (!result.success) {
                Alert.alert('Błąd', result.error || 'Nie udało się wygenerować planu');
                return;
            }

            setGeneratedPlan(result);
        } catch (error) {
            console.error('Generate error:', error);
            Alert.alert('Błąd', 'Nie udało się wygenerować planu treningowego');
        } finally {
            setGenerating(false);
        }
    };

    const renderMuscleChip = (muscleKey, label) => {
        const isSelected = selectedMuscles.includes(muscleKey);
        return (
            <TouchableOpacity
                key={muscleKey}
                style={[styles.muscleChip, isSelected && styles.muscleChipSelected]}
                onPress={() => toggleMuscle(muscleKey)}
            >
                <Text style={[styles.muscleChipText, isSelected && styles.muscleChipTextSelected]}>
                    {label}
                </Text>
            </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Generator Treningów</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {!generatedPlan ? (
                    <>
                        {/* Training Type Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>TYP TRENINGU</Text>
                            <View style={styles.typeGrid}>
                                {trainingTypes.map(type => (
                                    <TouchableOpacity
                                        key={type.key}
                                        style={[
                                            styles.typeCard,
                                            trainingType === type.key && styles.typeCardSelected
                                        ]}
                                        onPress={() => setTrainingType(type.key)}
                                    >
                                        <Text style={[
                                            styles.typeText,
                                            trainingType === type.key && styles.typeTextSelected
                                        ]}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Muscle Group Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PARTIE MIĘŚNIOWE</Text>

                            {Object.entries(muscleGroups).map(([groupKey, group]) => {
                                const groupMuscles = group.muscles.map(m => m.key);
                                const allSelected = groupMuscles.every(m => selectedMuscles.includes(m));

                                return (
                                    <View key={groupKey} style={styles.muscleGroupCard}>
                                        <TouchableOpacity
                                            style={styles.muscleGroupHeader}
                                            onPress={() => selectMuscleGroup(groupKey)}
                                        >
                                            <Text style={styles.muscleGroupLabel}>{group.label}</Text>
                                            <View style={[styles.checkbox, allSelected && styles.checkboxSelected]}>
                                                {allSelected && <Text style={styles.checkmark}>✓</Text>}
                                            </View>
                                        </TouchableOpacity>
                                        <View style={styles.muscleChipsContainer}>
                                            {group.muscles.map(muscle =>
                                                renderMuscleChip(muscle.key, muscle.label)
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Generate Button */}
                        <TouchableOpacity
                            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
                            onPress={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.generateButtonText}>Generuj Plan Treningowy</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* Generated Plan Display */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>WYGENEROWANY PLAN</Text>

                            {/* Analysis Summary */}
                            <View style={styles.analysisCard}>
                                <View style={styles.analysisRow}>
                                    <Text style={styles.analysisLabel}>Ćwiczenia:</Text>
                                    <Text style={styles.analysisValue}>{generatedPlan.analysis.totalExercises}</Text>
                                </View>
                                <View style={styles.analysisRow}>
                                    <Text style={styles.analysisLabel}>Złożone:</Text>
                                    <Text style={styles.analysisValue}>{generatedPlan.analysis.compoundCount}</Text>
                                </View>
                                <View style={styles.analysisRow}>
                                    <Text style={styles.analysisLabel}>Izolowane:</Text>
                                    <Text style={styles.analysisValue}>{generatedPlan.analysis.isolationCount}</Text>
                                </View>
                            </View>

                            {/* Warnings */}
                            {(generatedPlan.analysis.safety.warnings.length > 0 ||
                                generatedPlan.analysis.balance.warnings.length > 0) && (
                                    <View style={styles.warningsCard}>
                                        <Text style={styles.warningsTitle}>⚠️ Ostrzeżenia</Text>
                                        {generatedPlan.analysis.safety.warnings.map((warning, i) => (
                                            <Text key={i} style={styles.warningText}>• {warning}</Text>
                                        ))}
                                        {generatedPlan.analysis.balance.warnings.map((warning, i) => (
                                            <Text key={i} style={styles.warningText}>• {warning}</Text>
                                        ))}
                                    </View>
                                )}

                            {/* Exercise List */}
                            {generatedPlan.exercises.map((exercise, index) => (
                                <View key={exercise._id || index} style={styles.exerciseCard}>
                                    <View style={styles.exerciseHeader}>
                                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                                        <View style={[
                                            styles.typeBadge,
                                            exercise.type === 'Compound' ? styles.typeBadgeCompound : styles.typeBadgeIsolation
                                        ]}>
                                            <Text style={styles.typeBadgeText}>
                                                {exercise.type === 'Compound' ? 'Złożone' : 'Izolowane'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                                    <View style={styles.exerciseDetails}>
                                        <Text style={styles.exerciseDetail}>⚙️ {exercise.equipment}</Text>
                                        <Text style={styles.exerciseDetail}>
                                            💪 Poziom {exercise.difficulty}/5
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setGeneratedPlan(null)}
                            >
                                <Text style={styles.secondaryButtonText}>Generuj Ponownie</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => {
                                    // TODO: Save plan or navigate to workout editor
                                    Alert.alert('Sukces', 'Plan zapisany!');
                                    navigation.goBack();
                                }}
                            >
                                <Text style={styles.primaryButtonText}>Zapisz Plan</Text>
                            </TouchableOpacity>
                        </View>
                    </>
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
    headerTitle: {
        fontSize: 20,
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    typeCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#334155',
    },
    typeCardSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
    },
    typeTextSelected: {
        color: '#FFFFFF',
    },
    muscleGroupCard: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    muscleGroupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    muscleGroupLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    muscleChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    muscleChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#0F172A',
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    muscleChipSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    muscleChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
    },
    muscleChipTextSelected: {
        color: '#FFFFFF',
    },
    generateButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    generateButtonDisabled: {
        opacity: 0.6,
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    analysisCard: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#3B82F6',
    },
    analysisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    analysisLabel: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    analysisValue: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '700',
    },
    warningsCard: {
        backgroundColor: '#451A03',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#F59E0B',
    },
    warningsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F59E0B',
        marginBottom: 8,
    },
    warningText: {
        fontSize: 13,
        color: '#FCD34D',
        marginBottom: 4,
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
        marginBottom: 8,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typeBadgeCompound: {
        backgroundColor: '#3B82F6',
    },
    typeBadgeIsolation: {
        backgroundColor: '#8B5CF6',
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    exerciseDescription: {
        fontSize: 13,
        color: '#94A3B8',
        marginBottom: 8,
    },
    exerciseDetails: {
        flexDirection: 'row',
        gap: 16,
    },
    exerciseDetail: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#334155',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default WorkoutGeneratorScreen;
