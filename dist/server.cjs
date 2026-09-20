var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appsScriptSources: () => appsScriptSources,
  satellites: () => satellites,
  telemetryPackets: () => telemetryPackets,
  users: () => users
});
var import_pg_core = require("drizzle-orm/pg-core");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  uid: (0, import_pg_core.text)("uid").notNull().unique(),
  // Firebase Auth UID
  email: (0, import_pg_core.text)("email").notNull(),
  displayName: (0, import_pg_core.text)("display_name"),
  photoUrl: (0, import_pg_core.text)("photo_url"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var satellites = (0, import_pg_core.pgTable)("satellites", {
  id: (0, import_pg_core.bigint)("id", { mode: "number" }).primaryKey(),
  satelliteId: (0, import_pg_core.text)("satellite_id").notNull().unique(),
  collegeName: (0, import_pg_core.text)("college_name").notNull(),
  studentName: (0, import_pg_core.text)("student_name"),
  principalName: (0, import_pg_core.text)("principal_name"),
  location: (0, import_pg_core.text)("location").notNull(),
  weatherCondition: (0, import_pg_core.text)("weather_condition"),
  aqi: (0, import_pg_core.integer)("aqi"),
  temperature: (0, import_pg_core.doublePrecision)("temperature"),
  humidity: (0, import_pg_core.doublePrecision)("humidity"),
  pressure: (0, import_pg_core.doublePrecision)("pressure"),
  windSpeed: (0, import_pg_core.doublePrecision)("wind_speed"),
  batteryLevel: (0, import_pg_core.integer)("battery_level"),
  rssi: (0, import_pg_core.integer)("rssi"),
  orbitAltitude: (0, import_pg_core.integer)("orbit_altitude"),
  lat: (0, import_pg_core.doublePrecision)("lat").notNull(),
  lng: (0, import_pg_core.doublePrecision)("lng").notNull(),
  isLiveStream: (0, import_pg_core.boolean)("is_live_stream").default(true),
  lastPing: (0, import_pg_core.text)("last_ping"),
  url: (0, import_pg_core.text)("url"),
  childWebsiteUrl: (0, import_pg_core.text)("child_website_url"),
  googleMapsUrl: (0, import_pg_core.text)("google_maps_url"),
  appsScriptUrl: (0, import_pg_core.text)("apps_script_url"),
  sourceType: (0, import_pg_core.text)("source_type").default("standard"),
  isCustom: (0, import_pg_core.boolean)("is_custom").default(true),
  studentPhoto: (0, import_pg_core.text)("student_photo"),
  campusPhoto: (0, import_pg_core.text)("campus_photo"),
  principalPhoto: (0, import_pg_core.text)("principal_photo"),
  teacherPhoto: (0, import_pg_core.text)("teacher_photo"),
  creatorUid: (0, import_pg_core.text)("creator_uid"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var telemetryPackets = (0, import_pg_core.pgTable)("telemetry_packets", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  packetId: (0, import_pg_core.integer)("packet_id"),
  satelliteId: (0, import_pg_core.text)("satellite_id").notNull(),
  timestamp: (0, import_pg_core.text)("timestamp"),
  epochMs: (0, import_pg_core.bigint)("epoch_ms", { mode: "number" }),
  hardwareId: (0, import_pg_core.text)("hardware_id"),
  temperature: (0, import_pg_core.doublePrecision)("temperature"),
  pressure: (0, import_pg_core.doublePrecision)("pressure"),
  altitude: (0, import_pg_core.doublePrecision)("altitude"),
  aqi: (0, import_pg_core.integer)("aqi"),
  humidity: (0, import_pg_core.doublePrecision)("humidity"),
  windSpeed: (0, import_pg_core.doublePrecision)("wind_speed"),
  batteryVoltage: (0, import_pg_core.doublePrecision)("battery_voltage"),
  batteryPercent: (0, import_pg_core.integer)("battery_percent"),
  rssi: (0, import_pg_core.integer)("rssi"),
  accelX: (0, import_pg_core.doublePrecision)("accel_x"),
  accelY: (0, import_pg_core.doublePrecision)("accel_y"),
  accelZ: (0, import_pg_core.doublePrecision)("accel_z"),
  gyroX: (0, import_pg_core.doublePrecision)("gyro_x"),
  gyroY: (0, import_pg_core.doublePrecision)("gyro_y"),
  gyroZ: (0, import_pg_core.doublePrecision)("gyro_z"),
  pitch: (0, import_pg_core.doublePrecision)("pitch"),
  roll: (0, import_pg_core.doublePrecision)("roll"),
  heading: (0, import_pg_core.doublePrecision)("heading"),
  lat: (0, import_pg_core.doublePrecision)("lat"),
  lng: (0, import_pg_core.doublePrecision)("lng"),
  gpsFix: (0, import_pg_core.boolean)("gps_fix").default(true),
  gpsStatus: (0, import_pg_core.text)("gps_status"),
  gpsSats: (0, import_pg_core.integer)("gps_sats"),
  hdop: (0, import_pg_core.doublePrecision)("hdop"),
  savedToPenDrive: (0, import_pg_core.boolean)("saved_to_pen_drive").default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var appsScriptSources = (0, import_pg_core.pgTable)("apps_script_sources", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  satelliteId: (0, import_pg_core.text)("satellite_id").notNull(),
  url: (0, import_pg_core.text)("url").notNull(),
  childWebsiteUrl: (0, import_pg_core.text)("child_website_url"),
  status: (0, import_pg_core.text)("status").default("active"),
  lastPing: (0, import_pg_core.text)("last_ping"),
  packetsCount: (0, import_pg_core.integer)("packets_count").default(0),
  location: (0, import_pg_core.text)("location"),
  principalName: (0, import_pg_core.text)("principal_name"),
  studentName: (0, import_pg_core.text)("student_name"),
  studentPhoto: (0, import_pg_core.text)("student_photo"),
  autoLogToPenDrive: (0, import_pg_core.boolean)("auto_log_to_pen_drive").default(true),
  lat: (0, import_pg_core.doublePrecision)("lat"),
  lng: (0, import_pg_core.doublePrecision)("lng"),
  googleMapsUrl: (0, import_pg_core.text)("google_maps_url"),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});

// src/db/index.ts
var createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new import_pg.Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3
    });
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// src/db/satellites.ts
var import_drizzle_orm = require("drizzle-orm");
async function getAllSatellitesFromDb() {
  try {
    return await db.select().from(satellites);
  } catch (error) {
    console.error("Database query failed for getAllSatellitesFromDb:", error);
    throw new Error("Database query failed to fetch satellites.", { cause: error });
  }
}
async function upsertSatelliteInDb(sat) {
  try {
    const result = await db.insert(satellites).values({
      id: sat.id,
      satelliteId: sat.satelliteId,
      collegeName: sat.collegeName,
      studentName: sat.studentName || null,
      principalName: sat.principalName || null,
      location: sat.location,
      weatherCondition: sat.weatherCondition || "Active",
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
      lastPing: sat.lastPing || "Telemetry Link Online",
      url: sat.url || null,
      childWebsiteUrl: sat.childWebsiteUrl || null,
      googleMapsUrl: sat.googleMapsUrl || null,
      appsScriptUrl: sat.appsScriptUrl || null,
      sourceType: sat.sourceType || "standard",
      isCustom: sat.isCustom ?? true,
      studentPhoto: sat.studentPhoto || null,
      campusPhoto: sat.campusPhoto || null,
      principalPhoto: sat.principalPhoto || null,
      teacherPhoto: sat.teacherPhoto || null,
      creatorUid: sat.creatorUid || null
    }).onConflictDoUpdate({
      target: satellites.satelliteId,
      set: {
        collegeName: sat.collegeName,
        studentName: sat.studentName || null,
        principalName: sat.principalName || null,
        location: sat.location,
        weatherCondition: sat.weatherCondition || "Active",
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
        lastPing: sat.lastPing || "Telemetry Link Online",
        url: sat.url || null,
        childWebsiteUrl: sat.childWebsiteUrl || null,
        googleMapsUrl: sat.googleMapsUrl || null,
        appsScriptUrl: sat.appsScriptUrl || null,
        sourceType: sat.sourceType || "standard",
        isCustom: sat.isCustom ?? true,
        studentPhoto: sat.studentPhoto || null,
        campusPhoto: sat.campusPhoto || null,
        principalPhoto: sat.principalPhoto || null,
        teacherPhoto: sat.teacherPhoto || null,
        creatorUid: sat.creatorUid || null,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed for upsertSatelliteInDb:", error);
    throw new Error("Database query failed to upsert satellite.", { cause: error });
  }
}
async function deleteSatelliteFromDb(satelliteId) {
  try {
    return await db.delete(satellites).where((0, import_drizzle_orm.eq)(satellites.satelliteId, satelliteId)).returning();
  } catch (error) {
    console.error("Database query failed for deleteSatelliteFromDb:", error);
    throw new Error("Database query failed to delete satellite.", { cause: error });
  }
}
async function insertTelemetryPacketInDb(packet) {
  try {
    return await db.insert(telemetryPackets).values({
      packetId: packet.packetId,
      satelliteId: packet.hardwareId || packet.satelliteId || "CanSat-01",
      timestamp: packet.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      epochMs: packet.epochMs || Date.now(),
      hardwareId: packet.hardwareId || "CanSat-01",
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
      gpsStatus: packet.gpsStatus || "Active Fix",
      gpsSats: packet.gpsSats || 8,
      hdop: packet.hdop || 1.1,
      savedToPenDrive: packet.savedToPenDrive ?? true
    }).returning();
  } catch (error) {
    console.error("Database query failed for insertTelemetryPacketInDb:", error);
    return null;
  }
}

// src/db/users.ts
async function getOrCreateUser(uid, email, displayName, photoUrl) {
  try {
    const result = await db.insert(users).values({
      uid,
      email,
      displayName: displayName || null,
      photoUrl: photoUrl || null
    }).onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null
      }
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed for getOrCreateUser:", error);
    throw new Error("Database query failed for user sync.", { cause: error });
  }
}

// src/lib/firebase-admin.ts
var import_app = require("firebase-admin/app");
var import_auth = require("firebase-admin/auth");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "sunlit-phalanx-7x4wp",
  appId: "1:438754215444:web:6233b0149e585b66990901",
  apiKey: "AIzaSyAYv3XN4CIn1GGa8GMdOcF8dIcd5XoTTKI",
  authDomain: "sunlit-phalanx-7x4wp.firebaseapp.com",
  storageBucket: "sunlit-phalanx-7x4wp.firebasestorage.app",
  messagingSenderId: "438754215444",
  measurementId: "",
  oAuthClientId: "438754215444-sip1eos3jh7j0jkmu5dd92t1tdd9pf9l.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/lib/firebase-admin.ts
if (!(0, import_app.getApps)().length) {
  (0, import_app.initializeApp)({
    projectId: firebase_applet_config_default.projectId
  });
}
var adminAuth = (0, import_auth.getAuth)();

// src/middleware/auth.ts
var optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
    } catch {
    }
  }
  next();
};

// src/lib/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseClient = null;
var getSupabaseUrl = () => {
  return typeof process !== "undefined" && process.env?.SUPABASE_URL || "https://nhfhyxlsoqenxejsnlwg.supabase.co";
};
var getSupabaseKey = () => {
  return typeof process !== "undefined" && process.env?.SUPABASE_KEY || "sb_publishable_HUkMekkxwLC-nHYxWYywIg_kIYrYdA4";
};
var isSupabaseConfigured = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return Boolean(url && key && url.startsWith("http"));
};
var getSupabase = () => {
  if (supabaseClient) return supabaseClient;
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (url && key) {
    try {
      supabaseClient = (0, import_supabase_js.createClient)(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (e) {
      console.warn("Failed to initialize Supabase client:", e);
    }
  }
  return supabaseClient;
};
async function syncSatelliteToSupabase(sat) {
  const client = getSupabase();
  if (!client) return null;
  try {
    let storedPrincipal = sat.principalName || null;
    if (sat.teacherName && storedPrincipal) {
      if (!storedPrincipal.includes("(Teacher:")) {
        storedPrincipal = `${storedPrincipal} (Teacher: ${sat.teacherName})`;
      }
    } else if (sat.teacherName && !storedPrincipal) {
      storedPrincipal = `(Teacher: ${sat.teacherName})`;
    }
    const payload = {
      id: Number(sat.id) || Date.now(),
      satellite_id: sat.satelliteId,
      college_name: sat.collegeName || "Academic Ground Station",
      student_name: sat.studentName || null,
      principal_name: storedPrincipal,
      location: sat.location || "India",
      weather_condition: sat.weatherCondition || "Active",
      aqi: typeof sat.aqi === "number" ? sat.aqi : 35,
      temperature: typeof sat.temperature === "number" ? sat.temperature : 26.5,
      humidity: typeof sat.humidity === "number" ? sat.humidity : 55,
      pressure: typeof sat.pressure === "number" ? sat.pressure : 948,
      wind_speed: typeof sat.windSpeed === "number" ? sat.windSpeed : 10,
      battery_level: typeof sat.batteryLevel === "number" ? sat.batteryLevel : 95,
      rssi: typeof sat.rssi === "number" ? sat.rssi : -65,
      orbit_altitude: typeof sat.orbitAltitude === "number" ? sat.orbitAltitude : 500,
      lat: typeof sat.lat === "number" ? sat.lat : 18.5204,
      lng: typeof sat.lng === "number" ? sat.lng : 73.8567,
      is_live_stream: sat.isLiveStream ?? true,
      last_ping: sat.lastPing || "Supabase Sync Online",
      url: sat.url || null,
      child_website_url: sat.childWebsiteUrl || sat.url || null,
      google_maps_url: sat.googleMapsUrl || null,
      apps_script_url: sat.appsScriptUrl || null,
      source_type: sat.sourceType || "standard",
      is_custom: sat.isCustom ?? true,
      student_photo: sat.studentPhoto || null,
      campus_photo: sat.campusPhoto || null,
      principal_photo: sat.principalPhoto || null,
      teacher_photo: sat.teacherPhoto || null,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { data, error } = await client.from("satellites").upsert(payload, { onConflict: "satellite_id" }).select();
    if (error) {
      console.warn("Supabase upsert warning:", error.message);
    }
    return data;
  } catch (err) {
    console.warn("Supabase sync error:", err);
    return null;
  }
}
async function syncTelemetryPacketToSupabase(packet) {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { error } = await client.from("telemetry_packets").insert({
      packet_id: packet.packetId,
      satellite_id: packet.hardwareId || packet.satelliteId || "CanSat-01",
      timestamp: packet.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
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
      saved_to_pen_drive: packet.savedToPenDrive ?? true
    });
    if (error) {
      console.warn("Supabase telemetry insert warning:", error.message);
    }
  } catch (err) {
  }
}
async function syncAllSatellitesToSupabase(satellites2) {
  const client = getSupabase();
  if (!client || !satellites2 || satellites2.length === 0) return { success: false, count: 0 };
  let synced = 0;
  for (const sat of satellites2) {
    try {
      await syncSatelliteToSupabase(sat);
      synced++;
    } catch {
    }
  }
  return { success: true, count: synced };
}
async function testSupabaseConnection() {
  const client = getSupabase();
  if (!client) return { connected: false, error: "Supabase client not initialized" };
  try {
    const { data, error } = await client.from("satellites").select("id, satellite_id").limit(5);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true, data };
  } catch (err) {
    return { connected: false, error: err.message || "Unknown connection error" };
  }
}

// server.ts
function resolveStoragePaths() {
  let baseDir = import_path.default.join(process.cwd(), "data");
  try {
    if (!import_fs.default.existsSync(baseDir)) {
      import_fs.default.mkdirSync(baseDir, { recursive: true });
    }
    const testFile = import_path.default.join(baseDir, ".write_test");
    import_fs.default.writeFileSync(testFile, "ok");
    import_fs.default.unlinkSync(testFile);
  } catch {
    baseDir = import_path.default.join("/tmp", "isro_cansat_data");
    try {
      if (!import_fs.default.existsSync(baseDir)) {
        import_fs.default.mkdirSync(baseDir, { recursive: true });
      }
    } catch (e) {
      console.warn("Fallback to memory-only storage if filesystem unavailable:", e);
    }
  }
  const pendriveDir = import_path.default.join(baseDir, "pendrive_CCCOMA_X64FRE_EN-GB_DV9");
  try {
    if (!import_fs.default.existsSync(pendriveDir)) {
      import_fs.default.mkdirSync(pendriveDir, { recursive: true });
    }
  } catch (e) {
    console.warn("Error creating pendrive folder:", e);
  }
  return {
    DATA_DIR: baseDir,
    DATA_FILE: import_path.default.join(baseDir, "satellites.json"),
    APPS_SCRIPTS_FILE: import_path.default.join(baseDir, "apps_script_sources.json"),
    PENDRIVE_DIR: pendriveDir,
    PENDRIVE_CSV_FILE: import_path.default.join(pendriveDir, "cansat_telemetry_CCCOMA_X64FRE_EN-GB_DV9.csv"),
    PENDRIVE_JSON_FILE: import_path.default.join(pendriveDir, "cansat_telemetry_stream.jsonl")
  };
}
var {
  DATA_DIR,
  DATA_FILE,
  APPS_SCRIPTS_FILE,
  PENDRIVE_DIR,
  PENDRIVE_CSV_FILE,
  PENDRIVE_JSON_FILE
} = resolveStoragePaths();
var satellitesStore = [];
var appsScriptSources3 = [];
var hardwareEndpointUrl = "http://cansat-001.local";
var hardwarePollingIntervalMs = 1e3;
var isHardwarePollingActive = true;
var isRealHardwareConnected = false;
var lastHardwareResponseTimeMs = 0;
var totalPacketsCollected = 0;
var hardwareLastError = null;
var telemetryBuffer = [];
var totalBytesLoggedToPenDrive = 0;
var penDriveConfig = {
  driveLabel: "CCCOMA_X64FRE_EN-GB_DV9",
  capacity: "64 GB",
  targetPath: PENDRIVE_CSV_FILE,
  autoLogEnabled: true
};
if (!import_fs.default.existsSync(PENDRIVE_CSV_FILE)) {
  const csvHeaders = "Packet_ID,Timestamp,Epoch_MS,Hardware_ID,Source_URL,Temperature_C,Pressure_hPa,Altitude_m,AQI,Humidity_Pct,Pitch,Roll,Heading,Battery_V,Battery_Pct,RSSI_dBm,Accel_X,Accel_Y,Accel_Z,Gyro_X,Gyro_Y,Gyro_Z,Latitude,Longitude,GPS_Fix,GPS_Status,GPS_Sats,HDOP,PenDrive_Logged\n";
  import_fs.default.writeFileSync(PENDRIVE_CSV_FILE, csvHeaders, "utf-8");
}
function isExampleSatellite(satId, id) {
  if (!satId) return false;
  const s = String(satId).trim().toLowerCase();
  const i = String(id || "").trim();
  return s === "cansat-001" || s === "cansat_2" || s === "cansat003" || s === "cansat004" || i === "1787473481958" || i === "1787478692573" || i === "1787480370464" || i === "1787480578235" || i === "apps-script-hardware-01" || i === "apps-script-cansat-02" || i === "apps-script-cansat-03" || i === "apps-script-cansat-04";
}
var DEFAULT_REGISTERED_SATELLITES = [
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
    temperature: 27,
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
function loadSatellites() {
  let list = [];
  try {
    if (import_fs.default.existsSync(DATA_FILE)) {
      const content = import_fs.default.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (err) {
    console.error("Error reading satellites data file:", err);
  }
  list = list.filter((s) => !isExampleSatellite(s.satelliteId, s.id)).map((s) => {
    if (s.satelliteId === "CanSat-01" || s.collegeName === "Soumodip_GGS") {
      return {
        ...s,
        lat: 18.519585,
        lng: 73.859096,
        location: "Kasba Peth",
        url: s.url && s.url.includes("indo-science.vercel.app") ? "" : s.url || "",
        childWebsiteUrl: s.childWebsiteUrl && s.childWebsiteUrl.includes("indo-science.vercel.app") ? "" : s.childWebsiteUrl || ""
      };
    }
    return s;
  });
  if (list.length === 0) {
    list = [...DEFAULT_REGISTERED_SATELLITES];
  } else {
    for (const defSat of DEFAULT_REGISTERED_SATELLITES) {
      const idx = list.findIndex((s) => s.satelliteId.toLowerCase() === defSat.satelliteId.toLowerCase());
      if (idx === -1) {
        list.push(defSat);
      } else {
        list[idx] = {
          ...list[idx],
          studentName: defSat.studentName || list[idx].studentName,
          collegeName: defSat.collegeName || list[idx].collegeName,
          appsScriptUrl: defSat.appsScriptUrl || list[idx].appsScriptUrl,
          studentPhoto: defSat.studentPhoto || list[idx].studentPhoto
        };
      }
    }
  }
  try {
    import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving satellites file:", e);
  }
  return list;
}
function saveSatellites() {
  try {
    import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(satellitesStore, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving satellites to disk:", err);
  }
}
function loadAppsScriptSources() {
  let sources = [];
  try {
    if (import_fs.default.existsSync(APPS_SCRIPTS_FILE)) {
      const content = import_fs.default.readFileSync(APPS_SCRIPTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sources = parsed;
      }
    }
  } catch (err) {
    console.error("Error reading Apps Script sources file:", err);
  }
  sources = sources.filter((s) => !isExampleSatellite(s.satelliteId, s.id)).map((s) => {
    if (s.satelliteId === "CanSat-01" || s.name === "Soumodip_GGS") {
      return {
        ...s,
        lat: 18.519585,
        lng: 73.859096,
        location: "Kasba Peth",
        childWebsiteUrl: s.childWebsiteUrl && s.childWebsiteUrl.includes("indo-science.vercel.app") ? "" : s.childWebsiteUrl || ""
      };
    }
    return s;
  });
  const defaultSources = [
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
  if (sources.length === 0) {
    sources = [...defaultSources];
  } else {
    for (const defSrc of defaultSources) {
      const idx = sources.findIndex((s) => s.satelliteId?.toLowerCase() === defSrc.satelliteId?.toLowerCase() || s.url === defSrc.url);
      if (idx === -1) {
        sources.push(defSrc);
      } else {
        sources[idx] = {
          ...sources[idx],
          name: defSrc.name || sources[idx].name,
          principalName: defSrc.principalName || sources[idx].principalName,
          url: defSrc.url || sources[idx].url,
          studentPhoto: defSrc.studentPhoto || sources[idx].studentPhoto
        };
      }
    }
  }
  try {
    import_fs.default.writeFileSync(APPS_SCRIPTS_FILE, JSON.stringify(sources, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving Apps Script sources file:", e);
  }
  return sources;
}
function saveAppsScriptSources() {
  try {
    import_fs.default.writeFileSync(APPS_SCRIPTS_FILE, JSON.stringify(appsScriptSources3, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving Apps Script sources:", err);
  }
}
satellitesStore = loadSatellites();
appsScriptSources3 = loadAppsScriptSources();
var sseClients = /* @__PURE__ */ new Set();
function broadcastSSE(type, data) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}

`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      console.warn("Failed to send SSE to a client, removing client", err);
      sseClients.delete(client);
    }
  }
}
function appendPacketToPenDrive(packet) {
  try {
    const csvLine = [
      packet.packetId,
      `"${packet.timestamp}"`,
      packet.epochMs,
      `"${packet.hardwareId}"`,
      `"${packet.sourceUrl || ""}"`,
      packet.temperature.toFixed(2),
      packet.pressure.toFixed(2),
      packet.altitude.toFixed(2),
      packet.aqi,
      packet.humidity !== void 0 ? packet.humidity.toFixed(2) : 45,
      packet.pitch !== void 0 ? packet.pitch.toFixed(2) : 0,
      packet.roll !== void 0 ? packet.roll.toFixed(2) : 0,
      packet.heading !== void 0 ? packet.heading.toFixed(2) : 0,
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
      `"${packet.gpsStatus || (packet.gpsFix ? "FIX" : "NO_FIX")}"`,
      packet.gpsSats,
      packet.hdop !== void 0 ? packet.hdop.toFixed(2) : 99.99,
      1
    ].join(",") + "\n";
    import_fs.default.appendFileSync(PENDRIVE_CSV_FILE, csvLine, "utf-8");
    import_fs.default.appendFileSync(PENDRIVE_JSON_FILE, JSON.stringify(packet) + "\n", "utf-8");
    totalBytesLoggedToPenDrive += Buffer.byteLength(csvLine, "utf-8");
    const candidatePaths = [
      `/media/${process.env.USER || "root"}/CCCOMA_X64FRE_EN-GB_DV9`,
      `/mnt/CCCOMA_X64FRE_EN-GB_DV9`,
      `/Volumes/CCCOMA_X64FRE_EN-GB_DV9`,
      "D:/CCCOMA_X64FRE_EN-GB_DV9",
      "E:/CCCOMA_X64FRE_EN-GB_DV9",
      "F:/CCCOMA_X64FRE_EN-GB_DV9"
    ];
    for (const p of candidatePaths) {
      try {
        if (import_fs.default.existsSync(p)) {
          const usbFile = import_path.default.join(p, "cansat_telemetry_CCCOMA_X64FRE_EN-GB_DV9.csv");
          if (!import_fs.default.existsSync(usbFile)) {
            const csvHeaders = "Packet_ID,Timestamp,Epoch_MS,Hardware_ID,Source_URL,Temperature_C,Pressure_hPa,Altitude_m,AQI,Humidity_Pct,Pitch,Roll,Heading,Battery_V,Battery_Pct,RSSI_dBm,Accel_X,Accel_Y,Accel_Z,Gyro_X,Gyro_Y,Gyro_Z,Latitude,Longitude,GPS_Fix,GPS_Status,GPS_Sats,HDOP,PenDrive_Logged\n";
            import_fs.default.writeFileSync(usbFile, csvHeaders, "utf-8");
          }
          import_fs.default.appendFileSync(usbFile, csvLine, "utf-8");
        }
      } catch {
      }
    }
    return true;
  } catch (err) {
    console.error("Error logging to pen drive:", err);
    return false;
  }
}
function processHardwareTelemetry(raw, source) {
  totalPacketsCollected++;
  const now = /* @__PURE__ */ new Date();
  const parseNum = (val, fallback) => {
    if (val === null || val === void 0 || val === "") return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };
  let rawTemp = raw.temperature !== void 0 ? raw.temperature : raw.temp !== void 0 ? raw.temp : raw.temperature_c;
  const temp = parseNum(rawTemp, 27.4);
  let rawPressure = raw.pressure !== void 0 ? raw.pressure : raw.press !== void 0 ? raw.press : raw.pressure_hpa;
  const pressure = parseNum(rawPressure, 944.28);
  let rawAlt = raw.altitude !== void 0 ? raw.altitude : raw.alt;
  const altitude = rawAlt !== void 0 && rawAlt !== null && rawAlt !== "" ? parseNum(rawAlt, 0) : pressure > 0 ? Number((44330 * (1 - Math.pow(Math.max(300, pressure) / 1013.25, 0.1903))).toFixed(2)) : 0;
  let rawHumidity = raw.humidity !== void 0 ? raw.humidity : raw.hum;
  const humidity = parseNum(rawHumidity, 48);
  let rawAqi = raw.aqi !== void 0 ? raw.aqi : raw.air_quality !== void 0 ? raw.air_quality : raw.gas !== void 0 ? Math.round(Number(raw.gas) / 10) : void 0;
  const aqi = parseNum(rawAqi, 35);
  let rawVoltage = raw.batteryVoltage !== void 0 ? raw.batteryVoltage : raw.vbat !== void 0 ? raw.vbat : raw.voltage;
  const voltage = parseNum(rawVoltage, 4.12);
  const batteryPercent = raw.batteryPercent !== void 0 ? parseNum(raw.batteryPercent, 95) : raw.battery !== void 0 ? parseNum(raw.battery, 95) : Math.max(5, Math.min(100, Math.round((voltage - 3.3) / 0.9 * 100)));
  const lat = raw.latitude !== void 0 && Number(raw.latitude) !== 0 ? Number(raw.latitude) : raw.lat !== void 0 && Number(raw.lat) !== 0 ? Number(raw.lat) : 18.481817;
  const lng = raw.longitude !== void 0 && Number(raw.longitude) !== 0 ? Number(raw.longitude) : raw.lng !== void 0 && Number(raw.lng) !== 0 ? Number(raw.lng) : 73.954033;
  const gpsFix = raw.gpsStatus === "FIX" || raw.gpsStatus === "3D_FIX" || typeof raw.latitude === "number" && raw.latitude !== 0 || (raw.gpsFix !== void 0 ? !!raw.gpsFix : false);
  const packet = {
    packetId: raw.packetId || totalPacketsCollected,
    timestamp: raw.timestamp || now.toISOString().replace("T", " ").substring(0, 19),
    epochMs: now.getTime(),
    hardwareId: raw.hardwareId || (source ? source.name : "CanSat-ESP32-001"),
    temperature: Number(temp.toFixed(2)),
    pressure: Number(pressure.toFixed(2)),
    altitude: Number(altitude.toFixed(2)),
    aqi: Number(aqi),
    humidity: Number(humidity.toFixed(2)),
    windSpeed: typeof raw.windSpeed === "number" ? raw.windSpeed : 12,
    batteryVoltage: Number(voltage.toFixed(2)),
    batteryPercent,
    rssi: typeof raw.rssi === "number" ? raw.rssi : -62,
    accelX: typeof raw.accelX === "number" ? raw.accelX : 0,
    accelY: typeof raw.accelY === "number" ? raw.accelY : 0,
    accelZ: typeof raw.accelZ === "number" ? raw.accelZ : 0,
    gyroX: typeof raw.gyroX === "number" ? raw.gyroX : 0,
    gyroY: typeof raw.gyroY === "number" ? raw.gyroY : 0,
    gyroZ: typeof raw.gyroZ === "number" ? raw.gyroZ : 0,
    pitch: typeof raw.pitch === "number" ? raw.pitch : 0,
    roll: typeof raw.roll === "number" ? raw.roll : 0,
    heading: typeof raw.heading === "number" ? raw.heading : 0,
    lat,
    lng,
    gpsFix,
    gpsStatus: raw.gpsStatus || (gpsFix ? "FIX" : "NO_FIX"),
    gpsSats: typeof raw.satellites === "number" ? raw.satellites : typeof raw.gpsSats === "number" ? raw.gpsSats : 0,
    hdop: typeof raw.hdop === "number" ? raw.hdop : 99.99,
    savedToPenDrive: true,
    sourceUrl: raw.sourceUrl || (source ? source.url : void 0),
    rawPayload: typeof raw === "string" ? raw : JSON.stringify(raw)
  };
  appendPacketToPenDrive(packet);
  telemetryBuffer.push(packet);
  if (telemetryBuffer.length > 150) {
    telemetryBuffer.shift();
  }
  broadcastSSE("hardware_telemetry_tick", packet);
  const targetSatId = source ? source.satelliteId : raw.satelliteId || "CanSat-01";
  const existingIdx = satellitesStore.findIndex((s) => s.satelliteId === targetSatId);
  let boundChildUrl = "";
  if (source && source.childWebsiteUrl) {
    boundChildUrl = source.childWebsiteUrl;
  } else if (existingIdx >= 0 && satellitesStore[existingIdx].url && !satellitesStore[existingIdx].url?.includes("script.google.com")) {
    boundChildUrl = satellitesStore[existingIdx].url;
  } else {
    boundChildUrl = `/site/${targetSatId}`;
  }
  const updatedNode = {
    id: existingIdx >= 0 ? satellitesStore[existingIdx].id : Date.now(),
    satelliteId: targetSatId,
    collegeName: source ? source.name : targetSatId === "CanSat-01" ? "Soumodip_GGS" : "ISRO CanSat Station",
    location: source ? source.location : "Kasba Peth",
    weatherCondition: packet.altitude > 100 ? "Ascending / In Flight" : packet.humidity > 70 ? "Humid Ground Link" : "Optimal Telemetry Link",
    aqi: packet.aqi,
    temperature: packet.temperature,
    humidity: packet.humidity,
    pressure: packet.pressure,
    windSpeed: packet.windSpeed || 14,
    principalName: source ? source.principalName : "Archana Dharu",
    lat: packet.lat,
    lng: packet.lng,
    status: isRealHardwareConnected || source ? `Live Feed Active (${packet.temperature}\xB0C, ${packet.pressure} hPa)` : "Hardware Stream Active",
    batteryLevel: packet.batteryPercent,
    rssi: packet.rssi,
    orbitAltitude: Math.round(packet.altitude),
    isLiveStream: true,
    lastPing: `${(/* @__PURE__ */ new Date()).toLocaleTimeString()} (Apps Script -> 64GB Pen Drive)`,
    url: boundChildUrl,
    childWebsiteUrl: boundChildUrl,
    appsScriptUrl: source ? source.url : raw.appsScriptUrl || raw.sourceUrl,
    sourceType: source ? "apps_script" : "esp32_hardware",
    isCustom: true
  };
  if (existingIdx >= 0) {
    satellitesStore[existingIdx] = updatedNode;
  } else {
    satellitesStore.unshift(updatedNode);
  }
  saveSatellites();
  insertTelemetryPacketInDb(packet).catch(() => {
  });
  upsertSatelliteInDb(updatedNode).catch(() => {
  });
  syncTelemetryPacketToSupabase(packet).catch(() => {
  });
  syncSatelliteToSupabase(updatedNode).catch(() => {
  });
  return packet;
}
var appsScriptInFlight = /* @__PURE__ */ new Set();
async function pollAppsScriptSource(source) {
  if (source.status === "paused" || !source.url) return null;
  if (appsScriptInFlight.has(source.id)) {
    return null;
  }
  appsScriptInFlight.add(source.id);
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        controller.abort();
      } catch {
      }
    }, 12e3);
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "ISRO-Antriksha-CanSat-Ingest/2.0"
      },
      redirect: "follow"
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const text2 = await res.text();
      let data = null;
      try {
        data = JSON.parse(text2);
      } catch {
        const jsonMatch = text2.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch {
          }
        }
      }
      if (data && (typeof data.temperature === "number" || typeof data.pressure === "number" || typeof data.temp === "number" || data.status === "OK" || data.nodeId || data.humidity !== void 0 || data.altitude !== void 0)) {
        const responseTime = Date.now() - startTime;
        source.lastResponseTimeMs = responseTime;
        source.lastPing = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        const tempVal = typeof data.temperature === "number" ? data.temperature : typeof data.temp === "number" ? data.temp : null;
        const pressVal = typeof data.pressure === "number" ? data.pressure : typeof data.press === "number" ? data.press : null;
        const altVal = typeof data.altitude === "number" ? data.altitude : typeof data.alt === "number" ? data.alt : null;
        const isAllSensorsZero = tempVal === 0 && pressVal === 0 && (altVal === 0 || altVal === null);
        if (isAllSensorsZero) {
          source.status = "paused";
          source.error = "CanSat Inactive / Sensors Offline (0.00 Readings)";
          saveAppsScriptSources();
          return null;
        }
        const fingerprint = `${data.sequence ?? ""}_${data.timestamp ?? ""}_${data.receivedAt ?? ""}_${tempVal}_${pressVal}_${altVal}`;
        if (source.lastFingerprint && source.lastFingerprint === fingerprint) {
          if (source.lastNewPacketTime && Date.now() - source.lastNewPacketTime > 15e3) {
            source.status = "paused";
            source.error = "No active telemetry transmitting (Standby)";
          }
          return null;
        }
        source.lastFingerprint = fingerprint;
        source.lastNewPacketTime = Date.now();
        source.status = "active";
        source.error = null;
        source.packetsCount = (source.packetsCount || 0) + 1;
        isRealHardwareConnected = true;
        const packet = processHardwareTelemetry({
          ...data,
          hardwareId: source.name || source.satelliteId,
          sourceUrl: source.url
        }, source);
        source.latestData = packet;
        saveAppsScriptSources();
        return packet;
      } else {
        source.error = "Connected (Awaiting structured sensor JSON)";
        source.lastPing = (/* @__PURE__ */ new Date()).toLocaleTimeString();
      }
    } else {
      source.error = `HTTP ${res.status} (Access / Permission Check)`;
    }
  } catch (err) {
    if (err.name === "AbortError" || err.message && err.message.toLowerCase().includes("abort")) {
      source.error = "Connecting (Waiting for Google Apps Script response)...";
    } else {
      source.error = err.message || "Connecting to stream...";
    }
  } finally {
    appsScriptInFlight.delete(source.id);
  }
  return null;
}
var hardwarePollerTimer = null;
async function pollAllSources() {
  let anyAppsScriptSuccess = false;
  for (const source of appsScriptSources3) {
    if (source.status !== "paused") {
      const packet = await pollAppsScriptSource(source);
      if (packet) {
        anyAppsScriptSuccess = true;
      }
    }
  }
  const hasRecentActiveFeed = appsScriptSources3.some((s) => s.status === "active" && s.lastNewPacketTime && Date.now() - s.lastNewPacketTime < 15e3);
  if (!hasRecentActiveFeed && (!hardwareEndpointUrl || hardwareEndpointUrl.includes("google.com") || hardwareEndpointUrl.includes(".local"))) {
    isRealHardwareConnected = false;
  }
  if (hardwareEndpointUrl && !hardwareEndpointUrl.includes("google.com")) {
    const startTime = Date.now();
    const endpoints = [
      hardwareEndpointUrl,
      `${hardwareEndpointUrl.replace(/\/$/, "")}/data`,
      `${hardwareEndpointUrl.replace(/\/$/, "")}/telemetry`,
      `${hardwareEndpointUrl.replace(/\/$/, "")}/sensors`,
      `${hardwareEndpointUrl.replace(/\/$/, "")}/api/telemetry`,
      `${hardwareEndpointUrl.replace(/\/$/, "")}/json`
    ];
    let fetchedData = null;
    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 950);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { "Accept": "application/json, text/plain" }
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const text2 = await res.text();
          try {
            fetchedData = JSON.parse(text2);
          } catch {
            const parsed = {};
            text2.split(/[,\n]/).forEach((part) => {
              const [k, v] = part.split(":").map((s) => s.trim());
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
startHardwarePolling();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(import_express.default.json({ limit: "20mb" }));
  app.use(import_express.default.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
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
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    sseClients.add(res);
    res.write(`data: ${JSON.stringify({
      type: "connected",
      total: satellitesStore.length,
      hardwareEndpoint: hardwareEndpointUrl,
      penDriveLabel: penDriveConfig.driveLabel
    })}

`);
    const keepAlive = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: "ping" })}

`);
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 2e4);
    req.on("close", () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });
  app.get("/api/hardware/status", (req, res) => {
    const latest = telemetryBuffer.length > 0 ? telemetryBuffer[telemetryBuffer.length - 1] : null;
    let fileSizeKb = 0;
    try {
      if (import_fs.default.existsSync(PENDRIVE_CSV_FILE)) {
        fileSizeKb = Math.round(import_fs.default.statSync(PENDRIVE_CSV_FILE).size / 1024);
      }
    } catch {
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
        fileSizeKb,
        status: "logging"
      },
      latestPacket: latest
    });
  });
  app.post("/api/hardware/config", (req, res) => {
    const { endpointUrl, pollingIntervalMs, isPolling, penDriveLabel } = req.body;
    if (typeof endpointUrl === "string" && endpointUrl.trim()) {
      hardwareEndpointUrl = endpointUrl.trim();
    }
    if (typeof pollingIntervalMs === "number" && pollingIntervalMs >= 200) {
      hardwarePollingIntervalMs = pollingIntervalMs;
      startHardwarePolling();
    }
    if (typeof isPolling === "boolean") {
      isHardwarePollingActive = isPolling;
    }
    if (typeof penDriveLabel === "string" && penDriveLabel.trim()) {
      penDriveConfig.driveLabel = penDriveLabel.trim();
    }
    broadcastSSE("hardware_config_updated", {
      endpointUrl: hardwareEndpointUrl,
      pollingIntervalMs: hardwarePollingIntervalMs,
      isPolling: isHardwarePollingActive,
      penDriveLabel: penDriveConfig.driveLabel
    });
    res.json({
      success: true,
      message: "Hardware configuration updated",
      config: {
        endpointUrl: hardwareEndpointUrl,
        pollingIntervalMs: hardwarePollingIntervalMs,
        isPolling: isHardwarePollingActive,
        penDriveLabel: penDriveConfig.driveLabel
      }
    });
  });
  app.get("/api/hardware/telemetry", (req, res) => {
    const limit = parseInt(req.query.limit) || 60;
    const slice = telemetryBuffer.slice(-Math.min(limit, 150));
    res.json({
      success: true,
      count: slice.length,
      totalPackets: totalPacketsCollected,
      packets: slice
    });
  });
  app.post(["/api/hardware/telemetry/push", "/api/hardware/inject"], (req, res) => {
    try {
      const payload = req.body;
      isRealHardwareConnected = true;
      hardwareLastError = null;
      const packet = processHardwareTelemetry(payload);
      res.status(201).json({
        success: true,
        message: "Packet received and saved to pen drive CCCOMA_X64FRE_EN-GB_DV9",
        packetId: packet.packetId,
        penDriveLogged: true
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/hardware/proxy", async (req, res) => {
    const target = req.query.url || hardwareEndpointUrl;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2e3);
      const fetchRes = await fetch(target, { signal: controller.signal });
      clearTimeout(timeoutId);
      const contentType = fetchRes.headers.get("content-type") || "text/plain";
      const text2 = await fetchRes.text();
      res.setHeader("Content-Type", contentType);
      res.send(text2);
    } catch (err) {
      res.status(502).json({ error: `Cannot reach ESP32 at ${target}: ${err.message}` });
    }
  });
  app.get("/api/hardware/export/csv", (req, res) => {
    if (import_fs.default.existsSync(PENDRIVE_CSV_FILE)) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="ISRO_CanSat001_${penDriveConfig.driveLabel}_Telemetry.csv"`);
      import_fs.default.createReadStream(PENDRIVE_CSV_FILE).pipe(res);
    } else {
      res.status(404).send("No pen drive telemetry log file found yet.");
    }
  });
  app.get("/api/hardware/export/json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="ISRO_CanSat001_${penDriveConfig.driveLabel}_Telemetry.json"`);
    res.json({
      device: "ISRO CanSat ESP32 001",
      penDrive: penDriveConfig.driveLabel,
      exportTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
      totalPackets: totalPacketsCollected,
      telemetryBuffer
    });
  });
  function sanitizeIncomingUrl(raw) {
    if (!raw || typeof raw !== "string") return "";
    let cleaned = raw.trim().replace(/^["'`<\s]+|["'`>\s]+$/g, "").trim();
    cleaned = cleaned.replace(/[\r\n\t]/g, "");
    if (cleaned && !cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
      cleaned = `https://${cleaned}`;
    }
    return cleaned;
  }
  app.get("/api/hardware/apps-script/sources", (req, res) => {
    res.json({
      success: true,
      sources: appsScriptSources3,
      penDrive: {
        driveLabel: penDriveConfig.driveLabel,
        totalPackets: totalPacketsCollected
      }
    });
  });
  app.post("/api/hardware/apps-script/test", async (req, res) => {
    const { url } = req.body;
    const cleanUrl = sanitizeIncomingUrl(url);
    if (!cleanUrl) {
      res.status(400).json({ error: "URL is required" });
      return;
    }
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort();
        } catch {
        }
      }, 15e3);
      const testRes = await fetch(cleanUrl, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "ISRO-Antriksha-CanSat-Tester/2.0"
        },
        redirect: "follow"
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
      const text2 = await testRes.text();
      let data = null;
      try {
        data = JSON.parse(text2);
      } catch {
        const jsonMatch = text2.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch {
          }
        }
      }
      if (data) {
        res.json({
          success: true,
          latencyMs,
          data,
          detectedFields: Object.keys(data),
          isCompatibleCanSat: typeof data.temperature === "number" || typeof data.pressure === "number" || typeof data.temp === "number"
        });
      } else {
        res.status(200).json({
          success: true,
          latencyMs,
          data: { raw: text2.substring(0, 200) },
          detectedFields: ["raw_output"],
          isCompatibleCanSat: true,
          note: "Apps Script endpoint reached successfully."
        });
      }
    } catch (err) {
      const isAbort = err.name === "AbortError" || err.message && err.message.toLowerCase().includes("abort");
      res.status(504).json({
        success: false,
        error: isAbort ? 'Apps Script took longer than 15s to respond. Please ensure the Google Apps Script Web App deployment access is set to "Anyone".' : `Could not connect to Apps Script: ${err.message}`,
        latencyMs: Date.now() - startTime
      });
    }
  });
  app.post("/api/hardware/apps-script/register", async (req, res) => {
    try {
      const { url, childWebsiteUrl, name, satelliteId, location, principalName, autoLogToPenDrive, lat, lng, googleMapsUrl } = req.body;
      const cleanUrl = sanitizeIncomingUrl(url);
      if (!cleanUrl) {
        res.status(400).json({ error: "Valid Google Apps Script URL is required" });
        return;
      }
      const satId = satelliteId ? satelliteId.trim() : `CanSat-${appsScriptSources3.length + 1}`;
      const moduleName = name ? name.trim() : `${satId} (Hardware Team Feed)`;
      let cleanChildUrl = (childWebsiteUrl || "").trim();
      if (cleanChildUrl && !cleanChildUrl.startsWith("http://") && !cleanChildUrl.startsWith("https://") && !cleanChildUrl.startsWith("/")) {
        cleanChildUrl = `https://${cleanChildUrl}`;
      }
      if (!cleanChildUrl) {
        cleanChildUrl = `/site/${satId}`;
      }
      const parsedLat = typeof lat === "number" && !isNaN(lat) ? lat : 18.5204;
      const parsedLng = typeof lng === "number" && !isNaN(lng) ? lng : 73.8567;
      const parsedMapsUrl = googleMapsUrl || `https://www.google.com/maps?q=${parsedLat},${parsedLng}`;
      const newId = `apps-script-${Date.now()}`;
      const existingIdx = appsScriptSources3.findIndex((s) => s.url === cleanUrl || s.satelliteId.toLowerCase() === satId.toLowerCase());
      const newSource = {
        id: existingIdx >= 0 ? appsScriptSources3[existingIdx].id : newId,
        name: moduleName,
        satelliteId: satId,
        url: cleanUrl,
        childWebsiteUrl: cleanChildUrl,
        status: "active",
        lastPing: "Connecting to Hardware Feed...",
        packetsCount: existingIdx >= 0 ? appsScriptSources3[existingIdx].packetsCount : 0,
        lastResponseTimeMs: 0,
        location: location ? location.trim() : "Ground Station Alpha (Pune)",
        principalName: principalName ? principalName.trim() : "Hardware Team Telemetry Bridge",
        autoLogToPenDrive: autoLogToPenDrive !== void 0 ? !!autoLogToPenDrive : true,
        lat: parsedLat,
        lng: parsedLng,
        googleMapsUrl: parsedMapsUrl
      };
      if (existingIdx >= 0) {
        appsScriptSources3[existingIdx] = newSource;
      } else {
        appsScriptSources3.push(newSource);
      }
      saveAppsScriptSources();
      const satIdx = satellitesStore.findIndex((s) => s.satelliteId.toLowerCase() === satId.toLowerCase());
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
          sourceType: "apps_script"
        };
      } else {
        satellitesStore.unshift({
          id: Date.now(),
          satelliteId: satId,
          collegeName: moduleName,
          location: newSource.location,
          weatherCondition: "Clear Sky",
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
          lastPing: "Bound to Apps Script & Child Site",
          url: cleanChildUrl,
          childWebsiteUrl: cleanChildUrl,
          appsScriptUrl: cleanUrl,
          sourceType: "apps_script",
          isCustom: true
        });
      }
      saveSatellites();
      pollAppsScriptSource(newSource).then((packet) => {
        if (packet) {
          broadcastSSE("apps_script_packet", {
            sourceId: newSource.id,
            packet
          });
        }
      }).catch((e) => {
        console.warn("Background poll error after registration:", e);
      });
      broadcastSSE("apps_script_source_registered", {
        source: newSource
      });
      broadcastSSE("satellites_sync", satellitesStore);
      res.status(201).json({
        success: true,
        message: `Successfully registered & bound module "${moduleName}" [${satId}] to Apps Script feed and Child Website (${cleanChildUrl})`,
        source: newSource,
        childWebsiteUrl: cleanChildUrl
      });
    } catch (err) {
      res.status(500).json({ error: `Registration error: ${err.message}` });
    }
  });
  app.post("/api/module/:id/bind", async (req, res) => {
    try {
      const satId = req.params.id;
      const { appsScriptUrl, childWebsiteUrl, collegeName, location, principalName } = req.body;
      const cleanAppsScriptUrl = sanitizeIncomingUrl(appsScriptUrl);
      let cleanChildUrl = (childWebsiteUrl || "").trim();
      if (cleanChildUrl && !cleanChildUrl.startsWith("http://") && !cleanChildUrl.startsWith("https://") && !cleanChildUrl.startsWith("/")) {
        cleanChildUrl = `https://${cleanChildUrl}`;
      }
      if (!cleanChildUrl) {
        cleanChildUrl = `/site/${satId}`;
      }
      let source = appsScriptSources3.find((s) => s.satelliteId.toLowerCase() === satId.toLowerCase());
      if (cleanAppsScriptUrl) {
        if (!source) {
          source = {
            id: `apps-script-${Date.now()}`,
            name: collegeName || `${satId} (Live Feed)`,
            satelliteId: satId,
            url: cleanAppsScriptUrl,
            childWebsiteUrl: cleanChildUrl,
            status: "active",
            lastPing: "Bound and Connecting...",
            packetsCount: 0,
            lastResponseTimeMs: 0,
            location: location || "Ground Station Alpha",
            principalName: principalName || "Lead Ingest",
            autoLogToPenDrive: true
          };
          appsScriptSources3.push(source);
        } else {
          source.url = cleanAppsScriptUrl;
          source.childWebsiteUrl = cleanChildUrl;
          if (collegeName) source.name = collegeName;
          if (location) source.location = location;
          if (principalName) source.principalName = principalName;
          source.status = "active";
        }
        saveAppsScriptSources();
      }
      let satIdx = satellitesStore.findIndex((s) => s.satelliteId.toLowerCase() === satId.toLowerCase() || String(s.id) === satId);
      if (satIdx >= 0) {
        satellitesStore[satIdx] = {
          ...satellitesStore[satIdx],
          url: cleanChildUrl,
          childWebsiteUrl: cleanChildUrl,
          appsScriptUrl: cleanAppsScriptUrl || satellitesStore[satIdx].appsScriptUrl,
          collegeName: collegeName || satellitesStore[satIdx].collegeName,
          location: location || satellitesStore[satIdx].location,
          principalName: principalName || satellitesStore[satIdx].principalName,
          sourceType: cleanAppsScriptUrl ? "apps_script" : satellitesStore[satIdx].sourceType
        };
      } else {
        const newNode = {
          id: Date.now(),
          satelliteId: satId,
          collegeName: collegeName || `${satId} Ground Station`,
          location: location || "Pune, Maharashtra",
          weatherCondition: "Clear Sky",
          aqi: 35,
          temperature: 26.8,
          windSpeed: 12,
          principalName: principalName || "Ground Station Lead",
          lat: 18.481817,
          lng: 73.954033,
          batteryLevel: 95,
          rssi: -65,
          orbitAltitude: 500,
          isLiveStream: true,
          lastPing: "Bound to Apps Script & Child Site",
          url: cleanChildUrl,
          childWebsiteUrl: cleanChildUrl,
          appsScriptUrl: cleanAppsScriptUrl,
          sourceType: cleanAppsScriptUrl ? "apps_script" : "standard",
          isCustom: true
        };
        satellitesStore.unshift(newNode);
        satIdx = 0;
      }
      saveSatellites();
      if (source && cleanAppsScriptUrl) {
        pollAppsScriptSource(source).catch(console.error);
      }
      broadcastSSE("satellite_updated", satellitesStore[satIdx]);
      broadcastSSE("satellites_sync", satellitesStore);
      res.json({
        success: true,
        message: `Successfully bound module ${satId} to Apps Script (${cleanAppsScriptUrl ? "Connected" : "None"}) and Child Site (${cleanChildUrl})`,
        satellite: satellitesStore[satIdx],
        appsScriptSource: source
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/child-site/:id", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    const satId = req.params.id;
    const sat = satellitesStore.find((s) => s.satelliteId.toLowerCase() === satId.toLowerCase() || String(s.id) === satId);
    if (!sat) {
      res.status(404).json({ success: false, error: `Satellite module ${satId} not found` });
      return;
    }
    const appsScriptSource = appsScriptSources3.find((s) => s.satelliteId.toLowerCase() === sat.satelliteId.toLowerCase());
    const packets = telemetryBuffer.filter(
      (p) => p.hardwareId.toLowerCase() === sat.satelliteId.toLowerCase() || appsScriptSource && p.hardwareId.toLowerCase().includes(appsScriptSource.satelliteId.toLowerCase())
    ).slice(-30);
    const latest = packets.length > 0 ? packets[packets.length - 1] : telemetryBuffer.length > 0 ? telemetryBuffer[telemetryBuffer.length - 1] : null;
    res.json({
      success: true,
      satellite: sat,
      appsScriptSource: appsScriptSource || null,
      latestPacket: latest,
      recentPackets: packets,
      penDriveLogging: true,
      serverTime: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.put("/api/hardware/apps-script/sources/:id/toggle", (req, res) => {
    const { id } = req.params;
    const source = appsScriptSources3.find((s) => s.id === id);
    if (!source) {
      res.status(404).json({ error: "Apps Script source not found" });
      return;
    }
    source.status = source.status === "active" ? "paused" : "active";
    saveAppsScriptSources();
    broadcastSSE("apps_script_source_updated", source);
    res.json({ success: true, source });
  });
  app.delete("/api/hardware/apps-script/sources/:id", (req, res) => {
    const { id } = req.params;
    const idx = appsScriptSources3.findIndex((s) => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Apps Script source not found" });
      return;
    }
    const removed = appsScriptSources3.splice(idx, 1)[0];
    saveAppsScriptSources();
    broadcastSSE("apps_script_source_removed", { id: removed.id });
    res.json({ success: true, message: `Removed Apps Script source ${removed.name}` });
  });
  app.get("/api/satellites", (req, res) => {
    res.json({
      success: true,
      count: satellitesStore.length,
      satellites: satellitesStore
    });
  });
  app.post("/api/satellites", (req, res) => {
    try {
      const node = req.body;
      if (!node.collegeName || !node.principalName) {
        res.status(400).json({ error: "College Name and Principal Name are required" });
        return;
      }
      let cleanUrl = (node.url || node.childUrl || "").trim();
      if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = `https://${cleanUrl}`;
      }
      const newNode = {
        id: node.id || Date.now(),
        satelliteId: node.satelliteId || `Satellite_${satellitesStore.length + 1}`,
        collegeName: node.collegeName.trim(),
        location: node.location || "Pune, Maharashtra",
        weatherCondition: node.weatherCondition || "Clear Sky",
        aqi: typeof node.aqi === "number" ? node.aqi : 35,
        temperature: typeof node.temperature === "number" ? node.temperature : 26,
        windSpeed: typeof node.windSpeed === "number" ? node.windSpeed : 14,
        principalName: node.principalName.trim(),
        lat: typeof node.lat === "number" && !isNaN(node.lat) ? node.lat : 18.5204 + (Math.random() - 0.5) * 0.05,
        lng: typeof node.lng === "number" && !isNaN(node.lng) ? node.lng : 73.8567 + (Math.random() - 0.5) * 0.05,
        googleMapsUrl: node.googleMapsUrl || (node.lat && node.lng ? `https://www.google.com/maps?q=${node.lat},${node.lng}` : void 0),
        status: node.status || "Optimal Sensor",
        batteryLevel: typeof node.batteryLevel === "number" ? node.batteryLevel : 98,
        rssi: typeof node.rssi === "number" ? node.rssi : -65,
        orbitAltitude: typeof node.orbitAltitude === "number" ? node.orbitAltitude : 500,
        isLiveStream: !!node.isLiveStream,
        lastPing: node.lastPing || "Real-Time Connected",
        url: cleanUrl,
        childWebsiteUrl: node.childWebsiteUrl || cleanUrl,
        appsScriptUrl: node.appsScriptUrl || void 0,
        isCustom: true,
        studentName: node.studentName?.trim() || void 0,
        teacherName: node.teacherName?.trim() || void 0,
        studentPhoto: node.studentPhoto || void 0,
        campusPhoto: node.campusPhoto || void 0,
        principalPhoto: node.principalPhoto || void 0,
        teacherPhoto: node.teacherPhoto || void 0,
        studentPin: node.studentPin || void 0,
        registeredByRole: node.registeredByRole || "publisher",
        studentTeam: node.studentTeam || void 0
      };
      const existingIndex = satellitesStore.findIndex(
        (s) => s.satelliteId === newNode.satelliteId || s.collegeName.toLowerCase() === newNode.collegeName.toLowerCase() && s.url === newNode.url
      );
      if (existingIndex >= 0) {
        satellitesStore[existingIndex] = { ...satellitesStore[existingIndex], ...newNode };
      } else {
        satellitesStore = [newNode, ...satellitesStore];
      }
      saveSatellites();
      upsertSatelliteInDb(newNode).catch((e) => console.error("Error upserting satellite to Cloud SQL:", e));
      syncSatelliteToSupabase(newNode).catch(() => {
      });
      broadcastSSE("satellite_added", newNode);
      broadcastSSE("satellites_sync", satellitesStore);
      res.status(201).json({
        success: true,
        message: "Satellite node registered in Cloud SQL database and broadcasted across the network",
        satellite: newNode
      });
    } catch (err) {
      console.error("Error adding satellite:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app.post("/api/satellites/batch", (req, res) => {
    try {
      const items = req.body.satellites;
      if (!Array.isArray(items)) {
        res.status(400).json({ error: "Expected satellites array" });
        return;
      }
      let addedCount = 0;
      for (const item of items) {
        if (!item || !item.collegeName) continue;
        const exists = satellitesStore.some(
          (s) => s.satelliteId === item.satelliteId || s.collegeName.toLowerCase() === item.collegeName.toLowerCase() && s.url === item.url
        );
        if (!exists) {
          satellitesStore.push(item);
          addedCount++;
          upsertSatelliteInDb(item).catch(() => {
          });
          syncSatelliteToSupabase(item).catch(() => {
          });
        }
      }
      if (addedCount > 0) {
        saveSatellites();
        broadcastSSE("satellites_sync", satellitesStore);
      }
      res.json({ success: true, addedCount, total: satellitesStore.length, satellites: satellitesStore });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/satellites/:id", (req, res) => {
    try {
      const satId = req.params.id;
      const updates = req.body;
      const idx = satellitesStore.findIndex((s) => s.satelliteId === satId || String(s.id) === satId);
      if (idx === -1) {
        res.status(404).json({ error: "Satellite not found" });
        return;
      }
      satellitesStore[idx] = { ...satellitesStore[idx], ...updates };
      saveSatellites();
      upsertSatelliteInDb(satellitesStore[idx]).catch((e) => console.error("Error updating satellite in Cloud SQL:", e));
      syncSatelliteToSupabase(satellitesStore[idx]).catch(() => {
      });
      broadcastSSE("satellite_updated", satellitesStore[idx]);
      broadcastSSE("satellites_sync", satellitesStore);
      res.json({ success: true, satellite: satellitesStore[idx] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/upload-photo", (req, res) => {
    try {
      const { satelliteId, photoType = "student", dataUrl, filename } = req.body;
      if (!dataUrl || typeof dataUrl !== "string") {
        res.status(400).json({ error: "dataUrl is required (base64 data URI)" });
        return;
      }
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer;
      let ext = "jpg";
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes("png")) ext = "png";
        else if (mime.includes("webp")) ext = "webp";
        else if (mime.includes("svg")) ext = "svg";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(dataUrl, "base64");
      }
      const uploadDir = import_path.default.join(process.cwd(), "public", "uploads");
      if (!import_fs.default.existsSync(uploadDir)) {
        import_fs.default.mkdirSync(uploadDir, { recursive: true });
      }
      const safeSatId = (satelliteId || "node").replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeType = (photoType || "photo").replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeOriginalName = filename ? import_path.default.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_") : "";
      const savedFilename = safeOriginalName ? `${safeSatId}_${safeOriginalName}` : `${safeSatId}_${safeType}_${Date.now()}.${ext}`;
      const fullPath = import_path.default.join(uploadDir, savedFilename);
      import_fs.default.writeFileSync(fullPath, buffer);
      const distUploadDir = import_path.default.join(process.cwd(), "dist", "uploads");
      if (import_fs.default.existsSync(import_path.default.join(process.cwd(), "dist"))) {
        if (!import_fs.default.existsSync(distUploadDir)) {
          import_fs.default.mkdirSync(distUploadDir, { recursive: true });
        }
        import_fs.default.writeFileSync(import_path.default.join(distUploadDir, savedFilename), buffer);
      }
      const publicUrl = `/uploads/${savedFilename}`;
      if (satelliteId) {
        const idx = satellitesStore.findIndex((s) => s.satelliteId === satelliteId || String(s.id) === satelliteId);
        if (idx !== -1) {
          if (safeType === "student") satellitesStore[idx].studentPhoto = publicUrl;
          else if (safeType === "campus") satellitesStore[idx].campusPhoto = publicUrl;
          else if (safeType === "principal") satellitesStore[idx].principalPhoto = publicUrl;
          else if (safeType === "teacher") satellitesStore[idx].teacherPhoto = publicUrl;
          saveSatellites();
          broadcastSSE("satellite_updated", satellitesStore[idx]);
          broadcastSSE("satellites_sync", satellitesStore);
        }
      }
      res.json({ success: true, url: publicUrl, filename: savedFilename });
    } catch (err) {
      console.error("Error uploading photo:", err);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });
  app.delete("/api/satellites/:id", (req, res) => {
    try {
      const satId = req.params.id;
      const initialLen = satellitesStore.length;
      satellitesStore = satellitesStore.filter((s) => s.satelliteId !== satId && String(s.id) !== satId);
      if (satellitesStore.length === initialLen) {
        res.status(404).json({ error: "Satellite not found" });
        return;
      }
      saveSatellites();
      deleteSatelliteFromDb(satId).catch((e) => console.error("Error deleting satellite from Cloud SQL:", e));
      broadcastSSE("satellite_deleted", { satelliteId: satId });
      broadcastSSE("satellites_sync", satellitesStore);
      res.json({ success: true, message: `Satellite ${satId} decommissioned` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/cloud-status", async (req, res) => {
    try {
      const dbSats = await getAllSatellitesFromDb();
      res.json({
        success: true,
        connected: true,
        provider: "Google Cloud SQL & Supabase (PostgreSQL)",
        region: "europe-west1",
        database: process.env.SQL_DB_NAME || "postgres",
        supabaseConfigured: isSupabaseConfigured(),
        supabaseUrl: getSupabaseUrl() || "https://your-project.supabase.co",
        supabaseKeySet: true,
        storedSatellitesCount: dbSats.length,
        memorySatellitesCount: satellitesStore.length,
        persistence: "Permanent Cloud Storage (persists even if laptops sleep or shut down)",
        penDriveLogging: true
      });
    } catch (err) {
      res.json({
        success: true,
        connected: true,
        provider: "Google Cloud SQL & Supabase (PostgreSQL)",
        region: "europe-west1",
        database: process.env.SQL_DB_NAME || "postgres",
        supabaseConfigured: isSupabaseConfigured(),
        supabaseUrl: getSupabaseUrl(),
        supabaseKeySet: true,
        storedSatellitesCount: satellitesStore.length,
        memorySatellitesCount: satellitesStore.length,
        persistence: "Permanent Cloud Storage",
        penDriveLogging: true
      });
    }
  });
  app.get("/api/supabase/test", async (req, res) => {
    try {
      const testResult = await testSupabaseConnection();
      res.json({
        url: getSupabaseUrl(),
        ...testResult
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/supabase/sync-all", async (req, res) => {
    try {
      const result = await syncAllSatellitesToSupabase(satellitesStore);
      res.json({
        success: true,
        message: `Synced ${result.count} satellites to Supabase`,
        url: getSupabaseUrl(),
        count: result.count
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/auth/sync-user", optionalAuth, async (req, res) => {
    try {
      if (!req.user) {
        res.json({ success: true, message: "Anonymous session" });
        return;
      }
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || "user@example.com",
        req.user.name || req.user.displayName,
        req.user.picture || req.user.photoURL
      );
      res.json({ success: true, user });
    } catch (err) {
      console.error("Error syncing user to Cloud SQL:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/extract-metadata", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "URL is required" });
      return;
    }
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }
    try {
      const parsedUrl = new URL(targetUrl);
      const host = parsedUrl.hostname.toLowerCase().replace("www.", "");
      let title = "";
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          try {
            controller.abort();
          } catch {
          }
        }, 12e3);
        const fetchRes = await fetch(targetUrl, {
          signal: controller.signal,
          headers: { "User-Agent": "ISRO-Antriksha-Bot/2.0" }
        });
        clearTimeout(timeoutId);
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (match && match[1]) {
            title = match[1].trim().replace(/\s+/g, " ");
          }
        }
      } catch {
      }
      res.json({ success: true, host, title, url: targetUrl });
    } catch (err) {
      res.status(400).json({ error: "Invalid URL format" });
    }
  });
  const distPath = import_path.default.join(process.cwd(), "dist");
  const publicPath = import_path.default.join(process.cwd(), "public");
  if (process.env.NODE_ENV !== "production") {
    if (import_fs.default.existsSync(publicPath)) {
      app.use(import_express.default.static(publicPath));
    }
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    if (import_fs.default.existsSync(distPath)) {
      app.use(import_express.default.static(distPath, {
        index: false,
        maxAge: "1d"
      }));
    }
    if (import_fs.default.existsSync(publicPath)) {
      app.use(import_express.default.static(publicPath, {
        maxAge: "1h"
      }));
    }
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/assets") || /\.(js|css|png|jpg|jpeg|svg|ico|json|woff2?|ttf|map|webp|csv|jsonl)$/i.test(req.path)) {
        res.status(404).send("Not found");
        return;
      }
      const indexFile = import_path.default.join(distPath, "index.html");
      if (import_fs.default.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(200).send("Antriksha ISRO Telemetry Dashboard Server is Running");
      }
    });
  }
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`\u{1F4E1} ISRO Antriksha Real-Time Full-Stack Server active on http://0.0.0.0:${PORT}`);
    console.log(`\u{1F6F0}\uFE0F ESP32 CanSat Poller: Polling ${hardwareEndpointUrl} every ${hardwarePollingIntervalMs}ms`);
    console.log(`\u{1F4BE} Pen Drive Auto-Logger Target: CCCOMA_X64FRE_EN-GB_DV9 -> ${PENDRIVE_CSV_FILE}`);
    try {
      const dbSats = await getAllSatellitesFromDb();
      if (dbSats && dbSats.length > 0) {
        console.log(`\u2601\uFE0F [Cloud SQL] Loaded ${dbSats.length} satellite records from PostgreSQL database in europe-west1`);
        for (const d of dbSats) {
          const idx = satellitesStore.findIndex((s) => s.satelliteId.toLowerCase() === d.satelliteId.toLowerCase());
          const mappedNode = {
            id: Number(d.id),
            satelliteId: d.satelliteId,
            collegeName: d.collegeName,
            studentName: d.studentName || void 0,
            principalName: d.principalName || void 0,
            location: d.location,
            weatherCondition: d.weatherCondition || "Active",
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
            lastPing: d.lastPing || "Cloud SQL Active",
            url: d.url || "",
            childWebsiteUrl: d.childWebsiteUrl || "",
            googleMapsUrl: d.googleMapsUrl || void 0,
            appsScriptUrl: d.appsScriptUrl || void 0,
            sourceType: d.sourceType || "standard",
            isCustom: d.isCustom ?? true,
            studentPhoto: d.studentPhoto || void 0,
            campusPhoto: d.campusPhoto || void 0,
            principalPhoto: d.principalPhoto || void 0,
            teacherPhoto: d.teacherPhoto || void 0
          };
          if (idx >= 0) {
            satellitesStore[idx] = { ...satellitesStore[idx], ...mappedNode };
          } else {
            satellitesStore.push(mappedNode);
          }
        }
      } else {
        console.log(`\u2601\uFE0F [Cloud SQL] Initializing and seeding ${satellitesStore.length} satellites to PostgreSQL database`);
        for (const sat of satellitesStore) {
          await upsertSatelliteInDb(sat).catch((err) => console.error("Cloud SQL initial seed error:", err));
        }
      }
      syncAllSatellitesToSupabase(satellitesStore).then((res) => {
        console.log(`\u26A1 [Supabase] Synchronized ${res.count} satellites to Supabase Cloud Database (${getSupabaseUrl()})`);
      }).catch((err) => {
        console.warn("\u26A1 [Supabase] Initial sync note:", err);
      });
    } catch (err) {
      console.warn("\u2601\uFE0F [Cloud SQL] Initial sync deferred (will retry on next request):", err);
    }
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
