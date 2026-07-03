import { Device, Characteristic, Subscription, BleError } from 'react-native-ble-plx';
import { KNOWN_ELM327_PROFILES } from './elm327Uuids';
import { asciiToBase64, base64ToAscii } from './base64';

const PROMPT_CHAR = '>';
const DEFAULT_COMMAND_TIMEOUT_MS = 3000;

/** Sequência de comandos AT para colocar o ELM327 num estado previsível e sem eco/prompt ruidoso. */
const INIT_SEQUENCE = ['ATZ', 'ATE0', 'ATL0', 'ATS0', 'ATH0', 'ATSP0'];

interface PendingCommand {
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Encapsula a comunicação série (via GATT) com um adaptador ELM327,
 * incluindo descoberta de características, inicialização AT e query de PIDs OBD2.
 */
export class Elm327Client {
  private responseBuffer = '';
  private pendingCommand: PendingCommand | null = null;
  private readonly subscription: Subscription;

  private constructor(
    private readonly device: Device,
    private readonly serviceUUID: string,
    private readonly writeCharacteristicUUID: string,
    private readonly notifyCharacteristicUUID: string,
    private readonly useWriteWithResponse: boolean
  ) {
    this.subscription = this.device.monitorCharacteristicForService(
      this.serviceUUID,
      this.notifyCharacteristicUUID,
      this.handleNotification
    );
  }

  /**
   * Descobre o serviço/características de série do adaptador ligado.
   * Tenta primeiro os perfis de UUID conhecidos e, em último recurso,
   * procura genericamente qualquer par escrita+notificação válido.
   */
  static async discover(device: Device): Promise<Elm327Client> {
    const discoveredDevice = await device.discoverAllServicesAndCharacteristics();
    const services = await discoveredDevice.services();

    for (const profile of KNOWN_ELM327_PROFILES) {
      const service = services.find((s) => s.uuid.toLowerCase() === profile.service);
      if (!service) continue;

      const characteristics = await service.characteristics();
      const writeChar = characteristics.find((c) => c.uuid.toLowerCase() === profile.write);
      const notifyChar = characteristics.find((c) => c.uuid.toLowerCase() === profile.notify);

      if (writeChar && notifyChar && (writeChar.isWritableWithResponse || writeChar.isWritableWithoutResponse)) {
        return new Elm327Client(
          discoveredDevice,
          service.uuid,
          writeChar.uuid,
          notifyChar.uuid,
          writeChar.isWritableWithResponse
        );
      }
    }

    for (const service of services) {
      const characteristics = await service.characteristics();
      const writeChar = characteristics.find((c) => c.isWritableWithResponse || c.isWritableWithoutResponse);
      const notifyChar = characteristics.find((c) => c.isNotifiable || c.isIndicatable);

      if (writeChar && notifyChar) {
        return new Elm327Client(
          discoveredDevice,
          service.uuid,
          writeChar.uuid,
          notifyChar.uuid,
          writeChar.isWritableWithResponse
        );
      }
    }

    throw new Error(
      'Não foi possível identificar as características BLE de série do adaptador ELM327 neste dispositivo.'
    );
  }

  private handleNotification = (error: BleError | null, characteristic: Characteristic | null): void => {
    if (error) {
      if (this.pendingCommand) {
        clearTimeout(this.pendingCommand.timeoutHandle);
        this.pendingCommand.reject(error);
        this.pendingCommand = null;
      }
      return;
    }

    if (!characteristic?.value) return;

    this.responseBuffer += base64ToAscii(characteristic.value);

    if (this.responseBuffer.includes(PROMPT_CHAR)) {
      const completeResponse = this.responseBuffer;
      this.responseBuffer = '';

      if (this.pendingCommand) {
        clearTimeout(this.pendingCommand.timeoutHandle);
        const { resolve } = this.pendingCommand;
        this.pendingCommand = null;
        resolve(completeResponse);
      }
    }
  };

  private async writeRaw(payload: string): Promise<void> {
    const base64Payload = asciiToBase64(payload);

    if (this.useWriteWithResponse) {
      await this.device.writeCharacteristicWithResponseForService(
        this.serviceUUID,
        this.writeCharacteristicUUID,
        base64Payload
      );
    } else {
      await this.device.writeCharacteristicWithoutResponseForService(
        this.serviceUUID,
        this.writeCharacteristicUUID,
        base64Payload
      );
    }
  }

  /** Envia um comando AT/PID e resolve com a resposta bruta assim que o prompt `>` é recebido. */
  async sendCommand(command: string, timeoutMs: number = DEFAULT_COMMAND_TIMEOUT_MS): Promise<string> {
    if (this.pendingCommand) {
      throw new Error('Já existe um comando ELM327 a aguardar resposta.');
    }

    return new Promise<string>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingCommand = null;
        reject(new Error(`Tempo limite excedido a aguardar resposta para o comando "${command}".`));
      }, timeoutMs);

      this.pendingCommand = { resolve, reject, timeoutHandle };

      this.writeRaw(`${command}\r`).catch((err: unknown) => {
        clearTimeout(timeoutHandle);
        this.pendingCommand = null;
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });
  }

  /** Reinicia o chip e negoceia protocolo automático (ATSP0). O ATZ pode demorar por causa do reboot do chip. */
  async initializeProtocol(): Promise<void> {
    for (const command of INIT_SEQUENCE) {
      await this.sendCommand(command, 5000);
      await delay(100);
    }
  }

  async queryPid(pid: string): Promise<string> {
    return this.sendCommand(pid, 2000);
  }

  destroy(): void {
    this.subscription.remove();
  }
}
