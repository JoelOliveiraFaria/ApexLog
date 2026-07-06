export interface TelemetryPoint {
  id?: string;
  timestamp: string;
  rpm: number;
  speedKmh: number;
  throttlePosition: number;
  engineTempC: number;
}

export interface Motorcycle {
  id: string;
  make: string;
  model: string;
  year: number;
  nickname: string;
}

export interface Trip {
  id: string;
  motorcycle: Motorcycle;
  startTime: string;
  endTime: string;
  distanceKm: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  maxRpm: number;
  telemetryPoints?: TelemetryPoint[];
}