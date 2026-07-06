import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { StatusBar } from 'expo-status-bar';
import { Elm327Client } from './src/ble/Elm327Client';
import { useObdTelemetry } from './src/hooks/useObdTelemetry';
import { MotorcycleSelector } from './src/components/MotorcycleSelector';
import type { Motorcycle } from './src/types/motorcycle';

// Criar a instância global do gestor de Bluetooth
const manager = new BleManager();

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [elmClient, setElmClient] = useState<Elm327Client | null>(null);
  const [isInitializingElm, setIsInitializingElm] = useState(false);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState<Motorcycle | null>(null);

  const {
    latestSample,
    isRecording,
    pointsRecorded,
    lastError,
    startTripRecording,
    stopTripRecording,
  } = useObdTelemetry(elmClient);

  // 1. Pedir permissões de Hardware (Crítico para Android 12+)
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const scanGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: "Permissão de Scan Bluetooth",
          message: "O ApexLog precisa de acesso para procurar o iCar Pro.",
          buttonNeutral: "Depois",
          buttonNegative: "Cancelar",
          buttonPositive: "Aceitar",
        }
      );
      const connectGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: "Permissão de Conexão Bluetooth",
          message: "O ApexLog precisa de autorização para ligar ao OBD2.",
          buttonNeutral: "Depois",
          buttonNegative: "Cancelar",
          buttonPositive: "Aceitar",
        }
      );
      const locationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Permissão de Localização",
          message: "O Bluetooth necessita de localização para detetar aparelhos próximos.",
          buttonNeutral: "Depois",
          buttonNegative: "Cancelar",
          buttonPositive: "Aceitar",
        }
      );

      return (
        scanGranted === PermissionsAndroid.RESULTS.GRANTED &&
        connectGranted === PermissionsAndroid.RESULTS.GRANTED &&
        locationGranted === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true; // iOS lida com isto via app.json
  };

  // 2. Iniciar a busca pelo vGate iCar Pro
  const startScan = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert("Permissões de Bluetooth rejeitadas.");
      return;
    }

    setDevices([]);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("Erro no Scan:", error);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices((prevDevices) => {
          // Evitar duplicados na lista do ecrã
          if (prevDevices.some((d) => d.id === device.id)) {
            return prevDevices;
          }
          return [...prevDevices, device];
        });
      }
    });

    // Parar o scan automaticamente após 10 segundos para poupar bateria
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  // 3. Ligar ao Dispositivo OBD2 e inicializar o protocolo ELM327
  const connectToDevice = async (device: Device) => {
    manager.stopDeviceScan();
    setIsScanning(false);

    try {
      console.log(`A tentar ligar a: ${device.name}`);
      const connected = await manager.connectToDevice(device.id);
      const discovered = await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(discovered);

      setIsInitializingElm(true);
      const client = await Elm327Client.discover(discovered);
      await client.initializeProtocol();
      setElmClient(client);
    } catch (err) {
      console.log("Erro ao conectar/inicializar ELM327:", err);
      alert("Falha na conexão ou inicialização do adaptador OBD2. Verifica se está ligado à mota.");
      setConnectedDevice(null);
    } finally {
      setIsInitializingElm(false);
    }
  };

  // 4. Desligar e voltar ao ecrã de scan
  const disconnect = async () => {
    try {
      elmClient?.destroy();
      if (connectedDevice) {
        await manager.cancelDeviceConnection(connectedDevice.id);
      }
    } finally {
      setElmClient(null);
      setConnectedDevice(null);
    }
  };

  const handleToggleRecording = async () => {
    if (!isRecording && !selectedMotorcycle) {
      alert('Escolhe primeiro qual mota estás a usar.');
      return;
    }

    try {
      if (isRecording) {
        // distanceKm não é enviada: o backend calcula-a a partir da velocidade OBD2 registada.
        await stopTripRecording();
        alert('Viagem finalizada e enviada para o ApexLog!');
      } else {
        await startTripRecording(selectedMotorcycle!.id);
      }
    } catch (err) {
      console.log('Erro ao alternar gravação:', err);
      alert('Falha ao comunicar com a API do ApexLog.');
    }
  };

  // Ecrã de Telemetria (pós-conexão + protocolo ELM327 inicializado)
  if (connectedDevice && elmClient) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
        <StatusBar style="light" />

        <View style={styles.header}>
          <Text style={styles.title}>APEXLOG <Text style={styles.subtitle}>TELEMETRIA</Text></Text>
          <Text style={styles.description}>{connectedDevice.name}</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Estado da Gravação:</Text>
          <Text style={[styles.statusValue, isRecording ? styles.textGreen : styles.textOrange]}>
            {isRecording ? `A GRAVAR → ${pointsRecorded} pontos` : 'PARADA'}
          </Text>
        </View>

        {lastError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{lastError}</Text>
          </View>
        )}

        <View style={styles.gaugeGrid}>
          <View style={styles.gaugeCard}>
            <Text style={styles.gaugeLabel}>RPM</Text>
            <Text style={styles.gaugeValue}>{latestSample?.rpm ?? '--'}</Text>
          </View>
          <View style={styles.gaugeCard}>
            <Text style={styles.gaugeLabel}>Velocidade</Text>
            <Text style={styles.gaugeValue}>{latestSample?.speedKmh ?? '--'} <Text style={styles.gaugeUnit}>km/h</Text></Text>
          </View>
          <View style={styles.gaugeCard}>
            <Text style={styles.gaugeLabel}>Acelerador</Text>
            <Text style={styles.gaugeValue}>{latestSample?.throttlePosition ?? '--'} <Text style={styles.gaugeUnit}>%</Text></Text>
          </View>
          <View style={styles.gaugeCard}>
            <Text style={styles.gaugeLabel}>Temp. Motor</Text>
            <Text style={styles.gaugeValue}>{latestSample?.engineTempC ?? '--'} <Text style={styles.gaugeUnit}>ºC</Text></Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Mota utilizada</Text>
        <MotorcycleSelector
          selectedId={selectedMotorcycle?.id ?? null}
          onSelect={setSelectedMotorcycle}
          disabled={isRecording}
        />

        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.buttonStop,
            !isRecording && !selectedMotorcycle && styles.buttonDisabled,
          ]}
          onPress={handleToggleRecording}
          disabled={!isRecording && !selectedMotorcycle}
        >
          <Text style={styles.buttonText}>{isRecording ? 'Finalizar Viagem' : 'Iniciar Gravação'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={disconnect}>
          <Text style={styles.linkButtonText}>Desligar do adaptador</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>APEXLOG <Text style={styles.subtitle}>MOBILE</Text></Text>
        <Text style={styles.description}>Unidade de Aquisição de Telemetria OBD2</Text>
      </View>

      {/* Estado da Conexão */}
      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Estado do Hardware:</Text>
        <Text style={styles.statusValue}>
          {isInitializingElm ? 'A INICIALIZAR PROTOCOLO ELM327...' : 'DESCONECTADO'}
        </Text>
      </View>

      {/* Botão de Ação */}
      <TouchableOpacity
        style={[styles.button, (isScanning || isInitializingElm) && styles.buttonDisabled]}
        onPress={startScan}
        disabled={isScanning || isInitializingElm}
      >
        {isScanning || isInitializingElm ? (
          <ActivityIndicator color="#10b981" />
        ) : (
          <Text style={styles.buttonText}>Procurar iCar Pro (OBD2)</Text>
        )}
      </TouchableOpacity>

      {/* Lista de Dispositivos Encontrados */}
      <Text style={styles.sectionTitle}>Dispositivos detetados:</Text>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceCard} onPress={() => connectToDevice(item)}>
            <View>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceMac}>{item.id}</Text>
            </View>
            <Text style={styles.connectLink}>Ligar →</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isScanning ? (
            <Text style={styles.emptyText}>Nenhum dispositivo Bluetooth na área.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950 (Igual ao Dashboard Web!)
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
    color: '#10b981', // Verde esmeralda
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
    marginBottom: 24,
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
    color: '#f97316',
  },
  textGreen: { color: '#10b981' },
  textOrange: { color: '#f97316' },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
  gaugeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gaugeCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
  },
  gaugeLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  gaugeValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  gaugeUnit: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
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
  buttonStop: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  buttonDisabled: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  deviceCard: {
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
  deviceName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceMac: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  connectLink: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    color: '#475569',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
