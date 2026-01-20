import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import api from '../services/api';

const ExerciseProgressScreen = ({ route, navigation }) => {
    const { exerciseName } = route.params;
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState(null);

    useEffect(() => {
        fetchProgress();
    }, [exerciseName]);

    const fetchProgress = async () => {
        try {
            setLoading(true);
            const data = await api.getExerciseProgress(exerciseName);
            setProgressData(data);
        } catch (error) {
            console.error('Error fetching exercise progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatChartData = () => {
        if (!progressData || !progressData.history || progressData.history.length === 0) {
            return null;
        }

        // Pobierz ostatnie 10 sesji do wykresu
        const recentHistory = progressData.history.slice(0, 10).reverse();

        const labels = recentHistory.map((item, idx) => {
            const date = new Date(item.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });

        const maxWeights = recentHistory.map(item => item.maxWeight);
        const volumes = recentHistory.map(item => item.volume);
        const oneRepMaxes = recentHistory.map(item => item.oneRepMax || 0);

        return {
            labels,
            maxWeights,
            volumes,
            oneRepMaxes
        };
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Wróć</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{exerciseName}</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            </SafeAreaView>
        );
    }

    if (!progressData || progressData.sessions === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Wróć</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{exerciseName}</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Brak danych dla tego ćwiczenia</Text>
                    <Text style={styles.emptySubtext}>Wykonaj trening z tym ćwiczeniem, aby zobaczyć progres</Text>
                </View>
            </SafeAreaView>
        );
    }

    const chartData = formatChartData();
    const screenWidth = Dimensions.get('window').width;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Wróć</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{exerciseName}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Karty Statystyk */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{progressData.currentMax} kg</Text>
                        <Text style={styles.statLabel}>Max Waga</Text>
                        {progressData.previousMax > 0 && (
                            <Text style={[
                                styles.statChange,
                                progressData.currentMax > progressData.previousMax ? styles.statUp : styles.statDown
                            ]}>
                                {progressData.currentMax > progressData.previousMax ? '+' : ''}
                                {(progressData.currentMax - progressData.previousMax).toFixed(1)} kg
                            </Text>
                        )}
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{progressData.current1RM?.toFixed(1) || 0}</Text>
                        <Text style={styles.statLabel}>1 Rep Max</Text>
                        {progressData.previous1RM > 0 && (
                            <Text style={[
                                styles.statChange,
                                progressData.current1RM > progressData.previous1RM ? styles.statUp : styles.statDown
                            ]}>
                                {progressData.current1RM > progressData.previous1RM ? '+' : ''}
                                {(progressData.current1RM - progressData.previous1RM).toFixed(1)}
                            </Text>
                        )}
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{Math.round(progressData.maxVolume || 0)}</Text>
                        <Text style={styles.statLabel}>Max Volume</Text>
                        <Text style={styles.statSubtext}>kg × reps</Text>
                    </View>
                </View>

                {/* Wykres Progresji Wagi */}
                {chartData && chartData.maxWeights.length > 0 && (
                    <View style={styles.chartSection}>
                        <Text style={styles.chartTitle}>Progres Wagi</Text>
                        <LineChart
                            data={{
                                labels: chartData.labels,
                                datasets: [{
                                    data: chartData.maxWeights,
                                }]
                            }}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#1E293B',
                                backgroundGradientFrom: '#1E293B',
                                backgroundGradientTo: '#0F172A',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: '5',
                                    strokeWidth: '2',
                                    stroke: '#3B82F6'
                                }
                            }}
                            bezier
                            style={styles.chart}
                        />
                    </View>
                )}

                {/* Wykres Progresji 1RM */}
                {chartData && chartData.oneRepMaxes && chartData.oneRepMaxes.length > 0 && (
                    <View style={styles.chartSection}>
                        <Text style={styles.chartTitle}>Progresja 1RM</Text>
                        <LineChart
                            data={{
                                labels: chartData.labels,
                                datasets: [{
                                    data: chartData.oneRepMaxes,
                                }]
                            }}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#1E293B',
                                backgroundGradientFrom: '#1E293B',
                                backgroundGradientTo: '#0F172A',
                                decimalPlaces: 1,
                                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: '5',
                                    strokeWidth: '2',
                                    stroke: '#10B981'
                                }
                            }}
                            style={styles.chart}
                        />
                    </View>
                )}

                {/* Wykres Objętości (Volume) */}
                {chartData && chartData.volumes.length > 0 && (
                    <View style={styles.chartSection}>
                        <Text style={styles.chartTitle}>Progresja Objętości</Text>
                        <LineChart
                            data={{
                                labels: chartData.labels,
                                datasets: [{
                                    data: chartData.volumes,
                                }]
                            }}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#1E293B',
                                backgroundGradientFrom: '#1E293B',
                                backgroundGradientTo: '#0F172A',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: '5',
                                    strokeWidth: '2',
                                    stroke: '#8B5CF6'
                                }
                            }}
                            style={styles.chart}
                        />
                    </View>
                )}

                {/* Lista Historii */}
                <View style={styles.historySection}>
                    <Text style={styles.historyTitle}>Historia Treningów</Text>
                    {progressData.history.slice(0, 10).map((item, index) => (
                        <View key={index} style={styles.historyItem}>
                            <View style={styles.historyDate}>
                                <Text style={styles.historyDateText}>{item.date}</Text>
                            </View>
                            <View style={styles.historyStats}>
                                <Text style={styles.historyStatText}>Max: {item.maxWeight} kg</Text>
                                <Text style={styles.historyStatText}>1RM: {item.oneRepMax?.toFixed(1) || 0}</Text>
                                <Text style={styles.historyStatText}>Vol: {Math.round(item.volume)}</Text>
                            </View>
                        </View>
                    ))}
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backButton: {
        color: '#3B82F6',
        fontSize: 16,
        marginRight: 12,
    },
    title: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        color: '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    statValue: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        color: '#94A3B8',
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    statSubtext: {
        color: '#64748B',
        fontSize: 10,
        marginTop: 2,
    },
    statChange: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    statUp: {
        color: '#10B981',
    },
    statDown: {
        color: '#EF4444',
    },
    chartSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    chartTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    historySection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 20,
    },
    historyTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    historyItem: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    historyDate: {
        flex: 1,
    },
    historyDateText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    historyStats: {
        flexDirection: 'row',
        gap: 16,
    },
    historyStatText: {
        color: '#94A3B8',
        fontSize: 13,
    },
});

export default ExerciseProgressScreen;
