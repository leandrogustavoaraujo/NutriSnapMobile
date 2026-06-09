import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { onAuthStateChanged } from 'firebase/auth';

import {
  loginUser,
  registerUser,
} from '../services/auth';

import { auth } from '../firebase';
import { getUserGoals } from '../services/firestore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setCheckingSession(false);
          return;
        }

        await redirectUser(user.uid);
      } catch (error) {
        console.log('Erro ao verificar sessão:', error);
        setCheckingSession(false);
      }
    });

    return unsubscribe;
  }, []);

  async function redirectUser(userId: string) {
    const profile: any = await getUserGoals(userId);

    const hasCompletedOnboarding =
      profile?.onboardingCompleted === true ||
      (
        !!profile?.calorieGoal &&
        !!profile?.proteinGoal &&
        !!profile?.weight &&
        !!profile?.height
      );

    const isPremium = profile?.plan === 'premium';

    if (!hasCompletedOnboarding) {
      navigation.replace('Onboarding');
      return;
    }

    if (!isPremium) {
      navigation.replace('Premium');
      return;
    }

    navigation.replace('MainTabs');
  }

  function validateFields() {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return false;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      Alert.alert('E-mail inválido', 'Informe um e-mail válido.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve possuir ao menos 6 caracteres.');
      return false;
    }

    return true;
  }

  async function handleLogin() {
    try {
      if (!validateFields()) return;

      setLoading(true);

      const credential = await loginUser(email.trim(), password);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await redirectUser(credential.user.uid);
    } catch (error: any) {
      console.log('Erro ao entrar:', error);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Erro ao entrar',
        getFriendlyAuthError(error?.message)
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    try {
      if (!validateFields()) return;

      setLoading(true);

      await registerUser(email.trim(), password);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.replace('Onboarding');
    } catch (error: any) {
      console.log('Erro ao cadastrar:', error);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Erro ao cadastrar',
        getFriendlyAuthError(error?.message)
      );
    } finally {
      setLoading(false);
    }
  }

  function getFriendlyAuthError(message?: string) {
    const text = String(message || '').toLowerCase();

    if (text.includes('email-already-in-use')) {
      return 'Este e-mail já está cadastrado. Tente entrar na sua conta.';
    }

    if (text.includes('invalid-email')) {
      return 'Informe um e-mail válido.';
    }

    if (text.includes('weak-password')) {
      return 'A senha deve possuir ao menos 6 caracteres.';
    }

    if (text.includes('invalid-credential') || text.includes('wrong-password')) {
      return 'E-mail ou senha incorretos.';
    }

    if (text.includes('user-not-found')) {
      return 'Não encontramos uma conta com este e-mail.';
    }

    return 'Não foi possível concluir esta ação agora. Tente novamente.';
  }

  if (checkingSession) {
    return (
      <LinearGradient colors={['#070A12', '#0B1020']} style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Carregando NutriSnap...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#070A12', '#0B1020']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="restaurant-outline" size={42} color="#07110B" />
          </View>

          <Text style={styles.logo}>NutriSnap</Text>

          <Text style={styles.subtitle}>Seu nutricionista portátil</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comece seu acompanhamento</Text>

          <Text style={styles.cardDescription}>
            Configure suas metas, registre refeições e acompanhe sua alimentação com análise nutricional por foto.
          </Text>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            placeholder="seuemail@exemplo.com"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            placeholder="mínimo 6 caracteres"
            placeholderTextColor="#64748B"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textContentType="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#07110B" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.82}
          >
            <Text style={styles.secondaryButtonText}>
              Criar conta e configurar perfil
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Ao continuar, você poderá configurar suas metas antes de escolher o plano.
        </Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 34,
  },

  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  logo: {
    color: '#F8FAFC',
    fontSize: 42,
    fontWeight: '900',
  },

  subtitle: {
    color: '#94A3B8',
    marginTop: 9,
    fontSize: 16,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#111827',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#263244',
  },

  cardTitle: {
    color: '#F8FAFC',
    fontSize: 27,
    fontWeight: '900',
    marginBottom: 10,
  },

  cardDescription: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
  },

  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#0B1020',
    borderRadius: 18,
    height: 58,
    paddingHorizontal: 18,
    color: '#F8FAFC',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#263244',
    fontSize: 16,
    fontWeight: '700',
  },

  button: {
    backgroundColor: '#22C55E',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#07110B',
    fontSize: 17,
    fontWeight: '900',
  },

  secondaryButton: {
    alignItems: 'center',
    marginTop: 22,
  },

  secondaryButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '800',
  },

  footerText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 22,
    paddingHorizontal: 12,
  },
});