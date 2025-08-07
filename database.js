const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database file in the project directory
const dbPath = path.join(__dirname, "locations.db");

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT,
      ip_address TEXT,
      additional_data TEXT
    )
  `;

  db.run(createTableQuery, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Locations table ready");
    }
  });
}

// Function to insert location data
function insertLocation(locationData) {
  return new Promise((resolve, reject) => {
    const { latitude, longitude, userAgent, ipAddress, additionalData } =
      locationData;

    const query = `
      INSERT INTO locations (latitude, longitude, user_agent, ip_address, additional_data)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      latitude,
      longitude,
      userAgent || null,
      ipAddress || null,
      additionalData ? JSON.stringify(additionalData) : null,
    ];

    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

// Function to get all locations
function getAllLocations() {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM locations ORDER BY timestamp DESC";

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db,
  insertLocation,
  getAllLocations,
};
