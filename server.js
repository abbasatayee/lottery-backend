const express = require("express");
const cors = require("cors");
const { insertLocation, getAllLocations } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic route for testing
app.get("/", (req, res) => {
  res.json({
    message: "Location API Server",
    endpoints: {
      "POST /api/location": "Store location data",
      "GET /api/locations": "Get all stored locations",
      "GET /admin/send-location":
        "Admin endpoint to send location data via query parameters",
    },
  });
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

    // Prepare location data
    const locationData = {
      latitude: lat,
      longitude: lng,
      userAgent,
      ipAddress,
      additionalData: parsedAdditionalData,
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
    const { latitude, longitude, additionalData } = req.body;

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

    // Prepare location data
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      userAgent,
      ipAddress,
      additionalData,
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
  console.log(
    `   GET  http://localhost:${PORT}/admin/send-location?latitude=37.7749&longitude=-122.4194`
  );
  console.log(`   GET  http://localhost:${PORT}/`);
});
