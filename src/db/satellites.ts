import { db } from './index.ts';
import { satellites, telemetryPackets, appsScriptSources } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface DbSatelliteInput {
  id: number;
  satelliteId: string;
  collegeName: string;
  studentName?: string;
  principalName?: string;
  location: string;
  weatherCondition?: string;
  aqi?: number;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  windSpeed?: number;
  batteryLevel?: number;
  rssi?: number;
  orbitAltitude?: number;
  lat: number;
  lng: number;
  isLiveStream?: boolean;
  lastPing?: string;
  url?: string;
  childWebsiteUrl?: string;
  googleMapsUrl?: string;
  appsScriptUrl?: string;
  sourceType?: string;
  isCustom?: boolean;
  studentPhoto?: string;
  campusPhoto?: string;
  principalPhoto?: string;
  teacherPhoto?: string;
  creatorUid?: string;
}

export async function getAllSatellitesFromDb() {
  try {
    return await db.select().from(satellites);
  } catch (error) {
    console.error('Database query failed for getAllSatellitesFromDb:', error);
    throw new Error('Database query failed to fetch satellites.', { cause: error });
  }
}

export async function upsertSatelliteInDb(sat: DbSatelliteInput) {
  try {
    const result = await db.insert(satellites)
      .values({
        id: sat.id,
        satelliteId: sat.satelliteId,
        collegeName: sat.collegeName,
        studentName: sat.studentName || null,
        principalName: sat.principalName || null,
        location: sat.location,
        weatherCondition: sat.weatherCondition || 'Active',
        aqi: sat.aqi || 35,
        temperature: sat.temperature || 26.5,
        humidity: sat.humidity || 55,
        pressure: sat.pressure || 948,
        windSpeed: sat.windSpeed || 10,
        batteryLevel: sat.batteryLevel || 95,
        rssi: sat.rssi || -65,
        orbitAltitude: sat.orbitAltitude || 500,
        lat: sat.lat,
        lng: sat.lng,
        isLiveStream: sat.isLiveStream ?? true,
        lastPing: sat.lastPing || 'Telemetry Link Online',
        url: sat.url || null,
        childWebsiteUrl: sat.childWebsiteUrl || null,
        googleMapsUrl: sat.googleMapsUrl || null,
        appsScriptUrl: sat.appsScriptUrl || null,
        sourceType: sat.sourceType || 'standard',
        isCustom: sat.isCustom ?? true,
        studentPhoto: sat.studentPhoto || null,
        campusPhoto: sat.campusPhoto || null,
        principalPhoto: sat.principalPhoto || null,
        teacherPhoto: sat.teacherPhoto || null,
        creatorUid: sat.creatorUid || null,
      })
      .onConflictDoUpdate({
        target: satellites.satelliteId,
        set: {
          collegeName: sat.collegeName,
          studentName: sat.studentName || null,
          principalName: sat.principalName || null,
          location: sat.location,
          weatherCondition: sat.weatherCondition || 'Active',
          aqi: sat.aqi || 35,
          temperature: sat.temperature || 26.5,
          humidity: sat.humidity || 55,
          pressure: sat.pressure || 948,
          windSpeed: sat.windSpeed || 10,
          batteryLevel: sat.batteryLevel || 95,
          rssi: sat.rssi || -65,
          orbitAltitude: sat.orbitAltitude || 500,
          lat: sat.lat,
          lng: sat.lng,
          isLiveStream: sat.isLiveStream ?? true,
          lastPing: sat.lastPing || 'Telemetry Link Online',
          url: sat.url || null,
          childWebsiteUrl: sat.childWebsiteUrl || null,
          googleMapsUrl: sat.googleMapsUrl || null,
          appsScriptUrl: sat.appsScriptUrl || null,
          sourceType: sat.sourceType || 'standard',
          isCustom: sat.isCustom ?? true,
          studentPhoto: sat.studentPhoto || null,
          campusPhoto: sat.campusPhoto || null,
          principalPhoto: sat.principalPhoto || null,
          teacherPhoto: sat.teacherPhoto || null,
          creatorUid: sat.creatorUid || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed for upsertSatelliteInDb:', error);
    throw new Error('Database query failed to upsert satellite.', { cause: error });
  }
}

export async function deleteSatelliteFromDb(satelliteId: string) {
  try {
    return await db.delete(satellites).where(eq(satellites.satelliteId, satelliteId)).returning();
  } catch (error) {
    console.error('Database query failed for deleteSatelliteFromDb:', error);
    throw new Error('Database query failed to delete satellite.', { cause: error });
  }
}

export async function insertTelemetryPacketInDb(packet: any) {
  try {
    return await db.insert(telemetryPackets).values({
      packetId: packet.packetId,
      satelliteId: packet.hardwareId || packet.satelliteId || 'CanSat-01',
      timestamp: packet.timestamp || new Date().toISOString(),
      epochMs: packet.epochMs || Date.now(),
      hardwareId: packet.hardwareId || 'CanSat-01',
      temperature: packet.temperature,
      pressure: packet.pressure,
      altitude: packet.altitude,
      aqi: packet.aqi,
      humidity: packet.humidity,
      windSpeed: packet.windSpeed,
      batteryVoltage: packet.batteryVoltage,
      batteryPercent: packet.batteryPercent,
      rssi: packet.rssi,
      accelX: packet.accelX,
      accelY: packet.accelY,
      accelZ: packet.accelZ,
      gyroX: packet.gyroX,
      gyroY: packet.gyroY,
      gyroZ: packet.gyroZ,
      pitch: packet.pitch,
      roll: packet.roll,
      heading: packet.heading,
      lat: packet.lat,
      lng: packet.lng,
      gpsFix: packet.gpsFix ?? true,
      gpsStatus: packet.gpsStatus || 'Active Fix',
      gpsSats: packet.gpsSats || 8,
      hdop: packet.hdop || 1.1,
      savedToPenDrive: packet.savedToPenDrive ?? true,
    }).returning();
  } catch (error) {
    console.error('Database query failed for insertTelemetryPacketInDb:', error);
    // Non-blocking for telemetry streaming
    return null;
  }
}

export async function getRecentTelemetryPacketsFromDb(satelliteId: string, limit = 60) {
  try {
    return await db.select()
      .from(telemetryPackets)
      .where(eq(telemetryPackets.satelliteId, satelliteId))
      .orderBy(desc(telemetryPackets.id))
      .limit(limit);
  } catch (error) {
    console.error('Database query failed for getRecentTelemetryPacketsFromDb:', error);
    return [];
  }
}
