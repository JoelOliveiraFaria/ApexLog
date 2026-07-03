/** PIDs OBD2 modo 01 (dados em tempo real) usados pelo ApexLog. */
export const OBD_PIDS = {
  ENGINE_RPM: '010C',
  VEHICLE_SPEED: '010D',
  THROTTLE_POSITION: '0111',
  ENGINE_COOLANT_TEMP: '0105',
} as const;
