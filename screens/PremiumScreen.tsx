import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getAuth } from 'firebase/auth';

import {
  getUserGoals,
  activatePremiumMock,
} from '../services/firestore';

export default function PremiumScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    loadPremiumData();
  }, []);

  async function loadPremiumData() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const profile = await getUserGoals(user.uid);

      setPlan(profile?.plan || 'free');
    } catch (error) {
      console.log('Erro ao carregar Premium:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      setActivating(true);

      await activatePremiumMock(user.uid);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Premium ativado',
        'Seu acesso Premium foi liberado.',
        [
          {
            text: 'Começar agora',
            onPress: () => navigation.replace('MainTabs'),
          },
        ]
      );
    } catch (error) {
      console.log('Erro ao ativar Premium:', error);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Erro',
        'Não foi possível liberar o Premium agora.'
      );
    } finally {
      setActivating(false);
    }
  }

  function handleContinueWithoutPremium() {
    Alert.alert(
      'Premium necessário',
      'Para usar a análise nutricional automática por foto, é necessário assinar o Premium.',
      [
        {
          text: 'Entendi',
          style: 'cancel',
        },
      ]
    );
  }

  function showDisclaimer() {
    Alert.alert(
      'Aviso importante',
      'As análises e metas do NutriSnap são estimativas para acompanhamento alimentar e não substituem orientação profissional individualizada.'
    );
  }

  if (loading) {
    return (
      <LinearGradient colors={['#070A12', '#0B1020']} style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Carregando Premium...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#070A12', '#0B1020']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {plan === 'premium' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.replace('MainTabs')}
            activeOpacity={0.82}
          >
            <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
        )}

        <View style={styles.hero}>
          <View style={styles.iconHero}>
            <Ionicons name="diamond-outline" size={44} color="#07110B" />
          </View>

          <Text style={styles.kicker}>
            {plan === 'premium' ? 'Premium ativo' : 'Configuração concluída'}
          </Text>

          <Text style={styles.title}>
            {plan === 'premium'
              ? 'Seu acompanhamento está liberado'
              : 'Assine para liberar suas análises por foto'}
          </Text>

          <Text style={styles.subtitle}>
            {plan === 'premium'
              ? 'Você já pode analisar refeições, salvar seu histórico e acompanhar suas metas diariamente.'
              : 'Suas metas já foram configuradas. Para usar o NutriSnap no dia a dia, libere a análise nutricional automática por foto.'}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusLabel}>Plano atual</Text>
            <Text style={styles.statusValue}>
              {plan === 'premium' ? 'Premium' : 'Aguardando assinatura'}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {plan === 'premium' ? 'Ativo' : 'Bloqueado'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Premium libera</Text>

          <PremiumItem
            icon="camera-outline"
            title="Análises por foto"
            description="Envie fotos das suas refeições e receba uma análise nutricional automática."
          />

          <PremiumItem
            icon="restaurant-outline"
            title="Diário alimentar visual"
            description="Salve refeições e acompanhe sua alimentação de forma organizada."
          />

          <PremiumItem
            icon="stats-chart-outline"
            title="Controle de metas"
            description="Acompanhe calorias, proteínas e evolução diária."
          />

          <PremiumItem
            icon="calendar-outline"
            title="Histórico completo"
            description="Revise seus registros e mantenha consistência na rotina."
          />
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Plano mensal</Text>

          <View style={styles.priceRow}>
            <Text style={styles.currency}>R$</Text>
            <Text style={styles.price}>19,90</Text>
            <Text style={styles.period}>/mês</Text>
          </View>

          <Text style={styles.priceDescription}>
            Libere o acompanhamento alimentar visual com análise nutricional por foto.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, activating && styles.buttonDisabled]}
          onPress={plan === 'premium' ? () => navigation.replace('MainTabs') : handleSubscribe}
          activeOpacity={0.88}
          disabled={activating}
        >
          {activating ? (
            <ActivityIndicator color="#07110B" />
          ) : (
            <>
              <Ionicons
                name={plan === 'premium' ? 'restaurant' : 'diamond'}
                size={21}
                color="#07110B"
              />
              <Text style={styles.primaryButtonText}>
                {plan === 'premium' ? 'Entrar no app' : 'Assinar Premium'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {plan !== 'premium' && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContinueWithoutPremium}
            activeOpacity={0.82}
          >
            <Text style={styles.secondaryButtonText}>Continuar sem assinar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.disclaimerButton}
          onPress={showDisclaimer}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle-outline" size={18} color="#64748B" />
          <Text style={styles.disclaimerText}>Aviso nutricional</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

function PremiumItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.premiumItem}>
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={22} color="#22C55E" />
      </View>

      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 60,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#263244',
    marginBottom: 24,
  },

  hero: {
    marginBottom: 24,
  },

  iconHero: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },

  kicker: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 10,
  },

  title: {
    color: '#F8FAFC',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 43,
    marginBottom: 14,
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 25,
  },

  statusCard: {
    backgroundColor: '#111827',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#263244',
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },

  statusValue: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
  },

  statusBadge: {
    backgroundColor: '#0B1020',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#263244',
  },

  statusBadgeText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '900',
  },

  card: {
    backgroundColor: '#111827',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: '#263244',
    marginBottom: 18,
  },

  cardTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 18,
  },

  premiumItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  itemIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#263244',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  itemContent: {
    flex: 1,
  },

  itemTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 5,
  },

  itemDescription: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },

  priceCard: {
    backgroundColor: '#13251B',
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: '#22C55E',
    marginBottom: 20,
  },

  priceLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },

  currency: {
    color: '#22C55E',
    fontSize: 22,
    fontWeight: '900',
    marginRight: 4,
    marginBottom: 7,
  },

  price: {
    color: '#22C55E',
    fontSize: 48,
    fontWeight: '900',
  },

  period: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 5,
    marginBottom: 9,
  },

  priceDescription: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },

  primaryButton: {
    height: 62,
    borderRadius: 21,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  buttonDisabled: {
    opacity: 0.75,
  },

  primaryButtonText: {
    color: '#07110B',
    fontSize: 16,
    fontWeight: '900',
  },

  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  secondaryButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '800',
  },

  disclaimerButton: {
    marginTop: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  disclaimerText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
});