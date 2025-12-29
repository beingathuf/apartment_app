// backend/routes/notices.routes.js
const express = require("express");
const db = require("../db");
const { authMiddleware, requireRole } = require("../auth.middleware");

const router = express.Router();

// create notice (building_admin or super_admin)
router.post(
  "/buildings/:buildingId/notices",
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

      const {
        title,
        body,
        category = "general",
        priority = "normal",
        visible = true,
      } = req.body;
      if (!title) return res.status(400).json({ error: "title required" });

      // Validate category
      const validCategories = [
        "general",
        "important",
        "maintenance",
        "event",
        "payment",
        "security",
        "other",
      ];
      const validPriorities = ["low", "normal", "high", "urgent"];

      const noticeCategory = validCategories.includes(category.toLowerCase())
        ? category.toLowerCase()
        : "general";
      const noticePriority = validPriorities.includes(priority.toLowerCase())
        ? priority.toLowerCase()
        : "normal";

      const r = await db.query(
        `INSERT INTO notices (building_id, title, body, category, priority, visible, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, title, body, category, priority, visible, created_by, created_at`,
        [
          buildingId,
          title,
          body || null,
          noticeCategory,
          noticePriority,
          visible,
          req.user.id,
        ]
      );

      // Log the event
      await db.query(
        "INSERT INTO events (building_id, type, ref_id, message, created_by) VALUES ($1, $2, $3, $4, $5)",
        [
          buildingId,
          "notice_created",
          r.rows[0].id,
          `Notice created: ${title}`,
          req.user.id,
        ]
      );

      res.json({ notice: r.rows[0] });
    } catch (e) {
      console.error("POST /buildings/:buildingId/notices error", e);
      res.status(500).json({ error: "failed to create notice" });
    }
  }
);

// get notices for building (resident or admin)
router.get(
  "/buildings/:buildingId/notices",
  authMiddleware,
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;

      if (
        req.user.role === "resident" &&
        Number(req.user.buildingId) !== Number(buildingId)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      const { category, limit = 50, offset = 0 } = req.query;
      let query = `
      SELECT n.id, n.title, n.body, n.category, n.priority, n.visible, 
             n.created_at, n.created_by, u.name as created_by_name,
             EXTRACT(DAY FROM NOW() - n.created_at)::INTEGER as days_ago
      FROM notices n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.building_id = $1 AND n.visible = TRUE
    `;
      const params = [buildingId];

      if (category && category !== "all") {
        query += " AND n.category = $2";
        params.push(category);
      }

      query +=
        " ORDER BY n.created_at DESC LIMIT $" +
        (params.length + 1) +
        " OFFSET $" +
        (params.length + 2);
      params.push(parseInt(limit), parseInt(offset));

      const r = await db.query(query, params);

      // Get total count for pagination
      let countQuery =
        "SELECT COUNT(*) FROM notices WHERE building_id = $1 AND visible = TRUE";
      const countParams = [buildingId];

      if (category && category !== "all") {
        countQuery += " AND category = $2";
        countParams.push(category);
      }

      const countResult = await db.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      res.json({
        notices: r.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + r.rows.length < totalCount,
        },
      });
    } catch (e) {
      console.error("GET /buildings/:buildingId/notices error", e);
      res.status(500).json({ error: "failed to fetch notices" });
    }
  }
);

// get notice categories (for filter dropdown)
router.get(
  "/buildings/:buildingId/notice-categories",
  authMiddleware,
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;

      if (
        req.user.role === "resident" &&
        Number(req.user.buildingId) !== Number(buildingId)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      const r = await db.query(
        `SELECT DISTINCT category, COUNT(*) as count 
       FROM notices 
       WHERE building_id = $1 AND visible = TRUE 
       GROUP BY category 
       ORDER BY category`,
        [buildingId]
      );

      // Add default categories that might not have notices yet
      const allCategories = [
        "general",
        "important",
        "maintenance",
        "event",
        "payment",
        "security",
        "other",
      ];
      const existingCategories = r.rows.map((row) => row.category);
      const missingCategories = allCategories.filter(
        (cat) => !existingCategories.includes(cat)
      );

      const categories = [
        ...r.rows,
        ...missingCategories.map((cat) => ({ category: cat, count: 0 })),
      ].sort(
        (a, b) =>
          allCategories.indexOf(a.category) - allCategories.indexOf(b.category)
      );

      res.json({ categories });
    } catch (e) {
      console.error("GET /buildings/:buildingId/notice-categories error", e);
      res.status(500).json({ error: "failed to fetch categories" });
    }
  }
);

