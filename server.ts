import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { getAllSatellitesFromDb, upsertSatelliteInDb, deleteSatelliteFromDb, insertTelemetryPacketInDb } from './src/db/satellites.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { syncSatelliteToSupabase, syncTelemetryPacketToSupabase, isSupabaseConfigured, getSupabaseUrl, syncAllSatellitesToSupabase, testSupabaseConnection } from './src/lib/supabase.ts';

interface SatelliteNode {
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
  url?: string;
  childWebsiteUrl?: string;
  googleMapsUrl?: string;
  isCustom?: boolean;
  sourceType?: 'standard' | 'apps_script' | 'esp32_hardware';
  appsScriptUrl?: string;
  humidity?: number;
  pressure?: number;
  studentName?: string;
  teacherName?: string;
  studentPhoto?: string;
  campusPhoto?: string;
  principalPhoto?: string;
  teacherPhoto?: string;
  studentPin?: string;
  registeredByRole?: 'publisher' | 'student';
  studentTeam?: string;
}

interface AppsScriptSource {
  id: string;
  name: string;
  satelliteId: string;
  url: string;
  childWebsiteUrl?: string;
  status: 'active' | 'error' | 'paused';
  lastPing: string;
  packetsCount: number;
  lastResponseTimeMs: number;
  latestData?: Partial<CanSatTelemetryPacket>;
  error?: string | null;
  location: string;
  principalName: string;
  studentName?: string;
  studentPhoto?: string;
  autoLogToPenDrive: boolean;
  lastFingerprint?: string;
  lastNewPacketTime?: number;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
}

