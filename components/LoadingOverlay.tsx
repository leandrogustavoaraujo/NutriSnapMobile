import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '../constants/colors';

type Props = {
  visible: boolean;
  text?: string;
};

export default function LoadingOverlay({ visible, text = 'Processando sua refeição...' }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,10,18,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  box: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    width: '78%',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  text: {
    color: colors.text,
    marginTop: 14,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});