// get single notice
router.get("/notices/:id", authMiddleware, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT n.*, u.name as created_by_name, b.name as building_name
       FROM notices n
       LEFT JOIN users u ON n.created_by = u.id
       LEFT JOIN buildings b ON n.building_id = b.id
       WHERE n.id = $1`,
      [req.params.id]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ error: "notice not found" });
    }

    const notice = r.rows[0];

    // Check if user has access to this notice
    if (
      req.user.role === "resident" &&
      Number(req.user.buildingId) !== Number(notice.building_id)
    ) {
      return res.status(403).json({ error: "forbidden" });
    }

    res.json({ notice });
  } catch (e) {
    console.error("GET /notices/:id error", e);
    res.status(500).json({ error: "failed to fetch notice" });
  }
});

// update notice (admin only)
router.put(
  "/notices/:id",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const { title, body, category, priority, visible } = req.body;

      // First get the notice to check building ownership
      const existingNotice = await db.query(
        "SELECT * FROM notices WHERE id = $1",
        [req.params.id]
      );
      if (existingNotice.rows.length === 0) {
        return res.status(404).json({ error: "notice not found" });
      }

      const notice = existingNotice.rows[0];

      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(notice.building_id)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      // Build update query dynamically
      const updates = [];
      const params = [];
      let paramCounter = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCounter}`);
        params.push(title);
        paramCounter++;
      }
      if (body !== undefined) {
        updates.push(`body = $${paramCounter}`);
        params.push(body);
        paramCounter++;
      }
      if (category !== undefined) {
        updates.push(`category = $${paramCounter}`);
        params.push(category);
        paramCounter++;
      }
      if (priority !== undefined) {
        updates.push(`priority = $${paramCounter}`);
        params.push(priority);
        paramCounter++;
      }
      if (visible !== undefined) {
        updates.push(`visible = $${paramCounter}`);
        params.push(visible);
        paramCounter++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "no fields to update" });
      }

      updates.push(`updated_at = NOW()`);
      params.push(req.params.id); // ID goes last

      const query = `UPDATE notices SET ${updates.join(
        ", "
      )} WHERE id = $${paramCounter} RETURNING *`;
      const r = await db.query(query, params);

      // Log the event
      await db.query(
        "INSERT INTO events (building_id, type, ref_id, message, created_by) VALUES ($1, $2, $3, $4, $5)",
        [
          notice.building_id,
          "notice_updated",
          notice.id,
          `Notice updated: ${title || notice.title}`,
          req.user.id,
        ]
      );

      res.json({ notice: r.rows[0] });
    } catch (e) {
      console.error("PUT /notices/:id error", e);
      res.status(500).json({ error: "failed to update notice" });
    }
  }
);

// delete notice (admin only - soft delete)
router.delete(
  "/notices/:id",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      // First get the notice to check building ownership
      const existingNotice = await db.query(
        "SELECT * FROM notices WHERE id = $1",
        [req.params.id]
      );
      if (existingNotice.rows.length === 0) {
        return res.status(404).json({ error: "notice not found" });
      }

      const notice = existingNotice.rows[0];

      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(notice.building_id)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      // Soft delete by setting visible = false
      await db.query(
        "UPDATE notices SET visible = FALSE, updated_at = NOW() WHERE id = $1",
        [req.params.id]
      );

      // Log the event
      await db.query(
        "INSERT INTO events (building_id, type, ref_id, message, created_by) VALUES ($1, $2, $3, $4, $5)",
        [
          notice.building_id,
          "notice_deleted",
          notice.id,
          `Notice deleted: ${notice.title}`,
          req.user.id,
        ]
      );

      res.json({ ok: true, message: "Notice deleted successfully" });
    } catch (e) {
      console.error("DELETE /notices/:id error", e);
      res.status(500).json({ error: "failed to delete notice" });
    }
  }
);

module.exports = router;