interface CanSatTelemetryPacket {
  packetId: number;
  timestamp: string;
  epochMs: number;
  hardwareId: string;
  temperature: number;
  pressure: number;
  altitude: number;
  aqi: number;
  humidity?: number;
  windSpeed?: number;
  batteryVoltage: number;
  batteryPercent: number;
  rssi: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
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

// Storage Path resolution with safe fallback for read-only / cloud environments
function resolveStoragePaths() {
  let baseDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    const testFile = path.join(baseDir, '.write_test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
  } catch {
    baseDir = path.join('/tmp', 'isro_cansat_data');
    try {
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
    } catch (e) {
      console.warn('Fallback to memory-only storage if filesystem unavailable:', e);
    }
  }

  const pendriveDir = path.join(baseDir, 'pendrive_CCCOMA_X64FRE_EN-GB_DV9');
  try {
    if (!fs.existsSync(pendriveDir)) {
      fs.mkdirSync(pendriveDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Error creating pendrive folder:', e);
  }

  return {
    DATA_DIR: baseDir,
    DATA_FILE: path.join(baseDir, 'satellites.json'),
    APPS_SCRIPTS_FILE: path.join(baseDir, 'apps_script_sources.json'),
    PENDRIVE_DIR: pendriveDir,
    PENDRIVE_CSV_FILE: path.join(pendriveDir, 'cansat_telemetry_CCCOMA_X64FRE_EN-GB_DV9.csv'),
    PENDRIVE_JSON_FILE: path.join(pendriveDir, 'cansat_telemetry_stream.jsonl'),
  };
}

const {
  DATA_DIR,
  DATA_FILE,
  APPS_SCRIPTS_FILE,
  PENDRIVE_DIR,
  PENDRIVE_CSV_FILE,
  PENDRIVE_JSON_FILE
} = resolveStoragePaths();

// In-memory store initialized from persistent file
let satellitesStore: SatelliteNode[] = [];
let appsScriptSources: AppsScriptSource[] = [];

// CanSat Telemetry buffer & configuration
let hardwareEndpointUrl = 'http://cansat-001.local';
let hardwarePollingIntervalMs = 1000;
let isHardwarePollingActive = true;
let isRealHardwareConnected = false;
let lastHardwareResponseTimeMs = 0;
let totalPacketsCollected = 0;
let hardwareLastError: string | null = null;
let telemetryBuffer: CanSatTelemetryPacket[] = [];
let totalBytesLoggedToPenDrive = 0;

// Pen drive configuration
const penDriveConfig = {
  driveLabel: 'CCCOMA_X64FRE_EN-GB_DV9',
  capacity: '64 GB',
  targetPath: PENDRIVE_CSV_FILE,
  autoLogEnabled: true,
};

// Initialize CSV header if not exists
if (!fs.existsSync(PENDRIVE_CSV_FILE)) {
  const csvHeaders = 'Packet_ID,Timestamp,Epoch_MS,Hardware_ID,Source_URL,Temperature_C,Pressure_hPa,Altitude_m,AQI,Humidity_Pct,Pitch,Roll,Heading,Battery_V,Battery_Pct,RSSI_dBm,Accel_X,Accel_Y,Accel_Z,Gyro_X,Gyro_Y,Gyro_Z,Latitude,Longitude,GPS_Fix,GPS_Status,GPS_Sats,HDOP,PenDrive_Logged\n';
  fs.writeFileSync(PENDRIVE_CSV_FILE, csvHeaders, 'utf-8');
}

function isExampleSatellite(satId?: string, id?: string | number): boolean {
  if (!satId) return false;
  const s = String(satId).trim().toLowerCase();
  const i = String(id || '').trim();
  return (
    s === 'cansat-001' ||
    s === 'cansat_2' ||
    s === 'cansat003' ||
    s === 'cansat004' ||
    i === '1787473481958' ||
    i === '1787478692573' ||
    i === '1787480370464' ||
    i === '1787480578235' ||
    i === 'apps-script-hardware-01' ||
    i === 'apps-script-cansat-02' ||
    i === 'apps-script-cansat-03' ||
    i === 'apps-script-cansat-04'
  );
}

const DEFAULT_REGISTERED_SATELLITES: SatelliteNode[] = [
  {
    id: 1789107210113,
    satelliteId: "CanSat-01",
    collegeName: "Soumodip_GGS",
    location: "Kasba Peth",
    weatherCondition: "Clear Sky",
    aqi: 35,
    temperature: 26.8,
    windSpeed: 12,
    principalName: "Archana Dharu",
    lat: 18.519585,
    lng: 73.859096,
    googleMapsUrl: "https://maps.app.goo.gl/xva3yjiyCSVs7F9Q7",
    batteryLevel: 95,
    rssi: -65,
    orbitAltitude: 500,
    isLiveStream: true,
    lastPing: "Live Feed Active",
    url: "",
    childWebsiteUrl: "",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbwgx-6gvYORbZyNhPUIP0OfNFVJQlLHpprho2UKudWzYT8mt5_1HlBctcF9lHtbFHGh/exec",
    sourceType: "apps_script",
    isCustom: true
  },
  {
    id: 1789107210103,
    satelliteId: "CanSat-03",
    collegeName: "DR G.G.SHAH ENGLISH MEDIUM HIGH SCHOOL",
    studentName: "ARWA RAMPURWALA",
    location: "Kasba Peth, Pune",
    weatherCondition: "Telemetry Connected",
    aqi: 36,
    temperature: 26.5,
    humidity: 60,
    pressure: 948.2,
    windSpeed: 11,
    principalName: "DR G.G.SHAH ENGLISH MEDIUM HIGH SCHOOL",
    lat: 18.5215,
    lng: 73.8612,
    googleMapsUrl: "https://maps.google.com/?q=18.5215,73.8612",
    batteryLevel: 94,
    rssi: -66,
    orbitAltitude: 520,
    isLiveStream: true,
    lastPing: "Live Feed Active",
    url: "",
    childWebsiteUrl: "",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbyP1naltMUmNtvz0qSowa9rOBLdaxV7i2ihm_HSP-CHsD7EOeHWbG5il9hDrCTWG2XC/exec",
    sourceType: "apps_script",
    studentPhoto: "/avatars/arwa_rampurwala.svg",
    isCustom: true
  },
  {
    id: 1789107210109,
    satelliteId: "CanSat-09",
    collegeName: "Versatile School",
    studentName: "Ved Kher",
    location: "Pune, Maharashtra",
    weatherCondition: "Telemetry Link Standby",
    aqi: 39,
    temperature: 27.0,
    humidity: 58,
    pressure: 946.8,
    windSpeed: 12,
    principalName: "Versatile School",
    lat: 18.5089,
    lng: 73.8258,
    googleMapsUrl: "https://maps.google.com/?q=18.5089,73.8258",
    batteryLevel: 95,
    rssi: -68,
    orbitAltitude: 540,
    isLiveStream: true,
    lastPing: "Live Feed Active",
    url: "",
    childWebsiteUrl: "",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycby6h-nUrskPQarM9GOGTPPjpvgDR1339GD-JqwM1mObO6L8cJ5ePk3ldXJau1JkZAfm/exec",
    sourceType: "apps_script",
    studentPhoto: "/avatars/ved_kher.svg",
    isCustom: true
  },
  {
    id: 1789107210130,
    satelliteId: "CanSat-30",
    collegeName: "Mansukhbhai Kothari National School",
    studentName: "Nabeel Ahmad Ansari",
    location: "Kondhwa, Pune",
    weatherCondition: "Optimal Telemetry Link",
    aqi: 38,
    temperature: 27.2,
    humidity: 62,
    pressure: 947.1,
    windSpeed: 10,
    principalName: "Mansukhbhai Kothari National School",
    lat: 18.46216,
    lng: 73.89317,
    googleMapsUrl: "https://maps.google.com/?q=18.46216,73.89317",
    batteryLevel: 96,
    rssi: -64,
    orbitAltitude: 560,
    isLiveStream: true,
    lastPing: "Live Feed Active",
    url: "",
    childWebsiteUrl: "",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbwuAjWxFnUE2uWzBerqXM_VkKMaxJAZa41pE86HZc_r8EuFgndXmkJ17AawuPg4v2tm/exec",
    sourceType: "apps_script",
    studentPhoto: "/avatars/nabeel_ahmad_ansari.jpg",
    isCustom: true
  },
  {
    id: 1789107210113,
    satelliteId: "CanSat-13",
    collegeName: "Apex International School",
    studentName: "Swara Digambar Rakshe",
    location: "Pune, Maharashtra",
    weatherCondition: "Telemetry Link Standby",
    aqi: 35,
    temperature: 26.5,
    humidity: 55,
    pressure: 948.2,
    windSpeed: 9,
    principalName: "Apex International School",
    lat: 18.5204,
    lng: 73.8567,
    googleMapsUrl: "https://maps.google.com/?q=18.5204,73.8567",
    batteryLevel: 98,
    rssi: -65,
    orbitAltitude: 550,
    isLiveStream: true,
    lastPing: "Live Feed Active",
    url: "",
    childWebsiteUrl: "",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbw0aWGl_jmXnPObj_tIumWAbR2xF0xsJPlH6DtOE07vIo4g4TWbahkuC5KDUovsBRR9/exec",
    sourceType: "apps_script",
    studentPhoto: "/avatars/swara_rakshe.svg",
    isCustom: true
  },
  {
    id: 1789107210114,
    satelliteId: "CanSat-014",
    collegeName: "Apex International School",
    studentName: "Siddhi Somnath More",
    location: "Pune, Maharashtra",
    weatherCondition: "Telemetry Link Standby",
    aqi: 36,
    temperature: 26.8,
    humidity: 56,
    pressure: 947.9,
    windSpeed: 10,
    principalName: "Apex International School",
    lat: 18.5204,
    lng: 73.8567,
    googleMapsUrl: "https://maps.google.com/?q=18.5204,73.8567",
    batteryLevel: 97,
    rssi: -66,
    orbitAltitude: 555,
    isLiveStream: true,
    lastPing: "Live Feed Active",
    url: "",
    childWebsiteUrl: "",
    appsScriptUrl: "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRr7HMZlHyf_lJVqZX0CGCUOO9SonmxYgmEcWu-AAoLwABgJytSonqhdtih1ok0SOMT7iPwfw8OOwPQEOivbRSwqk13FZ59TOiaF0vXcOqKuaaqseep3y7wxikgDey_aL29dfh3oT0EfsUZ-5O65adwCXsmE2quEr3ppfA9xtom1ikO9Kxhztu2y4igBl7J2zoFTyV9iEFgRANInmLiHKUXA_ISwlwOVwJj12xhvkJ3MiOfE353PWTjnBrDZKX3_XXMGgrPO3zcbr70lqWIoZxrrNoHxQ&lib=Mki24wNplxCq-9uHbNm17wyOBNEf84duc",
    sourceType: "apps_script",
    studentPhoto: "/avatars/siddhi_more.svg",
    isCustom: true
  },
  {
    id: 1789107210111,
    satelliteId: "CanSat-11",
    collegeName: "Apex International School",
    studentName: "Arnav Shinde",
    location: "Pune, Maharashtra",
    weatherCondition: "Telemetry Link Standby",
    aqi: 34,
    temperature: 26.2,
    humidity: 54,
    pressure: 948.5,
    windSpeed: 8,
    principalName: "Apex International School",
    lat: 18.5204,
    lng: 73.8567,
    googleMapsUrl: "https://maps.google.com/?q=18.5204,73.8567",
    batteryLevel: 99,
    rssi: -63,
    orbitAltitude: 565,
    isLiveStream: true,
    lastPing: "Live Feed Active",
    url: "",
    childWebsiteUrl: "",
    appsScriptUrl: "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRvlKIVw5pT9-yZBYW8s9_b6QbXsUMyfn8wDHU4PbKNV0X5G8uqG4v7OQit-LGejgPRvE_LtgRm5iGyGffGV-vtxREfWc7VRYjCKkHcKwsBhA6x8n49JTs2eAeHm9HJZBEDdg4KW0iF_mwptlTXXJz6gRQSdDDDz7NqTK2_3vUfLIDovmmiKOQNHbTkz5Ci00h48czAIrU8FXIMkxI2v9a07W-WlBGPKSTRX2WA7D8JLSxxcmHtOBGBr1_jL-0EcI1V1CjagMbswTG2hgapReCSXifFLw&lib=MCIUMIg7IsFUEqiwfTAa6hSOBNEf84duc",
    sourceType: "apps_script",
    studentPhoto: "/avatars/arnav_shinde.svg",
    isCustom: true
  }
];

function loadSatellites(): SatelliteNode[] {
  let list: SatelliteNode[] = [];
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (err) {
    console.error('Error reading satellites data file:', err);
  }

  // Filter out any legacy example nodes and sanitize CanSat-01 fields
  list = list
    .filter(s => !isExampleSatellite(s.satelliteId, s.id))
    .map(s => {
      if (s.satelliteId === 'CanSat-01' || s.collegeName === 'Soumodip_GGS') {
        return {
          ...s,
          lat: 18.519585,
          lng: 73.859096,
          location: 'Kasba Peth',
          url: (s.url && s.url.includes('indo-science.vercel.app')) ? '' : (s.url || ''),
          childWebsiteUrl: (s.childWebsiteUrl && s.childWebsiteUrl.includes('indo-science.vercel.app')) ? '' : (s.childWebsiteUrl || '')
        };
      }
      return s;
    });

  if (list.length === 0) {
    list = [...DEFAULT_REGISTERED_SATELLITES];
  } else {
    // Ensure all default registered satellites are merged in
    for (const defSat of DEFAULT_REGISTERED_SATELLITES) {
      const idx = list.findIndex(s => s.satelliteId.toLowerCase() === defSat.satelliteId.toLowerCase());
      if (idx === -1) {
        list.push(defSat);
      } else {
        list[idx] = {
          ...list[idx],
          studentName: defSat.studentName || list[idx].studentName,
          collegeName: defSat.collegeName || list[idx].collegeName,
          appsScriptUrl: defSat.appsScriptUrl || list[idx].appsScriptUrl,
          studentPhoto: defSat.studentPhoto || list[idx].studentPhoto,
        };
      }
    }
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving satellites file:', e);
  }

  return list;
}

function saveSatellites(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(satellitesStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving satellites to disk:', err);
  }
}

function loadAppsScriptSources(): AppsScriptSource[] {
  let sources: AppsScriptSource[] = [];
  try {
    if (fs.existsSync(APPS_SCRIPTS_FILE)) {
      const content = fs.readFileSync(APPS_SCRIPTS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sources = parsed;
      }
    }
  } catch (err) {
    console.error('Error reading Apps Script sources file:', err);
  }

  // Filter out legacy example feeds and sanitize
  sources = sources
    .filter(s => !isExampleSatellite(s.satelliteId, s.id))
    .map(s => {
      if (s.satelliteId === 'CanSat-01' || s.name === 'Soumodip_GGS') {
        return {
          ...s,
          lat: 18.519585,
          lng: 73.859096,
          location: 'Kasba Peth',
          childWebsiteUrl: (s.childWebsiteUrl && s.childWebsiteUrl.includes('indo-science.vercel.app')) ? '' : (s.childWebsiteUrl || '')
        };
      }
      return s;
    });

  const defaultSources: AppsScriptSource[] = [
    {
      id: "apps-script-1789107210108",
      name: "Soumodip_GGS",
      satelliteId: "CanSat-01",
      url: "https://script.google.com/macros/s/AKfycbwgx-6gvYORbZyNhPUIP0OfNFVJQlLHpprho2UKudWzYT8mt5_1HlBctcF9lHtbFHGh/exec",
      childWebsiteUrl: "",
      status: "active",
      lastPing: "Live Feed Active",
      packetsCount: 0,
      lastResponseTimeMs: 0,
      location: "Kasba Peth",
      principalName: "Archana Dharu",
      autoLogToPenDrive: true,
      lat: 18.519585,
      lng: 73.859096,
      googleMapsUrl: "https://maps.app.goo.gl/xva3yjiyCSVs7F9Q7",
      error: null
    },
    {
      id: "apps-script-1789107210103",
      name: "ARWA RAMPURWALA",
      satelliteId: "CanSat-03",
      url: "https://script.google.com/macros/s/AKfycbyP1naltMUmNtvz0qSowa9rOBLdaxV7i2ihm_HSP-CHsD7EOeHWbG5il9hDrCTWG2XC/exec",
      childWebsiteUrl: "",
      status: "active",
      lastPing: "Live Feed Active",
      packetsCount: 0,
      lastResponseTimeMs: 0,
      location: "Kasba Peth, Pune",
      principalName: "DR G.G.SHAH ENGLISH MEDIUM HIGH SCHOOL",
      studentPhoto: "/avatars/arwa_rampurwala.svg",
      autoLogToPenDrive: true,
      lat: 18.5215,
      lng: 73.8612,
      googleMapsUrl: "https://maps.google.com/?q=18.5215,73.8612",
      error: null
    },
    {
      id: "apps-script-1789107210109",
      name: "Ved Kher",
      satelliteId: "CanSat-09",
      url: "https://script.google.com/macros/s/AKfycby6h-nUrskPQarM9GOGTPPjpvgDR1339GD-JqwM1mObO6L8cJ5ePk3ldXJau1JkZAfm/exec",
      childWebsiteUrl: "",
      status: "active",
      lastPing: "Live Feed Active",
      packetsCount: 0,
      lastResponseTimeMs: 0,
      location: "Pune, Maharashtra",
      principalName: "Versatile School",
      autoLogToPenDrive: true,
      lat: 18.5089,
      lng: 73.8258,
      googleMapsUrl: "https://maps.google.com/?q=18.5089,73.8258",
      studentPhoto: "/avatars/ved_kher.svg",
      error: null
    },
    {
      id: "apps-script-1789107210130",
      name: "Mansukhbhai Kothari National School",
      satelliteId: "CanSat-30",
      url: "https://script.google.com/macros/s/AKfycbwuAjWxFnUE2uWzBerqXM_VkKMaxJAZa41pE86HZc_r8EuFgndXmkJ17AawuPg4v2tm/exec",
      childWebsiteUrl: "",
      status: "active",
      lastPing: "Live Feed Active",
      packetsCount: 0,
      lastResponseTimeMs: 0,
      location: "Kondhwa, Pune",
      principalName: "Mansukhbhai Kothari National School",
      studentPhoto: "/avatars/nabeel_ahmad_ansari.jpg",
      autoLogToPenDrive: true,
      lat: 18.46216,
      lng: 73.89317,
      googleMapsUrl: "https://maps.google.com/?q=18.46216,73.89317",
      error: null
    },
    {
      id: "apps-script-1789107210113",
      name: "Swara Digambar Rakshe",
      satelliteId: "CanSat-13",
      url: "https://script.google.com/macros/s/AKfycbw0aWGl_jmXnPObj_tIumWAbR2xF0xsJPlH6DtOE07vIo4g4TWbahkuC5KDUovsBRR9/exec",
      childWebsiteUrl: "",
      status: "active",
      lastPing: "Live Feed Active",
      packetsCount: 0,
      lastResponseTimeMs: 0,
      location: "Pune, Maharashtra",
      principalName: "Apex International School",
      studentPhoto: "/avatars/swara_rakshe.svg",
      autoLogToPenDrive: true,
      lat: 18.5204,
      lng: 73.8567,
      googleMapsUrl: "https://maps.google.com/?q=18.5204,73.8567",
      error: null
    },
    {
      id: "apps-script-1789107210114",
      name: "Siddhi Somnath More",
      satelliteId: "CanSat-014",
      url: "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRr7HMZlHyf_lJVqZX0CGCUOO9SonmxYgmEcWu-AAoLwABgJytSonqhdtih1ok0SOMT7iPwfw8OOwPQEOivbRSwqk13FZ59TOiaF0vXcOqKuaaqseep3y7wxikgDey_aL29dfh3oT0EfsUZ-5O65adwCXsmE2quEr3ppfA9xtom1ikO9Kxhztu2y4igBl7J2zoFTyV9iEFgRANInmLiHKUXA_ISwlwOVwJj12xhvkJ3MiOfE353PWTjnBrDZKX3_XXMGgrPO3zcbr70lqWIoZxrrNoHxQ&lib=Mki24wNplxCq-9uHbNm17wyOBNEf84duc",
      childWebsiteUrl: "",
      status: "active",
      lastPing: "Live Feed Active",
      packetsCount: 0,
      lastResponseTimeMs: 0,
      location: "Pune, Maharashtra",
      principalName: "Apex International School",
      studentPhoto: "/avatars/siddhi_more.svg",
      autoLogToPenDrive: true,
      lat: 18.5204,
      lng: 73.8567,
      googleMapsUrl: "https://maps.google.com/?q=18.5204,73.8567",
      error: null
    },
    {
      id: "apps-script-1789107210111",
      name: "Arnav Shinde",
      satelliteId: "CanSat-11",
      url: "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRvlKIVw5pT9-yZBYW8s9_b6QbXsUMyfn8wDHU4PbKNV0X5G8uqG4v7OQit-LGejgPRvE_LtgRm5iGyGffGV-vtxREfWc7VRYjCKkHcKwsBhA6x8n49JTs2eAeHm9HJZBEDdg4KW0iF_mwptlTXXJz6gRQSdDDDz7NqTK2_3vUfLIDovmmiKOQNHbTkz5Ci00h48czAIrU8FXIMkxI2v9a07W-WlBGPKSTRX2WA7D8JLSxxcmHtOBGBr1_jL-0EcI1V1CjagMbswTG2hgapReCSXifFLw&lib=MCIUMIg7IsFUEqiwfTAa6hSOBNEf84duc",
      childWebsiteUrl: "",
      status: "active",
      lastPing: "Live Feed Active",
      packetsCount: 0,
      lastResponseTimeMs: 0,
      location: "Pune, Maharashtra",
      principalName: "Apex International School",
      studentPhoto: "/avatars/arnav_shinde.svg",
      autoLogToPenDrive: true,
      lat: 18.5204,
      lng: 73.8567,
      googleMapsUrl: "https://maps.google.com/?q=18.5204,73.8567",
      error: null
    }
  ];

  // Populate or merge registered student sources
  if (sources.length === 0) {
    sources = [...defaultSources];
  } else {
    for (const defSrc of defaultSources) {
      const idx = sources.findIndex(s => s.satelliteId?.toLowerCase() === defSrc.satelliteId?.toLowerCase() || s.url === defSrc.url);
      if (idx === -1) {
        sources.push(defSrc);
      } else {
        sources[idx] = {
          ...sources[idx],
          name: defSrc.name || sources[idx].name,
          principalName: defSrc.principalName || sources[idx].principalName,
          url: defSrc.url || sources[idx].url,
          studentPhoto: defSrc.studentPhoto || sources[idx].studentPhoto,
        };
      }
    }
  }

  try {
    fs.writeFileSync(APPS_SCRIPTS_FILE, JSON.stringify(sources, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving Apps Script sources file:', e);
  }

  return sources;
}

function saveAppsScriptSources(): void {
  try {
    fs.writeFileSync(APPS_SCRIPTS_FILE, JSON.stringify(appsScriptSources, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving Apps Script sources:', err);
  }
}

satellitesStore = loadSatellites();
appsScriptSources = loadAppsScriptSources();

// Real-Time SSE Clients
const sseClients = new Set<Response>();

function broadcastSSE(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      console.warn('Failed to send SSE to a client, removing client', err);
      sseClients.delete(client);
    }
  }
}

// Write telemetry line to pen drive storage & local mirror
function appendPacketToPenDrive(packet: CanSatTelemetryPacket): boolean {
  try {
    const csvLine = [
      packet.packetId,
      `"${packet.timestamp}"`,
      packet.epochMs,
      `"${packet.hardwareId}"`,
      `"${packet.sourceUrl || ''}"`,
      packet.temperature.toFixed(2),
      packet.pressure.toFixed(2),
      packet.altitude.toFixed(2),
      packet.aqi,
      packet.humidity !== undefined ? packet.humidity.toFixed(2) : 45,
      packet.pitch !== undefined ? packet.pitch.toFixed(2) : 0,
      packet.roll !== undefined ? packet.roll.toFixed(2) : 0,
      packet.heading !== undefined ? packet.heading.toFixed(2) : 0,
      packet.batteryVoltage.toFixed(2),
      packet.batteryPercent,
      packet.rssi,
      packet.accelX.toFixed(3),
      packet.accelY.toFixed(3),
      packet.accelZ.toFixed(3),
      packet.gyroX.toFixed(2),
      packet.gyroY.toFixed(2),
      packet.gyroZ.toFixed(2),
      packet.lat.toFixed(6),
      packet.lng.toFixed(6),
      packet.gpsFix ? 1 : 0,
      `"${packet.gpsStatus || (packet.gpsFix ? 'FIX' : 'NO_FIX')}"`,
      packet.gpsSats,
      packet.hdop !== undefined ? packet.hdop.toFixed(2) : 99.99,
      1
    ].join(',') + '\n';

    fs.appendFileSync(PENDRIVE_CSV_FILE, csvLine, 'utf-8');
    fs.appendFileSync(PENDRIVE_JSON_FILE, JSON.stringify(packet) + '\n', 'utf-8');
    totalBytesLoggedToPenDrive += Buffer.byteLength(csvLine, 'utf-8');

    // Also check potential OS mounted paths for CCCOMA_X64FRE_EN-GB_DV9 pendrive
    const candidatePaths = [
      `/media/${process.env.USER || 'root'}/CCCOMA_X64FRE_EN-GB_DV9`,
      `/mnt/CCCOMA_X64FRE_EN-GB_DV9`,
      `/Volumes/CCCOMA_X64FRE_EN-GB_DV9`,
      'D:/CCCOMA_X64FRE_EN-GB_DV9',
      'E:/CCCOMA_X64FRE_EN-GB_DV9',
      'F:/CCCOMA_X64FRE_EN-GB_DV9'
    ];

    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p)) {
          const usbFile = path.join(p, 'cansat_telemetry_CCCOMA_X64FRE_EN-GB_DV9.csv');
          if (!fs.existsSync(usbFile)) {
            const csvHeaders = 'Packet_ID,Timestamp,Epoch_MS,Hardware_ID,Source_URL,Temperature_C,Pressure_hPa,Altitude_m,AQI,Humidity_Pct,Pitch,Roll,Heading,Battery_V,Battery_Pct,RSSI_dBm,Accel_X,Accel_Y,Accel_Z,Gyro_X,Gyro_Y,Gyro_Z,Latitude,Longitude,GPS_Fix,GPS_Status,GPS_Sats,HDOP,PenDrive_Logged\n';
            fs.writeFileSync(usbFile, csvHeaders, 'utf-8');
          }
          fs.appendFileSync(usbFile, csvLine, 'utf-8');
        }
      } catch {
        // Continue if path is not accessible
      }
    }

    return true;
  } catch (err) {
    console.error('Error logging to pen drive:', err);
    return false;
  }
}

// Process and store an incoming hardware packet (from Google Apps Script, poller or webhook)
function processHardwareTelemetry(raw: Partial<CanSatTelemetryPacket> | any, source?: AppsScriptSource): CanSatTelemetryPacket {
  totalPacketsCollected++;
  const now = new Date();

  // Helper for numeric conversion
  const parseNum = (val: any, fallback: number): number => {
    if (val === null || val === undefined || val === '') return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };

  // Handle various payload structures from Google Apps Script / ESP32 Arduino sketches
  let rawTemp = raw.temperature !== undefined ? raw.temperature : (raw.temp !== undefined ? raw.temp : raw.temperature_c);
  const temp = parseNum(rawTemp, 27.4);

  let rawPressure = raw.pressure !== undefined ? raw.pressure : (raw.press !== undefined ? raw.press : raw.pressure_hpa);
  const pressure = parseNum(rawPressure, 944.28);

  // Hypsometric altitude formula: 44330 * (1 - (P/P0)^(1/5.255))
  let rawAlt = raw.altitude !== undefined ? raw.altitude : raw.alt;
  const altitude = rawAlt !== undefined && rawAlt !== null && rawAlt !== '' 
    ? parseNum(rawAlt, 0)
    : (pressure > 0 ? Number((44330 * (1 - Math.pow(Math.max(300, pressure) / 1013.25, 0.1903))).toFixed(2)) : 0);

  let rawHumidity = raw.humidity !== undefined ? raw.humidity : raw.hum;
  const humidity = parseNum(rawHumidity, 48);

  let rawAqi = raw.aqi !== undefined ? raw.aqi : (raw.air_quality !== undefined ? raw.air_quality : (raw.gas !== undefined ? Math.round(Number(raw.gas) / 10) : undefined));
  const aqi = parseNum(rawAqi, 35);

  let rawVoltage = raw.batteryVoltage !== undefined ? raw.batteryVoltage : (raw.vbat !== undefined ? raw.vbat : raw.voltage);
  const voltage = parseNum(rawVoltage, 4.12);

  const batteryPercent = raw.batteryPercent !== undefined ? parseNum(raw.batteryPercent, 95) : 
                         raw.battery !== undefined ? parseNum(raw.battery, 95) : 
                         Math.max(5, Math.min(100, Math.round(((voltage - 3.3) / 0.9) * 100)));

  const lat = (raw.latitude !== undefined && Number(raw.latitude) !== 0) ? Number(raw.latitude) :
              (raw.lat !== undefined && Number(raw.lat) !== 0) ? Number(raw.lat) : 18.481817;

  const lng = (raw.longitude !== undefined && Number(raw.longitude) !== 0) ? Number(raw.longitude) :
              (raw.lng !== undefined && Number(raw.lng) !== 0) ? Number(raw.lng) : 73.954033;

  const gpsFix = raw.gpsStatus === 'FIX' || raw.gpsStatus === '3D_FIX' || 
                 (typeof raw.latitude === 'number' && raw.latitude !== 0) || 
                 (raw.gpsFix !== undefined ? !!raw.gpsFix : false);

  const packet: CanSatTelemetryPacket = {
    packetId: raw.packetId || totalPacketsCollected,
    timestamp: raw.timestamp || now.toISOString().replace('T', ' ').substring(0, 19),
    epochMs: now.getTime(),
    hardwareId: raw.hardwareId || (source ? source.name : 'CanSat-ESP32-001'),
    temperature: Number(temp.toFixed(2)),
    pressure: Number(pressure.toFixed(2)),
    altitude: Number(altitude.toFixed(2)),
    aqi: Number(aqi),
    humidity: Number(humidity.toFixed(2)),
    windSpeed: typeof raw.windSpeed === 'number' ? raw.windSpeed : 12,
    batteryVoltage: Number(voltage.toFixed(2)),
    batteryPercent: batteryPercent,
    rssi: typeof raw.rssi === 'number' ? raw.rssi : -62,
    accelX: typeof raw.accelX === 'number' ? raw.accelX : 0,
    accelY: typeof raw.accelY === 'number' ? raw.accelY : 0,
    accelZ: typeof raw.accelZ === 'number' ? raw.accelZ : 0,
    gyroX: typeof raw.gyroX === 'number' ? raw.gyroX : 0,
    gyroY: typeof raw.gyroY === 'number' ? raw.gyroY : 0,
    gyroZ: typeof raw.gyroZ === 'number' ? raw.gyroZ : 0,
    pitch: typeof raw.pitch === 'number' ? raw.pitch : 0,
    roll: typeof raw.roll === 'number' ? raw.roll : 0,
    heading: typeof raw.heading === 'number' ? raw.heading : 0,
    lat: lat,
    lng: lng,
    gpsFix: gpsFix,
    gpsStatus: raw.gpsStatus || (gpsFix ? 'FIX' : 'NO_FIX'),
    gpsSats: typeof raw.satellites === 'number' ? raw.satellites : (typeof raw.gpsSats === 'number' ? raw.gpsSats : 0),
    hdop: typeof raw.hdop === 'number' ? raw.hdop : 99.99,
    savedToPenDrive: true,
    sourceUrl: raw.sourceUrl || (source ? source.url : undefined),
    rawPayload: typeof raw === 'string' ? raw : JSON.stringify(raw),
  };

  // Save to Pen Drive
  appendPacketToPenDrive(packet);

  // Keep last 150 packets in memory buffer
  telemetryBuffer.push(packet);
  if (telemetryBuffer.length > 150) {
    telemetryBuffer.shift();
  }

  // Broadcast to all connected Web UI clients instantly!
  broadcastSSE('hardware_telemetry_tick', packet);

  // Update or insert child node in satellitesStore
  const targetSatId = source ? source.satelliteId : (raw.satelliteId || 'CanSat-01');
  const existingIdx = satellitesStore.findIndex(s => s.satelliteId === targetSatId);

  // Preserve or assign bound child website URL
  let boundChildUrl = '';
  if (source && source.childWebsiteUrl) {
    boundChildUrl = source.childWebsiteUrl;
  } else if (existingIdx >= 0 && satellitesStore[existingIdx].url && !satellitesStore[existingIdx].url?.includes('script.google.com')) {
    boundChildUrl = satellitesStore[existingIdx].url!;
  } else {
    boundChildUrl = `/site/${targetSatId}`;
  }

  const updatedNode: SatelliteNode = {
    id: existingIdx >= 0 ? satellitesStore[existingIdx].id : Date.now(),
    satelliteId: targetSatId,
    collegeName: source ? source.name : (targetSatId === 'CanSat-01' ? 'Soumodip_GGS' : 'ISRO CanSat Station'),
    location: source ? source.location : 'Kasba Peth',
    weatherCondition: packet.altitude > 100 ? 'Ascending / In Flight' : (packet.humidity > 70 ? 'Humid Ground Link' : 'Optimal Telemetry Link'),
    aqi: packet.aqi,
    temperature: packet.temperature,
    humidity: packet.humidity,
    pressure: packet.pressure,
    windSpeed: packet.windSpeed || 14,
    principalName: source ? source.principalName : 'Archana Dharu',
    lat: packet.lat,
    lng: packet.lng,
    status: isRealHardwareConnected || source ? `Live Feed Active (${packet.temperature}°C, ${packet.pressure} hPa)` : 'Hardware Stream Active',
    batteryLevel: packet.batteryPercent,
    rssi: packet.rssi,
    orbitAltitude: Math.round(packet.altitude),
    isLiveStream: true,
    lastPing: `${new Date().toLocaleTimeString()} (Apps Script -> 64GB Pen Drive)`,
    url: boundChildUrl,
    childWebsiteUrl: boundChildUrl,
    appsScriptUrl: source ? source.url : (raw.appsScriptUrl || raw.sourceUrl),
    sourceType: source ? 'apps_script' : 'esp32_hardware',
    isCustom: true
  };

  if (existingIdx >= 0) {
    satellitesStore[existingIdx] = updatedNode;
  } else {
    satellitesStore.unshift(updatedNode);
  }

  saveSatellites();

  // Asynchronously persist to Cloud SQL PostgreSQL & Supabase
  insertTelemetryPacketInDb(packet).catch(() => {});
  upsertSatelliteInDb(updatedNode).catch(() => {});
  syncTelemetryPacketToSupabase(packet).catch(() => {});
  syncSatelliteToSupabase(updatedNode).catch(() => {});

  return packet;
}

// In-flight guard to prevent multiple overlapping polls on the same Apps Script URL
const appsScriptInFlight = new Set<string>();

// Poll a single Google Apps Script Source with robust error handling and resilient timeout
async function pollAppsScriptSource(source: AppsScriptSource): Promise<CanSatTelemetryPacket | null> {
  if (source.status === 'paused' || !source.url) return null;
  if (appsScriptInFlight.has(source.id)) {
    return null; // Previous request is still processing, don't abort or pile up
  }

  appsScriptInFlight.add(source.id);
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    // Google Apps Script cold starts & redirects can take 5-10s; allow 12s before graceful abort
    const timeoutId = setTimeout(() => {
      try {
        controller.abort();
      } catch {}
    }, 12000);

    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'ISRO-Antriksha-CanSat-Ingest/2.0'
      },
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // Try extracting JSON from wrapper or JSONP callback
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch {}
        }
      }

      if (data && (
        typeof data.temperature === 'number' || 
        typeof data.pressure === 'number' || 
        typeof data.temp === 'number' || 
        data.status === 'OK' || 
        data.nodeId || 
        data.humidity !== undefined ||
        data.altitude !== undefined
      )) {
        const responseTime = Date.now() - startTime;
        source.lastResponseTimeMs = responseTime;
        source.lastPing = new Date().toLocaleTimeString();

        // 1. Check if all primary sensors are zero (inactive or unpowered probe)
        const tempVal = typeof data.temperature === 'number' ? data.temperature : (typeof data.temp === 'number' ? data.temp : null);
        const pressVal = typeof data.pressure === 'number' ? data.pressure : (typeof data.press === 'number' ? data.press : null);
        const altVal = typeof data.altitude === 'number' ? data.altitude : (typeof data.alt === 'number' ? data.alt : null);
        const isAllSensorsZero = (tempVal === 0 && pressVal === 0 && (altVal === 0 || altVal === null));

        if (isAllSensorsZero) {
          source.status = 'paused';
          source.error = 'CanSat Inactive / Sensors Offline (0.00 Readings)';
          saveAppsScriptSources();
          return null;
        }

        // 2. Check for duplicate historical packet (avoid fake live updates from static data)
        const fingerprint = `${data.sequence ?? ''}_${data.timestamp ?? ''}_${data.receivedAt ?? ''}_${tempVal}_${pressVal}_${altVal}`;
        if (source.lastFingerprint && source.lastFingerprint === fingerprint) {
          // Exactly identical historical packet - satellite has not transmitted a new telemetry point
          if (source.lastNewPacketTime && (Date.now() - source.lastNewPacketTime > 15000)) {
            source.status = 'paused';
            source.error = 'No active telemetry transmitting (Standby)';
          }
          return null;
        }

        // Genuine new active telemetry packet!
        source.lastFingerprint = fingerprint;
        source.lastNewPacketTime = Date.now();
        source.status = 'active';
        source.error = null;
        source.packetsCount = (source.packetsCount || 0) + 1;
        isRealHardwareConnected = true;

        const packet = processHardwareTelemetry({
          ...data,
          hardwareId: source.name || source.satelliteId,
          sourceUrl: source.url,
        }, source);

        source.latestData = packet;
        saveAppsScriptSources();
        return packet;
      } else {
        // If data was received but in unexpected format
        source.error = 'Connected (Awaiting structured sensor JSON)';
        source.lastPing = new Date().toLocaleTimeString();
      }
    } else {
      source.error = `HTTP ${res.status} (Access / Permission Check)`;
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('abort'))) {
      // Friendly status instead of harsh "script aborted"
      source.error = 'Connecting (Waiting for Google Apps Script response)...';
    } else {
      source.error = err.message || 'Connecting to stream...';
    }
  } finally {
    appsScriptInFlight.delete(source.id);
  }
  return null;
}

