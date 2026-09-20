import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseUrl = (): string => {
  return (
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    'https://nhfhyxlsoqenxejsnlwg.supabase.co'
  );
};

export const getSupabaseKey = (): string => {
  return (
    (typeof process !== 'undefined' && process.env?.SUPABASE_KEY) ||
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

// Map a raw Supabase database row to SatelliteNode format
export function mapSupabaseRowToSatellite(d: any): any {
  if (!d) return null;
  let principalName = d.principal_name || undefined;
  let teacherName: string | undefined = undefined;
  if (principalName && principalName.includes('(Teacher:')) {
    const match = principalName.match(/\(Teacher:\s*(.*?)\)/);
    if (match) {
      teacherName = match[1].trim();
      principalName = principalName.replace(/\s*\(Teacher:\s*.*?\)/, '').trim();
      if (!principalName) principalName = undefined;
    }
  }

  const satId = d.satellite_id;
  const childUrl = d.child_website_url || d.url || (satId ? `/site/${encodeURIComponent(satId)}` : '');

  return {
    id: Number(d.id) || Date.now(),
    satelliteId: satId,
    collegeName: d.college_name || 'Academic Ground Station',
    studentName: d.student_name || undefined,
    principalName: principalName,
    teacherName: teacherName,
    location: d.location || 'India',
    weatherCondition: d.weather_condition || 'Active',
    aqi: typeof d.aqi === 'number' && !isNaN(d.aqi) ? d.aqi : 35,
    temperature: typeof d.temperature === 'number' && !isNaN(d.temperature) ? d.temperature : 26.5,
    humidity: typeof d.humidity === 'number' && !isNaN(d.humidity) ? d.humidity : 55,
    pressure: typeof d.pressure === 'number' && !isNaN(d.pressure) ? d.pressure : 948,
    windSpeed: typeof d.wind_speed === 'number' && !isNaN(d.wind_speed) ? d.wind_speed : 10,
    batteryLevel: typeof d.battery_level === 'number' && !isNaN(d.battery_level) ? d.battery_level : 95,
    rssi: typeof d.rssi === 'number' && !isNaN(d.rssi) ? d.rssi : -65,
    orbitAltitude: typeof d.orbit_altitude === 'number' && !isNaN(d.orbit_altitude) ? d.orbit_altitude : 500,
    lat: typeof d.lat === 'number' && !isNaN(d.lat) ? d.lat : 18.5204,
    lng: typeof d.lng === 'number' && !isNaN(d.lng) ? d.lng : 73.8567,
    isLiveStream: d.is_live_stream ?? true,
    lastPing: d.last_ping || 'Supabase Active',
    url: childUrl,
    childWebsiteUrl: childUrl,
    googleMapsUrl: d.google_maps_url || undefined,
    appsScriptUrl: d.apps_script_url || undefined,
    sourceType: d.source_type || (d.apps_script_url ? 'apps_script' : 'standard'),
    isCustom: d.is_custom ?? true,
    studentPhoto: d.student_photo || undefined,
    campusPhoto: d.campus_photo || undefined,
    principalPhoto: d.principal_photo || undefined,
    teacherPhoto: d.teacher_photo || undefined,
  };
}

// Database helper functions for Satellites in Supabase
export async function syncSatelliteToSupabase(sat: any) {
  const client = getSupabase();
  if (!client) return null;
  try {
    let storedPrincipal = sat.principalName || null;
    if (sat.teacherName && storedPrincipal) {
      if (!storedPrincipal.includes('(Teacher:')) {
        storedPrincipal = `${storedPrincipal} (Teacher: ${sat.teacherName})`;
      }
    } else if (sat.teacherName && !storedPrincipal) {
      storedPrincipal = `(Teacher: ${sat.teacherName})`;
    }

    const payload = {
      id: Number(sat.id) || Date.now(),
      satellite_id: sat.satelliteId,
      college_name: sat.collegeName || 'Academic Ground Station',
      student_name: sat.studentName || null,
      principal_name: storedPrincipal,
      location: sat.location || 'India',
      weather_condition: sat.weatherCondition || 'Active',
      aqi: typeof sat.aqi === 'number' ? sat.aqi : 35,
      temperature: typeof sat.temperature === 'number' ? sat.temperature : 26.5,
      humidity: typeof sat.humidity === 'number' ? sat.humidity : 55,
      pressure: typeof sat.pressure === 'number' ? sat.pressure : 948,
      wind_speed: typeof sat.windSpeed === 'number' ? sat.windSpeed : 10,
      battery_level: typeof sat.batteryLevel === 'number' ? sat.batteryLevel : 95,
      rssi: typeof sat.rssi === 'number' ? sat.rssi : -65,
      orbit_altitude: typeof sat.orbitAltitude === 'number' ? sat.orbitAltitude : 500,
      lat: typeof sat.lat === 'number' ? sat.lat : 18.5204,
      lng: typeof sat.lng === 'number' ? sat.lng : 73.8567,
      is_live_stream: sat.isLiveStream ?? true,
      last_ping: sat.lastPing || 'Supabase Sync Online',
      url: sat.url || null,
      child_website_url: sat.childWebsiteUrl || sat.url || null,
      google_maps_url: sat.googleMapsUrl || null,
      apps_script_url: sat.appsScriptUrl || null,
      source_type: sat.sourceType || 'standard',
      is_custom: sat.isCustom ?? true,
      student_photo: sat.studentPhoto || null,
      campus_photo: sat.campusPhoto || null,
      principal_photo: sat.principalPhoto || null,
      teacher_photo: sat.teacherPhoto || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('satellites')
      .upsert(payload, { onConflict: 'satellite_id' })
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

export async function deleteSatelliteFromSupabase(satelliteId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client || !satelliteId) return false;
  try {
    const { error } = await client
      .from('satellites')
      .delete()
      .eq('satellite_id', satelliteId);
    if (error) {
      console.warn('Supabase delete satellite warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete error:', err);
    return false;
  }
}

export function subscribeToSupabaseSatellites(
  onInsert: (sat: any) => void,
  onUpdate: (sat: any) => void,
  onDelete: (satelliteId: string) => void
): () => void {
  const client = getSupabase();
  if (!client) return () => {};
  try {
    const channel = client
      .channel('public:satellites_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'satellites' },
        (payload: any) => {
          try {
            if (payload.eventType === 'INSERT' && payload.new) {
              const mapped = mapSupabaseRowToSatellite(payload.new);
              if (mapped) onInsert(mapped);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const mapped = mapSupabaseRowToSatellite(payload.new);
              if (mapped) onUpdate(mapped);
            } else if (payload.eventType === 'DELETE' && payload.old) {
              onDelete(payload.old.satellite_id);
            }
          } catch (err) {
            console.warn('Error handling realtime change:', err);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        client.removeChannel(channel);
      } catch {}
    };
  } catch (e) {
    console.warn('Supabase realtime subscribe error:', e);
    return () => {};
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
    return (data || []).map(mapSupabaseRowToSatellite).filter(Boolean);
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

