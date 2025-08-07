const Database = require("better-sqlite3");
const path = require("path");
const os = require("os");

// Create database file in the project directory
const dbPath = path.join(__dirname, "locations.db");

// Initialize database
const db = new Database(dbPath);

console.log("Connected to SQLite database");
initDatabase();

// Initialize database tables
function initDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      -- Client Information
      user_agent TEXT,
      ip_address TEXT,
      host TEXT,
      referer TEXT,
      origin TEXT,
      
      -- Request Information
      method TEXT,
      url TEXT,
      protocol TEXT,
      headers TEXT,
      
      -- System Information
      server_hostname TEXT,
      server_platform TEXT,
      server_arch TEXT,
      server_node_version TEXT,
      server_uptime REAL,
      
      -- Location Metadata
      accuracy REAL,
      altitude REAL,
      altitude_accuracy REAL,
      heading REAL,
      speed REAL,
      
      -- Additional Data
      additional_data TEXT,
      
      -- Geolocation Context
      timezone TEXT,
      language TEXT,
      screen_resolution TEXT,
      device_memory REAL,
      hardware_concurrency INTEGER,
      
      -- Network Information
      connection_type TEXT,
      effective_type TEXT,
      downlink REAL,
      rtt REAL,
      
      -- Browser/Device Info
      platform TEXT,
      vendor TEXT,
      cookie_enabled BOOLEAN,
      do_not_track TEXT,
      
      -- Custom Fields
      custom_fields TEXT
    )
  `;

  try {
    db.exec(createTableQuery);
    console.log("Locations table ready with comprehensive schema");
  } catch (error) {
    console.error("Error creating table:", error.message);
  }
}

// Function to insert location data with comprehensive information
function insertLocation(locationData) {
  return new Promise((resolve, reject) => {
    try {
      const {
        latitude,
        longitude,
        userAgent,
        ipAddress,
        additionalData,
        requestInfo,
        systemInfo,
        geolocationInfo,
        browserInfo,
        networkInfo,
        customFields
      } = locationData;

      const query = `
        INSERT INTO locations (
          latitude, longitude, user_agent, ip_address, host, referer, origin,
          method, url, protocol, headers, server_hostname, server_platform,
          server_arch, server_node_version, server_uptime, accuracy, altitude,
          altitude_accuracy, heading, speed, additional_data, timezone,
          language, screen_resolution, device_memory, hardware_concurrency,
          connection_type, effective_type, downlink, rtt, platform, vendor,
          cookie_enabled, do_not_track, custom_fields
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;

      const params = [
        latitude,
        longitude,
        userAgent || null,
        ipAddress || null,
        requestInfo?.host || null,
        requestInfo?.referer || null,
        requestInfo?.origin || null,
        requestInfo?.method || null,
        requestInfo?.url || null,
        requestInfo?.protocol || null,
        requestInfo?.headers ? JSON.stringify(requestInfo.headers) : null,
        systemInfo?.hostname || os.hostname(),
        systemInfo?.platform || os.platform(),
        systemInfo?.arch || os.arch(),
        systemInfo?.nodeVersion || process.version,
        systemInfo?.uptime || process.uptime(),
        geolocationInfo?.accuracy || null,
        geolocationInfo?.altitude || null,
        geolocationInfo?.altitudeAccuracy || null,
        geolocationInfo?.heading || null,
        geolocationInfo?.speed || null,
        additionalData ? JSON.stringify(additionalData) : null,
        browserInfo?.timezone || null,
        browserInfo?.language || null,
        browserInfo?.screenResolution || null,
        browserInfo?.deviceMemory || null,
        browserInfo?.hardwareConcurrency || null,
        networkInfo?.connectionType || null,
        networkInfo?.effectiveType || null,
        networkInfo?.downlink || null,
        networkInfo?.rtt || null,
        browserInfo?.platform || null,
        browserInfo?.vendor || null,
        browserInfo?.cookieEnabled !== null ? (browserInfo.cookieEnabled ? 1 : 0) : null,
        browserInfo?.doNotTrack || null,
        customFields ? JSON.stringify(customFields) : null
      ];

      const stmt = db.prepare(query);
      const result = stmt.run(params);

      resolve({ id: result.lastInsertRowid });
    } catch (error) {
      reject(error);
    }
  });
}

// Function to get all locations
function getAllLocations() {
  return new Promise((resolve, reject) => {
    try {
      const query = "SELECT * FROM locations ORDER BY timestamp DESC";
      const stmt = db.prepare(query);
      const rows = stmt.all();
      resolve(rows);
    } catch (error) {
      reject(error);
    }
  });
}

// Function to get location statistics
function getLocationStats() {
  return new Promise((resolve, reject) => {
    try {
      const stats = {
        total: db.prepare("SELECT COUNT(*) as count FROM locations").get().count,
        today: db.prepare("SELECT COUNT(*) as count FROM locations WHERE DATE(timestamp) = DATE('now')").get().count,
        thisWeek: db.prepare("SELECT COUNT(*) as count FROM locations WHERE timestamp >= datetime('now', '-7 days')").get().count,
        uniqueIPs: db.prepare("SELECT COUNT(DISTINCT ip_address) as count FROM locations").get().count,
        uniqueUserAgents: db.prepare("SELECT COUNT(DISTINCT user_agent) as count FROM locations").get().count
      };
      resolve(stats);
    } catch (error) {
      reject(error);
    }
  });
}

// Function to search locations
function searchLocations(filters) {
  return new Promise((resolve, reject) => {
    try {
      let query = "SELECT * FROM locations WHERE 1=1";
      const params = [];

      if (filters.latitude) {
        query += " AND latitude = ?";
        params.push(filters.latitude);
      }
      if (filters.longitude) {
        query += " AND longitude = ?";
        params.push(filters.longitude);
      }
      if (filters.ipAddress) {
        query += " AND ip_address LIKE ?";
        params.push(`%${filters.ipAddress}%`);
      }
      if (filters.dateFrom) {
        query += " AND timestamp >= ?";
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        query += " AND timestamp <= ?";
        params.push(filters.dateTo);
      }

      query += " ORDER BY timestamp DESC";
      const stmt = db.prepare(query);
      const rows = stmt.all(params);
      resolve(rows);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  db,
  insertLocation,
  getAllLocations,
  getLocationStats,
  searchLocations
};
