const MODE_01_RESPONSE_PREFIX = '41';

/** Remove eco de comando, ruído de protocolo ("SEARCHING...") e delimitadores do ELM327. */
export function cleanElmResponse(raw: string): string {
  return raw
    .replace(/SEARCHING\.*/gi, '')
    .replace(/STOPPED/gi, '')
    .replace(/[>\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDataBytes(raw: string, pid: string): number[] | null {
  const cleaned = cleanElmResponse(raw).replace(/\s/g, '').toUpperCase();

  if (cleaned.includes('NODATA') || cleaned.includes('ERROR') || cleaned.includes('UNABLETOCONNECT')) {
    return null;
  }

  const marker = `${MODE_01_RESPONSE_PREFIX}${pid.toUpperCase()}`;
  const markerIndex = cleaned.indexOf(marker);
  if (markerIndex === -1) return null;

  const dataHex = cleaned.slice(markerIndex + marker.length);
  const bytes: number[] = [];

  for (let i = 0; i + 1 < dataHex.length; i += 2) {
    const byte = parseInt(dataHex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) break;
    bytes.push(byte);
  }

  return bytes.length > 0 ? bytes : null;
}

/** PID 010C — Rotações do motor: ((A*256)+B)/4. */
export function parseEngineRpm(raw: string): number | null {
  const bytes = extractDataBytes(raw, '0C');
  if (!bytes || bytes.length < 2) return null;
  return Math.round((bytes[0] * 256 + bytes[1]) / 4);
}

/** PID 010D — Velocidade em km/h: valor direto do byte A. */
export function parseVehicleSpeed(raw: string): number | null {
  const bytes = extractDataBytes(raw, '0D');
  if (!bytes || bytes.length < 1) return null;
  return bytes[0];
}

/** PID 0111 — Posição do acelerador em %: A*100/255. */
export function parseThrottlePosition(raw: string): number | null {
  const bytes = extractDataBytes(raw, '11');
  if (!bytes || bytes.length < 1) return null;
  return Math.round((bytes[0] * 100) / 255);
}

/** PID 0105 — Temperatura do líquido de refrigeração em ºC: A-40. */
export function parseEngineCoolantTemp(raw: string): number | null {
  const bytes = extractDataBytes(raw, '05');
  if (!bytes || bytes.length < 1) return null;
  return bytes[0] - 40;
}
