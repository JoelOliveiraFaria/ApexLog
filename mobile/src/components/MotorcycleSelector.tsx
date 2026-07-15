import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { createMotorcycle, fetchMotorcycles } from '../api/apexLogApi';
import type { Motorcycle } from '../types/motorcycle';
import { useTheme, type ColorPalette } from '../theme';

interface MotorcycleSelectorProps {
  selectedId: string | null;
  onSelect: (motorcycle: Motorcycle) => void;
  disabled?: boolean;
}

/** Lista as motas do backend, deixa escolher qual está a usar, e permite registar uma nova. */
export function MotorcycleSelector({ selectedId, onSelect, disabled }: MotorcycleSelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [nickname, setNickname] = useState('');

  const loadMotorcycles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchMotorcycles();
      setMotorcycles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar motas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMotorcycles();
  }, [loadMotorcycles]);

  const resetForm = () => {
    setMake('');
    setModel('');
    setYear('');
    setNickname('');
    setSaveError(null);
  };

  const handleSave = async () => {
    const parsedYear = parseInt(year, 10);

    if (!make.trim() || !model.trim()) {
      setSaveError('Marca e modelo são obrigatórios.');
      return;
    }
    if (!Number.isFinite(parsedYear)) {
      setSaveError('Indica um ano válido.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const created = await createMotorcycle({
        make: make.trim(),
        model: model.trim(),
        year: parsedYear,
        nickname: nickname.trim() || `${make.trim()} ${model.trim()}`,
      });
      setMotorcycles((prev) => [...prev, created]);
      onSelect(created);
      resetForm();
      setIsAdding(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Falha ao registar a mota.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator color="#10b981" />
        <Text style={styles.stateText}>A carregar motas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadMotorcycles} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {motorcycles.length === 0 && !isAdding && (
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>Ainda não tens nenhuma mota registada no ApexLog.</Text>
        </View>
      )}

      {motorcycles.map((motorcycle) => {
        const isSelected = motorcycle.id === selectedId;
        return (
          <TouchableOpacity
            key={motorcycle.id}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelect(motorcycle)}
            disabled={disabled}
          >
            <View>
              <Text style={styles.nickname}>{motorcycle.nickname || `${motorcycle.make} ${motorcycle.model}`}</Text>
              <Text style={styles.details}>{motorcycle.make} {motorcycle.model} · {motorcycle.year}</Text>
            </View>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        );
      })}

      {isAdding ? (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            value={make}
            onChangeText={setMake}
            placeholder="Marca (ex: CFMOTO)"
            placeholderTextColor={colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Modelo (ex: 450SR)"
            placeholderTextColor={colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder="Ano (ex: 2024)"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Alcunha (opcional)"
            placeholderTextColor={colors.placeholder}
          />

          {saveError && <Text style={styles.errorText}>{saveError}</Text>}

          <View style={styles.addFormActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsAdding(false);
                resetForm();
              }}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)} disabled={disabled}>
          <Text style={styles.addButtonText}>+ Adicionar mota</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    stateBox: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginBottom: 12,
    },
    stateText: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 8,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 8,
    },
    retryButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    retryButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentBg,
    },
    nickname: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    details: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    checkmark: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: 'bold',
    },
    addButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 12,
    },
    addButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    addForm: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      color: colors.textPrimary,
      marginBottom: 10,
    },
    addFormActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 4,
    },
    cancelButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: colors.accent,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 90,
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
    },
  });
