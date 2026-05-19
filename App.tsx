import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

export default function App() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#020817',
      }}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{
          padding: 24,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            marginTop: 30,
          }}
        >
          <Image
            source={require('./assets/icon.png')}
            style={{
              width: 90,
              height: 90,
              borderRadius: 24,
              marginBottom: 18,
            }}
          />

          <Text
            style={{
              color: 'white',
              fontSize: 34,
              fontWeight: '800',
              textAlign: 'center',
              lineHeight: 42,
            }}
          >
            Descubra calorias e proteínas apenas com uma foto
          </Text>

          <Text
            style={{
              color: '#94A3B8',
              textAlign: 'center',
              fontSize: 16,
              marginTop: 18,
              lineHeight: 24,
            }}
          >
            Tire uma foto da refeição e receba instantaneamente uma análise nutricional com IA.
          </Text>
        </View>

        <View
          style={{
            marginTop: 40,
            gap: 16,
          }}
        >
          <View
            style={{
              backgroundColor: '#0F172A',
              padding: 20,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: '#1E293B',
            }}
          >
            <Text
              style={{
                color: '#22C55E',
                fontSize: 18,
                fontWeight: '700',
              }}
            >
              Reconhecimento Inteligente
            </Text>

            <Text
              style={{
                color: '#94A3B8',
                marginTop: 10,
                lineHeight: 22,
              }}
            >
              Identificação automática dos alimentos da refeição.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#0F172A',
              padding: 20,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: '#1E293B',
            }}
          >
            <Text
              style={{
                color: '#22C55E',
                fontSize: 18,
                fontWeight: '700',
              }}
            >
              Resultado Instantâneo
            </Text>

            <Text
              style={{
                color: '#94A3B8',
                marginTop: 10,
                lineHeight: 22,
              }}
            >
              Veja calorias, proteínas e observações nutricionais em segundos.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#22C55E',
            height: 58,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 42,
          }}
        >
          <Text
            style={{
              color: '#020817',
              fontSize: 18,
              fontWeight: '800',
            }}
          >
            Entrar com Google
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}