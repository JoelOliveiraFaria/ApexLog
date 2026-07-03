export interface Elm327Profile {
  service: string;
  write: string;
  notify: string;
}

/**
 * Perfis de UUID conhecidos para chips BLE usados em adaptadores ELM327 de baixo custo
 * (vGate iCar Pro, vLinker FS, etc.). São tentados por ordem antes do fallback genérico
 * em `Elm327Client.discover`, porque nem todo o firmware expõe corretamente as flags
 * isWritable/isNotifiable usadas na descoberta automática.
 */
export const KNOWN_ELM327_PROFILES: Elm327Profile[] = [
  {
    // Perfil "FFF0", comum em clones baseados em CC2541/CC2540 (vGate iCar Pro BLE4.0)
    service: '0000fff0-0000-1000-8000-00805f9b34fb',
    write: '0000fff2-0000-1000-8000-00805f9b34fb',
    notify: '0000fff1-0000-1000-8000-00805f9b34fb',
  },
  {
    // Perfil "FFE0", comum em módulos seriais estilo HM-10 (característica única R/W/Notify)
    service: '0000ffe0-0000-1000-8000-00805f9b34fb',
    write: '0000ffe1-0000-1000-8000-00805f9b34fb',
    notify: '0000ffe1-0000-1000-8000-00805f9b34fb',
  },
];
