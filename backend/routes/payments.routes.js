// routes/payments.routes.js
const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth.middleware');

const router = express.Router();

router.get('/buildings/:buildingId/payments', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'resident' && Number(req.user.buildingId) !== Number(req.params.buildingId)) return res.status(403).json({ error: 'forbidden' });

    let q = 'SELECT * FROM payments WHERE building_id = $1';
    const params = [req.params.buildingId];
    if (req.user.role === 'resident') {
      q += ' AND apartment_id = $2';
      params.push(req.user.apartmentId);
    }
    const r = await db.query(q, params);
    res.json({ payments: r.rows });
  } catch (e) {
    console.error('GET /buildings/:buildingId/payments error', e);
    res.status(500).json({ error: 'failed' });
  }
});

// mark paid (simulate). In production verify via gateway webhook.
router.post('/payments/:id/pay', authMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const r0 = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (!r0.rows.length) return res.status(404).json({ error: 'not found' });

    const p = r0.rows[0];
    if (req.user.role === 'resident' && Number(req.user.apartmentId) !== Number(p.apartment_id)) return res.status(403).json({ error: 'forbidden' });

    // Use transaction: update payment status + insert event
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query("UPDATE payments SET status = 'paid' WHERE id = $1", [id]);
      await client.query(
        'INSERT INTO events (building_id,type,ref_id,message,created_by) VALUES ($1,$2,$3,$4,$5)',
        [p.building_id, 'payment_made', id, `Payment made: ${p.bill_name}`, req.user.id]
      );
      await client.query('COMMIT');
      res.json({ ok: true });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('POST /payments/:id/pay error', e);
    res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
