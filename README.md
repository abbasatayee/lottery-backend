# Location API Server

A comprehensive Express server that stores detailed location information in an SQLite database with extensive metadata collection.

## Features

- Store location data (latitude, longitude) via REST API
- Admin endpoint for easy testing and manual data entry
- **Comprehensive data collection**: Captures 35+ data points per location
- Automatic database initialization with enhanced schema
- CORS enabled for cross-origin requests
- Input validation and error handling
- Client information capture (IP, User-Agent, headers)
- System information tracking
- Geolocation metadata (accuracy, altitude, speed, heading)
- Browser/device information
- Network information
- Custom fields support
- Statistics and search functionality
- Retrieve all stored locations with full metadata

## Data Collected

The server captures comprehensive information for each location entry:

### **Core Location Data**

- Latitude & Longitude coordinates
- Timestamp of collection

### **Client Information**

- IP Address
- User Agent
- Host
- Referer
- Origin

### **Request Information**

- HTTP Method
- URL
- Protocol
- All HTTP Headers

### **System Information**

- Server hostname
- Platform (OS)
- Architecture
- Node.js version
- Server uptime

### **Geolocation Metadata**

- Accuracy
- Altitude
- Altitude accuracy
- Heading (direction)
- Speed

### **Browser/Device Information**

- Timezone
- Language preferences
- Screen resolution
- Device memory
- Hardware concurrency (CPU cores)
- Platform
- Vendor
- Cookie enabled status
- Do Not Track preference

### **Network Information**

- Connection type (wifi, cellular, etc.)
- Effective type (2g, 3g, 4g, etc.)
- Downlink speed
- Round-trip time (RTT)

### **Additional Data**

- Custom JSON data
- Source tracking (admin endpoint vs API)
- Query parameters

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

The server will start on port 3000 (or the PORT environment variable if set).

## API Endpoints

### GET /

Returns API information and available endpoints.

**Response:**

```json
{
  "message": "Location API Server",
  "endpoints": {
    "POST /api/location": "Store location data",
    "GET /api/locations": "Get all stored locations",
    "GET /admin/send-location": "Admin endpoint to send location data via query parameters",
    "GET /api/stats": "Get location statistics",
    "GET /api/search": "Search locations with filters"
  }
}
```

### GET /admin/send-location

Admin endpoint to send location data via GET request with query parameters. Perfect for testing and manual data entry.

**Query Parameters:**

- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `accuracy`, `altitude`, `speed`, `heading`: Geolocation metadata
- `timezone`, `deviceMemory`, `hardwareConcurrency`: Browser info
- `connectionType`, `effectiveType`, `downlink`, `rtt`: Network info
- `platform`, `vendor`, `cookieEnabled`: Device info
- `additionalData`: Additional data in key:value format or JSON

**Examples:**

```bash
# Basic location
curl "http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194"

# With comprehensive data
curl "http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194&accuracy=10&altitude=100&speed=5.2&timezone=America/Los_Angeles&deviceMemory=8&hardwareConcurrency=8&connectionType=wifi&effectiveType=4g&platform=MacIntel&vendor=Apple Inc."
```

### POST /api/location

Store location data in the database with comprehensive metadata.

**Request Body:**

```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 10,
  "altitude": 100,
  "speed": 5.2,
  "heading": 180,
  "timezone": "America/Los_Angeles",
  "deviceMemory": 8,
  "hardwareConcurrency": 8,
  "connectionType": "wifi",
  "effectiveType": "4g",
  "downlink": 10,
  "rtt": 50,
  "platform": "MacIntel",
  "vendor": "Apple Inc.",
  "cookieEnabled": true,
  "additionalData": {
    "building": "Salesforce Tower",
    "floor": 50,
    "room": "conference"
  }
}
```

### GET /api/locations

Retrieve all stored locations with full metadata.

**Response:**

```json
{
  "count": 2,
  "locations": [
    {
      "id": 2,
      "latitude": 40.7128,
      "longitude": -74.006,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "user_agent": "curl/8.7.1",
      "ip_address": "::1",
      "host": "localhost:3000",
      "method": "POST",
      "url": "/api/location",
      "protocol": "http",
      "headers": "{\"user-agent\":\"curl/8.7.1\",\"accept\":\"*/*\"}",
      "server_hostname": "Abbass-MacBook-Pro.local",
      "server_platform": "darwin",
      "server_arch": "arm64",
      "server_node_version": "v22.14.0",
      "server_uptime": 1234.56,
      "accuracy": 15,
      "altitude": 50,
      "speed": 3.5,
      "timezone": "America/New_York",
      "device_memory": 16,
      "hardware_concurrency": 12,
      "connection_type": "wifi",
      "effective_type": "4g",
      "downlink": 10,
      "rtt": 50,
      "platform": "MacIntel",
      "vendor": "Apple Inc.",
      "cookie_enabled": 1,
      "additional_data": "{\"building\":\"Empire State\",\"floor\":86,\"room\":\"observation\"}",
      "custom_fields": "{\"source\":\"api_endpoint\"}"
    }
  ]
}
```

### GET /api/stats

Get comprehensive location statistics.

**Response:**

```json
{
  "message": "Location statistics",
  "stats": {
    "total": 25,
    "today": 5,
    "thisWeek": 15,
    "uniqueIPs": 8,
    "uniqueUserAgents": 12
  }
}
```

### GET /api/search

Search locations with various filters.

**Query Parameters:**

- `latitude`: Exact latitude match
- `longitude`: Exact longitude match
- `ipAddress`: IP address (partial match)
- `dateFrom`: Start date (YYYY-MM-DD)
- `dateTo`: End date (YYYY-MM-DD)

**Example:**

