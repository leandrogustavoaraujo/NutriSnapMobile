import React, { useRef, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { getAuth } from 'firebase/auth';

import {
  saveMeal,
  canUserAnalyzeToday,
  incrementDailyAnalysisCount,
} from '../services/firestore';

const API_URL = 'https://food-analyzer-wexy.onrender.com/analyze';

export default function AnalyzeScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [limitInfo, setLimitInfo] = useState<any>(null);

  const savingRef = useRef(false);
  const analyzingRef = useRef(false);

  async function checkAnalysisPermission() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
      navigation.replace('Login');
      return false;
    }

    const permission = await canUserAnalyzeToday(user.uid);
    setLimitInfo(permission);

    if (!permission.allowed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      Alert.alert(
        'Limite diário atingido',
        'Você já usou suas 2 análises gratuitas de hoje. Assine o Premium para continuar usando a análise nutricional por foto sem limite diário.',
        [
          {
            text: 'Agora não',
            style: 'cancel',
          },
          {
            text: 'Ver Premium',
            onPress: () => navigation.navigate('Premium'),
          },
        ]
      );

      return false;
    }

    return true;
  }

  async function openImageOptions() {
    try {
      Haptics.selectionAsync();

      const allowed = await checkAnalysisPermission();

      if (!allowed) return;

      Alert.alert(
        'Selecionar imagem',
        'Escolha uma opção',
        [
          {
            text: 'Câmera',
            onPress: async () => {
              const permission = await ImagePicker.requestCameraPermissionsAsync();

              if (!permission.granted) {
                Alert.alert('Permissão necessária', 'Permita o acesso à câmera.');
                return;
              }

              const response = await ImagePicker.launchCameraAsync({
                quality: 0.7,
                allowsEditing: true,
              });

              if (response.canceled) return;

              await handleImage(response.assets[0].uri);
            },
          },
          {
            text: 'Galeria',
            onPress: async () => {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

              if (!permission.granted) {
                Alert.alert('Permissão necessária', 'Permita o acesso à galeria.');
                return;
              }

              const response = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: true,
              });

              if (response.canceled) return;

              await handleImage(response.assets[0].uri);
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.log('Erro ao abrir seletor:', error);

      Alert.alert(
        'Erro',
        'Não foi possível abrir a câmera ou galeria agora.'
      );
    }
  }

  async function handleImage(uri: string) {
    const allowed = await checkAnalysisPermission();

    if (!allowed) return;

    setImage(uri);
    setResult(null);
    setSaved(false);
    setError(null);

    await analyzeImage(uri);
  }

  async function analyzeImage(uri: string, retry = false) {
    try {
      if (analyzingRef.current && !retry) return;

      analyzingRef.current = true;

      setLoading(true);

      if (retry) {
        setRetrying(true);
      }

      const formData = new FormData();

      formData.append('image', {
        uri,
        name: 'meal.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 503 && !retry) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        return await analyzeImage(uri, true);
      }

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('BACKEND:', data);

      const analysis = data?.data || data?.result || data?.analysis || data;

      if (!analysis) {
        throw new Error('Resposta inválida');
      }

      const auth = getAuth();
      const user = auth.currentUser;

      if (user && !retry) {
        const nextCount = await incrementDailyAnalysisCount(user.uid);

        setLimitInfo((current: any) => ({
          ...(current || {}),
          count: nextCount,
          remaining:
            current?.limit !== null && current?.limit !== undefined
              ? Math.max(Number(current.limit) - nextCount, 0)
              : null,
        }));
      }

      setResult(analysis);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.log('Erro na análise:', err);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setError(
        'Não foi possível concluir a análise nutricional. Tente novamente.'
      );
    } finally {
      setLoading(false);
      setRetrying(false);
      analyzingRef.current = false;
    }
  }

  async function handleSave() {
    try {
      if (!result || saved || savingRef.current) return;

      savingRef.current = true;

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
        navigation.replace('Login');
        return;
      }

      await saveMeal({
        ...result,
        calorias: result.calorias_total || result.calorias || 0,
        proteinas: result.proteinas_total || result.proteinas || 0,
        imageUri: image,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
      });

      setSaved(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Refeição salva',
        'Sua refeição foi adicionada ao histórico.'
      );
    } catch (error) {
      console.log('Erro ao salvar refeição:', error);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert('Erro', 'Não foi possível salvar a refeição.');
    } finally {
      savingRef.current = false;
    }
  }

  function resetAnalysis() {
    setImage(null);
    setResult(null);
    setSaved(false);
    setError(null);
  }

  const calories = result?.calorias_total || result?.calorias || 0;
  const proteins = result?.proteinas_total || result?.proteinas || 0;
  const confidence = result?.confianca || 'Alta';

  const freeRemaining =
    limitInfo?.remaining !== null && limitInfo?.remaining !== undefined
      ? limitInfo.remaining
      : null;

  return (
    <LinearGradient colors={['#070A12', '#0B1020']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Seu nutricionista portátil</Text>

          <Text style={styles.title}>Analisar refeição</Text>

          <Text style={styles.subtitle}>
            Tire uma foto e receba uma análise nutricional automática da sua refeição.
          </Text>
        </View>

        <View style={styles.limitCard}>
          <View style={styles.limitIcon}>
            <Ionicons name="camera-outline" size={21} color="#22C55E" />
          </View>

          <View style={styles.limitContent}>
            <Text style={styles.limitTitle}>
              {limitInfo?.plan === 'premium' ? 'Premium ativo' : 'Experiência Free'}
            </Text>

            <Text style={styles.limitText}>
              {limitInfo?.plan === 'premium'
                ? 'Você pode fazer análises sem limite diário.'
                : freeRemaining === null
                  ? 'Você tem 2 análises gratuitas por dia para testar o NutriSnap.'
                  : `${freeRemaining} análise${freeRemaining === 1 ? '' : 's'} gratuita${freeRemaining === 1 ? '' : 's'} restante${freeRemaining === 1 ? '' : 's'} hoje.`}
            </Text>
          </View>

          {limitInfo?.plan !== 'premium' && (
            <TouchableOpacity
              style={styles.premiumMiniButton}
              onPress={() => navigation.navigate('Premium')}
              activeOpacity={0.85}
            >
              <Text style={styles.premiumMiniText}>Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {!image && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.uploadCard}
            onPress={openImageOptions}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.uploadIcon}
            >
              <Ionicons name="camera" size={38} color="#FFFFFF" />
            </LinearGradient>

            <Text style={styles.uploadTitle}>Fotografar refeição</Text>

            <Text style={styles.uploadDescription}>
              Controle alimentar visual de forma simples e rápida.
            </Text>

            <View style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Escolher imagem</Text>
            </View>
          </TouchableOpacity>
        )}

        {image && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.image} />

            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={openImageOptions}
            >
              <Ionicons name="images-outline" size={18} color="#FFFFFF" />

              <Text style={styles.changeImageText}>Alterar foto</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#22C55E" />

            <Text style={styles.loadingTitle}>Analisando refeição...</Text>

            <Text style={styles.loadingDescription}>
              {retrying
                ? 'Servidor ocupado. Tentando novamente automaticamente.'
                : 'Estamos processando sua refeição.'}
            </Text>
          </View>
        )}

        {!!error && !loading && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={42} color="#EF4444" />

            <Text style={styles.errorTitle}>Não foi possível analisar</Text>

            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => image && handleImage(image)}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {result && !loading && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.mealName}>
                  {result?.prato || 'Refeição analisada'}
                </Text>

                <Text style={styles.confidence}>
                  Confiança da análise: {confidence}
                </Text>
              </View>

              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>Calorias</Text>

                <Text style={styles.value}>{Math.round(Number(calories))}</Text>

                <Text style={styles.unit}>kcal</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.label}>Proteínas</Text>

                <Text style={styles.value}>{Math.round(Number(proteins))}</Text>

                <Text style={styles.unit}>gramas</Text>
              </View>
            </View>

            <View style={styles.observationCard}>
              <Text style={styles.observationTitle}>
                Observações nutricionais
              </Text>

              <Text style={styles.description}>
                {result?.observacao || 'Análise concluída com sucesso.'}
              </Text>
            </View>

            <TouchableOpacity
              disabled={saved}
              style={[
                styles.saveButton,
                saved && {
                  backgroundColor: '#14532D',
                },
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {saved ? 'Salvo no histórico' : 'Salvar refeição'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newButton} onPress={resetAnalysis}>
              <Text style={styles.newButtonText}>Nova análise</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingTop: 70,
    paddingHorizontal: 22,
    paddingBottom: 140,
  },

  header: {
    marginBottom: 18,
  },

  kicker: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 25,
    marginTop: 12,
  },

  limitCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#263244',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  limitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#263244',
  },

  limitContent: {
    flex: 1,
  },

  limitTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },

  limitText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },

  premiumMiniButton: {
    backgroundColor: '#22C55E',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 10,
  },

  premiumMiniText: {
    color: '#07110B',
    fontSize: 12,
    fontWeight: '900',
  },

  uploadCard: {
    backgroundColor: '#111827',
    borderRadius: 34,
    padding: 34,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#263244',
  },

  uploadIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },

  uploadDescription: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    fontSize: 15,
  },

  uploadButton: {
    marginTop: 24,
    backgroundColor: '#22C55E',
    borderRadius: 18,
    height: 54,
    paddingHorizontal: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },

  uploadButtonText: {
    color: '#07110B',
    fontSize: 15,
    fontWeight: '900',
  },

  imageWrapper: {
    position: 'relative',
    marginBottom: 24,
  },

  image: {
    width: '100%',
    height: 320,
    borderRadius: 30,
    backgroundColor: '#0B1020',
  },

  changeImageButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },

  changeImageText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  loadingCard: {
    backgroundColor: '#111827',
    borderRadius: 28,
    padding: 34,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#263244',
  },

  loadingTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 20,
  },

  loadingDescription: {
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },

  errorCard: {
    backgroundColor: '#111827',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B1D1D',
  },

  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 16,
  },

  errorText: {
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },

  retryButton: {
    marginTop: 24,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  resultCard: {
    backgroundColor: '#111827',
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: '#263244',
  },

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  mealName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    maxWidth: 260,
  },

  confidence: {
    color: '#94A3B8',
    fontSize: 13,
  },

  successBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0B1020',
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },

  infoBox: {
    flex: 1,
    backgroundColor: '#0B1020',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#263244',
  },

  label: {
    color: '#94A3B8',
    marginBottom: 12,
    fontSize: 13,
  },

  value: {
    color: '#22C55E',
    fontSize: 34,
    fontWeight: '900',
  },

  unit: {
    color: '#94A3B8',
    marginTop: 6,
    fontSize: 13,
  },

  observationCard: {
    backgroundColor: '#0B1020',
    borderRadius: 24,
    padding: 20,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#263244',
  },

  observationTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 12,
    fontSize: 15,
  },

  description: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 24,
  },

  saveButton: {
    backgroundColor: '#22C55E',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#07110B',
    fontWeight: '900',
    fontSize: 16,
  },

  newButton: {
    marginTop: 18,
    alignItems: 'center',
  },

  newButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '800',
  },
});