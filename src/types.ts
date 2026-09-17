export interface SatelliteNode {
  id: number;
  satelliteId: string;
  collegeName: string;
  location: string;
  weatherCondition: string;
  aqi: number;
  temperature: number;
  windSpeed: number;
  principalName: string;
  lat: number;
  lng: number;
  status?: string;
  batteryLevel?: number;
  rssi?: number;
  orbitAltitude?: number;
  isLiveStream?: boolean;
  lastPing?: string;
  url?: string; // Child website URL if registered
  childWebsiteUrl?: string; // Explicit bound child website URL
  googleMapsUrl?: string;
  isCustom?: boolean;
  sourceType?: 'standard' | 'apps_script' | 'esp32_hardware';
  appsScriptUrl?: string;
  humidity?: number;
  pressure?: number;
  campusPhoto?: string;
  studentName?: string;
  teacherName?: string;
  studentPhoto?: string;
  principalPhoto?: string;
  teacherPhoto?: string;
  studentPin?: string;
  registeredByRole?: 'publisher' | 'student';
  studentTeam?: string;
}

export interface CustomNode {
  collegeName: string;
  url: string;
  childWebsiteUrl?: string;
  appsScriptUrl?: string;
  satelliteNumber?: string;
  campusTemp?: number | string;
  windSpeed?: number | string;
  status?: string;
  principalName?: string;
  location?: string;
  aqi?: number;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  campusPhoto?: string;
  studentName?: string;
  teacherName?: string;
  studentPhoto?: string;
  principalPhoto?: string;
  teacherPhoto?: string;
}

export interface AuditLog {
  id: number;
  time: string;
  text: string;
}

export interface CanSatTelemetryPacket {
  packetId: number;
  timestamp: string;
  epochMs: number;
  hardwareId: string; // e.g. "CanSat-ESP32-001"
  temperature: number; // in °C
  pressure: number; // in hPa
  altitude: number; // in meters (calculated barometric altitude)
  aqi: number; // Air Quality Index
  humidity?: number; // %
  windSpeed?: number; // km/h
  batteryVoltage: number; // e.g. 4.12 V
  batteryPercent: number; // 0-100%
  rssi: number; // dBm
  accelX: number; // m/s^2 or g
  accelY: number;
  accelZ: number;
  gyroX: number; // deg/sec
  gyroY: number;
  gyroZ: number;
  pitch?: number;
  roll?: number;
  heading?: number;
  lat: number;
  lng: number;
  gpsFix: boolean;
  gpsStatus?: string;
  gpsSats: number;
  hdop?: number;
  savedToPenDrive: boolean;
  sourceUrl?: string;
  rawPayload?: string;
}

export interface AppsScriptSource {
  id: string;
  name: string;
  satelliteId: string;
  url: string;
  childWebsiteUrl?: string; // Bound Child Website / Portal URL
  status: 'active' | 'error' | 'paused';
  lastPing: string;
  packetsCount: number;
  lastResponseTimeMs: number;
  latestData?: Partial<CanSatTelemetryPacket>;
  error?: string | null;
  location: string;
  principalName: string;
  autoLogToPenDrive: boolean;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  campusPhoto?: string;
  studentPhoto?: string;
  principalPhoto?: string;
  teacherPhoto?: string;
}

export interface PenDriveConfig {
  driveLabel: string; // e.g. "CCCOMA_X64FRE_EN-GB_DV9"
  capacity: string; // "64 GB"
  filePath: string;
  autoLogEnabled: boolean;
  recordsCount: number;
  bytesWritten: number;
  lastSavedAt: string | null;
  status: 'connected' | 'logging' | 'standby' | 'error';
}

export interface HardwareStreamConfig {
  endpointUrl: string; // e.g. "http://cansat-001.local"
  pollingIntervalMs: number; // e.g. 1000
  isConnected: boolean;
  isPolling: boolean;
  packetsReceived: number;
  lastResponseTimeMs: number;
  lastError?: string | null;
  mode: 'real-hardware' | 'simulated-fallback';
}
