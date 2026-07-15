import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { login, register, type AuthResponse } from '../api/apexLogApi';
import { useTheme, type ColorPalette } from '../theme';

interface AuthScreenProps {
  onAuthenticated: (auth: AuthResponse) => void;
}

/** Ecrã de login/registo — primeiro passo obrigatório antes de qualquer outra funcionalidade da app. */
export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const auth = mode === 'login' ? await login(email, password) : await register(name, email, password);
      onAuthenticated(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>APEXLOG <Text style={styles.subtitle}>MOBILE</Text></Text>
        <Text style={styles.description}>
          {mode === 'login' ? 'Entra para começar a gravar viagens.' : 'Cria a tua conta para começar.'}
        </Text>
      </View>

      {mode === 'register' && (
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nome"
          placeholderTextColor={colors.placeholder}
        />
      )}
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.placeholder}
        secureTextEntry
      />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setError(null);
        }}
        style={styles.linkButton}
      >
        <Text style={styles.linkButtonText}>
          {mode === 'login' ? 'Ainda não tens conta? Regista-te' : 'Já tens conta? Entra'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 100,
      paddingHorizontal: 24,
      justifyContent: 'flex-start',
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.textPrimary,
      letterSpacing: 1,
    },
    subtitle: {
      color: colors.accent,
    },
    description: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 8,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    errorBox: {
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    linkButton: {
      alignItems: 'center',
      marginTop: 20,
    },
    linkButtonText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
  });
