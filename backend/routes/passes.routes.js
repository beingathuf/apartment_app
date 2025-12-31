// backend/routes/passes.routes.js - UPDATED
const express = require("express");
const db = require("../db");
const { authMiddleware } = require("../auth.middleware");

const router = express.Router();

// Create visitor pass - 30 MINUTE EXPIRY (FIXED)
router.post(
  "/buildings/:buildingId/visitor-passes",
  authMiddleware,
  async (req, res) => {
    const buildingId = Number(req.params.buildingId);
    try {
      if (
        req.user.role === "resident" &&
        Number(req.user.buildingId) !== buildingId
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      const providedCode = req.body.code;
      const code = providedCode || generateShortCode();
      const visitorName = req.body.visitorName || req.body.name || null;
      const qrData = req.body.qrData || req.body.qr || null;

      // FIXED: Handle expiry properly - always treat as UTC
      let expiresAt = req.body.expiresAt;

      if (!expiresAt) {
        // 30 minutes from now in UTC
        expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      } else {
        // If expiresAt is provided, ensure it's treated as UTC
        try {
          const date = new Date(expiresAt);
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date");
          }
          // Always store as UTC in database
          expiresAt = date.toISOString();
        } catch (err) {
          console.error("Invalid expiresAt provided:", expiresAt, err);
          // Fallback to 30 minutes from now
          expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        }
      }

      console.log("Creating visitor pass (UTC times):", {
        code,
        visitorName,
        expiresAt: expiresAt,
        expiresAtLocal: new Date(expiresAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        currentUTC: new Date().toISOString(),
        currentLocal: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      });

      const apartmentId =
        req.body.apartment_id ||
        req.body.apartmentId ||
        req.user.apartmentId ||
        null;

      const client = await db.getClient();
      try {
        await client.query("BEGIN");
        const insertPass = `INSERT INTO visitor_passes (building_id, apartment_id, code, visitor_name, qr_data, created_by, expires_at, status)
                          VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
        const r = await client.query(insertPass, [
          buildingId,
          apartmentId,
          code,
          visitorName,
          qrData,
          req.user.id,
          expiresAt,
          "active", // Start with 'active' status
        ]);

        const passRow = r.rows[0];

        // Ensure we return UTC ISO string
        if (passRow.expires_at instanceof Date) {
          passRow.expires_at = passRow.expires_at.toISOString();
        } else if (passRow.expires_at) {
          passRow.expires_at = new Date(passRow.expires_at).toISOString();
        }

        if (passRow.created_at instanceof Date) {
          passRow.created_at = passRow.created_at.toISOString();
        }

        // Log event
        const insertEvent =
          "INSERT INTO events (building_id,type,ref_id,message,created_by) VALUES ($1,$2,$3,$4,$5)";
        await client.query(insertEvent, [
          buildingId,
          "visitor_request",
          passRow.id,
          `30-min visitor pass created: ${code}`,
          req.user.id,
        ]);

        await client.query("COMMIT");

        return res.json({
          pass: passRow,
          message: "Visitor pass created with 30-minute validity",
        });
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("create pass transaction error", err);
        return res.status(500).json({ error: "failed to create pass" });
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("POST /buildings/:buildingId/visitor-passes error", e);
      return res.status(500).json({ error: "failed" });
    }
  }
);

// List active passes (building) - Only non-expired passes
router.get(
  "/buildings/:buildingId/visitor-passes",
  authMiddleware,
  async (req, res) => {
    try {
      const buildingId = Number(req.params.buildingId);

      if (
        req.user.role === "resident" &&
        Number(req.user.buildingId) !== buildingId
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      // Get ALL passes for the building (including verified and active non-expired)
      const r = await db.query(
        `SELECT 
          vp.*,
          u.name as resident_name,
          u.phone as resident_phone,
          a.unit_number
         FROM visitor_passes vp
         LEFT JOIN users u ON vp.created_by = u.id
         LEFT JOIN apartments a ON vp.apartment_id = a.id
         WHERE vp.building_id = $1
           AND vp.status IN ('active', 'verified')
         ORDER BY vp.created_at DESC`,
        [buildingId]
      );

      // Convert all timestamps to ISO strings for consistent frontend handling
      const passes = r.rows.map((pass) => {
        const convertedPass = { ...pass };

        // Convert expires_at to ISO string
        if (convertedPass.expires_at instanceof Date) {
          convertedPass.expires_at = convertedPass.expires_at.toISOString();
        } else if (convertedPass.expires_at) {
          convertedPass.expires_at = new Date(
            convertedPass.expires_at
          ).toISOString();
        }

        // Convert created_at to ISO string
        if (convertedPass.created_at instanceof Date) {
          convertedPass.created_at = convertedPass.created_at.toISOString();
        }

        // Convert verified_at to ISO string if exists
        if (convertedPass.verified_at instanceof Date) {
          convertedPass.verified_at = convertedPass.verified_at.toISOString();
        }

        // Calculate time remaining in minutes
        if (convertedPass.expires_at) {
          const now = new Date();
          const expiry = new Date(convertedPass.expires_at);
          const diff = expiry.getTime() - now.getTime();
          convertedPass.timeRemaining = Math.max(
            0,
            Math.floor(diff / (1000 * 60))
          );

          // Also calculate isExpired flag for frontend
          convertedPass.isExpired = diff <= 0;
        } else {
          convertedPass.timeRemaining = 0;
          convertedPass.isExpired = true;
        }

        // Add isActive flag
        convertedPass.isActive =
          convertedPass.status === "active" && !convertedPass.isExpired;

        return convertedPass;
      });

      console.log(
        `GET /buildings/${buildingId}/visitor-passes: ${
          passes.length
        } passes (${
          passes.filter((p) => p.status === "verified").length
        } verified, ${
          passes.filter((p) => p.status === "active" && !p.isExpired).length
        } active)`
      );

      return res.json({
        passes: passes,
      });
    } catch (e) {
      console.error("GET /buildings/:buildingId/visitor-passes error", e);
      return res.status(500).json({ error: "failed" });
    }
  }
);

// Verify pass (used by both admin and watchman)
router.post(
  "/buildings/:buildingId/verify-pass",
  authMiddleware,
  async (req, res) => {
    try {
      const buildingId = Number(req.params.buildingId);
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Pass code is required" });
      }

      // Check if user has permission to verify passes for this building
      if (!["admin", "watchman", "building_admin"].includes(req.user.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (Number(req.user.buildingId) !== buildingId) {
        return res.status(403).json({ error: "Not assigned to this building" });
      }

      // Find the pass by code and building
      const passQuery = await db.query(
        `SELECT 
          vp.*,
          u.name as resident_name,
          u.phone as resident_phone,
          a.unit_number
         FROM visitor_passes vp
         LEFT JOIN users u ON vp.created_by = u.id
         LEFT JOIN apartments a ON vp.apartment_id = a.id
         WHERE vp.building_id = $1 
           AND vp.code = $2`,
        [buildingId, code.toUpperCase()]
      );

      if (passQuery.rows.length === 0) {
        return res.json({
          valid: false,
          message: "Invalid pass code",
          pass: null,
        });
      }

      const pass = passQuery.rows[0];
      const now = new Date();
      const expiresAt = new Date(pass.expires_at);
      const timeRemaining = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60)
      );

      // Check if pass is expired
      if (timeRemaining <= 0) {
        // Update status to expired
        await db.query(
          "UPDATE visitor_passes SET status = 'expired' WHERE id = $1",
          [pass.id]
        );

        return res.json({
          valid: false,
          message: "Pass has expired",
          pass: {
            id: pass.id,
            code: pass.code,
            visitor_name: pass.visitor_name,
            resident_name: pass.resident_name,
            resident_phone: pass.resident_phone,
            unit_number: pass.unit_number,
            created_at: pass.created_at.toISOString(),
            expires_at: pass.expires_at.toISOString(),
            status: "expired",
            timeRemaining: 0,
          },
        });
      }

      // Check pass status
      if (pass.status === "cancelled") {
        return res.json({
          valid: false,
          message: "Pass has been cancelled",
          pass: {
            id: pass.id,
            code: pass.code,
            visitor_name: pass.visitor_name,
            resident_name: pass.resident_name,
            resident_phone: pass.resident_phone,
            unit_number: pass.unit_number,
            created_at: pass.created_at.toISOString(),
            expires_at: pass.expires_at.toISOString(),
            status: "cancelled",
            timeRemaining,
          },
        });
      }

      if (pass.status === "verified") {
        return res.json({
          valid: true,
          message: "Pass already verified",
          pass: {
            id: pass.id,
            code: pass.code,
            visitor_name: pass.visitor_name,
            resident_name: pass.resident_name,
            resident_phone: pass.resident_phone,
            unit_number: pass.unit_number,
            created_at: pass.created_at.toISOString(),
            expires_at: pass.expires_at.toISOString(),
            status: "verified",
            verified_at: pass.verified_at
              ? pass.verified_at.toISOString()
              : null,
            timeRemaining,
          },
        });
      }

      // Update pass status to verified
      const updateResult = await db.query(
        "UPDATE visitor_passes SET status = 'verified', verified_at = NOW(), verified_by = $1 WHERE id = $2 RETURNING *",
        [req.user.id, pass.id]
      );

      const updatedPass = updateResult.rows[0];

      // Log verification event
      await db.query(
        "INSERT INTO events (building_id, type, ref_id, message, created_by) VALUES ($1, $2, $3, $4, $5)",
        [
          buildingId,
          "visitor_verified",
          pass.id,
          `Visitor pass verified: ${pass.code}`,
          req.user.id,
        ]
      );

      return res.json({
        valid: true,
        message: "Pass verified successfully",
        pass: {
          id: updatedPass.id,
          code: updatedPass.code,
          visitor_name: updatedPass.visitor_name,
          resident_name: pass.resident_name,
          resident_phone: pass.resident_phone,
          unit_number: pass.unit_number,
          created_at: updatedPass.created_at.toISOString(),
          expires_at: updatedPass.expires_at.toISOString(),
          status: "verified",
          verified_at: updatedPass.verified_at
            ? updatedPass.verified_at.toISOString()
            : null,
          timeRemaining,
        },
      });
    } catch (e) {
      console.error("POST /buildings/:buildingId/verify-pass error", e);
      return res.status(500).json({ error: "failed to verify pass" });
    }
  }
);

// Get a specific pass
router.get("/visitor-passes/:id", authMiddleware, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT 
        vp.*,
        u.name as resident_name,
        u.phone as resident_phone,
        a.unit_number
       FROM visitor_passes vp
       LEFT JOIN users u ON vp.created_by = u.id
       LEFT JOIN apartments a ON vp.apartment_id = a.id
       WHERE vp.id = $1`,
      [req.params.id]
    );

    if (r.rows.length === 0)
      return res.status(404).json({ error: "not found" });

    const pass = r.rows[0];

    // Convert timestamps to ISO strings
    if (pass.expires_at instanceof Date) {
      pass.expires_at = pass.expires_at.toISOString();
    } else if (pass.expires_at) {
      pass.expires_at = new Date(pass.expires_at).toISOString();
    }

    if (pass.created_at instanceof Date) {
      pass.created_at = pass.created_at.toISOString();
    }

    if (pass.verified_at instanceof Date) {
      pass.verified_at = pass.verified_at.toISOString();
    }

    // Check if user has permission
    if (
      req.user.role === "resident" &&
      Number(req.user.buildingId) !== Number(pass.building_id)
    )
      return res.status(403).json({ error: "forbidden" });

    return res.json({
      pass: pass,
    });
  } catch (e) {
    console.error("GET /visitor-passes/:id error", e);
    return res.status(500).json({ error: "failed" });
  }
});

// Cancel pass
router.post("/visitor-passes/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const r0 = await db.query("SELECT * FROM visitor_passes WHERE id = $1", [
      req.params.id,
    ]);
    if (r0.rows.length === 0)
      return res.status(404).json({ error: "not found" });
    const pass = r0.rows[0];
    if (req.user.role === "resident" && pass.created_by !== req.user.id)
      return res.status(403).json({ error: "forbidden" });

    await db.query(
      "UPDATE visitor_passes SET status = 'cancelled' WHERE id = $1",
      [req.params.id]
    );

    return res.json({
      ok: true,
      message: "Pass cancelled successfully",
      id: req.params.id,
    });
  } catch (e) {
    console.error("POST /visitor-passes/:id/cancel error", e);
    return res.status(500).json({ error: "failed" });
  }
});

function generateShortCode(len = 6) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

module.exports = router;
