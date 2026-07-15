import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, type ColorPalette } from '../theme';

interface AccountMenuButtonProps {
  onPress: () => void;
}

/** Ícone de conta fixo no canto superior direito do ecrã — abre o ecrã de Perfil. */
export function AccountMenuButton({ onPress }: AccountMenuButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonIcon}>👤</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    button: {
      position: 'absolute',
      top: 56,
      right: 24,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    buttonIcon: {
      fontSize: 20,
    },
  });
