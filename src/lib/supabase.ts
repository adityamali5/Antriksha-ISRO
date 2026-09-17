import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseUrl = (): string => {
  return (
    process.env.SUPABASE_URL ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    'https://nhfhyxlsoqenxejsnlwg.supabase.co'
  );
};

export const getSupabaseKey = (): string => {
  return (
    process.env.SUPABASE_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    'sb_publishable_HUkMekkxwLC-nHYxWYywIg_kIYrYdA4'
  );
};

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return Boolean(url && key && url.startsWith('http'));
};

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseClient) return supabaseClient;
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }
  return supabaseClient;
};

// Database helper functions for Satellites in Supabase
export async function syncSatelliteToSupabase(sat: any) {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('satellites')
      .upsert({
        id: sat.id,
        satellite_id: sat.satelliteId,
        college_name: sat.collegeName,
        student_name: sat.studentName || null,
        principal_name: sat.principalName || null,
        location: sat.location,
        weather_condition: sat.weatherCondition || 'Active',
        aqi: sat.aqi || 35,
        temperature: sat.temperature || 26.5,
        humidity: sat.humidity || 55,
        pressure: sat.pressure || 948,
        wind_speed: sat.windSpeed || 10,
        battery_level: sat.batteryLevel || 95,
        rssi: sat.rssi || -65,
        orbit_altitude: sat.orbitAltitude || 500,
        lat: sat.lat,
        lng: sat.lng,
        is_live_stream: sat.isLiveStream ?? true,
        last_ping: sat.lastPing || 'Supabase Sync Online',
        url: sat.url || null,
        child_website_url: sat.childWebsiteUrl || null,
        google_maps_url: sat.googleMapsUrl || null,
        apps_script_url: sat.appsScriptUrl || null,
        source_type: sat.sourceType || 'standard',
        is_custom: sat.isCustom ?? true,
        student_photo: sat.studentPhoto || null,
        campus_photo: sat.campusPhoto || null,
        principal_photo: sat.principalPhoto || null,
        teacher_photo: sat.teacherPhoto || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'satellite_id' })
      .select();

    if (error) {
      console.warn('Supabase upsert warning:', error.message);
    }
    return data;
  } catch (err) {
    console.warn('Supabase sync error:', err);
    return null;
  }
}

export async function fetchSatellitesFromSupabase() {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client.from('satellites').select('*');
    if (error) {
      console.warn('Supabase fetch satellites warning:', error.message);
      return [];
    }
    return (data || []).map((d: any) => ({
      id: Number(d.id),
      satelliteId: d.satellite_id,
      collegeName: d.college_name,
      studentName: d.student_name || undefined,
      principalName: d.principal_name || undefined,
      location: d.location,
      weatherCondition: d.weather_condition || 'Active',
      aqi: d.aqi || 35,
      temperature: d.temperature || 26.5,
      humidity: d.humidity || 55,
      pressure: d.pressure || 948,
      windSpeed: d.wind_speed || 10,
      batteryLevel: d.battery_level || 95,
      rssi: d.rssi || -65,
      orbitAltitude: d.orbit_altitude || 500,
      lat: d.lat,
      lng: d.lng,
      isLiveStream: d.is_live_stream ?? true,
      lastPing: d.last_ping || 'Supabase Active',
      url: d.url || '',
      childWebsiteUrl: d.child_website_url || '',
      googleMapsUrl: d.google_maps_url || undefined,
      appsScriptUrl: d.apps_script_url || undefined,
      sourceType: d.source_type || 'standard',
      isCustom: d.is_custom ?? true,
      studentPhoto: d.student_photo || undefined,
      campusPhoto: d.campus_photo || undefined,
      principalPhoto: d.principal_photo || undefined,
      teacherPhoto: d.teacher_photo || undefined,
    }));
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return [];
  }
}

export async function syncTelemetryPacketToSupabase(packet: any) {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { error } = await client.from('telemetry_packets').insert({
      packet_id: packet.packetId,
      satellite_id: packet.hardwareId || packet.satelliteId || 'CanSat-01',
      timestamp: packet.timestamp || new Date().toISOString(),
      temperature: packet.temperature,
      pressure: packet.pressure,
      altitude: packet.altitude,
      aqi: packet.aqi,
      humidity: packet.humidity,
      wind_speed: packet.windSpeed,
      battery_voltage: packet.batteryVoltage,
      battery_percent: packet.batteryPercent,
      rssi: packet.rssi,
      lat: packet.lat,
      lng: packet.lng,
      saved_to_pen_drive: packet.savedToPenDrive ?? true,
    });
    if (error) {
      console.warn('Supabase telemetry insert warning:', error.message);
    }
  } catch (err) {
    // non-blocking
  }
}

export async function syncAllSatellitesToSupabase(satellites: any[]) {
  const client = getSupabase();
  if (!client || !satellites || satellites.length === 0) return { success: false, count: 0 };
  let synced = 0;
  for (const sat of satellites) {
    try {
      await syncSatelliteToSupabase(sat);
      synced++;
    } catch {
      // continue
    }
  }
  return { success: true, count: synced };
}

export async function testSupabaseConnection() {
  const client = getSupabase();
  if (!client) return { connected: false, error: 'Supabase client not initialized' };
  try {
    const { data, error } = await client.from('satellites').select('id, satellite_id').limit(5);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true, data };
  } catch (err: any) {
    return { connected: false, error: err.message || 'Unknown connection error' };
  }
}