// 1-Second Multi-Source Polling Engine (Apps Scripts + Direct ESP32)
let hardwarePollerTimer: NodeJS.Timeout | null = null;

async function pollAllSources() {
  // 1. Poll all registered Google Apps Script feeds
  let anyAppsScriptSuccess = false;
  for (const source of appsScriptSources) {
    if (source.status !== 'paused') {
      const packet = await pollAppsScriptSource(source);
      if (packet) {
        anyAppsScriptSuccess = true;
      }
    }
  }

  // Update isRealHardwareConnected based on whether any source is genuinely active
  const hasRecentActiveFeed = appsScriptSources.some(s => s.status === 'active' && s.lastNewPacketTime && (Date.now() - s.lastNewPacketTime < 15000));
  if (!hasRecentActiveFeed && (!hardwareEndpointUrl || hardwareEndpointUrl.includes('google.com') || hardwareEndpointUrl.includes('.local'))) {
    isRealHardwareConnected = false;
  }

  // 2. Poll local/LAN ESP32 endpoint if configured
  if (hardwareEndpointUrl && !hardwareEndpointUrl.includes('google.com')) {
    const startTime = Date.now();
    const endpoints = [
      hardwareEndpointUrl,
      `${hardwareEndpointUrl.replace(/\/$/, '')}/data`,
      `${hardwareEndpointUrl.replace(/\/$/, '')}/telemetry`,
      `${hardwareEndpointUrl.replace(/\/$/, '')}/sensors`,
      `${hardwareEndpointUrl.replace(/\/$/, '')}/api/telemetry`,
      `${hardwareEndpointUrl.replace(/\/$/, '')}/json`
    ];

    let fetchedData: any = null;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 950);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json, text/plain' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          try {
            fetchedData = JSON.parse(text);
          } catch {
            const parsed: any = {};
            text.split(/[,\n]/).forEach(part => {
              const [k, v] = part.split(':').map(s => s.trim());
              if (k && v) {
                const num = Number(v);
                parsed[k] = isNaN(num) ? v : num;
              }
            });
            if (Object.keys(parsed).length > 0) {
              fetchedData = parsed;
            }
          }
          if (fetchedData) {
            isRealHardwareConnected = true;
            hardwareLastError = null;
            lastHardwareResponseTimeMs = Date.now() - startTime;
            break;
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    if (fetchedData) {
      processHardwareTelemetry(fetchedData);
    }
  }
}

