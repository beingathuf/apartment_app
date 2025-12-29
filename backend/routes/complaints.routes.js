// routes/complaints.routes.js
const express = require("express");
const db = require("../db");
const { authMiddleware } = require("../auth.middleware");

const router = express.Router();

// Create new complaint
router.post(
  "/buildings/:buildingId/complaints",
  authMiddleware,
  async (req, res) => {
    const buildingId = req.params.buildingId;
    try {
      if (Number(req.user.buildingId) !== Number(buildingId)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { type, description } = req.body;

      if (!type || !description) {
        return res
          .status(400)
          .json({ error: "Type and description are required" });
      }

      const client = await db.getClient();
      try {
        await client.query("BEGIN");

        const insertComplaint = `
        INSERT INTO complaints (building_id, apartment_id, type, description, created_by, status) 
        VALUES ($1, $2, $3, $4, $5, 'submitted') 
        RETURNING *
      `;

        const complaintResult = await client.query(insertComplaint, [
          buildingId,
          req.user.apartmentId,
          type,
          description,
          req.user.id,
        ]);

        const complaintId = complaintResult.rows[0].id;

        // Create event for admin notification
        const insertEvent = `
        INSERT INTO events (building_id, type, ref_id, message, created_by) 
        VALUES ($1, 'complaint', $2, $3, $4)
      `;

        await client.query(insertEvent, [
          buildingId,
          complaintId,
          `New complaint submitted: ${type}`,
          req.user.id,
        ]);

        await client.query("COMMIT");

        res.json({
          success: true,
          complaint: complaintResult.rows[0],
          message: "Complaint submitted successfully",
        });
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("POST /buildings/:buildingId/complaints error", e);
      res.status(500).json({ error: "Failed to submit complaint" });
    }
  }
);

// Get complaints for a building (admin or resident)
router.get(
  "/buildings/:buildingId/complaints",
  authMiddleware,
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;

      console.log("User accessing complaints:", {
        userId: req.user.id,
        role: req.user.role,
        userBuildingId: req.user.buildingId,
        requestedBuildingId: buildingId,
        match: Number(req.user.buildingId) === Number(buildingId),
      });

      // RESIDENT: Check if building matches
      if (
        req.user.role === "resident" &&
        Number(req.user.buildingId) !== Number(buildingId)
      ) {
        console.log("Resident trying to access wrong building");
        return res.status(403).json({ error: "Forbidden" });
      }

      // ADMIN: Check if building matches (can only access own building)
      if (
        (req.user.role === "admin" || req.user.role === "building_admin") && // FIX: Add building_admin here
        Number(req.user.buildingId) !== Number(buildingId)
      ) {
        console.log("Admin trying to access wrong building");
        return res.status(403).json({
          error: "Forbidden - Can only access complaints in your own building",
        });
      }

      // SUPER_ADMIN: Can access any building - no check needed

      let query = "";
      let params = [];

      // FIX: Check for building_admin role too
      if (
        req.user.role === "admin" ||
        req.user.role === "super_admin" ||
        req.user.role === "building_admin"
      ) {
        // Admin sees all complaints in the building
        query = `
        SELECT 
          c.*,
          a.unit_number,
          u.name as resident_name,
          u.phone as resident_phone
        FROM complaints c
        LEFT JOIN apartments a ON c.apartment_id = a.id
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.building_id = $1
        ORDER BY c.created_at DESC
      `;
        params = [buildingId];
      } else {
        // Resident sees only their own complaints
        query = `
        SELECT 
          c.*,
          a.unit_number
        FROM complaints c
        LEFT JOIN apartments a ON c.apartment_id = a.id
        WHERE c.building_id = $1 AND c.created_by = $2
        ORDER BY c.created_at DESC
      `;
        params = [buildingId, req.user.id];
      }

      console.log("Executing query:", query, "with params:", params);
      console.log("User role for query:", req.user.role);

      const result = await db.query(query, params);

      console.log("Found complaints:", result.rows.length);

      res.json({
        success: true,
        complaints: result.rows,
      });
    } catch (e) {
      console.error("GET /buildings/:buildingId/complaints error", e);
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  }
);
// Update complaint status (admin only)
router.patch(
  "/complaints/:complaintId/status",
  authMiddleware,
  async (req, res) => {
    try {
      // Only admin can update complaint status
      // FIX: Add building_admin role
      if (
        req.user.role !== "admin" &&
        req.user.role !== "super_admin" &&
        req.user.role !== "building_admin"
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { complaintId } = req.params;
      const { status, admin_response } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Valid statuses
      const validStatuses = [
        "submitted",
        "in_progress",
        "resolved",
        "rejected",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const query = `
      UPDATE complaints 
      SET 
        status = $1,
        admin_response = $2,
        updated_at = CURRENT_TIMESTAMP,
        resolved_by = $3,
        resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
      WHERE id = $4
      RETURNING *
    `;

      const result = await db.query(query, [
        status,
        admin_response || null,
        req.user.id,
        complaintId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      // Create event for status update
      const insertEvent = `
      INSERT INTO events (building_id, type, ref_id, message, created_by) 
      VALUES ($1, 'complaint_update', $2, $3, $4)
    `;

      await db.query(insertEvent, [
        result.rows[0].building_id,
        complaintId,
        `Complaint status updated to: ${status}`,
        req.user.id,
      ]);

      res.json({
        success: true,
        complaint: result.rows[0],
        message: "Complaint status updated successfully",
      });
    } catch (e) {
      console.error("PATCH /complaints/:complaintId/status error", e);
      res.status(500).json({ error: "Failed to update complaint status" });
    }
  }
);

// Delete complaint (admin or owner)
router.delete("/complaints/:complaintId", authMiddleware, async (req, res) => {
  try {
    const { complaintId } = req.params;

    // Check if complaint exists
    const complaintCheck = await db.query(
      "SELECT * FROM complaints WHERE id = $1",
      [complaintId]
    );

    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const complaint = complaintCheck.rows[0];

    // Check permissions
    const canDelete =
      req.user.role === "admin" ||
      req.user.role === "super_admin" ||
      complaint.created_by === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.query("DELETE FROM complaints WHERE id = $1", [complaintId]);

    res.json({
      success: true,
      message: "Complaint deleted successfully",
    });
  } catch (e) {
    console.error("DELETE /complaints/:complaintId error", e);
    res.status(500).json({ error: "Failed to delete complaint" });
  }
});

// Get complaint statistics for dashboard
// routes/complaints.routes.js - UPDATED stats endpoint
router.get(
  "/buildings/:buildingId/complaints/stats",
  authMiddleware,
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;

      // Only admin and super_admin can see stats
      // FIX: Add building_admin role
      if (
        req.user.role !== "admin" &&
        req.user.role !== "super_admin" &&
        req.user.role !== "building_admin"
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // ADMIN: Check if building matches
      // FIX: Check for building_admin role too
      if (
        (req.user.role === "admin" || req.user.role === "building_admin") &&
        Number(req.user.buildingId) !== Number(buildingId)
      ) {
        return res
          .status(403)
          .json({ error: "Forbidden - Can only access own building" });
      }

      // SUPER_ADMIN: Can access any building, no check needed

      const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today
      FROM complaints 
      WHERE building_id = $1
    `;

      const result = await db.query(query, [buildingId]);

      // Handle case where no complaints exist
      const stats = result.rows[0] || {
        total: 0,
        submitted: 0,
        in_progress: 0,
        resolved: 0,
        rejected: 0,
        today: 0,
      };

      res.json({
        success: true,
        stats: stats,
      });
    } catch (e) {
      console.error("GET /buildings/:buildingId/complaints/stats error", e);
      res.status(500).json({ error: "Failed to fetch complaint statistics" });
    }
  }
);

module.exports = router;
