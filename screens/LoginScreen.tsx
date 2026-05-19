import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function LoginScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>NutriSnap</Text>

        <Text style={styles.title}>
          Descubra calorias e proteínas apenas com uma foto
        </Text>

        <Text style={styles.subtitle}>
          Tire uma foto da refeição e receba uma análise nutricional com IA.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.buttonText}>Entrar com Google</Text>
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

  logo: {
    color: '#22c55e',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 18,
  },

  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
    marginBottom: 18,
  },

  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 42,
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