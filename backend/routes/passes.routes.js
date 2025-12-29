// backend/routes/passes.routes.js
const express = require("express");
const db = require("../db");
const { authMiddleware } = require("../auth.middleware");

const router = express.Router();

// create visitor pass - 30 MINUTE EXPIRY (FIXED)
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
          "active",
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

// list active passes (building) - Only non-expired passes
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

      // Get only active AND non-expired passes (expires_at > NOW() at UTC)
      const r = await db.query(
        `SELECT id, building_id, apartment_id, code, visitor_name, qr_data, created_by, created_at, expires_at, status
         FROM visitor_passes
         WHERE building_id = $1
           AND status = 'active'
           AND expires_at > NOW() AT TIME ZONE 'UTC'
         ORDER BY created_at DESC`,
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

        return convertedPass;
      });

      console.log(
        `GET /buildings/${buildingId}/visitor-passes: ${passes.length} active passes`
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

// get a specific pass
router.get("/visitor-passes/:id", authMiddleware, async (req, res) => {
  try {
    const r = await db.query(
      "SELECT * FROM visitor_passes WHERE id = $1 AND expires_at > NOW() AT TIME ZONE 'UTC'",
      [req.params.id]
    );
    if (r.rows.length === 0)
      return res.status(404).json({ error: "not found or expired" });

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

// cancel pass
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
