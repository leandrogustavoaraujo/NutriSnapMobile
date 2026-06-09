import React, { useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getAuth, signOut } from 'firebase/auth';

import {
  saveUserGoals,
  getUserGoals,
} from '../services/firestore';

type SexType = 'male' | 'female';
type GoalType = 'lose' | 'maintain' | 'gain';
type ActivityLevel = 'low' | 'moderate' | 'high';

type ProfileData = {
  calorieGoal?: number;
  proteinGoal?: number;
  estimatedCalorieGoal?: number;
  estimatedProteinGoal?: number;
  estimatedBmr?: number;
  estimatedMaintenanceCalories?: number;
  estimationFormula?: string;
  weight?: number;
  height?: number;
  age?: number;
  sex?: SexType;
  objective?: GoalType;
  activityLevel?: ActivityLevel;
  plan?: string;
  dailyAnalysisCount?: number;
};

export default function ProfileScreen({ navigation }: any) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [calories, setCalories] = useState('2500');
  const [proteins, setProteins] = useState('180');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<SexType>('male');
  const [objective, setObjective] = useState<GoalType>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  const [estimatedCalorieGoal, setEstimatedCalorieGoal] = useState(0);
  const [estimatedProteinGoal, setEstimatedProteinGoal] = useState(0);
  const [estimatedBmr, setEstimatedBmr] = useState(0);
  const [estimatedMaintenanceCalories, setEstimatedMaintenanceCalories] = useState(0);
  const [estimationFormula, setEstimationFormula] = useState('Mifflin-St Jeor');

  const [plan, setPlan] = useState('free');
  const [dailyAnalysisCount, setDailyAnalysisCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      if (!user) return;

      const data: ProfileData = await getUserGoals(user.uid);

      setCalories(String(data?.calorieGoal || 2500));
      setProteins(String(data?.proteinGoal || 180));
      setWeight(data?.weight ? String(data.weight) : '');
      setHeight(data?.height ? String(data.height) : '');
      setAge(data?.age ? String(data.age) : '');
      setSex(data?.sex || 'male');
      setObjective(data?.objective || 'maintain');
      setActivityLevel(data?.activityLevel || 'moderate');

      setEstimatedCalorieGoal(Number(data?.estimatedCalorieGoal || 0));
      setEstimatedProteinGoal(Number(data?.estimatedProteinGoal || 0));
      setEstimatedBmr(Number(data?.estimatedBmr || 0));
      setEstimatedMaintenanceCalories(Number(data?.estimatedMaintenanceCalories || 0));
      setEstimationFormula(data?.estimationFormula || 'Mifflin-St Jeor');

      setPlan(data?.plan || 'free');
      setDailyAnalysisCount(Number(data?.dailyAnalysisCount || 0));
    } catch (error) {
      console.log('Erro ao carregar perfil:', error);

      Alert.alert(
        'Erro',
        'Não foi possível carregar os dados do seu perfil.'
      );
    } finally {
      setLoading(false);
    }
  }

  function sanitizeNumber(value: string) {
    return value.replace(',', '.').replace(/[^0-9.]/g, '');
  }

  function validateFields() {
    const calorieNumber = Number(sanitizeNumber(calories));
    const proteinNumber = Number(sanitizeNumber(proteins));
    const weightNumber = Number(sanitizeNumber(weight));
    const heightNumber = Number(sanitizeNumber(height));
    const ageNumber = Number(sanitizeNumber(age));

    if (!calorieNumber || calorieNumber < 800 || calorieNumber > 8000) {
      Alert.alert(
        'Meta inválida',
        'Informe uma meta calórica entre 800 e 8000 kcal.'
      );

      return false;
    }

    if (!proteinNumber || proteinNumber < 20 || proteinNumber > 400) {
      Alert.alert(
        'Meta inválida',
        'Informe uma meta de proteínas entre 20g e 400g.'
      );

      return false;
    }

    if (weight && (!weightNumber || weightNumber < 30 || weightNumber > 300)) {
      Alert.alert(
        'Peso inválido',
        'Informe um peso válido entre 30kg e 300kg.'
      );

      return false;
    }

    if (height && (!heightNumber || heightNumber < 100 || heightNumber > 250)) {
      Alert.alert(
        'Altura inválida',
        'Informe uma altura válida entre 100cm e 250cm.'
      );

      return false;
    }

    if (age && (!ageNumber || ageNumber < 13 || ageNumber > 90)) {
      Alert.alert(
        'Idade inválida',
        'Informe uma idade válida.'
      );

      return false;
    }

    return true;
  }

  async function handleSave() {
    try {
      if (!user || saving) return;

      if (!validateFields()) return;

      setSaving(true);

      const payload = {
        calorieGoal: Number(sanitizeNumber(calories)),
        proteinGoal: Number(sanitizeNumber(proteins)),
        weight: weight ? Number(sanitizeNumber(weight)) : null,
        height: height ? Number(sanitizeNumber(height)) : null,
        age: age ? Number(sanitizeNumber(age)) : null,
        sex,
        objective,
        activityLevel,
        updatedAt: new Date().toISOString(),
      };

      await saveUserGoals(user.uid, payload);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Perfil atualizado',
        'Suas metas e dados pessoais foram salvos com sucesso.'
      );
    } catch (error) {
      console.log('Erro ao salvar perfil:', error);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Erro',
        'Não foi possível salvar seu perfil agora.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert(
      'Sair da conta',
      'Deseja realmente sair do NutriSnap?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            navigation.replace('Login');
          },
        },
      ]
    );
  }

  function showNutritionDisclaimer() {
    Alert.alert(
      'Aviso nutricional',
      'As metas e análises do NutriSnap são estimativas para acompanhamento alimentar e não substituem avaliação individual feita por nutricionista, médico ou outro profissional habilitado.'
    );
  }

  function showPrivacyInfo() {
    Alert.alert(
      'Privacidade',
      'O NutriSnap utiliza seus dados de perfil e refeições para exibir metas, histórico e acompanhamento dentro do aplicativo.'
    );
  }

  const initial = useMemo(() => {
    return user?.email?.charAt(0).toUpperCase() || 'N';
  }, [user?.email]);

  const planLabel = plan === 'premium' ? 'Premium' : 'Aguardando assinatura';

  const objectiveLabel = useMemo(() => {
    if (objective === 'lose') return 'Emagrecer';
    if (objective === 'gain') return 'Ganhar massa';
    return 'Manter';
  }, [objective]);

  const activityLabel = useMemo(() => {
    if (activityLevel === 'low') return 'Baixo';
    if (activityLevel === 'high') return 'Alto';
    return 'Moderado';
  }, [activityLevel]);

  const sexLabel = sex === 'male' ? 'Masculino' : 'Feminino';

  const imc = useMemo(() => {
    const weightNumber = Number(sanitizeNumber(weight));
    const heightNumber = Number(sanitizeNumber(height));

    if (!weightNumber || !heightNumber) return null;

    const heightInMeters = heightNumber / 100;

    return weightNumber / (heightInMeters * heightInMeters);
  }, [weight, height]);

  if (loading) {
    return (
      <LinearGradient colors={['#070A12', '#0B1020']} style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
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
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <View style={styles.headerText}>
              <Text style={styles.kicker}>Sua conta</Text>
              <Text style={styles.title}>Perfil</Text>
              <Text style={styles.email}>{user?.email || 'Usuário logado'}</Text>
            </View>
          </View>

          <View style={styles.planCard}>
            <View style={styles.planTop}>
              <View style={styles.planIcon}>
                <Ionicons
                  name={plan === 'premium' ? 'diamond-outline' : 'lock-closed-outline'}
                  size={24}
                  color="#22C55E"
                />
              </View>

              <View style={styles.planInfo}>
                <Text style={styles.planLabel}>Plano atual</Text>
                <Text style={styles.planTitle}>{planLabel}</Text>
              </View>

              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>
                  {plan === 'premium' ? 'Ativo' : 'Bloqueado'}
                </Text>
              </View>
            </View>

            <Text style={styles.planText}>
              {plan === 'premium'
                ? 'Você tem acesso liberado à análise nutricional automática por foto e ao acompanhamento alimentar.'
                : 'Assine o Premium para liberar a análise nutricional automática por foto e usar o NutriSnap no dia a dia.'}
            </Text>

            <View style={styles.planStats}>
              <View style={styles.planStatItem}>
                <Text style={styles.planStatValue}>{dailyAnalysisCount}</Text>
                <Text style={styles.planStatLabel}>análises hoje</Text>
              </View>

              <View style={styles.planDivider} />

              <View style={styles.planStatItem}>
                <Text style={styles.planStatValue}>
                  {plan === 'premium' ? 'Liberado' : 'Premium'}
                </Text>
                <Text style={styles.planStatLabel}>acesso</Text>
              </View>
            </View>

            {plan !== 'premium' && (
              <TouchableOpacity
                style={styles.planButton}
                onPress={() => navigation.navigate('Premium')}
                activeOpacity={0.88}
              >
                <Text style={styles.planButtonText}>Ver plano Premium</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.cardTitle}>Metas diárias</Text>
                <Text style={styles.cardSubtitle}>
                  Você pode alterar os valores estimados pelo app.
                </Text>
              </View>

              <Ionicons name="flag-outline" size={24} color="#22C55E" />
            </View>

            <Text style={styles.label}>Calorias por dia</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
                placeholder="2500"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.inputUnit}>kcal</Text>
            </View>

            <Text style={styles.label}>Proteínas por dia</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={proteins}
                onChangeText={setProteins}
                placeholder="180"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.inputUnit}>g</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#07110B" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={21} color="#07110B" />
                  <Text style={styles.buttonText}>Salvar metas</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.cardTitle}>Dados pessoais</Text>
                <Text style={styles.cardSubtitle}>
                  Informações usadas na estimativa inicial.
                </Text>
              </View>

              <Ionicons name="person-outline" size={24} color="#22C55E" />
            </View>

            <Text style={styles.label}>Peso atual</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
                placeholder="Ex: 82"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <Text style={styles.label}>Altura</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
                placeholder="Ex: 177"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.inputUnit}>cm</Text>
            </View>

            <Text style={styles.label}>Idade</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                placeholder="Ex: 25"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.inputUnit}>anos</Text>
            </View>

            <Text style={styles.label}>Sexo biológico para estimativa</Text>
            <View style={styles.twoColumns}>
              <TouchableOpacity
                style={[styles.choiceButton, sex === 'male' && styles.choiceButtonActive]}
                onPress={() => setSex('male')}
                activeOpacity={0.86}
              >
                <Text style={[styles.choiceText, sex === 'male' && styles.choiceTextActive]}>
                  Masculino
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceButton, sex === 'female' && styles.choiceButtonActive]}
                onPress={() => setSex('female')}
                activeOpacity={0.86}
              >
                <Text style={[styles.choiceText, sex === 'female' && styles.choiceTextActive]}>
                  Feminino
                </Text>
              </TouchableOpacity>
            </View>

            {imc ? (
              <View style={styles.imcBox}>
                <Text style={styles.imcLabel}>IMC estimado</Text>
                <Text style={styles.imcValue}>{imc.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.cardTitle}>Estimativa inicial</Text>
                <Text style={styles.cardSubtitle}>
                  Dados calculados no onboarding.
                </Text>
              </View>

              <Ionicons name="calculator-outline" size={24} color="#22C55E" />
            </View>

            <InfoRow label="Fórmula" value={estimationFormula || 'Mifflin-St Jeor'} />
            <InfoRow label="Objetivo" value={objectiveLabel} />
            <InfoRow label="Atividade" value={activityLabel} />
            <InfoRow label="Sexo usado no cálculo" value={sexLabel} />
            <InfoRow
              label="Metabolismo basal estimado"
              value={estimatedBmr ? `${estimatedBmr} kcal` : 'Não informado'}
            />
            <InfoRow
              label="Manutenção estimada"
              value={estimatedMaintenanceCalories ? `${estimatedMaintenanceCalories} kcal` : 'Não informado'}
            />
            <InfoRow
              label="Calorias sugeridas"
              value={estimatedCalorieGoal ? `${estimatedCalorieGoal} kcal` : 'Não informado'}
            />
            <InfoRow
              label="Proteínas sugeridas"
              value={estimatedProteinGoal ? `${estimatedProteinGoal}g` : 'Não informado'}
            />

            <Text style={styles.note}>
              As metas são estimativas iniciais. Ajustes individuais podem ser necessários conforme rotina, evolução e orientação profissional.
            </Text>
          </View>

          <View style={styles.legalCard}>
            <TouchableOpacity
              style={styles.legalItem}
              onPress={showNutritionDisclaimer}
              activeOpacity={0.8}
            >
              <Ionicons name="medical-outline" size={21} color="#22C55E" />
              <Text style={styles.legalText}>Aviso nutricional</Text>
              <Ionicons name="chevron-forward" size={19} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.legalDivider} />

            <TouchableOpacity
              style={styles.legalItem}
              onPress={showPrivacyInfo}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark-outline" size={21} color="#22C55E" />
              <Text style={styles.legalText}>Privacidade</Text>
              <Ionicons name="chevron-forward" size={19} color="#64748B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboard: {
    flex: 1,
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

  content: {
    paddingTop: 66,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    gap: 16,
  },

  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#07110B',
    fontSize: 30,
    fontWeight: '900',
  },

  headerText: {
    flex: 1,
  },

  kicker: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 5,
  },

  title: {
    color: '#F8FAFC',
    fontSize: 36,
    fontWeight: '900',
  },

  email: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },

  planCard: {
    backgroundColor: '#111827',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: '#263244',
    marginBottom: 18,
  },

  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  planIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#263244',
    marginRight: 14,
  },

  planInfo: {
    flex: 1,
  },

  planLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 3,
  },

  planTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '900',
  },

  planBadge: {
    backgroundColor: '#0B1020',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#263244',
  },

  planBadgeText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '900',
  },

  planText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
  },

  planStats: {
    marginTop: 18,
    flexDirection: 'row',
    backgroundColor: '#0B1020',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#263244',
    overflow: 'hidden',
  },

  planStatItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },

  planStatValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },

  planStatLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 5,
  },

  planDivider: {
    width: 1,
    backgroundColor: '#263244',
  },

  planButton: {
    marginTop: 18,
    backgroundColor: '#22C55E',
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  planButtonText: {
    color: '#07110B',
    fontSize: 15,
    fontWeight: '900',
  },

  card: {
    backgroundColor: '#111827',
    borderRadius: 30,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#263244',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },

  cardTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 5,
  },

  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },

  label: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '800',
  },

  inputWrapper: {
    backgroundColor: '#0B1020',
    borderRadius: 18,
    height: 58,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#263244',
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },

  inputUnit: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },

  twoColumns: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  choiceButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#0B1020',
    borderWidth: 1,
    borderColor: '#263244',
    alignItems: 'center',
    justifyContent: 'center',
  },

  choiceButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },

  choiceText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '900',
  },

  choiceTextActive: {
    color: '#07110B',
  },

  imcBox: {
    backgroundColor: '#0B1020',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#263244',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  imcLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
  },

  imcValue: {
    color: '#22C55E',
    fontSize: 22,
    fontWeight: '900',
  },

  button: {
    backgroundColor: '#22C55E',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    flexDirection: 'row',
    gap: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#07110B',
    fontWeight: '900',
    fontSize: 16,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#263244',
    paddingBottom: 12,
    marginBottom: 12,
  },

  infoLabel: {
    color: '#94A3B8',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  infoValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
    maxWidth: '45%',
  },

  note: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },

  legalCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#263244',
    marginBottom: 28,
    overflow: 'hidden',
  },

  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },

  legalText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },

  legalDivider: {
    height: 1,
    backgroundColor: '#263244',
    marginLeft: 18,
  },

  logoutButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },

  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '900',
  },
});