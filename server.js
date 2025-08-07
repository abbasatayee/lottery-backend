const express = require("express");
const cors = require("cors");
const { insertLocation, getAllLocations, getLocationStats, searchLocations, resetLocations } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Helper function to extract comprehensive request information
function extractRequestInfo(req) {
  return {
    host: req.get('host'),
    referer: req.get('referer'),
    origin: req.get('origin'),
    method: req.method,
    url: req.originalUrl,
    protocol: req.protocol,
    headers: {
      'user-agent': req.get('user-agent'),
      'accept': req.get('accept'),
      'accept-language': req.get('accept-language'),
      'accept-encoding': req.get('accept-encoding'),
      'connection': req.get('connection'),
      'cache-control': req.get('cache-control'),
      'sec-fetch-dest': req.get('sec-fetch-dest'),
      'sec-fetch-mode': req.get('sec-fetch-mode'),
      'sec-fetch-site': req.get('sec-fetch-site'),
      'sec-ch-ua': req.get('sec-ch-ua'),
      'sec-ch-ua-mobile': req.get('sec-ch-ua-mobile'),
      'sec-ch-ua-platform': req.get('sec-ch-ua-platform'),
      'upgrade-insecure-requests': req.get('upgrade-insecure-requests'),
      'x-forwarded-for': req.get('x-forwarded-for'),
      'x-forwarded-proto': req.get('x-forwarded-proto'),
      'x-real-ip': req.get('x-real-ip')
    }
  };
}

// Helper function to extract geolocation metadata
function extractGeolocationInfo(body) {
  return {
    accuracy: body.accuracy || null,
    altitude: body.altitude || null,
    altitudeAccuracy: body.altitudeAccuracy || null,
    heading: body.heading || null,
    speed: body.speed || null
  };
}

// Helper function to extract browser information
function extractBrowserInfo(req, body) {
  const userAgent = req.get('user-agent') || '';
  
  return {
    timezone: body.timezone || null,
    language: req.get('accept-language') || null,
    screenResolution: body.screenResolution || null,
    deviceMemory: body.deviceMemory || null,
    hardwareConcurrency: body.hardwareConcurrency || null,
    platform: body.platform || null,
    vendor: body.vendor || null,
    cookieEnabled: body.cookieEnabled || null,
    doNotTrack: req.get('dnt') || null
  };
}

// Helper function to extract network information
function extractNetworkInfo(body) {
  return {
    connectionType: body.connectionType || null,
    effectiveType: body.effectiveType || null,
    downlink: body.downlink || null,
    rtt: body.rtt || null
  };
}

// Basic route for testing
app.get("/", (req, res) => {
  res.json({
    message: "Location API Server",
    endpoints: {
      "POST /api/location": "Store location data",
      "GET /api/locations": "Get all stored locations",
      "GET /admin/send-location": "Admin endpoint to send location data via query parameters",
      "GET /api/stats": "Get location statistics",
      "GET /api/search": "Search locations with filters",
      "DELETE /api/reset": "Reset/clear all location data"
    },
  });
});

