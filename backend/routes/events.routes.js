// routes/events.routes.js
const express = require('express');
const db = require('../db');
const { authMiddleware, requireRole } = require('../auth.middleware');

const router = express.Router();

router.get('/buildings/:buildingId/events', authMiddleware, requireRole('building_admin','super_admin'), async (req, res) => {
  try {
    const buildingId = req.params.buildingId;
    if (req.user.role === 'building_admin' && Number(req.user.buildingId) !== Number(buildingId)) return res.status(403).json({ error: 'forbidden' });

    const r = await db.query('SELECT * FROM events WHERE building_id = $1 ORDER BY created_at DESC', [buildingId]);
    res.json({ events: r.rows });
  } catch (e) {
    console.error('GET /buildings/:buildingId/events error', e);
    res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
