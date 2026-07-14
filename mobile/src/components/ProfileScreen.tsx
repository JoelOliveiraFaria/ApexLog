import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { getMyProfile, changeMyPassword, type UserProfile } from '../api/apexLogApi';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToMotorcycles: () => void;
  onLogout: () => void;
}

export function ProfileScreen({ onBack, onNavigateToMotorcycles, onLogout }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        setProfile(await getMyProfile());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar o perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação não corresponde à nova password.');
      return;
    }

    setIsSaving(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setPasswordSuccess('Password alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Falha ao alterar a password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <Text style={styles.title}>APEXLOG <Text style={styles.subtitle}>PERFIL</Text></Text>
        <Text style={styles.description}>Os teus dados de conta</Text>
      </View>

      {loading && <ActivityIndicator color="#10b981" style={{ marginTop: 24 }} />}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && profile && (
        <>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Nome:</Text>
            <Text style={styles.statusValue}>{profile.name}</Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Email:</Text>
            <Text style={styles.statusValue}>{profile.email}</Text>
          </View>

          <Text style={styles.sectionTitle}>Alterar password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Password atual"
            placeholderTextColor="#475569"
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nova password"
            placeholderTextColor="#475569"
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmar nova password"
            placeholderTextColor="#475569"
            secureTextEntry
          />

          {passwordError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{passwordError}</Text>
            </View>
          )}
          {passwordSuccess && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{passwordSuccess}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Guardar nova password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onNavigateToMotorcycles}>
            <Text style={styles.secondaryButtonText}>Ver motas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={onBack} style={styles.linkButton}>
        <Text style={styles.linkButtonText}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#10b981',
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  statusBox: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  statusLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#ffffff',
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    color: '#ffffff',
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  successText: {
    color: '#34d399',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  linkButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});
