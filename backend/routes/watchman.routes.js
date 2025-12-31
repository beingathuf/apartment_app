// backend/routes/watchman.routes.js
const express = require("express");
const db = require("../db");
const { authMiddleware } = require("../auth.middleware");

const router = express.Router();

// Verify pass - used by watchman (same as admin endpoint)
router.post(
  "/watchman/buildings/:buildingId/verify-pass",
  authMiddleware,
  async (req, res) => {
    try {
      const buildingId = Number(req.params.buildingId);
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Pass code is required" });
      }

      // Check if user is a watchman
      if (req.user.role !== "watchman") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if watchman is assigned to this building
      if (Number(req.user.buildingId) !== buildingId) {
        return res.status(403).json({ error: "Not assigned to this building" });
      }

      // Use the same verification logic as admin
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
      const timeRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));

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
            code: pass.code,
            visitor_name: pass.visitor_name,
            resident_name: pass.resident_name,
            resident_phone: pass.resident_phone,
            unit_number: pass.unit_number,
            created_at: pass.created_at.toISOString(),
            expires_at: pass.expires_at.toISOString(),
            timeRemaining: 0,
          },
        });
      }

      // Check pass status
      if (pass.status === 'cancelled') {
        return res.json({
          valid: false,
          message: "Pass has been cancelled",
          pass: {
            code: pass.code,
            visitor_name: pass.visitor_name,
            resident_name: pass.resident_name,
            resident_phone: pass.resident_phone,
            unit_number: pass.unit_number,
            created_at: pass.created_at.toISOString(),
            expires_at: pass.expires_at.toISOString(),
            timeRemaining,
          },
        });
      }

      if (pass.status === 'verified') {
        return res.json({
          valid: true,
          message: "Pass already verified",
          pass: {
            code: pass.code,
            visitor_name: pass.visitor_name,
            resident_name: pass.resident_name,
            resident_phone: pass.resident_phone,
            unit_number: pass.unit_number,
            created_at: pass.created_at.toISOString(),
            expires_at: pass.expires_at.toISOString(),
            timeRemaining,
          },
        });
      }

      // Update pass status to verified
      await db.query(
        "UPDATE visitor_passes SET status = 'verified', verified_at = NOW(), verified_by = $1 WHERE id = $2",
        [req.user.id, pass.id]
      );

      // Log verification event
      await db.query(
        "INSERT INTO events (building_id, type, ref_id, message, created_by) VALUES ($1, $2, $3, $4, $5)",
        [
          buildingId,
          "visitor_verified",
          pass.id,
          `Visitor pass verified by watchman: ${pass.code}`,
          req.user.id,
        ]
      );

      return res.json({
        valid: true,
        message: "Pass verified successfully",
        pass: {
          code: pass.code,
          visitor_name: pass.visitor_name,
          resident_name: pass.resident_name,
          resident_phone: pass.resident_phone,
          unit_number: pass.unit_number,
          created_at: pass.created_at.toISOString(),
          expires_at: pass.expires_at.toISOString(),
          timeRemaining,
        },
      });

    } catch (e) {
      console.error("POST /watchman/buildings/:buildingId/verify-pass error", e);
      return res.status(500).json({ error: "failed to verify pass" });
    }
  }
);

module.exports = router;