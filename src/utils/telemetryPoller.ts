import { CanSatTelemetryPacket } from '../types';

export interface ParsedAppsScriptTelemetry {
  status?: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  altitude?: number;
  aqi?: number;
  batteryPercent?: number;
  batteryVoltage?: number;
  rssi?: number;
  lat?: number;
  lng?: number;
  timestamp?: string;
  studentName?: string;
  collegeName?: string;
  raw?: any;
}

// In-flight guard to prevent duplicate stacked fetches
const activeFetches = new Set<string>();

/**
 * Directly polls a Google Apps Script web app endpoint or hardware URL from the browser.
 * Works seamlessly in client-side static environments without needing an Express backend.
 */
export async function fetchTelemetryFromAppsScript(
  url: string,
  timeoutMs: number = 9000
): Promise<ParsedAppsScriptTelemetry | null> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;

  const cleanUrl = url.trim();
  if (activeFetches.has(cleanUrl)) return null;

  activeFetches.add(cleanUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort();
    } catch {}
  }, timeoutMs);

  try {
    const res = await fetch(cleanUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, text/plain, */*'
      },
      redirect: 'follow'
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[TelemetryPoller] HTTP ${res.status} from ${cleanUrl.slice(0, 50)}...`);
      return null;
    }

    const text = await res.text();
    let data: any = null;

    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          data = JSON.parse(match[0]);
        } catch {}
      }
    }

    if (!data) return null;

    // Check for NO_DATA sentinel
    if (data.status === 'NO_DATA') {
      return { status: 'NO_DATA' };
    }

    // Support array responses (take last telemetry item)
    if (Array.isArray(data)) {
      if (data.length === 0) return null;
      data = data[data.length - 1];
    }

    const parseNum = (val: any): number | undefined => {
      if (val === null || val === undefined || val === '') return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    };

    const rawTemp = data.temperature ?? data.temp ?? data.temperature_c ?? data.Temp;
    const temperature = parseNum(rawTemp);

    const rawHum = data.humidity ?? data.hum ?? data.Humidity ?? data.humidity_pct;
    const humidity = parseNum(rawHum);

    const rawPress = data.pressure ?? data.press ?? data.pressure_hpa ?? data.Pressure;
    const pressure = parseNum(rawPress);

    const rawAlt = data.altitude ?? data.alt ?? data.Altitude;
    let altitude = parseNum(rawAlt);
    if (altitude === undefined && pressure !== undefined && pressure > 0) {
      altitude = Number((44330 * (1 - Math.pow(Math.max(300, pressure) / 1013.25, 0.1903))).toFixed(1));
    }

    const rawAqi = data.aqi ?? data.air_quality ?? (data.gas ? Math.round(Number(data.gas) / 10) : undefined);
    const aqi = parseNum(rawAqi);

    const rawVolt = data.batteryVoltage ?? data.vbat ?? data.voltage;
    const batteryVoltage = parseNum(rawVolt);

    const rawBat = data.batteryPercent ?? data.battery ?? (batteryVoltage !== undefined ? Math.max(5, Math.min(100, Math.round(((batteryVoltage - 3.3) / 0.9) * 100))) : undefined);
    const batteryPercent = parseNum(rawBat);

    const rssi = parseNum(data.rssi);
    const lat = parseNum(data.latitude ?? data.lat);
    const lng = parseNum(data.longitude ?? data.lng);

    return {
      status: data.status || 'OK',
      temperature,
      humidity,
      pressure,
      altitude,
      aqi,
      batteryPercent,
      batteryVoltage,
      rssi,
      lat: (lat && lat !== 0) ? lat : undefined,
      lng: (lng && lng !== 0) ? lng : undefined,
      timestamp: data.receivedAt || (data.timestamp ? new Date(typeof data.timestamp === 'number' && data.timestamp < 10000000000 ? data.timestamp * 1000 : data.timestamp).toISOString() : new Date().toISOString()),
      studentName: data.student_name || data.studentName || undefined,
      collegeName: data.school_name || data.college_name || data.collegeName || undefined,
      raw: data
    };
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[TelemetryPoller] Fetch error:', err.message || err);
    }
    return null;
  } finally {
    activeFetches.delete(cleanUrl);
  }
}
