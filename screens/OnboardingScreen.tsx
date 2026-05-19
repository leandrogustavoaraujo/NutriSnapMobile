import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function OnboardingScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>PASSO 1</Text>

        <Text style={styles.title}>
          Sua nutrição controlada por inteligência artificial
        </Text>

        <Text style={styles.description}>
          O NutriSnap identifica alimentos, calcula macros e acompanha sua meta
          calórica automaticamente.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  step: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
    marginBottom: 22,
  },

  description: {
    color: '#94a3b8',
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 40,
  },

  button: {
    backgroundColor: '#22c55e',
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#020817',
    fontWeight: '800',
    fontSize: 18,
  },
});