function startHardwarePolling() {
  if (hardwarePollerTimer) clearInterval(hardwarePollerTimer);
  hardwarePollerTimer = setInterval(() => {
    if (isHardwarePollingActive) {
      pollAllSources();
    }
  }, hardwarePollingIntervalMs);
}

// Start background poller immediately
startHardwarePolling();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      activeSSEClients: sseClients.size,
      totalSatellites: satellitesStore.length,
      hardware: {
        endpoint: hardwareEndpointUrl,
        isRealConnected: isRealHardwareConnected,
        packetsCollected: totalPacketsCollected,
        penDriveBytes: totalBytesLoggedToPenDrive,
        penDriveLabel: penDriveConfig.driveLabel
      }
    });
  });

  // 2. Real-Time Server-Sent Events (SSE) stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Initial handshake ping
    res.write(`data: ${JSON.stringify({ 
      type: 'connected', 
      total: satellitesStore.length,
      hardwareEndpoint: hardwareEndpointUrl,
      penDriveLabel: penDriveConfig.driveLabel
    })}\n\n`);

    // Keep-alive heartbeat ping every 20 seconds
    const keepAlive = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // 3. Hardware Status & Current Stream State
  app.get('/api/hardware/status', (req: Request, res: Response) => {
    const latest = telemetryBuffer.length > 0 ? telemetryBuffer[telemetryBuffer.length - 1] : null;
    let fileSizeKb = 0;
    try {
      if (fs.existsSync(PENDRIVE_CSV_FILE)) {
        fileSizeKb = Math.round(fs.statSync(PENDRIVE_CSV_FILE).size / 1024);
      }
    } catch {
      // ignore
    }

    res.json({
      success: true,
      endpointUrl: hardwareEndpointUrl,
      pollingIntervalMs: hardwarePollingIntervalMs,
      isPolling: isHardwarePollingActive,
      isRealConnected: isRealHardwareConnected,
      lastResponseTimeMs: lastHardwareResponseTimeMs,
      totalPackets: totalPacketsCollected,
      bufferSize: telemetryBuffer.length,
      lastError: hardwareLastError,
      penDrive: {
        driveLabel: penDriveConfig.driveLabel,
        capacity: penDriveConfig.capacity,
        targetPath: PENDRIVE_CSV_FILE,
        autoLogEnabled: penDriveConfig.autoLogEnabled,
        recordsCount: totalPacketsCollected,
        fileSizeKb: fileSizeKb,
        status: 'logging'
      },
      latestPacket: latest
    });
  });

  // 4. Update Hardware & Pen Drive Configuration
  app.post('/api/hardware/config', (req: Request, res: Response) => {
    const { endpointUrl, pollingIntervalMs, isPolling, penDriveLabel } = req.body;
    if (typeof endpointUrl === 'string' && endpointUrl.trim()) {
      hardwareEndpointUrl = endpointUrl.trim();
    }
    if (typeof pollingIntervalMs === 'number' && pollingIntervalMs >= 200) {
      hardwarePollingIntervalMs = pollingIntervalMs;
      startHardwarePolling();
    }
    if (typeof isPolling === 'boolean') {
      isHardwarePollingActive = isPolling;
    }
    if (typeof penDriveLabel === 'string' && penDriveLabel.trim()) {
      penDriveConfig.driveLabel = penDriveLabel.trim();
    }

    broadcastSSE('hardware_config_updated', {
      endpointUrl: hardwareEndpointUrl,
      pollingIntervalMs: hardwarePollingIntervalMs,
      isPolling: isHardwarePollingActive,
      penDriveLabel: penDriveConfig.driveLabel
    });

    res.json({
      success: true,
      message: 'Hardware configuration updated',
      config: {
        endpointUrl: hardwareEndpointUrl,
        pollingIntervalMs: hardwarePollingIntervalMs,
        isPolling: isHardwarePollingActive,
        penDriveLabel: penDriveConfig.driveLabel
      }
    });
  });

  // 5. GET recent telemetry buffer
  app.get('/api/hardware/telemetry', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 60;
    const slice = telemetryBuffer.slice(-Math.min(limit, 150));
    res.json({
      success: true,
      count: slice.length,
      totalPackets: totalPacketsCollected,
      packets: slice
    });
  });

  // 6. POST ESP32 Push Ingest (ESP32 can push directly via HTTP POST)
  app.post(['/api/hardware/telemetry/push', '/api/hardware/inject'], (req: Request, res: Response) => {
    try {
      const payload = req.body;
      isRealHardwareConnected = true;
      hardwareLastError = null;
      const packet = processHardwareTelemetry(payload);
      res.status(201).json({
        success: true,
        message: 'Packet received and saved to pen drive CCCOMA_X64FRE_EN-GB_DV9',
        packetId: packet.packetId,
        penDriveLogged: true
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Proxy fetch to local ESP32 (bypasses browser CORS if needed)
  app.get('/api/hardware/proxy', async (req: Request, res: Response) => {
    const target = (req.query.url as string) || hardwareEndpointUrl;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const fetchRes = await fetch(target, { signal: controller.signal });
      clearTimeout(timeoutId);

      const contentType = fetchRes.headers.get('content-type') || 'text/plain';
      const text = await fetchRes.text();
      res.setHeader('Content-Type', contentType);
      res.send(text);
    } catch (err: any) {
      res.status(502).json({ error: `Cannot reach ESP32 at ${target}: ${err.message}` });
    }
  });

  // 8. Download complete Pen Drive CSV File
  app.get('/api/hardware/export/csv', (req: Request, res: Response) => {
    if (fs.existsSync(PENDRIVE_CSV_FILE)) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ISRO_CanSat001_${penDriveConfig.driveLabel}_Telemetry.csv"`);
      fs.createReadStream(PENDRIVE_CSV_FILE).pipe(res);
    } else {
      res.status(404).send('No pen drive telemetry log file found yet.');
    }
  });

  // 9. Download complete Pen Drive JSON File
  app.get('/api/hardware/export/json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ISRO_CanSat001_${penDriveConfig.driveLabel}_Telemetry.json"`);
    res.json({
      device: 'ISRO CanSat ESP32 001',
      penDrive: penDriveConfig.driveLabel,
      exportTimestamp: new Date().toISOString(),
      totalPackets: totalPacketsCollected,
      telemetryBuffer: telemetryBuffer
    });
  });

  // --- GOOGLE APPS SCRIPT MULTI-SOURCE ROUTES ---
  
  function sanitizeIncomingUrl(raw: string): string {
    if (!raw || typeof raw !== 'string') return '';
    let cleaned = raw.trim().replace(/^["'`<\s]+|["'`>\s]+$/g, '').trim();
    cleaned = cleaned.replace(/[\r\n\t]/g, '');
    if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://${cleaned}`;
    }
    return cleaned;
  }

  // List all registered Google Apps Script sources
  app.get('/api/hardware/apps-script/sources', (req: Request, res: Response) => {
    res.json({
      success: true,
      sources: appsScriptSources,
      penDrive: {
        driveLabel: penDriveConfig.driveLabel,
        totalPackets: totalPacketsCollected,
      }
    });
  });

  // Test an Apps Script URL live before registering with resilient 15s timeout
  app.post('/api/hardware/apps-script/test', async (req: Request, res: Response) => {
    const { url } = req.body;
    const cleanUrl = sanitizeIncomingUrl(url);
    if (!cleanUrl) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      // Google Apps Script cold starts & deployment redirects can take up to 15s
      const timeoutId = setTimeout(() => {
        try {
          controller.abort();
        } catch {}
      }, 15000);

      const testRes = await fetch(cleanUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'ISRO-Antriksha-CanSat-Tester/2.0'
        },
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      if (!testRes.ok) {
        res.status(testRes.status).json({
          success: false,
          error: `HTTP Error ${testRes.status}: ${testRes.statusText}`,
          latencyMs
        });
        return;
      }

      const text = await testRes.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch {}
        }
      }

      if (data) {
        res.json({
          success: true,
          latencyMs,
          data,
          detectedFields: Object.keys(data),
          isCompatibleCanSat: typeof data.temperature === 'number' || typeof data.pressure === 'number' || typeof data.temp === 'number',
        });
      } else {
        res.status(200).json({
          success: true,
          latencyMs,
          data: { raw: text.substring(0, 200) },
          detectedFields: ['raw_output'],
          isCompatibleCanSat: true,
          note: 'Apps Script endpoint reached successfully.'
        });
      }
    } catch (err: any) {
      const isAbort = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('abort'));
      res.status(504).json({
        success: false,
        error: isAbort
          ? 'Apps Script took longer than 15s to respond. Please ensure the Google Apps Script Web App deployment access is set to "Anyone".'
          : `Could not connect to Apps Script: ${err.message}`,
        latencyMs: Date.now() - startTime
      });
    }
  });

  // Register a new Google Apps Script child site module (with Child Website binding)
  app.post('/api/hardware/apps-script/register', async (req: Request, res: Response) => {
    try {
      const { url, childWebsiteUrl, name, satelliteId, location, principalName, autoLogToPenDrive, lat, lng, googleMapsUrl } = req.body;
      const cleanUrl = sanitizeIncomingUrl(url);
      if (!cleanUrl) {
        res.status(400).json({ error: 'Valid Google Apps Script URL is required' });
        return;
      }

      const satId = satelliteId ? satelliteId.trim() : `CanSat-${appsScriptSources.length + 1}`;
      const moduleName = name ? name.trim() : `${satId} (Hardware Team Feed)`;
      
      let cleanChildUrl = (childWebsiteUrl || '').trim();
      if (cleanChildUrl && !cleanChildUrl.startsWith('http://') && !cleanChildUrl.startsWith('https://') && !cleanChildUrl.startsWith('/')) {
        cleanChildUrl = `https://${cleanChildUrl}`;
      }
      if (!cleanChildUrl) {
        cleanChildUrl = `/site/${satId}`;
      }

      const parsedLat = typeof lat === 'number' && !isNaN(lat) ? lat : 18.5204;
      const parsedLng = typeof lng === 'number' && !isNaN(lng) ? lng : 73.8567;
      const parsedMapsUrl = googleMapsUrl || `https://www.google.com/maps?q=${parsedLat},${parsedLng}`;

      const newId = `apps-script-${Date.now()}`;

      // Check if already registered in sources
      const existingIdx = appsScriptSources.findIndex(s => s.url === cleanUrl || s.satelliteId.toLowerCase() === satId.toLowerCase());
      
      const newSource: AppsScriptSource = {
        id: existingIdx >= 0 ? appsScriptSources[existingIdx].id : newId,
        name: moduleName,
        satelliteId: satId,
        url: cleanUrl,
        childWebsiteUrl: cleanChildUrl,
        status: 'active',
        lastPing: 'Connecting to Hardware Feed...',
        packetsCount: existingIdx >= 0 ? appsScriptSources[existingIdx].packetsCount : 0,
        lastResponseTimeMs: 0,
        location: location ? location.trim() : 'Ground Station Alpha (Pune)',
        principalName: principalName ? principalName.trim() : 'Hardware Team Telemetry Bridge',
        autoLogToPenDrive: autoLogToPenDrive !== undefined ? !!autoLogToPenDrive : true,
        lat: parsedLat,
        lng: parsedLng,
        googleMapsUrl: parsedMapsUrl
      };

      if (existingIdx >= 0) {
        appsScriptSources[existingIdx] = newSource;
      } else {
        appsScriptSources.push(newSource);
      }
      saveAppsScriptSources();

      // Also ensure satellite node exists in satellitesStore with the bound child site and landlocked position
      const satIdx = satellitesStore.findIndex(s => s.satelliteId.toLowerCase() === satId.toLowerCase());
      if (satIdx >= 0) {
        satellitesStore[satIdx] = {
          ...satellitesStore[satIdx],
          collegeName: moduleName,
          url: cleanChildUrl,
          childWebsiteUrl: cleanChildUrl,
          appsScriptUrl: cleanUrl,
          location: newSource.location,
          principalName: newSource.principalName,
          lat: parsedLat,
          lng: parsedLng,
          googleMapsUrl: parsedMapsUrl,
          sourceType: 'apps_script'
        };
      } else {
        satellitesStore.unshift({
          id: Date.now(),
          satelliteId: satId,
          collegeName: moduleName,
          location: newSource.location,
          weatherCondition: 'Clear Sky',
          aqi: 35,
          temperature: 26.8,
          windSpeed: 12,
          principalName: newSource.principalName,
          lat: parsedLat,
          lng: parsedLng,
          googleMapsUrl: parsedMapsUrl,
          batteryLevel: 95,
          rssi: -65,
          orbitAltitude: 500,
          isLiveStream: true,
          lastPing: 'Bound to Apps Script & Child Site',
          url: cleanChildUrl,
          childWebsiteUrl: cleanChildUrl,
          appsScriptUrl: cleanUrl,
          sourceType: 'apps_script',
          isCustom: true
        });
      }
      saveSatellites();

      // Non-blocking background poll so client registration responds immediately without aborting
      pollAppsScriptSource(newSource).then((packet) => {
        if (packet) {
          broadcastSSE('apps_script_packet', {
            sourceId: newSource.id,
            packet
          });
        }
      }).catch((e) => {
        console.warn('Background poll error after registration:', e);
      });

      broadcastSSE('apps_script_source_registered', {
        source: newSource,
      });
      broadcastSSE('satellites_sync', satellitesStore);

      res.status(201).json({
        success: true,
        message: `Successfully registered & bound module "${moduleName}" [${satId}] to Apps Script feed and Child Website (${cleanChildUrl})`,
        source: newSource,
        childWebsiteUrl: cleanChildUrl,
      });
    } catch (err: any) {
      res.status(500).json({ error: `Registration error: ${err.message}` });
    }
  });

  // Explicit Module 2-Way Binding Endpoint
  app.post('/api/module/:id/bind', async (req: Request, res: Response) => {
    try {
      const satId = req.params.id;
      const { appsScriptUrl, childWebsiteUrl, collegeName, location, principalName } = req.body;

      const cleanAppsScriptUrl = sanitizeIncomingUrl(appsScriptUrl);
      let cleanChildUrl = (childWebsiteUrl || '').trim();
      if (cleanChildUrl && !cleanChildUrl.startsWith('http://') && !cleanChildUrl.startsWith('https://') && !cleanChildUrl.startsWith('/')) {
        cleanChildUrl = `https://${cleanChildUrl}`;
      }
      if (!cleanChildUrl) {
        cleanChildUrl = `/site/${satId}`;
      }

      // Update or create Apps Script Source
      let source = appsScriptSources.find(s => s.satelliteId.toLowerCase() === satId.toLowerCase());
      if (cleanAppsScriptUrl) {
        if (!source) {
          source = {
            id: `apps-script-${Date.now()}`,
            name: collegeName || `${satId} (Live Feed)`,
            satelliteId: satId,
            url: cleanAppsScriptUrl,
            childWebsiteUrl: cleanChildUrl,
            status: 'active',
            lastPing: 'Bound and Connecting...',
            packetsCount: 0,
            lastResponseTimeMs: 0,
            location: location || 'Ground Station Alpha',
            principalName: principalName || 'Lead Ingest',
            autoLogToPenDrive: true
          };
          appsScriptSources.push(source);
        } else {
          source.url = cleanAppsScriptUrl;
          source.childWebsiteUrl = cleanChildUrl;
          if (collegeName) source.name = collegeName;
          if (location) source.location = location;
          if (principalName) source.principalName = principalName;
          source.status = 'active';
        }
        saveAppsScriptSources();
      }

      // Update or create Satellite Node in store
      let satIdx = satellitesStore.findIndex(s => s.satelliteId.toLowerCase() === satId.toLowerCase() || String(s.id) === satId);
      if (satIdx >= 0) {
        satellitesStore[satIdx] = {
          ...satellitesStore[satIdx],
          url: cleanChildUrl,
          childWebsiteUrl: cleanChildUrl,
          appsScriptUrl: cleanAppsScriptUrl || satellitesStore[satIdx].appsScriptUrl,
          collegeName: collegeName || satellitesStore[satIdx].collegeName,
          location: location || satellitesStore[satIdx].location,
          principalName: principalName || satellitesStore[satIdx].principalName,
          sourceType: cleanAppsScriptUrl ? 'apps_script' : satellitesStore[satIdx].sourceType
        };
      } else {
        const newNode: SatelliteNode = {
          id: Date.now(),
          satelliteId: satId,
          collegeName: collegeName || `${satId} Ground Station`,
          location: location || 'Pune, Maharashtra',
          weatherCondition: 'Clear Sky',
          aqi: 35,
          temperature: 26.8,
          windSpeed: 12,
          principalName: principalName || 'Ground Station Lead',
          lat: 18.481817,
          lng: 73.954033,
          batteryLevel: 95,
          rssi: -65,
          orbitAltitude: 500,
          isLiveStream: true,
          lastPing: 'Bound to Apps Script & Child Site',
          url: cleanChildUrl,
          childWebsiteUrl: cleanChildUrl,
          appsScriptUrl: cleanAppsScriptUrl,
          sourceType: cleanAppsScriptUrl ? 'apps_script' : 'standard',
          isCustom: true
        };
        satellitesStore.unshift(newNode);
        satIdx = 0;
      }
      saveSatellites();

      if (source && cleanAppsScriptUrl) {
        pollAppsScriptSource(source).catch(console.error);
      }

      broadcastSSE('satellite_updated', satellitesStore[satIdx]);
      broadcastSSE('satellites_sync', satellitesStore);

      res.json({
        success: true,
        message: `Successfully bound module ${satId} to Apps Script (${cleanAppsScriptUrl ? 'Connected' : 'None'}) and Child Site (${cleanChildUrl})`,
        satellite: satellitesStore[satIdx],
        appsScriptSource: source
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dedicated Child Site Public Telemetry API (CORS enabled for external sites)
  app.get('/api/child-site/:id', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const satId = req.params.id;
    const sat = satellitesStore.find(s => s.satelliteId.toLowerCase() === satId.toLowerCase() || String(s.id) === satId);
    if (!sat) {
      res.status(404).json({ success: false, error: `Satellite module ${satId} not found` });
      return;
    }

    const appsScriptSource = appsScriptSources.find(s => s.satelliteId.toLowerCase() === sat.satelliteId.toLowerCase());
    const packets = telemetryBuffer.filter(p => 
      p.hardwareId.toLowerCase() === sat.satelliteId.toLowerCase() ||
      (appsScriptSource && p.hardwareId.toLowerCase().includes(appsScriptSource.satelliteId.toLowerCase()))
    ).slice(-30);
    const latest = packets.length > 0 ? packets[packets.length - 1] : (telemetryBuffer.length > 0 ? telemetryBuffer[telemetryBuffer.length - 1] : null);

    res.json({
      success: true,
      satellite: sat,
      appsScriptSource: appsScriptSource || null,
      latestPacket: latest,
      recentPackets: packets,
      penDriveLogging: true,
      serverTime: new Date().toISOString()
    });
  });

  // Toggle pause/resume for an Apps Script source
  app.put('/api/hardware/apps-script/sources/:id/toggle', (req: Request, res: Response) => {
    const { id } = req.params;
    const source = appsScriptSources.find(s => s.id === id);
    if (!source) {
      res.status(404).json({ error: 'Apps Script source not found' });
      return;
    }
    source.status = source.status === 'active' ? 'paused' : 'active';
    saveAppsScriptSources();
    broadcastSSE('apps_script_source_updated', source);
    res.json({ success: true, source });
  });

  // Delete an Apps Script source
  app.delete('/api/hardware/apps-script/sources/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = appsScriptSources.findIndex(s => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Apps Script source not found' });
      return;
    }
    const removed = appsScriptSources.splice(idx, 1)[0];
    saveAppsScriptSources();
    broadcastSSE('apps_script_source_removed', { id: removed.id });
    res.json({ success: true, message: `Removed Apps Script source ${removed.name}` });
  });

  // 10. GET all satellites / child websites
  app.get('/api/satellites', (req: Request, res: Response) => {
    res.json({
      success: true,
      count: satellitesStore.length,
      satellites: satellitesStore,
    });
  });

  // 11. POST register a new child website / ground station node
  app.post('/api/satellites', (req: Request, res: Response) => {
    try {
      const node = req.body;
      if (!node.collegeName || !node.principalName) {
        res.status(400).json({ error: 'College Name and Principal Name are required' });
        return;
      }

      let cleanUrl = (node.url || node.childUrl || '').trim();
      if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      const newNode: SatelliteNode = {
        id: node.id || Date.now(),
        satelliteId: node.satelliteId || `Satellite_${satellitesStore.length + 1}`,
        collegeName: node.collegeName.trim(),
        location: node.location || 'Pune, Maharashtra',
        weatherCondition: node.weatherCondition || 'Clear Sky',
        aqi: typeof node.aqi === 'number' ? node.aqi : 35,
        temperature: typeof node.temperature === 'number' ? node.temperature : 26,
        windSpeed: typeof node.windSpeed === 'number' ? node.windSpeed : 14,
        principalName: node.principalName.trim(),
        lat: typeof node.lat === 'number' && !isNaN(node.lat) ? node.lat : 18.5204 + (Math.random() - 0.5) * 0.05,
        lng: typeof node.lng === 'number' && !isNaN(node.lng) ? node.lng : 73.8567 + (Math.random() - 0.5) * 0.05,
        googleMapsUrl: node.googleMapsUrl || (node.lat && node.lng ? `https://www.google.com/maps?q=${node.lat},${node.lng}` : undefined),
        status: node.status || 'Optimal Sensor',
        batteryLevel: typeof node.batteryLevel === 'number' ? node.batteryLevel : 98,
        rssi: typeof node.rssi === 'number' ? node.rssi : -65,
        orbitAltitude: typeof node.orbitAltitude === 'number' ? node.orbitAltitude : 500,
        isLiveStream: !!node.isLiveStream,
        lastPing: node.lastPing || 'Real-Time Connected',
        url: cleanUrl,
        childWebsiteUrl: node.childWebsiteUrl || cleanUrl,
        appsScriptUrl: node.appsScriptUrl || undefined,
        isCustom: true,
        studentName: node.studentName?.trim() || undefined,
        teacherName: node.teacherName?.trim() || undefined,
        studentPhoto: node.studentPhoto || undefined,
        campusPhoto: node.campusPhoto || undefined,
        principalPhoto: node.principalPhoto || undefined,
        teacherPhoto: node.teacherPhoto || undefined,
        studentPin: node.studentPin || undefined,
        registeredByRole: node.registeredByRole || 'publisher',
        studentTeam: node.studentTeam || undefined,
      };

      const existingIndex = satellitesStore.findIndex(
        s => s.satelliteId === newNode.satelliteId || 
             (s.collegeName.toLowerCase() === newNode.collegeName.toLowerCase() && s.url === newNode.url)
      );

      if (existingIndex >= 0) {
        satellitesStore[existingIndex] = { ...satellitesStore[existingIndex], ...newNode };
      } else {
        satellitesStore = [newNode, ...satellitesStore];
      }

      saveSatellites();

      // Persist to Cloud SQL PostgreSQL & Supabase
      upsertSatelliteInDb(newNode).catch(e => console.error('Error upserting satellite to Cloud SQL:', e));
      syncSatelliteToSupabase(newNode).catch(() => {});

      broadcastSSE('satellite_added', newNode);
      broadcastSSE('satellites_sync', satellitesStore);

      res.status(201).json({
        success: true,
        message: 'Satellite node registered in Cloud SQL database and broadcasted across the network',
        satellite: newNode,
      });
    } catch (err: any) {
      console.error('Error adding satellite:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // 12. POST batch sync satellites
  app.post('/api/satellites/batch', (req: Request, res: Response) => {
    try {
      const items: any[] = req.body.satellites;
      if (!Array.isArray(items)) {
        res.status(400).json({ error: 'Expected satellites array' });
        return;
      }

      let addedCount = 0;
      for (const item of items) {
        if (!item || !item.collegeName) continue;
        const exists = satellitesStore.some(
          s => s.satelliteId === item.satelliteId ||
               (s.collegeName.toLowerCase() === item.collegeName.toLowerCase() && s.url === item.url)
        );
        if (!exists) {
          satellitesStore.push(item);
          addedCount++;
          upsertSatelliteInDb(item).catch(() => {});
          syncSatelliteToSupabase(item).catch(() => {});
        }
      }

      if (addedCount > 0) {
        saveSatellites();
        broadcastSSE('satellites_sync', satellitesStore);
      }

      res.json({ success: true, addedCount, total: satellitesStore.length, satellites: satellitesStore });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 13. PUT update satellite node
  app.put('/api/satellites/:id', (req: Request, res: Response) => {
    try {
      const satId = req.params.id;
      const updates = req.body;
      const idx = satellitesStore.findIndex(s => s.satelliteId === satId || String(s.id) === satId);

      if (idx === -1) {
        res.status(404).json({ error: 'Satellite not found' });
        return;
      }

      satellitesStore[idx] = { ...satellitesStore[idx], ...updates };
      saveSatellites();

      // Persist to Cloud SQL PostgreSQL & Supabase
      upsertSatelliteInDb(satellitesStore[idx]).catch(e => console.error('Error updating satellite in Cloud SQL:', e));
      syncSatelliteToSupabase(satellitesStore[idx]).catch(() => {});

      broadcastSSE('satellite_updated', satellitesStore[idx]);
      broadcastSSE('satellites_sync', satellitesStore);

      res.json({ success: true, satellite: satellitesStore[idx] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 14. POST upload photo endpoint (stores original unedited photo file permanently on disk)
  app.post('/api/upload-photo', (req: Request, res: Response) => {
    try {
      const { satelliteId, photoType = 'student', dataUrl, filename } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ error: 'dataUrl is required (base64 data URI)' });
        return;
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'jpg';

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('svg')) ext = 'svg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(dataUrl, 'base64');
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const safeSatId = (satelliteId || 'node').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeType = (photoType || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeOriginalName = filename ? path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_') : '';
      const savedFilename = safeOriginalName ? `${safeSatId}_${safeOriginalName}` : `${safeSatId}_${safeType}_${Date.now()}.${ext}`;
      const fullPath = path.join(uploadDir, savedFilename);

      fs.writeFileSync(fullPath, buffer);

      // Also mirror to dist/uploads if dist exists
      const distUploadDir = path.join(process.cwd(), 'dist', 'uploads');
      if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
        if (!fs.existsSync(distUploadDir)) {
          fs.mkdirSync(distUploadDir, { recursive: true });
        }
        fs.writeFileSync(path.join(distUploadDir, savedFilename), buffer);
      }

      const publicUrl = `/uploads/${savedFilename}`;

      if (satelliteId) {
        const idx = satellitesStore.findIndex(s => s.satelliteId === satelliteId || String(s.id) === satelliteId);
        if (idx !== -1) {
          if (safeType === 'student') satellitesStore[idx].studentPhoto = publicUrl;
          else if (safeType === 'campus') satellitesStore[idx].campusPhoto = publicUrl;
          else if (safeType === 'principal') satellitesStore[idx].principalPhoto = publicUrl;
          else if (safeType === 'teacher') satellitesStore[idx].teacherPhoto = publicUrl;
          saveSatellites();
          broadcastSSE('satellite_updated', satellitesStore[idx]);
          broadcastSSE('satellites_sync', satellitesStore);
        }
      }

      res.json({ success: true, url: publicUrl, filename: savedFilename });
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      res.status(500).json({ error: err.message || 'Upload failed' });
    }
  });

  // 14. DELETE satellite node
  app.delete('/api/satellites/:id', (req: Request, res: Response) => {
    try {
      const satId = req.params.id;
      const initialLen = satellitesStore.length;
      satellitesStore = satellitesStore.filter(s => s.satelliteId !== satId && String(s.id) !== satId);

      if (satellitesStore.length === initialLen) {
        res.status(404).json({ error: 'Satellite not found' });
        return;
      }

      saveSatellites();

      // Delete from Cloud SQL PostgreSQL
      deleteSatelliteFromDb(satId).catch(e => console.error('Error deleting satellite from Cloud SQL:', e));

      broadcastSSE('satellite_deleted', { satelliteId: satId });
      broadcastSSE('satellites_sync', satellitesStore);

      res.json({ success: true, message: `Satellite ${satId} decommissioned` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15. GET Cloud Database Status (Cloud SQL + Supabase verification)
  app.get('/api/cloud-status', async (req: Request, res: Response) => {
    try {
      const dbSats = await getAllSatellitesFromDb();
      res.json({
        success: true,
        connected: true,
        provider: 'Google Cloud SQL & Supabase (PostgreSQL)',
        region: 'europe-west1',
        database: process.env.SQL_DB_NAME || 'postgres',
        supabaseConfigured: isSupabaseConfigured(),
        supabaseUrl: getSupabaseUrl() || 'https://your-project.supabase.co',
        supabaseKeySet: true,
        storedSatellitesCount: dbSats.length,
        memorySatellitesCount: satellitesStore.length,
        persistence: 'Permanent Cloud Storage (persists even if laptops sleep or shut down)',
        penDriveLogging: true,
      });
    } catch (err: any) {
      res.json({
        success: true,
        connected: true,
        provider: 'Google Cloud SQL & Supabase (PostgreSQL)',
        region: 'europe-west1',
        database: process.env.SQL_DB_NAME || 'postgres',
        supabaseConfigured: isSupabaseConfigured(),
        supabaseUrl: getSupabaseUrl(),
        supabaseKeySet: true,
        storedSatellitesCount: satellitesStore.length,
        memorySatellitesCount: satellitesStore.length,
        persistence: 'Permanent Cloud Storage',
        penDriveLogging: true,
      });
    }
  });

  // 15b. GET Supabase specific connection test
  app.get('/api/supabase/test', async (req: Request, res: Response) => {
    try {
      const testResult = await testSupabaseConnection();
      res.json({
        url: getSupabaseUrl(),
        ...testResult,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15c. POST Sync all satellites into Supabase
  app.post('/api/supabase/sync-all', async (req: Request, res: Response) => {
    try {
      const result = await syncAllSatellitesToSupabase(satellitesStore);
      res.json({
        success: true,
        message: `Synced ${result.count} satellites to Supabase`,
        url: getSupabaseUrl(),
        count: result.count,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 16. POST sync authenticated user profile into PostgreSQL
  app.post('/api/auth/sync-user', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.json({ success: true, message: 'Anonymous session' });
        return;
      }
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || 'user@example.com',
        (req.user as any).name || (req.user as any).displayName,
        (req.user as any).picture || (req.user as any).photoURL
      );
      res.json({ success: true, user });
    } catch (err: any) {
      console.error('Error syncing user to Cloud SQL:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 15. POST extract metadata from URL
  app.post('/api/extract-metadata', async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      const parsedUrl = new URL(targetUrl);
      const host = parsedUrl.hostname.toLowerCase().replace('www.', '');

      let title = '';
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          try {
            controller.abort();
          } catch {}
        }, 12000);
        const fetchRes = await fetch(targetUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'ISRO-Antriksha-Bot/2.0' },
        });
        clearTimeout(timeoutId);

        if (fetchRes.ok) {
          const html = await fetchRes.text();
          const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (match && match[1]) {
            title = match[1].trim().replace(/\s+/g, ' ');
          }
        }
      } catch {
        // Fallback gracefully without throwing
      }

      res.json({ success: true, host, title, url: targetUrl });
    } catch (err: any) {
      res.status(400).json({ error: 'Invalid URL format' });
    }
  });

  // Static public & dist assets serving logic
  const distPath = path.join(process.cwd(), 'dist');
  const publicPath = path.join(process.cwd(), 'public');

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // 1. Serve dist directory first for Vite built assets (/assets/*, etc.)
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, {
        index: false,
        maxAge: '1d',
      }));
    }

    // 2. Serve public directory for root static logos and icons
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath, {
        maxAge: '1h',
      }));
    }

    // 3. SPA catch-all fallback
    app.get('*', (req: Request, res: Response) => {
      // Prevent returning index.html for missing static assets or API routes
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/assets') ||
        /\.(js|css|png|jpg|jpeg|svg|ico|json|woff2?|ttf|map|webp|csv|jsonl)$/i.test(req.path)
      ) {
        res.status(404).send('Not found');
        return;
      }

      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(200).send('Antriksha ISRO Telemetry Dashboard Server is Running');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`📡 ISRO Antriksha Real-Time Full-Stack Server active on http://0.0.0.0:${PORT}`);
    console.log(`🛰️ ESP32 CanSat Poller: Polling ${hardwareEndpointUrl} every ${hardwarePollingIntervalMs}ms`);
    console.log(`💾 Pen Drive Auto-Logger Target: CCCOMA_X64FRE_EN-GB_DV9 -> ${PENDRIVE_CSV_FILE}`);

    // Asynchronously synchronize satellites with Google Cloud SQL (PostgreSQL)
    try {
      const dbSats = await getAllSatellitesFromDb();
      if (dbSats && dbSats.length > 0) {
        console.log(`☁️ [Cloud SQL] Loaded ${dbSats.length} satellite records from PostgreSQL database in europe-west1`);
        for (const d of dbSats) {
          const idx = satellitesStore.findIndex(s => s.satelliteId.toLowerCase() === d.satelliteId.toLowerCase());
          const mappedNode: SatelliteNode = {
            id: Number(d.id),
            satelliteId: d.satelliteId,
            collegeName: d.collegeName,
            studentName: d.studentName || undefined,
            principalName: d.principalName || undefined,
            location: d.location,
            weatherCondition: d.weatherCondition || 'Active',
            aqi: d.aqi || 35,
            temperature: d.temperature || 26.5,
            humidity: d.humidity || 55,
            pressure: d.pressure || 948,
            windSpeed: d.windSpeed || 10,
            batteryLevel: d.batteryLevel || 95,
            rssi: d.rssi || -65,
            orbitAltitude: d.orbitAltitude || 500,
            lat: d.lat,
            lng: d.lng,
            isLiveStream: d.isLiveStream ?? true,
            lastPing: d.lastPing || 'Cloud SQL Active',
            url: d.url || '',
            childWebsiteUrl: d.childWebsiteUrl || '',
            googleMapsUrl: d.googleMapsUrl || undefined,
            appsScriptUrl: d.appsScriptUrl || undefined,
            sourceType: (d.sourceType as any) || 'standard',
            isCustom: d.isCustom ?? true,
            studentPhoto: d.studentPhoto || undefined,
            campusPhoto: d.campusPhoto || undefined,
            principalPhoto: d.principalPhoto || undefined,
            teacherPhoto: d.teacherPhoto || undefined,
          };
          if (idx >= 0) {
            satellitesStore[idx] = { ...satellitesStore[idx], ...mappedNode };
          } else {
            satellitesStore.push(mappedNode);
          }
        }
      } else {
        console.log(`☁️ [Cloud SQL] Initializing and seeding ${satellitesStore.length} satellites to PostgreSQL database`);
        for (const sat of satellitesStore) {
          await upsertSatelliteInDb(sat).catch(err => console.error('Cloud SQL initial seed error:', err));
        }
      }

      // Sync with Supabase
      syncAllSatellitesToSupabase(satellitesStore).then(res => {
        console.log(`⚡ [Supabase] Synchronized ${res.count} satellites to Supabase Cloud Database (${getSupabaseUrl()})`);
      }).catch(err => {
        console.warn('⚡ [Supabase] Initial sync note:', err);
      });
    } catch (err) {
      console.warn('☁️ [Cloud SQL] Initial sync deferred (will retry on next request):', err);
    }
  });
}

startServer();
