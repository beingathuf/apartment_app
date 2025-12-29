// backend/routes/admin.routes.js (Remove the notice routes from here)
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const { authMiddleware, requireRole } = require("../auth.middleware");

const router = express.Router();

// create building (super_admin only)
router.post(
  "/buildings",
  authMiddleware,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const { name, address } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });

      const r = await db.query(
        "INSERT INTO buildings (name,address) VALUES ($1,$2) RETURNING *",
        [name, address || null]
      );
      res.json({ building: r.rows[0] });
    } catch (e) {
      console.error("POST /admin/buildings error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// create building-admin for a building (super_admin)
router.post(
  "/buildings/:buildingId/admins",
  authMiddleware,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      const { name, phone, password, email } = req.body;
      if (!phone || !password)
        return res.status(400).json({ error: "phone & password required" });

      // Check if phone already exists
      const existingUser = await db.query(
        "SELECT id FROM users WHERE phone = $1",
        [phone]
      );
      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Phone number already registered" });
      }

      const hash = await bcrypt.hash(password, 10);
      const r = await db.query(
        "INSERT INTO users (phone,name,email,password_hash,role,building_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,phone,name,role,building_id",
        [phone, name || null, email || null, hash, "building_admin", buildingId]
      );
      res.json({ admin: r.rows[0] });
    } catch (e) {
      console.error("POST /admin/buildings/:buildingId/admins error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// create apartments (building_admin or super_admin) with duplicate prevention
router.post(
  "/buildings/:buildingId/apartments",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(buildingId)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }
      const { unit_number, owner_name } = req.body;
      if (!unit_number)
        return res.status(400).json({ error: "unit_number required" });

      // Check for duplicate apartment unit in same building
      const existingApartment = await db.query(
        "SELECT id FROM apartments WHERE building_id = $1 AND LOWER(unit_number) = LOWER($2)",
        [buildingId, unit_number.trim()]
      );
      if (existingApartment.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Apartment unit already exists in this building" });
      }

      const r = await db.query(
        "INSERT INTO apartments (building_id, unit_number, owner_name) VALUES ($1,$2,$3) RETURNING *",
        [buildingId, unit_number.trim(), owner_name || null]
      );
      res.json({ apartment: r.rows[0] });
    } catch (e) {
      console.error("POST /admin/buildings/:buildingId/apartments error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// create resident under building (building_admin) with duplicate prevention
router.post(
  "/buildings/:buildingId/users",
  authMiddleware,
  requireRole("building_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      if (Number(req.user.buildingId) !== Number(buildingId))
        return res.status(403).json({ error: "forbidden" });

      const { name, phone, password, email, apartment_id } = req.body;
      if (!phone || !password)
        return res.status(400).json({ error: "phone & password required" });

      // Check if phone already exists
      const existingUser = await db.query(
        "SELECT id FROM users WHERE phone = $1",
        [phone]
      );
      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Phone number already registered" });
      }

      // If apartment_id provided, check if resident already exists for that apartment
      if (apartment_id) {
        const existingResident = await db.query(
          "SELECT id FROM users WHERE building_id = $1 AND apartment_id = $2 AND role = $3",
          [buildingId, apartment_id, "resident"]
        );
        if (existingResident.rows.length > 0) {
          return res
            .status(400)
            .json({ error: "Apartment already has a resident assigned" });
        }
      }

      const hash = await bcrypt.hash(password, 10);
      const r = await db.query(
        "INSERT INTO users (phone,name,email,password_hash,role,building_id,apartment_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,phone,name,role,building_id,apartment_id",
        [
          phone,
          name || null,
          email || null,
          hash,
          "resident",
          buildingId,
          apartment_id || null,
        ]
      );
      res.json({ user: r.rows[0] });
    } catch (e) {
      console.error("POST /admin/buildings/:buildingId/users error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// list apartments
router.get(
  "/buildings/:buildingId/apartments",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(buildingId)
      )
        return res.status(403).json({ error: "forbidden" });

      const r = await db.query(
        "SELECT * FROM apartments WHERE building_id = $1 ORDER BY id",
        [buildingId]
      );
      res.json({ apartments: r.rows });
    } catch (e) {
      console.error("GET /admin/buildings/:buildingId/apartments error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// list users in building
router.get(
  "/buildings/:buildingId/users",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(buildingId)
      )
        return res.status(403).json({ error: "forbidden" });

      const r = await db.query(
        `SELECT u.id, u.phone, u.name, u.role, u.apartment_id, u.created_at, a.unit_number
       FROM users u
       LEFT JOIN apartments a ON u.apartment_id = a.id
       WHERE u.building_id = $1 
       ORDER BY u.role, u.id`,
        [buildingId]
      );
      res.json({ users: r.rows });
    } catch (e) {
      console.error("GET /admin/buildings/:buildingId/users error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// delete a user
router.delete(
  "/buildings/:buildingId/users/:userId",
  authMiddleware,
  requireRole("building_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      if (Number(req.user.buildingId) !== Number(buildingId))
        return res.status(403).json({ error: "forbidden" });

      await db.query("DELETE FROM users WHERE id = $1 AND building_id = $2", [
        req.params.userId,
        buildingId,
      ]);
      res.json({ ok: true });
    } catch (e) {
      console.error(
        "DELETE /admin/buildings/:buildingId/users/:userId error",
        e
      );
      res.status(500).json({ error: "failed" });
    }
  }
);

// delete an apartment (only if no residents assigned)
router.delete(
  "/buildings/:buildingId/apartments/:apartmentId",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      const apartmentId = req.params.apartmentId;

      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(buildingId)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      // Check if any residents are assigned to this apartment
      const residentCheck = await db.query(
        "SELECT id FROM users WHERE apartment_id = $1 AND building_id = $2 LIMIT 1",
        [apartmentId, buildingId]
      );

      if (residentCheck.rows.length > 0) {
        return res.status(400).json({
          error:
            "Cannot delete apartment: Residents are assigned to it. Remove residents first.",
        });
      }

      await db.query(
        "DELETE FROM apartments WHERE id = $1 AND building_id = $2",
        [apartmentId, buildingId]
      );
      res.json({ ok: true });
    } catch (e) {
      console.error(
        "DELETE /admin/buildings/:buildingId/apartments/:apartmentId error",
        e
      );
      res.status(500).json({ error: "failed" });
    }
  }
);

// VERIFY VISITOR PASS by code or QR (building_admin)
router.post(
  "/buildings/:buildingId/verify-pass",
  authMiddleware,
  requireRole("building_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      if (Number(req.user.buildingId) !== Number(buildingId))
        return res.status(403).json({ error: "forbidden" });

      const { code, qrData } = req.body;

      if (!code && !qrData) {
        return res
          .status(400)
          .json({ error: "Either code or qrData is required" });
      }

      let pass;
      if (code) {
        // Verify by code
        const result = await db.query(
          `SELECT vp.*, u.name as created_by_name, u.phone as created_by_phone, 
                a.unit_number, b.name as building_name
         FROM visitor_passes vp
         LEFT JOIN users u ON vp.created_by = u.id
         LEFT JOIN apartments a ON vp.apartment_id = a.id
         LEFT JOIN buildings b ON vp.building_id = b.id
         WHERE vp.code = $1 AND vp.building_id = $2
         LIMIT 1`,
          [code.toUpperCase().trim(), buildingId]
        );
        pass = result.rows[0];
      } else if (qrData) {
        // Verify by QR data (simplified - you might need to parse QR content)
        // This assumes qrData contains the pass code
        try {
          const qrContent = JSON.parse(qrData);
          const passCode = qrContent.code;

          const result = await db.query(
            `SELECT vp.*, u.name as created_by_name, u.phone as created_by_phone, 
                  a.unit_number, b.name as building_name
           FROM visitor_passes vp
           LEFT JOIN users u ON vp.created_by = u.id
           LEFT JOIN apartments a ON vp.apartment_id = a.id
           LEFT JOIN buildings b ON vp.building_id = b.id
           WHERE vp.code = $1 AND vp.building_id = $2
           LIMIT 1`,
            [passCode, buildingId]
          );
          pass = result.rows[0];
        } catch (parseError) {
          console.error("QR parse error:", parseError);
          return res.status(400).json({ error: "Invalid QR data format" });
        }
      }

      if (!pass) {
        return res.status(404).json({
          error: "Pass not found or does not belong to this building",
          valid: false,
        });
      }

      // Check if pass is expired
      const now = new Date();
      const expiresAt = new Date(pass.expires_at);
      const isExpired = expiresAt <= now;
      const isActive = pass.status === "active" && !isExpired;

      // Format dates for display
      const formattedPass = {
        ...pass,
        created_at: pass.created_at
          ? new Date(pass.created_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              dateStyle: "medium",
              timeStyle: "short",
            })
          : null,
        expires_at: pass.expires_at
          ? new Date(pass.expires_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              dateStyle: "medium",
              timeStyle: "short",
            })
          : null,
        isExpired,
        isActive,
        timeRemaining: isActive
          ? Math.max(0, Math.floor((expiresAt - now) / 60000))
          : 0, // minutes
      };

      // Log verification event
      await db.query(
        "INSERT INTO events (building_id, type, ref_id, message, created_by) VALUES ($1, $2, $3, $4, $5)",
        [
          buildingId,
          "pass_verification",
          pass.id,
          `Visitor pass ${pass.code} verified by admin`,
          req.user.id,
        ]
      );

      res.json({
        pass: formattedPass,
        valid: isActive,
        message: isActive ? "Valid visitor pass" : "Invalid or expired pass",
      });
    } catch (e) {
      console.error("POST /admin/buildings/:buildingId/verify-pass error", e);
      res.status(500).json({ error: "verification failed" });
    }
  }
);

// Get active passes for building (admin view)
router.get(
  "/buildings/:buildingId/active-passes",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(buildingId)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      const r = await db.query(
        `SELECT vp.*, u.name as resident_name, u.phone as resident_phone, 
              a.unit_number, b.name as building_name
       FROM visitor_passes vp
       LEFT JOIN users u ON vp.created_by = u.id
       LEFT JOIN apartments a ON vp.apartment_id = a.id
       LEFT JOIN buildings b ON vp.building_id = b.id
       WHERE vp.building_id = $1 
         AND vp.status = 'active'
         AND vp.expires_at > NOW() AT TIME ZONE 'UTC'
       ORDER BY vp.expires_at ASC`,
        [buildingId]
      );

      // Format dates
      const passes = r.rows.map((pass) => ({
        ...pass,
        created_at: pass.created_at
          ? new Date(pass.created_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              dateStyle: "medium",
              timeStyle: "short",
            })
          : null,
        expires_at: pass.expires_at
          ? new Date(pass.expires_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              dateStyle: "medium",
              timeStyle: "short",
            })
          : null,
      }));

      res.json({ passes });
    } catch (e) {
      console.error("GET /admin/buildings/:buildingId/active-passes error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// Add to backend/routes/admin.routes.js

// Get all buildings (super_admin only)
router.get(
  "/buildings",
  authMiddleware,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const r = await db.query(
        "SELECT * FROM buildings ORDER BY created_at DESC"
      );
      res.json({ buildings: r.rows });
    } catch (e) {
      console.error("GET /admin/buildings error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// Get building admins for a specific building
router.get(
  "/buildings/:buildingId/admins",
  authMiddleware,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;

      const r = await db.query(
        `SELECT u.id, u.phone, u.name, u.email, u.role, u.created_at, u.last_login
         FROM users u
         WHERE u.building_id = $1 AND u.role = 'building_admin'
         ORDER BY u.created_at DESC`,
        [buildingId]
      );
      res.json({ admins: r.rows });
    } catch (e) {
      console.error("GET /admin/buildings/:buildingId/admins error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// Delete a building admin
router.delete(
  "/users/:userId",
  authMiddleware,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const userId = req.params.userId;

      // Check if user exists and is a building_admin
      const user = await db.query(
        "SELECT id, role, building_id FROM users WHERE id = $1",
        [userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userRole = user.rows[0].role;
      const userBuildingId = user.rows[0].building_id;

      // Only allow deleting building_admin users
      if (userRole !== "building_admin") {
        return res.status(400).json({
          error:
            "Can only delete building admins. Residents must be deleted through building admin panel.",
        });
      }

      // If super_admin is deleting, allow it without building check
      if (req.user.role === "super_admin") {
        await db.query("DELETE FROM users WHERE id = $1", [userId]);
        console.log(
          `Super admin ${req.user.id} deleted building admin ${userId}`
        );
        return res.json({
          ok: true,
          message: "Building admin deleted successfully",
        });
      }

      // For building_admin, ensure they're deleting from their own building
      if (req.user.role === "building_admin") {
        if (Number(req.user.buildingId) !== Number(userBuildingId)) {
          return res
            .status(403)
            .json({ error: "Cannot delete admin from another building" });
        }
        await db.query("DELETE FROM users WHERE id = $1 AND building_id = $2", [
          userId,
          req.user.buildingId,
        ]);
        return res.json({ ok: true });
      }

      res.status(403).json({ error: "Forbidden" });
    } catch (e) {
      console.error("DELETE /admin/users/:userId error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// Delete a building (and cascade delete related data)
router.delete(
  "/buildings/:buildingId",
  authMiddleware,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;

      // Check if building exists
      const building = await db.query("SELECT * FROM buildings WHERE id = $1", [
        buildingId,
      ]);

      if (building.rows.length === 0) {
        return res.status(404).json({ error: "Building not found" });
      }

      // Check if building has any users
      const users = await db.query(
        "SELECT id, name, role FROM users WHERE building_id = $1",
        [buildingId]
      );

      if (users.rows.length > 0) {
        const admins = users.rows.filter((u) => u.role === "building_admin");
        const residents = users.rows.filter((u) => u.role === "resident");

        return res.status(400).json({
          error: "Cannot delete building with active users",
          details: {
            totalUsers: users.rows.length,
            admins: admins.length,
            residents: residents.length,
            message:
              "Delete all users from this building first, then try again.",
          },
        });
      }

      // Check if building has any apartments
      const apartments = await db.query(
        "SELECT id FROM apartments WHERE building_id = $1",
        [buildingId]
      );

      if (apartments.rows.length > 0) {
        return res.status(400).json({
          error: "Cannot delete building with apartments",
          details: {
            apartmentCount: apartments.rows.length,
            message:
              "Delete all apartments from this building first, then try again.",
          },
        });
      }

      // Start a transaction to delete related data safely
      await db.query("BEGIN");

      try {
        // Delete visitor passes
        await db.query("DELETE FROM visitor_passes WHERE building_id = $1", [
          buildingId,
        ]);

        // Delete payments
        await db.query("DELETE FROM payments WHERE building_id = $1", [
          buildingId,
        ]);

        // Delete notices
        await db.query("DELETE FROM notices WHERE building_id = $1", [
          buildingId,
        ]);

        // Delete complaints
        await db.query("DELETE FROM complaints WHERE building_id = $1", [
          buildingId,
        ]);

        // Delete events
        await db.query("DELETE FROM events WHERE building_id = $1", [
          buildingId,
        ]);

        // Delete the building
        await db.query("DELETE FROM buildings WHERE id = $1", [buildingId]);

        await db.query("COMMIT");

        console.log(
          `Super admin ${req.user.id} deleted building ${buildingId}`
        );
        res.json({
          ok: true,
          message: "Building deleted successfully",
          deletedBuilding: building.rows[0],
        });
      } catch (e) {
        await db.query("ROLLBACK");
        throw e;
      }
    } catch (e) {
      console.error("DELETE /admin/buildings/:buildingId error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// Add this route after the existing create resident route

// create watchman under building (building_admin)
router.post(
  "/buildings/:buildingId/watchmen",
  authMiddleware,
  requireRole("building_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      if (Number(req.user.buildingId) !== Number(buildingId))
        return res.status(403).json({ error: "forbidden" });

      const { name, phone, password } = req.body;
      if (!phone || !password)
        return res.status(400).json({ error: "phone & password required" });

      // Check if phone already exists
      const existingUser = await db.query(
        "SELECT id FROM users WHERE phone = $1",
        [phone]
      );
      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Phone number already registered" });
      }

      const hash = await bcrypt.hash(password, 10);
      const r = await db.query(
        "INSERT INTO users (phone, name, password_hash, role, building_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, phone, name, role, building_id",
        [phone, name || null, hash, "watchman", buildingId]
      );
      res.json({ watchman: r.rows[0] });
    } catch (e) {
      console.error("POST /admin/buildings/:buildingId/watchmen error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// Add this route to get watchmen for a building
router.get(
  "/buildings/:buildingId/watchmen",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(buildingId)
      )
        return res.status(403).json({ error: "forbidden" });

      const r = await db.query(
        `SELECT u.id, u.phone, u.name, u.role, u.created_at, u.last_login,
                b.name as building_name
         FROM users u
         LEFT JOIN buildings b ON u.building_id = b.id
         WHERE u.building_id = $1 AND u.role = 'watchman'
         ORDER BY u.created_at DESC`,
        [buildingId]
      );
      res.json({ watchmen: r.rows });
    } catch (e) {
      console.error("GET /admin/buildings/:buildingId/watchmen error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// Add this route to delete a watchman
router.delete(
  "/buildings/:buildingId/watchmen/:watchmanId",
  authMiddleware,
  requireRole("building_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      const watchmanId = req.params.watchmanId;

      if (Number(req.user.buildingId) !== Number(buildingId))
        return res.status(403).json({ error: "forbidden" });

      await db.query(
        "DELETE FROM users WHERE id = $1 AND building_id = $2 AND role = 'watchman'",
        [watchmanId, buildingId]
      );
      res.json({ ok: true });
    } catch (e) {
      console.error(
        "DELETE /admin/buildings/:buildingId/watchmen/:watchmanId error",
        e
      );
      res.status(500).json({ error: "failed" });
    }
  }
);

module.exports = router;
