export interface TelemetryPoint {
  id?: string;
  timestamp: string;
  rpm: number;
  speedKmh: number;
  throttlePosition: number;
  engineTempC: number;
}

export interface Trip {
  id: string;
  motoId: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  maxRpm: number;
  telemetryPoints?: TelemetryPoint[];
}