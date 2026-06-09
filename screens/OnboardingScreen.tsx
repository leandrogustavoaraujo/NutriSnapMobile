import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getAuth } from 'firebase/auth';
import { saveUserGoals } from '../services/firestore';

type GoalType = 'lose' | 'maintain' | 'gain';
type ActivityLevel = 'low' | 'moderate' | 'high';
type SexType = 'male' | 'female';

export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(1);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<SexType>('male');

  const [goal, setGoal] = useState<GoalType>('maintain');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');

  const [manualCalories, setManualCalories] = useState('');
  const [manualProteins, setManualProteins] = useState('');

  const [saving, setSaving] = useState(false);

  function sanitizeNumber(value: string) {
    return value.replace(',', '.').replace(/[^0-9.]/g, '');
  }

  function getActivityMultiplier() {
    if (activity === 'low') return 1.35;
    if (activity === 'moderate') return 1.55;
    return 1.75;
  }

  function getGoalCalorieAdjustment(maintenanceCalories: number) {
    if (goal === 'lose') {
      return maintenanceCalories * 0.85;
    }

    if (goal === 'gain') {
      return maintenanceCalories * 1.1;
    }

    return maintenanceCalories;
  }

  function getProteinMultiplier() {
    if (goal === 'lose') return 2.0;
    if (goal === 'gain') return 1.8;
    return 1.6;
  }

  const estimatedGoals = useMemo(() => {
    const weightNumber = Number(sanitizeNumber(weight));
    const heightNumber = Number(sanitizeNumber(height));
    const ageNumber = Number(sanitizeNumber(age));

    if (!weightNumber || !heightNumber || !ageNumber) {
      return {
        bmr: 0,
        maintenance: 0,
        calories: 2500,
        proteins: 160,
      };
    }

    const sexConstant = sex === 'male' ? 5 : -161;

    const bmr =
      10 * weightNumber +
      6.25 * heightNumber -
      5 * ageNumber +
      sexConstant;

    const maintenance = bmr * getActivityMultiplier();

    const calories = getGoalCalorieAdjustment(maintenance);

    const proteins = weightNumber * getProteinMultiplier();

    return {
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenance),
      calories: Math.round(Math.max(calories, 1200)),
      proteins: Math.round(Math.max(proteins, 50)),
    };
  }, [weight, height, age, sex, goal, activity]);

  const finalGoals = useMemo(() => {
    return {
      calories: manualCalories
        ? Number(sanitizeNumber(manualCalories))
        : estimatedGoals.calories,
      proteins: manualProteins
        ? Number(sanitizeNumber(manualProteins))
        : estimatedGoals.proteins,
    };
  }, [manualCalories, manualProteins, estimatedGoals]);

  function validatePhysicalData() {
    const weightNumber = Number(sanitizeNumber(weight));
    const heightNumber = Number(sanitizeNumber(height));
    const ageNumber = Number(sanitizeNumber(age));

    if (!weightNumber || weightNumber < 30 || weightNumber > 300) {
      Alert.alert('Peso inválido', 'Informe um peso válido entre 30kg e 300kg.');
      return false;
    }

    if (!heightNumber || heightNumber < 100 || heightNumber > 250) {
      Alert.alert('Altura inválida', 'Informe uma altura válida entre 100cm e 250cm.');
      return false;
    }

    if (!ageNumber || ageNumber < 13 || ageNumber > 90) {
      Alert.alert('Idade inválida', 'Informe uma idade válida.');
      return false;
    }

    return true;
  }

  function validateManualGoals() {
    const caloriesNumber = Number(finalGoals.calories);
    const proteinsNumber = Number(finalGoals.proteins);

    if (!caloriesNumber || caloriesNumber < 800 || caloriesNumber > 8000) {
      Alert.alert(
        'Meta calórica inválida',
        'Informe uma meta entre 800 e 8000 kcal.'
      );

      return false;
    }

    if (!proteinsNumber || proteinsNumber < 20 || proteinsNumber > 400) {
      Alert.alert(
        'Meta proteica inválida',
        'Informe uma meta entre 20g e 400g de proteína.'
      );

      return false;
    }

    return true;
  }

  function handleNext() {
    Haptics.selectionAsync();

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!validatePhysicalData()) return;
      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(4);
      return;
    }

    if (step === 4) {
      setManualCalories(String(estimatedGoals.calories));
      setManualProteins(String(estimatedGoals.proteins));
      setStep(5);
      return;
    }
  }

  function handleBack() {
    Haptics.selectionAsync();

    if (step === 1) return;
    setStep((current) => current - 1);
  }

  async function handleFinish() {
    try {
      if (!validatePhysicalData()) return;
      if (!validateManualGoals()) return;

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
        navigation.replace('Login');
        return;
      }

      setSaving(true);

      const payload = {
        calorieGoal: Number(finalGoals.calories),
        proteinGoal: Number(finalGoals.proteins),

        estimatedCalorieGoal: estimatedGoals.calories,
        estimatedProteinGoal: estimatedGoals.proteins,
        estimatedBmr: estimatedGoals.bmr,
        estimatedMaintenanceCalories: estimatedGoals.maintenance,
        estimationFormula: 'Mifflin-St Jeor',

        weight: Number(sanitizeNumber(weight)),
        height: Number(sanitizeNumber(height)),
        age: Number(sanitizeNumber(age)),
        sex,
        objective: goal,
        activityLevel: activity,

        plan: 'free',
        dailyAnalysisCount: 0,
        dailyAnalysisDate: new Date().toISOString().split('T')[0],
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };

      await saveUserGoals(user.uid, payload);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.replace('Premium');
    } catch (error) {
      console.log('Erro ao finalizar onboarding:', error);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Erro',
        'Não foi possível salvar suas metas agora. Tente novamente.'
      );
    } finally {
      setSaving(false);
    }
  }

  const progress = `${step}/5`;

  return (
    <LinearGradient colors={['#070A12', '#0B1020']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topBar}>
              {step > 1 ? (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
                </TouchableOpacity>
              ) : (
                <View style={styles.backPlaceholder} />
              )}

              <Text style={styles.progress}>{progress}</Text>
            </View>

            {step === 1 && (
              <View>
                <View style={styles.iconHero}>
                  <Ionicons name="restaurant-outline" size={44} color="#07110B" />
                </View>

                <Text style={styles.kicker}>Seu nutricionista portátil</Text>

                <Text style={styles.title}>
                  Configure seu acompanhamento alimentar
                </Text>

                <Text style={styles.description}>
                  Primeiro vamos estimar suas metas de calorias e proteínas. Depois você poderá ajustar os valores manualmente antes de assinar.
                </Text>

                <View style={styles.featureList}>
                  <FeatureItem icon="calculator-outline" text="Estimativa baseada em peso, altura, idade e objetivo" />
                  <FeatureItem icon="create-outline" text="Você pode alterar as metas antes de salvar" />
                  <FeatureItem icon="camera-outline" text="Análise de refeições liberada no Premium" />
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.kicker}>Dados iniciais</Text>

                <Text style={styles.title}>
                  Vamos estimar suas metas
                </Text>

                <Text style={styles.description}>
                  Quanto mais completos os dados, melhor será a estimativa inicial.
                </Text>

                <Text style={styles.label}>Peso atual</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholder="Ex: 82"
                    placeholderTextColor="#64748B"
                  />
                  <Text style={styles.inputUnit}>kg</Text>
                </View>

                <Text style={styles.label}>Altura</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="Ex: 177"
                    placeholderTextColor="#64748B"
                  />
                  <Text style={styles.inputUnit}>cm</Text>
                </View>

                <Text style={styles.label}>Idade</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholder="Ex: 25"
                    placeholderTextColor="#64748B"
                  />
                  <Text style={styles.inputUnit}>anos</Text>
                </View>

                <Text style={styles.label}>Sexo biológico para estimativa metabólica</Text>

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
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={styles.kicker}>Objetivo</Text>

                <Text style={styles.title}>
                  Qual é seu foco agora?
                </Text>

                <Text style={styles.description}>
                  O objetivo ajusta a meta calórica estimada.
                </Text>

                <OptionCard
                  title="Emagrecer"
                  description="Estimativa com déficit moderado de aproximadamente 15%."
                  icon="trending-down-outline"
                  active={goal === 'lose'}
                  onPress={() => setGoal('lose')}
                />

                <OptionCard
                  title="Manter"
                  description="Estimativa próxima ao gasto diário total."
                  icon="remove-outline"
                  active={goal === 'maintain'}
                  onPress={() => setGoal('maintain')}
                />

                <OptionCard
                  title="Ganhar massa"
                  description="Estimativa com superávit moderado de aproximadamente 10%."
                  icon="trending-up-outline"
                  active={goal === 'gain'}
                  onPress={() => setGoal('gain')}
                />
              </View>
            )}

            {step === 4 && (
              <View>
                <Text style={styles.kicker}>Rotina</Text>

                <Text style={styles.title}>
                  Como é seu nível de atividade?
                </Text>

                <Text style={styles.description}>
                  O nível de atividade ajusta sua estimativa de gasto diário.
                </Text>

                <OptionCard
                  title="Baixo"
                  description="Pouco exercício ou rotina mais parada."
                  icon="walk-outline"
                  active={activity === 'low'}
                  onPress={() => setActivity('low')}
                />

                <OptionCard
                  title="Moderado"
                  description="Treina algumas vezes na semana."
                  icon="bicycle-outline"
                  active={activity === 'moderate'}
                  onPress={() => setActivity('moderate')}
                />

                <OptionCard
                  title="Alto"
                  description="Treina com frequência ou tem rotina intensa."
                  icon="barbell-outline"
                  active={activity === 'high'}
                  onPress={() => setActivity('high')}
                />

                <View style={styles.resultBox}>
                  <Text style={styles.resultLabel}>Prévia da estimativa</Text>

                  <View style={styles.resultRow}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultValue}>{estimatedGoals.calories}</Text>
                      <Text style={styles.resultUnit}>kcal/dia</Text>
                    </View>

                    <View style={styles.resultDivider} />

                    <View style={styles.resultItem}>
                      <Text style={styles.resultValue}>{estimatedGoals.proteins}g</Text>
                      <Text style={styles.resultUnit}>proteína/dia</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {step === 5 && (
              <View>
                <Text style={styles.kicker}>Metas finais</Text>

                <Text style={styles.title}>
                  Ajuste antes de salvar
                </Text>

                <Text style={styles.description}>
                  Estas são metas iniciais estimadas. Você pode editar agora ou ajustar depois no perfil.
                </Text>

                <View style={styles.estimationCard}>
                  <View style={styles.estimationLine}>
                    <Text style={styles.estimationLabel}>Fórmula</Text>
                    <Text style={styles.estimationValue}>Mifflin-St Jeor</Text>
                  </View>

                  <View style={styles.estimationLine}>
                    <Text style={styles.estimationLabel}>Metabolismo basal estimado</Text>
                    <Text style={styles.estimationValue}>{estimatedGoals.bmr} kcal</Text>
                  </View>

                  <View style={styles.estimationLine}>
                    <Text style={styles.estimationLabel}>Manutenção estimada</Text>
                    <Text style={styles.estimationValue}>{estimatedGoals.maintenance} kcal</Text>
                  </View>
                </View>

                <Text style={styles.label}>Meta diária de calorias</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={manualCalories}
                    onChangeText={setManualCalories}
                    keyboardType="numeric"
                    placeholder={String(estimatedGoals.calories)}
                    placeholderTextColor="#64748B"
                  />
                  <Text style={styles.inputUnit}>kcal</Text>
                </View>

                <Text style={styles.label}>Meta diária de proteínas</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={manualProteins}
                    onChangeText={setManualProteins}
                    keyboardType="numeric"
                    placeholder={String(estimatedGoals.proteins)}
                    placeholderTextColor="#64748B"
                  />
                  <Text style={styles.inputUnit}>g</Text>
                </View>

                <Text style={styles.note}>
                  As metas são estimativas iniciais e não substituem acompanhamento profissional individualizado.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={step === 5 ? handleFinish : handleNext}
              activeOpacity={0.88}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#07110B" />
              ) : (
                <Text style={styles.buttonText}>
                  {step === 5 ? 'Salvar metas e ver Premium' : 'Continuar'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function FeatureItem({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={20} color="#22C55E" />
      </View>

      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function OptionCard({
  title,
  description,
  icon,
  active,
  onPress,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.optionCard, active && styles.optionCardActive]}
    >
      <View style={[styles.optionIcon, active && styles.optionIconActive]}>
        <Ionicons name={icon} size={23} color={active ? '#07110B' : '#22C55E'} />
      </View>

      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>

      <Ionicons
        name={active ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={active ? '#22C55E' : '#64748B'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 42,
    justifyContent: 'space-between',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#263244',
  },

  backPlaceholder: {
    width: 44,
    height: 44,
  },

  progress: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
  },

  iconHero: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
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
    fontSize: 35,
    fontWeight: '900',
    lineHeight: 42,
    marginBottom: 16,
  },

  description: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 28,
  },

  featureList: {
    gap: 12,
    marginBottom: 30,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#263244',
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  featureText: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },

  label: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },

  inputWrapper: {
    height: 60,
    backgroundColor: '#111827',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#263244',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },

  inputUnit: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 14,
  },

  twoColumns: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },

  choiceButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#111827',
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

  optionCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#263244',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  optionCardActive: {
    borderColor: '#22C55E',
    backgroundColor: '#13251B',
  },

  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0B1020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#263244',
  },

  optionIconActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 5,
  },

  optionDescription: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },

  resultBox: {
    backgroundColor: '#111827',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#263244',
    padding: 20,
    marginTop: 8,
    marginBottom: 30,
  },

  resultLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 16,
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  resultItem: {
    flex: 1,
    alignItems: 'center',
  },

  resultValue: {
    color: '#22C55E',
    fontSize: 28,
    fontWeight: '900',
  },

  resultUnit: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '700',
  },

  resultDivider: {
    width: 1,
    height: 46,
    backgroundColor: '#263244',
  },

  estimationCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#263244',
    marginBottom: 20,
  },

  estimationLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 12,
  },

  estimationLabel: {
    color: '#94A3B8',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  estimationValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '900',
  },

  note: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 24,
  },

  button: {
    backgroundColor: '#22C55E',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#07110B',
    fontSize: 17,
    fontWeight: '900',
  },
});