// DELETE endpoint to reset all locations
app.delete("/api/reset", async (req, res) => {
  try {
    const result = await resetLocations();
    res.json({
      message: "Reset operation completed successfully",
      ...result
    });
  } catch (error) {
    console.error("Error resetting locations:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Admin endpoint to send location data via GET request
app.get("/admin/send-location", async (req, res) => {
  try {
    const { latitude, longitude, additionalData } = req.query;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Missing required fields: latitude and longitude are required",
        usage:
          "GET /admin/send-location?latitude=37.7749&longitude=-122.4194&additionalData=accuracy:10,altitude:100",
      });
    }

    // Validate latitude and longitude ranges
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        error: "Invalid latitude. Must be a number between -90 and 90",
      });
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({
        error: "Invalid longitude. Must be a number between -180 and 180",
      });
    }

    // Parse additional data if provided
    let parsedAdditionalData = null;
    if (additionalData) {
      try {
        // Try to parse as JSON first
        if (additionalData.startsWith("{") && additionalData.endsWith("}")) {
          parsedAdditionalData = JSON.parse(additionalData);
        } else {
          // Parse as key:value,key:value format
          const dataObj = {};
          const pairs = additionalData.split(",");
          pairs.forEach((pair) => {
            const [key, value] = pair.split(":");
            if (key && value) {
              dataObj[key.trim()] = value.trim();
            }
          });
          parsedAdditionalData =
            Object.keys(dataObj).length > 0 ? dataObj : null;
        }
      } catch (error) {
        console.warn("Could not parse additionalData:", additionalData);
      }
    }

    // Get client information
    const userAgent = req.get("User-Agent");
    const ipAddress =
      req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"];

    // Extract comprehensive information
    const requestInfo = extractRequestInfo(req);
    const geolocationInfo = extractGeolocationInfo({ ...req.query, ...parsedAdditionalData });
    const browserInfo = extractBrowserInfo(req, { ...req.query, ...parsedAdditionalData });
    const networkInfo = extractNetworkInfo({ ...req.query, ...parsedAdditionalData });

    // Prepare location data
    const locationData = {
      latitude: lat,
      longitude: lng,
      userAgent,
      ipAddress,
      additionalData: parsedAdditionalData,
      requestInfo,
      geolocationInfo,
      browserInfo,
      networkInfo,
      customFields: {
        source: 'admin_endpoint',
        queryParams: req.query
      }
    };

    // Store in database
    const result = await insertLocation(locationData);

    res.json({
      message: "Location stored successfully via admin endpoint",
      id: result.id,
      data: locationData,
      query: req.query,
    });
  } catch (error) {
    console.error("Error storing location via admin endpoint:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST endpoint to store location data (public)
app.post("/api/location", async (req, res) => {
  try {
    const { latitude, longitude, additionalData, geolocationInfo, browserInfo, networkInfo, customFields } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Missing required fields: latitude and longitude are required",
      });
    }

    // Validate latitude and longitude ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: "Invalid latitude. Must be between -90 and 90",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: "Invalid longitude. Must be between -180 and 180",
      });
    }

    // Get client information
    const userAgent = req.get("User-Agent");
    const ipAddress =
      req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"];

    // Extract comprehensive information
    const requestInfo = extractRequestInfo(req);
    const extractedGeolocationInfo = extractGeolocationInfo({ ...req.body, ...geolocationInfo });
    const extractedBrowserInfo = extractBrowserInfo(req, { ...req.body, ...browserInfo });
    const extractedNetworkInfo = extractNetworkInfo({ ...req.body, ...networkInfo });

    // Prepare location data
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      userAgent,
      ipAddress,
      additionalData,
      requestInfo,
      geolocationInfo: extractedGeolocationInfo,
      browserInfo: extractedBrowserInfo,
      networkInfo: extractedNetworkInfo,
      customFields: {
        source: 'api_endpoint',
        ...customFields
      }
    };

    // Store in database
    const result = await insertLocation(locationData);

    res.status(201).json({
      message: "Location stored successfully",
      id: result.id,
      data: locationData,
    });
  } catch (error) {
    console.error("Error storing location:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET endpoint to retrieve all locations
app.get("/api/locations", async (req, res) => {
  try {
    const locations = await getAllLocations();
    res.json({
      count: locations.length,
      locations: locations,
    });
  } catch (error) {
    console.error("Error retrieving locations:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET endpoint to retrieve location statistics
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await getLocationStats();
    res.json({
      message: "Location statistics",
      stats: stats
    });
  } catch (error) {
    console.error("Error retrieving statistics:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET endpoint to search locations
app.get("/api/search", async (req, res) => {
  try {
    const filters = {
      latitude: req.query.latitude ? parseFloat(req.query.latitude) : null,
      longitude: req.query.longitude ? parseFloat(req.query.longitude) : null,
      ipAddress: req.query.ipAddress || null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null
    };

    const locations = await searchLocations(filters);
    res.json({
      count: locations.length,
      filters: filters,
      locations: locations,
    });
  } catch (error) {
    console.error("Error searching locations:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: {
      "GET /": "API information",
      "POST /api/location": "Store location data",
      "GET /api/locations": "Get all locations",
      "GET /api/stats": "Get location statistics",
      "GET /api/search": "Search locations",
      "DELETE /api/reset": "Reset/clear all location data",
      "GET /admin/send-location": "Admin endpoint to send location data",
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Location API endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/location`);
  console.log(`   GET  http://localhost:${PORT}/api/locations`);
  console.log(`   GET  http://localhost:${PORT}/api/stats`);
  console.log(`   GET  http://localhost:${PORT}/api/search`);
  console.log(`   DELETE http://localhost:${PORT}/api/reset`);
  console.log(
    `   GET  http://localhost:${PORT}/admin/send-location?latitude=37.7749&longitude=-122.4194`
  );
  console.log(`   GET  http://localhost:${PORT}/`);
});
