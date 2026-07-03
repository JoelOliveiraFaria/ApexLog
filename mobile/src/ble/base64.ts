/**
 * Codificador/descodificador Base64 dependency-free.
 * As respostas ELM327 são sempre ASCII puro, por isso este par de funções
 * evita depender de `Buffer`/`atob`/`btoa`, que nem sempre estão polyfilled em Hermes.
 */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function asciiToBase64(input: string): string {
  let result = '';
  let i = 0;

  while (i < input.length) {
    const byte1 = input.charCodeAt(i++) & 0xff;
    const hasByte2 = i < input.length;
    const byte2 = hasByte2 ? input.charCodeAt(i++) & 0xff : 0;
    const hasByte3 = i < input.length;
    const byte3 = hasByte3 ? input.charCodeAt(i++) & 0xff : 0;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
    const enc3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
    const enc4 = byte3 & 0x3f;

    result +=
      BASE64_CHARS.charAt(enc1) +
      BASE64_CHARS.charAt(enc2) +
      (hasByte2 ? BASE64_CHARS.charAt(enc3) : '=') +
      (hasByte3 ? BASE64_CHARS.charAt(enc4) : '=');
  }

  return result;
}

export function base64ToAscii(input: string): string {
  const sanitized = input.replace(/[^A-Za-z0-9+/=]/g, '');
  let result = '';
  let i = 0;

  while (i < sanitized.length) {
    const enc1 = BASE64_CHARS.indexOf(sanitized.charAt(i++));
    const enc2 = BASE64_CHARS.indexOf(sanitized.charAt(i++));
    const enc3 = BASE64_CHARS.indexOf(sanitized.charAt(i++));
    const enc4 = BASE64_CHARS.indexOf(sanitized.charAt(i++));

    const byte1 = (enc1 << 2) | (enc2 >> 4);
    const byte2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const byte3 = ((enc3 & 3) << 6) | enc4;

    result += String.fromCharCode(byte1);
    if (enc3 !== -1 && enc3 !== 64) result += String.fromCharCode(byte2);
    if (enc4 !== -1 && enc4 !== 64) result += String.fromCharCode(byte3);
  }

  return result;
}
