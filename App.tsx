import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';

import {
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { onAuthStateChanged } from 'firebase/auth';

import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import AnalyzeScreen from './screens/AnalyzeScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import PremiumScreen from './screens/PremiumScreen';

import { auth } from './firebase';
import { getUserGoals } from './services/firestore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 18,
          backgroundColor: '#111827',
          borderTopWidth: 0,
          height: 74,
          paddingBottom: 12,
          paddingTop: 10,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: '#263244',
        },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') iconName = 'home';
          if (route.name === 'Analyze') iconName = 'camera';
          if (route.name === 'History') iconName = 'time';
          if (route.name === 'Profile') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />

      <Tab.Screen
        name="Analyze"
        component={AnalyzeScreen}
        options={{ title: 'Analisar' }}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Histórico' }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <LinearGradient colors={['#070A12', '#0B1020']} style={styles.loadingScreen}>
      <ActivityIndicator size="large" color="#22C55E" />
      <Text style={styles.loadingText}>Carregando NutriSnap...</Text>
    </LinearGradient>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setInitialRoute('Login');
          return;
        }

        const profile: any = await getUserGoals(user.uid);

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
          setInitialRoute('Onboarding');
          return;
        }

        if (!isPremium) {
          setInitialRoute('Premium');
          return;
        }

        setInitialRoute('MainTabs');
      } catch (error) {
        console.log('Erro ao definir rota inicial:', error);
        setInitialRoute('Login');
      } finally {
        setAppReady(true);
      }
    });

    return unsubscribe;
  }, []);

  if (!appReady || !initialRoute) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={initialRoute}
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Premium" component={PremiumScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
});