```bash
curl "http://localhost:3000/api/search?ipAddress=192.168.1.1&dateFrom=2024-01-01"
```

## Database Schema

The server uses SQLite with a comprehensive `locations.db` file. The database contains a single table with 36 columns:

**locations table:**

- `id` (INTEGER PRIMARY KEY): Auto-incrementing ID
- `latitude` (REAL): Latitude coordinate
- `longitude` (REAL): Longitude coordinate
- `timestamp` (DATETIME): When the location was stored
- `user_agent` (TEXT): Client's User-Agent header
- `ip_address` (TEXT): Client's IP address
- `host` (TEXT): Request host
- `referer` (TEXT): HTTP referer
- `origin` (TEXT): Request origin
- `method` (TEXT): HTTP method
- `url` (TEXT): Request URL
- `protocol` (TEXT): HTTP protocol
- `headers` (TEXT): JSON string of all headers
- `server_hostname` (TEXT): Server hostname
- `server_platform` (TEXT): OS platform
- `server_arch` (TEXT): CPU architecture
- `server_node_version` (TEXT): Node.js version
- `server_uptime` (REAL): Server uptime
- `accuracy` (REAL): Geolocation accuracy
- `altitude` (REAL): Altitude
- `altitude_accuracy` (REAL): Altitude accuracy
- `heading` (REAL): Direction heading
- `speed` (REAL): Movement speed
- `additional_data` (TEXT): JSON string of additional data
- `timezone` (TEXT): Client timezone
- `language` (TEXT): Accept-Language header
- `screen_resolution` (TEXT): Screen resolution
- `device_memory` (REAL): Device memory in GB
- `hardware_concurrency` (INTEGER): CPU cores
- `connection_type` (TEXT): Network connection type
- `effective_type` (TEXT): Network effective type
- `downlink` (REAL): Network downlink speed
- `rtt` (REAL): Network round-trip time
- `platform` (TEXT): Client platform
- `vendor` (TEXT): Device vendor
- `cookie_enabled` (BOOLEAN): Cookie enabled status
- `do_not_track` (TEXT): Do Not Track header
- `custom_fields` (TEXT): JSON string of custom fields

## Example Usage

### Using curl:

```bash
# Store a location via admin endpoint (easiest for testing)
curl "http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194&accuracy=10&altitude=100&speed=5.2&timezone=America/Los_Angeles&deviceMemory=8&hardwareConcurrency=8&connectionType=wifi&effectiveType=4g&platform=MacIntel&vendor=Apple Inc."

# Store a location via POST endpoint with comprehensive data
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 10,
    "altitude": 100,
    "speed": 5.2,
    "timezone": "America/Los_Angeles",
    "deviceMemory": 8,
    "hardwareConcurrency": 8,
    "connectionType": "wifi",
    "effectiveType": "4g",
    "downlink": 10,
    "rtt": 50,
    "platform": "MacIntel",
    "vendor": "Apple Inc.",
    "cookieEnabled": true,
    "additionalData": {
      "building": "Salesforce Tower",
      "floor": 50,
      "room": "conference"
    }
  }'

# Get all locations
curl http://localhost:3000/api/locations

# Get statistics
curl http://localhost:3000/api/stats

# Search locations
curl "http://localhost:3000/api/search?ipAddress=::1"
```

### Using JavaScript (fetch):

```javascript
// Store location via admin endpoint
const adminResponse = await fetch(
  "http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194&accuracy=10&altitude=100&speed=5.2&timezone=America/Los_Angeles&deviceMemory=8&hardwareConcurrency=8&connectionType=wifi&effectiveType=4g&platform=MacIntel&vendor=Apple Inc."
);
const adminResult = await adminResponse.json();
console.log(adminResult);

// Store location via POST endpoint with comprehensive data
const response = await fetch("http://localhost:3000/api/location", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: 100,
    speed: 5.2,
    timezone: "America/Los_Angeles",
    deviceMemory: 8,
    hardwareConcurrency: 8,
    connectionType: "wifi",
    effectiveType: "4g",
    downlink: 10,
    rtt: 50,
    platform: "MacIntel",
    vendor: "Apple Inc.",
    cookieEnabled: true,
    additionalData: {
      building: "Salesforce Tower",
      floor: 50,
      room: "conference",
    },
  }),
});

const result = await response.json();
console.log(result);

// Get all locations
const locationsResponse = await fetch("http://localhost:3000/api/locations");
const locations = await locationsResponse.json();
console.log(locations);

// Get statistics
const statsResponse = await fetch("http://localhost:3000/api/stats");
const stats = await statsResponse.json();
console.log(stats);

// Search locations
const searchResponse = await fetch(
  "http://localhost:3000/api/search?ipAddress=::1"
);
const searchResults = await searchResponse.json();
console.log(searchResults);
```

### Browser Testing:

You can easily test the admin endpoint by visiting these URLs in your browser:

```
http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194&accuracy=10&altitude=100&speed=5.2&timezone=America/Los_Angeles&deviceMemory=8&hardwareConcurrency=8&connectionType=wifi&effectiveType=4g&platform=MacIntel&vendor=Apple Inc.
http://localhost:3000/api/locations
http://localhost:3000/api/stats
http://localhost:3000/api/search?ipAddress=::1
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created (location stored)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a message explaining the issue:

```json
{
  "error": "Missing required fields: latitude and longitude are required"
}
```

## Data Privacy & Security

This server collects comprehensive information. Consider:

- **Data Retention**: Implement data retention policies
- **GDPR Compliance**: Handle user consent and data deletion
- **Encryption**: Consider encrypting sensitive data
- **Access Control**: Implement authentication for admin endpoints
- **Logging**: Monitor access patterns and suspicious activity
