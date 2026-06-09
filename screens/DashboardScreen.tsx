import React, { useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { getAuth } from 'firebase/auth';

import {
  getTodayNutrition,
  getUserGoals,
  getMealsByUser,
} from '../services/firestore';

type Meal = {
  id?: string;
  prato?: string;
  calorias?: number;
  calorias_total?: number;
  proteinas?: number;
  proteinas_total?: number;
  createdAt?: any;
};

export default function DashboardScreen({ navigation }: any) {
  const [calories, setCalories] = useState(0);
  const [proteins, setProteins] = useState(0);
  const [mealsCount, setMealsCount] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2500);
  const [proteinGoal, setProteinGoal] = useState(180);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const [nutrition, goals, meals] = await Promise.all([
        getTodayNutrition(user.uid),
        getUserGoals(user.uid),
        getMealsByUser(user.uid),
      ]);

      setCalories(Number(nutrition?.totalCalories || 0));
      setProteins(Number(nutrition?.totalProteins || 0));
      setMealsCount(Number(nutrition?.meals?.length || 0));

      setCalorieGoal(Number(goals?.calorieGoal || 2500));
      setProteinGoal(Number(goals?.proteinGoal || 180));

      setAllMeals(Array.isArray(meals) ? meals : []);
    } catch (error) {
      console.log('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function getMealTime(meal: Meal) {
    if (meal.createdAt?.seconds) return meal.createdAt.seconds * 1000;
    if (meal.createdAt?.toDate) return meal.createdAt.toDate().getTime();
    if (meal.createdAt) return new Date(meal.createdAt).getTime();
    return 0;
  }

  function getDateKey(date: Date) {
    return date.toISOString().split('T')[0];
  }

  function getMealCalories(meal: Meal) {
    return Number(meal.calorias || meal.calorias_total || 0);
  }

  function getMealProteins(meal: Meal) {
    return Number(meal.proteinas || meal.proteinas_total || 0);
  }

  const calorieFill = useMemo(() => {
    if (!calorieGoal) return 0;
    return Math.min((calories / calorieGoal) * 100, 100);
  }, [calories, calorieGoal]);

  const proteinFill = useMemo(() => {
    if (!proteinGoal) return 0;
    return Math.min((proteins / proteinGoal) * 100, 100);
  }, [proteins, proteinGoal]);

  const remainingCalories = Math.max(calorieGoal - calories, 0);
  const remainingProteins = Math.max(proteinGoal - proteins, 0);

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const mealsThisWeek = allMeals.filter((meal) => {
      const time = getMealTime(meal);
      return time >= startOfWeek.getTime();
    });

    const weeklyCalories = mealsThisWeek.reduce(
      (sum, meal) => sum + getMealCalories(meal),
      0
    );

    const weeklyProteins = mealsThisWeek.reduce(
      (sum, meal) => sum + getMealProteins(meal),
      0
    );

    const activeDays = new Set(
      mealsThisWeek
        .map((meal) => {
          const time = getMealTime(meal);
          if (!time) return null;
          return getDateKey(new Date(time));
        })
        .filter(Boolean)
    ).size;

    return {
      meals: mealsThisWeek.length,
      calories: weeklyCalories,
      proteins: weeklyProteins,
      activeDays,
    };
  }, [allMeals]);

  const streak = useMemo(() => {
    const mealDates = new Set(
      allMeals
        .map((meal) => {
          const time = getMealTime(meal);
          if (!time) return null;
          return getDateKey(new Date(time));
        })
        .filter(Boolean)
    );

    let count = 0;
    const cursor = new Date();

    while (mealDates.has(getDateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }, [allMeals]);

  const insight = useMemo(() => {
    if (mealsCount === 0) {
      return 'Comece registrando sua primeira refeição do dia para acompanhar sua evolução.';
    }

    if (calories > calorieGoal) {
      return 'Você ultrapassou sua meta calórica. Nas próximas refeições, priorize escolhas mais leves.';
    }

    if (proteins < proteinGoal * 0.45) {
      return 'Seu consumo de proteínas ainda está baixo para hoje. Uma refeição mais proteica pode ajudar.';
    }

    if (calories < calorieGoal * 0.45) {
      return 'Você ainda está abaixo da metade da meta calórica diária. Continue registrando suas refeições.';
    }

    if (proteins >= proteinGoal && calories <= calorieGoal) {
      return 'Excelente evolução hoje. Sua meta de proteínas foi atingida mantendo bom controle calórico.';
    }

    return 'Seu acompanhamento alimentar está bem encaminhado. Continue registrando suas refeições.';
  }, [mealsCount, calories, proteins, calorieGoal, proteinGoal]);

  if (loading) {
    return (
      <LinearGradient colors={['#070A12', '#0B1020']} style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Carregando seu painel...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#070A12', '#0B1020']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22C55E"
            colors={['#22C55E']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Seu nutricionista portátil</Text>
          <Text style={styles.title}>Hoje</Text>
          <Text style={styles.subtitle}>
            Controle alimentar visual com metas, progresso e histórico em tempo real.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <AnimatedCircularProgress
            size={205}
            width={17}
            fill={calorieFill}
            tintColor="#22C55E"
            backgroundColor="#263244"
            rotation={0}
            lineCap="round"
          >
            {() => (
              <View style={styles.center}>
                <Text style={styles.heroCalories}>{Math.round(calories)}</Text>
                <Text style={styles.heroSubtitle}>de {calorieGoal} kcal</Text>
              </View>
            )}
          </AnimatedCircularProgress>

          <Text style={styles.heroTitle}>Calorias consumidas</Text>

          <View style={styles.heroFooter}>
            <View style={styles.heroFooterItem}>
              <Ionicons name="flame-outline" size={18} color="#F59E0B" />
              <Text style={styles.heroFooterText}>
                Restam {Math.round(remainingCalories)} kcal
              </Text>
            </View>

            <View style={styles.heroFooterItem}>
              <Ionicons name="restaurant-outline" size={18} color="#38BDF8" />
              <Text style={styles.heroFooterText}>{mealsCount} refeições</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.smallCard}>
            <View style={styles.cardIcon}>
              <Ionicons name="barbell-outline" size={22} color="#22C55E" />
            </View>

            <Text style={styles.smallLabel}>Proteínas</Text>
            <Text style={styles.smallValue}>{Math.round(proteins)}g</Text>
            <Text style={styles.smallGoal}>
              Meta: {proteinGoal}g · {Math.round(proteinFill)}%
            </Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${proteinFill}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.smallCard}>
            <View style={styles.cardIcon}>
              <Ionicons name="calendar-outline" size={22} color="#22C55E" />
            </View>

            <Text style={styles.smallLabel}>Sequência</Text>
            <Text style={styles.smallValue}>{streak}</Text>
            <Text style={styles.smallGoal}>
              {streak === 1 ? 'dia ativo' : 'dias ativos'}
            </Text>

            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>Streak diário</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Analyze')}
        >
          <Ionicons name="camera" size={22} color="#07110B" />
          <Text style={styles.primaryButtonText}>Analisar nova refeição</Text>
        </TouchableOpacity>

        <View style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <View style={styles.messageIcon}>
              <Ionicons name="sparkles-outline" size={22} color="#22C55E" />
            </View>

            <Text style={styles.messageTitle}>Insight automático</Text>
          </View>

          <Text style={styles.messageText}>{insight}</Text>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resumo semanal</Text>
            <Text style={styles.sectionSubtitle}>Últimos 7 dias</Text>
          </View>

          <View style={styles.weekGrid}>
            <WeekItem
              label="Refeições"
              value={weeklyStats.meals.toString()}
              icon="restaurant-outline"
            />

            <WeekItem
              label="Dias ativos"
              value={weeklyStats.activeDays.toString()}
              icon="calendar-clear-outline"
            />

            <WeekItem
              label="Calorias"
              value={Math.round(weeklyStats.calories).toString()}
              icon="flame-outline"
            />

            <WeekItem
              label="Proteínas"
              value={`${Math.round(weeklyStats.proteins)}g`}
              icon="barbell-outline"
            />
          </View>
        </View>

        <View style={styles.premiumCard}>
          <LinearGradient
            colors={['#182235', '#111827']}
            style={styles.premiumGradient}
          >
            <View style={styles.premiumIcon}>
              <Ionicons name="diamond-outline" size={24} color="#22C55E" />
            </View>

            <View style={styles.premiumContent}>
              <Text style={styles.premiumTitle}>Evolução Premium</Text>
              <Text style={styles.premiumText}>
                Em breve: metas avançadas, relatórios completos e acompanhamento mais detalhado.
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function WeekItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.weekItem}>
      <Ionicons name={icon} size={20} color="#22C55E" />
      <Text style={styles.weekValue}>{value}</Text>
      <Text style={styles.weekLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 140,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },

  header: {
    marginBottom: 24,
  },

  kicker: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 8,
  },

  title: {
    color: '#F8FAFC',
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 8,
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 23,
  },

  heroCard: {
    backgroundColor: '#111827',
    borderRadius: 34,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#263244',
  },

  center: {
    alignItems: 'center',
  },

  heroCalories: {
    color: '#F8FAFC',
    fontSize: 45,
    fontWeight: '900',
  },

  heroSubtitle: {
    color: '#94A3B8',
    marginTop: 6,
    fontSize: 15,
  },

  heroTitle: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 20,
  },

  heroFooter: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 18,
  },

  heroFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#0B1020',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#263244',
  },

  heroFooterText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },

  row: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },

  smallCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#263244',
  },

  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#263244',
  },

  smallLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 7,
  },

  smallValue: {
    color: '#F8FAFC',
    fontSize: 31,
    fontWeight: '900',
  },

  smallGoal: {
    color: '#22C55E',
    marginTop: 7,
    fontSize: 12,
    fontWeight: '700',
  },

  progressTrack: {
    height: 7,
    backgroundColor: '#263244',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },

  streakBadge: {
    marginTop: 14,
    backgroundColor: '#0B1020',
    borderRadius: 999,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#263244',
  },

  streakBadgeText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
  },

  primaryButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    flexDirection: 'row',
    gap: 10,
  },

  primaryButtonText: {
    color: '#07110B',
    fontSize: 16,
    fontWeight: '900',
  },

  messageCard: {
    backgroundColor: '#111827',
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#263244',
  },

  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  messageIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#263244',
  },

  messageTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },

  messageText: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 23,
  },

  weekCard: {
    backgroundColor: '#111827',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#263244',
    marginBottom: 18,
  },

  sectionHeader: {
    marginBottom: 18,
  },

  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 5,
  },

  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  weekItem: {
    width: '47.8%',
    backgroundColor: '#0B1020',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#263244',
  },

  weekValue: {
    color: '#F8FAFC',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 10,
  },

  weekLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },

  premiumCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#263244',
  },

  premiumGradient: {
    padding: 20,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },

  premiumIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#263244',
  },

  premiumContent: {
    flex: 1,
  },

  premiumTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },

  premiumText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },
});