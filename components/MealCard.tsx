import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import colors from '../constants/colors';

type Meal = {
  prato?: string;
  calorias?: number;
  calorias_total?: number;
  proteinas?: number;
  proteinas_total?: number;
  observacao?: string;
  confianca?: string | number;
  imageUri?: string;
};

type Props = {
  meal: Meal;
};

export default function MealCard({ meal }: Props) {
  const calories = meal.calorias ?? meal.calorias_total ?? 0;
  const protein = meal.proteinas ?? meal.proteinas_total ?? 0;

  return (
    <View style={styles.card}>
      {!!meal.imageUri && <Image source={{ uri: meal.imageUri }} style={styles.image} />}

      <View style={styles.content}>
        <Text style={styles.title}>{meal.prato || 'Refeição analisada'}</Text>

        <View style={styles.row}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{Math.round(Number(calories) || 0)} kcal</Text>
          </View>

          <View style={styles.pill}>
            <Text style={styles.pillText}>{Math.round(Number(protein) || 0)}g proteína</Text>
          </View>
        </View>

        {!!meal.observacao && <Text style={styles.obs}>{meal.observacao}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  image: {
    width: '100%',
    height: 170,
    backgroundColor: colors.backgroundSoft,
  },
  content: {
    padding: 16,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  obs: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
});