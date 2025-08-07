# Location API Server

A simple Express server that stores location information in an SQLite database.

## Features

- Store location data (latitude, longitude) via REST API
- Admin endpoint for easy testing and manual data entry
- Automatic database initialization
- CORS enabled for cross-origin requests
- Input validation
- Client information capture (IP, User-Agent)
- Retrieve all stored locations

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
    "GET /admin/send-location": "Admin endpoint to send location data via query parameters"
  }
}
```

### GET /admin/send-location

Admin endpoint to send location data via GET request with query parameters. Perfect for testing and manual data entry.

**Query Parameters:**
- `latitude` (required): Latitude coordinate (-90 to 90)
- `longitude` (required): Longitude coordinate (-180 to 180)
- `additionalData` (optional): Additional data in key:value format or JSON

**Examples:**

```bash
# Basic location
curl "http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194"

# With additional data (key:value format)
curl "http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194&additionalData=accuracy:10,altitude:100,speed:5.2"

# With JSON additional data
curl "http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194&additionalData={\"accuracy\":10,\"altitude\":100}"
```

**Response:**

```json
{
  "message": "Location stored successfully via admin endpoint",
  "id": 3,
  "data": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "userAgent": "curl/8.7.1",
    "ipAddress": "::1",
    "additionalData": {
      "accuracy": "10",
      "altitude": "100"
    }
  },
  "query": {
    "latitude": "37.7749",
    "longitude": "-122.4194",
    "additionalData": "accuracy:10,altitude:100"
  }
}
```

### POST /api/location

Store location data in the database.

**Request Body:**

```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "additionalData": {
    "accuracy": 10,
    "altitude": 100,
    "speed": 5.2
  }
}
```

**Required Fields:**

- `latitude` (number): Must be between -90 and 90
- `longitude` (number): Must be between -180 and 180

**Optional Fields:**

- `additionalData` (object): Any additional data you want to store

**Response:**

```json
{
  "message": "Location stored successfully",
  "id": 1,
  "data": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1",
    "additionalData": {
      "accuracy": 10,
      "altitude": 100,
      "speed": 5.2
    }
  }
}
```

### GET /api/locations

Retrieve all stored locations.

**Response:**

```json
{
  "count": 2,
  "locations": [
    {
      "id": 2,
      "latitude": 37.7749,
      "longitude": -122.4194,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "user_agent": "Mozilla/5.0...",
      "ip_address": "192.168.1.1",
      "additional_data": "{\"accuracy\":10,\"altitude\":100}"
    },
    {
      "id": 1,
      "latitude": 40.7128,
      "longitude": -74.006,
      "timestamp": "2024-01-15T10:25:00.000Z",
      "user_agent": "Mozilla/5.0...",
      "ip_address": "192.168.1.1",
      "additional_data": null
    }
  ]
}
```

## Database

The server uses SQLite with a `locations.db` file created automatically in the project directory. The database contains a single table:

**locations table:**

- `id` (INTEGER PRIMARY KEY): Auto-incrementing ID
- `latitude` (REAL): Latitude coordinate
- `longitude` (REAL): Longitude coordinate
- `timestamp` (DATETIME): When the location was stored
- `user_agent` (TEXT): Client's User-Agent header
- `ip_address` (TEXT): Client's IP address
- `additional_data` (TEXT): JSON string of additional data

## Example Usage

### Using curl:

```bash
# Store a location via admin endpoint (easiest for testing)
curl "http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194&additionalData=accuracy:10,altitude:100"

# Store a location via POST endpoint
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "additionalData": {
      "accuracy": 10,
      "altitude": 100
    }
  }'

# Get all locations
curl http://localhost:3000/api/locations
```

### Using JavaScript (fetch):

```javascript
// Store location via admin endpoint
const adminResponse = await fetch("http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194&additionalData=accuracy:10,altitude:100");
const adminResult = await adminResponse.json();
console.log(adminResult);

// Store location via POST endpoint
const response = await fetch("http://localhost:3000/api/location", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    latitude: 37.7749,
    longitude: -122.4194,
    additionalData: {
      accuracy: 10,
      altitude: 100,
    },
  }),
});

const result = await response.json();
console.log(result);

// Get all locations
const locationsResponse = await fetch("http://localhost:3000/api/locations");
const locations = await locationsResponse.json();
console.log(locations);
```

### Browser Testing:

You can easily test the admin endpoint by visiting these URLs in your browser:

```
http://localhost:3000/admin/send-location?latitude=37.7749&longitude=-122.4194
http://localhost:3000/admin/send-location?latitude=40.7128&longitude=-74.006&additionalData=accuracy:15,altitude:50
http://localhost:3000/api/locations
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
