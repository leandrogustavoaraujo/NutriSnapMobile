import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Dashboard</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meta Calórica</Text>
          <Text style={styles.cardValue}>1850 kcal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Proteínas</Text>
          <Text style={styles.cardValue}>132g</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Carboidratos</Text>
          <Text style={styles.cardValue}>210g</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020817',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 30,
  },

  card: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  cardTitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 10,
  },

  cardValue: {
    color: '#22c55e',
    fontSize: 28,
    fontWeight: '800',
  },
});