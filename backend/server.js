// backend/server.js - FIXED ROUTE MOUNTING ORDER
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodeCron = require("node-cron");

const { runMigrations, query, closePool, initPool } = require("./db");

// load routes
const authRoutes = require("./routes/auth.routes");
const passesRoutes = require("./routes/passes.routes");
const adminRoutes = require("./routes/admin.routes");
const noticesRoutes = require("./routes/notices.routes");
const bookingsRoutes = require("./routes/bookings.routes");
const complaintsRoutes = require("./routes/complaints.routes");
const watchmanRoutes = require("./routes/watchman.routes");
const paymentsRoutes = require("./routes/payments.routes");

const PORT = process.env.PORT || 3000;

async function start() {
  initPool();

  try {
    console.log("Running migrations...");
    await runMigrations();
    console.log("Migrations finished.");
  } catch (err) {
    console.error("Migration error:", err);
    // Continue even if migrations fail (for development)
  }

  const app = express();

  // CORS configuration - FIXED
  app.use(cors({}));

  app.use(bodyParser.json());

  // health endpoint
  app.get("/", (req, res) =>
    res.json({ ok: true, message: "Server is running" })
  );

  // Debug endpoint to check tables
  app.get("/api/debug/tables", async (req, res) => {
    try {
      const result = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      res.json({ tables: result.rows });
    } catch (error) {
      console.error("Debug tables error:", error);
      res.status(500).json({ error: "Failed to get tables" });
    }
  });

  // Mount API routes in correct order
  app.use("/api/auth", authRoutes);
  app.use("/api", passesRoutes);
  app.use("/api", bookingsRoutes);
  app.use("/api", noticesRoutes);
  app.use("/api", complaintsRoutes);
  app.use("/api", paymentsRoutes);
  app.use("/api/admin", adminRoutes);

  // generic 404 for /api/*
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      error: `Not found: ${req.method} ${req.originalUrl}`,
      availableEndpoints: [
        "POST /api/bookings - Create booking (resident)",
        "GET /api/bookings/my - Get user's bookings",
        "GET /api/buildings/:buildingId/bookings - Get building bookings (admin)",
        "POST /api/bookings/:id/approve - Approve booking (admin)",
        "POST /api/bookings/:id/reject - Reject booking (admin)",
        "POST /api/bookings/:id/cancel - Cancel booking",
      ],
    });
  });

  if (process.env.NODE_ENV !== "test") {
    nodeCron.schedule("0 0 1 * *", async () => {
      try {
        console.log("Generating monthly maintenance payments...");
        const buildingsRes = await query("SELECT id FROM buildings");
        for (const building of buildingsRes.rows) {
          await generateMonthlyMaintenance(building.id);
        }
        console.log("Monthly maintenance payments generated successfully");
      } catch (err) {
        console.error("Error generating monthly payments:", err);
      }
    });
  }

  // error handler
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(
      `Bookings API available at: http://localhost:${PORT}/api/bookings`
    );
  });

  // graceful shutdown
  async function graceful() {
    console.log("Shutting down server...");
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await closePool();
        console.log("DB pool closed.");
      } catch (e) {
        console.error("Error closing DB pool", e);
      }
      process.exit(0);
    });

    setTimeout(() => {
      console.warn("Force exit after timeout");
      process.exit(1);
    }, 10000).unref();
  }

  process.on("SIGTERM", graceful);
  process.on("SIGINT", graceful);
}

start().catch((err) => {
  console.error("Failed to start", err);
  process.exit(1);
});
