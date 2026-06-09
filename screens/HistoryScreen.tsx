import React, { useEffect, useMemo, useState } from 'react';

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getMealsByUser } from '../services/firestore';

type FilterType = 'all' | 'highProtein' | 'highCalories';

export default function HistoryScreen() {
  const [meals, setMeals] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadMeals();
  }, []);

  async function loadMeals() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const data = await getMealsByUser(user.uid);

      const sortedMeals = [...data].sort((a, b) => {
        const dateA = getMealTime(a);
        const dateB = getMealTime(b);
        return dateB - dateA;
      });

      setMeals(sortedMeals);
    } catch (error) {
      console.log('Erro ao carregar histórico:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  }

  function getMealTime(meal: any) {
    if (meal.createdAt?.seconds) return meal.createdAt.seconds * 1000;
    if (meal.createdAt?.toDate) return meal.createdAt.toDate().getTime();
    if (meal.createdAt) return new Date(meal.createdAt).getTime();
    return 0;
  }

  function formatDate(meal: any) {
    const timestamp = getMealTime(meal);
    const date = timestamp ? new Date(timestamp) : new Date();

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  const filteredMeals = useMemo(() => {
    if (filter === 'highProtein') {
      return meals.filter((meal) => {
        const proteins = Number(meal.proteinas || meal.proteinas_total || 0);
        return proteins >= 25;
      });
    }

    if (filter === 'highCalories') {
      return meals.filter((meal) => {
        const calories = Number(meal.calorias || meal.calorias_total || 0);
        return calories >= 500;
      });
    }

    return meals;
  }, [meals, filter]);

  const groupedMeals = useMemo(() => {
    return filteredMeals.reduce((groups: Record<string, any[]>, meal) => {
      const date = formatDate(meal);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(meal);
      return groups;
    }, {});
  }, [filteredMeals]);

  const totalCalories = filteredMeals.reduce((sum, meal) => {
    return sum + Number(meal.calorias || meal.calorias_total || 0);
  }, 0);

  const totalProteins = filteredMeals.reduce((sum, meal) => {
    return sum + Number(meal.proteinas || meal.proteinas_total || 0);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#22C55E"
            colors={['#22C55E']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Diário nutricional inteligente</Text>
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>
            Acompanhe suas refeições analisadas por foto.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Refeições</Text>
            <Text style={styles.summaryValue}>{filteredMeals.length}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Calorias</Text>
            <Text style={styles.summaryValue}>{Math.round(totalCalories)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Proteínas</Text>
            <Text style={styles.summaryValue}>{Math.round(totalProteins)}g</Text>
          </View>
        </View>

        <View style={styles.filters}>
          <FilterButton
            title="Todas"
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />

          <FilterButton
            title="Proteicas"
            active={filter === 'highProtein'}
            onPress={() => setFilter('highProtein')}
          />

          <FilterButton
            title="Calóricas"
            active={filter === 'highCalories'}
            onPress={() => setFilter('highCalories')}
          />
        </View>

        {filteredMeals.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Ionicons name="restaurant-outline" size={34} color="#22C55E" />
            </View>

            <Text style={styles.emptyTitle}>Nenhuma refeição encontrada</Text>
            <Text style={styles.emptyText}>
              Faça uma análise de refeição por foto para começar seu acompanhamento alimentar.
            </Text>
          </View>
        ) : (
          Object.entries(groupedMeals).map(([date, dateMeals]) => (
            <View key={date} style={styles.group}>
              <Text style={styles.groupTitle}>{date}</Text>

              {dateMeals.map((meal, index) => {
                const calories = Number(meal.calorias || meal.calorias_total || 0);
                const proteins = Number(meal.proteinas || meal.proteinas_total || 0);

                return (
                  <View key={meal.id || `${date}-${index}`} style={styles.card}>
                    {meal.imageUri ? (
                      <Image source={{ uri: meal.imageUri }} style={styles.image} />
                    ) : (
                      <View style={styles.imageFallback}>
                        <Ionicons name="image-outline" size={32} color="#64748B" />
                      </View>
                    )}

                    <View style={styles.cardBody}>
                      <Text style={styles.mealTitle}>
                        {meal.prato || 'Refeição analisada'}
                      </Text>

                      <View style={styles.row}>
                        <View style={styles.infoBox}>
                          <Text style={styles.label}>Calorias</Text>
                          <Text style={styles.value}>
                            {Math.round(calories)}
                            <Text style={styles.unit}> kcal</Text>
                          </Text>
                        </View>

                        <View style={styles.infoBox}>
                          <Text style={styles.label}>Proteínas</Text>
                          <Text style={styles.value}>
                            {Math.round(proteins)}
                            <Text style={styles.unit}> g</Text>
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.description}>
                        {meal.observacao || 'Sem observação registrada.'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.filterButton, active && styles.filterButtonActive]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
  },

  content: {
    padding: 20,
    paddingTop: 58,
    paddingBottom: 130,
  },

  header: {
    marginBottom: 22,
  },

  kicker: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  title: {
    color: '#F8FAFC',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
  },

  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#263244',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 6,
  },

  summaryValue: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
  },

  divider: {
    width: 1,
    height: 34,
    backgroundColor: '#263244',
  },

  filters: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#263244',
  },

  filterButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },

  filterText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },

  filterTextActive: {
    color: '#07110B',
  },

  group: {
    marginBottom: 26,
  },

  groupTitle: {
    color: '#CBD5E1',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 14,
  },

  card: {
    backgroundColor: '#111827',
    borderRadius: 26,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#263244',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: 185,
    backgroundColor: '#0B1020',
  },

  imageFallback: {
    width: '100%',
    height: 150,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: {
    padding: 17,
  },

  mealTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    lineHeight: 26,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  infoBox: {
    flex: 1,
    backgroundColor: '#0B1020',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#263244',
  },

  label: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },

  value: {
    color: '#22C55E',
    fontSize: 24,
    fontWeight: '900',
  },

  unit: {
    color: '#94A3B8',
    fontSize: 12,
  },

  description: {
    color: '#CBD5E1',
    lineHeight: 22,
    fontSize: 14,
  },

  emptyBox: {
    backgroundColor: '#111827',
    borderRadius: 26,
    padding: 28,
    borderWidth: 1,
    borderColor: '#263244',
    alignItems: 'center',
    marginTop: 20,
  },

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#263244',
  },

  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});