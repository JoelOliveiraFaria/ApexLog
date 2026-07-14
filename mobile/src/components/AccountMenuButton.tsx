import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface AccountMenuButtonProps {
  onPress: () => void;
}

/** Ícone de conta fixo no canto superior direito do ecrã — abre o ecrã de Perfil. */
export function AccountMenuButton({ onPress }: AccountMenuButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonIcon}>👤</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  buttonIcon: {
    fontSize: 20,
  },
});
