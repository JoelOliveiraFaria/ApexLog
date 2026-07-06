import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchMotorcycles } from '../api/apexLogApi';
import type { Motorcycle } from '../types/motorcycle';

interface MotorcycleSelectorProps {
  selectedId: string | null;
  onSelect: (motorcycle: Motorcycle) => void;
  disabled?: boolean;
}

/** Lista as motas do backend e deixa o utilizador escolher qual está a usar antes de gravar uma viagem. */
export function MotorcycleSelector({ selectedId, onSelect, disabled }: MotorcycleSelectorProps) {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (motorcycles.length === 0) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.errorText}>Ainda não tens nenhuma mota registada no ApexLog.</Text>
      </View>
    );
  }

  return (
    <View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  stateBox: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  stateText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  retryButtonText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  nickname: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  checkmark: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
