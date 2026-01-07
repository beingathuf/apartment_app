// routes/payments.routes.js - FIXED VERSION
const express = require("express");
const db = require("../db");
const { authMiddleware } = require("../auth.middleware");

const router = express.Router();

// GET all payments for a building
router.get(
  "/buildings/:buildingId/payments",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role === "resident" &&
        Number(req.user.buildingId) !== Number(req.params.buildingId)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      let q = `
      SELECT p.*, 
             a.unit_number,
             am.monthly_amount,
             ep.bill_name as extra_bill_name,
             ep.description as extra_description,
             CASE 
               WHEN p.bill_type = 'maintenance' THEN CONCAT('Maintenance - ', TO_CHAR(p.due_date, 'Mon YYYY'))
               WHEN p.bill_type = 'extra' THEN ep.bill_name
               ELSE p.bill_name
             END as display_name
      FROM payments p
      LEFT JOIN apartments a ON p.apartment_id = a.id
      LEFT JOIN apartment_maintenance am ON p.apartment_maintenance_id = am.id
      LEFT JOIN extra_payments ep ON p.extra_payment_id = ep.id
      WHERE p.building_id = $1
    `;

      const params = [req.params.buildingId];

      if (req.user.role === "resident") {
        q += " AND p.apartment_id = $2";
        params.push(req.user.apartmentId);
      }

      q += " ORDER BY p.due_date DESC, p.created_at DESC";

      const r = await db.query(q, params);
      res.json({ payments: r.rows });
    } catch (e) {
      console.error("GET /buildings/:buildingId/payments error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// GET apartment maintenance settings
router.get(
  "/admin/buildings/:buildingId/apartments/:apartmentId/maintenance",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "building_admin") {
        return res.status(403).json({ error: "forbidden" });
      }

      const q = `
      SELECT * FROM apartment_maintenance 
      WHERE building_id = $1 AND apartment_id = $2 
      ORDER BY effective_from DESC
    `;
      const r = await db.query(q, [
        req.params.buildingId,
        req.params.apartmentId,
      ]);
      res.json({ maintenance: r.rows });
    } catch (e) {
      console.error("GET maintenance error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// SET apartment maintenance amount
router.post(
  "/admin/buildings/:buildingId/apartments/:apartmentId/maintenance",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "building_admin") {
        return res.status(403).json({ error: "forbidden" });
      }

      const { monthly_amount, effective_from } = req.body;

      if (!monthly_amount || isNaN(monthly_amount)) {
        return res
          .status(400)
          .json({ error: "Monthly amount is required and must be a number" });
      }

      // End previous maintenance record if exists
      await db.query(
        `UPDATE apartment_maintenance 
       SET effective_to = $1, is_active = false 
       WHERE apartment_id = $2 AND is_active = true`,
        [
          effective_from || new Date().toISOString().split("T")[0],
          req.params.apartmentId,
        ]
      );

      // Create new maintenance record
      const q = `
      INSERT INTO apartment_maintenance 
      (building_id, apartment_id, monthly_amount, effective_from, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

      const params = [
        req.params.buildingId,
        req.params.apartmentId,
        parseFloat(monthly_amount),
        effective_from || new Date().toISOString().split("T")[0],
        req.user.id,
      ];

      const r = await db.query(q, params);
      res.json({ maintenance: r.rows[0] });
    } catch (e) {
      console.error("POST maintenance error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// GET extra payments for a building (ADMIN only)
router.get(
  "/admin/buildings/:buildingId/extra-payments",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "building_admin") {
        return res.status(403).json({ error: "forbidden" });
      }

      const q = `
      SELECT ep.*, a.unit_number as apartment_unit
      FROM extra_payments ep
      LEFT JOIN apartments a ON ep.apartment_id = a.id
      WHERE ep.building_id = $1
      ORDER BY ep.due_date DESC, ep.created_at DESC
    `;

      const r = await db.query(q, [req.params.buildingId]);
      res.json({ extra_payments: r.rows });
    } catch (e) {
      console.error("GET /admin/buildings/:buildingId/extra-payments error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// CREATE extra payment (for specific apartment or all apartments)
router.post(
  "/admin/buildings/:buildingId/extra-payments",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "building_admin") {
        return res.status(403).json({ error: "forbidden" });
      }

      const {
        bill_name,
        description,
        amount,
        due_date,
        apartment_id,
        apply_to_all,
      } = req.body;

      if (!bill_name || !amount || !due_date) {
        return res
          .status(400)
          .json({ error: "Bill name, amount, and due date are required" });
      }

      const client = await db.getClient();
      try {
        await client.query("BEGIN");

        // Create extra payment record
        const q1 = `
        INSERT INTO extra_payments 
        (building_id, apartment_id, bill_name, description, amount, due_date, applied_to_all, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

        const params1 = [
          req.params.buildingId,
          apartment_id || null,
          bill_name,
          description || null,
          parseFloat(amount),
          due_date,
          !!apply_to_all,
          req.user.id,
        ];

        const extraRes = await client.query(q1, params1);
        const extraPayment = extraRes.rows[0];

        // Create individual payment records
        if (apply_to_all) {
          // Get all apartments in the building
          const apartmentsRes = await client.query(
            "SELECT id FROM apartments WHERE building_id = $1",
            [req.params.buildingId]
          );

          for (const apartment of apartmentsRes.rows) {
            await client.query(
              `INSERT INTO payments 
             (building_id, apartment_id, bill_name, amount, currency, due_date, bill_type, extra_payment_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                req.params.buildingId,
                apartment.id,
                bill_name,
                parseFloat(amount),
                "INR",
                due_date,
                "extra",
                extraPayment.id,
                req.user.id,
              ]
            );
          }
        } else if (apartment_id) {
          // Create payment for specific apartment
          await client.query(
            `INSERT INTO payments 
           (building_id, apartment_id, bill_name, amount, currency, due_date, bill_type, extra_payment_id, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              req.params.buildingId,
              apartment_id,
              bill_name,
              parseFloat(amount),
              "INR",
              due_date,
              "extra",
              extraPayment.id,
              req.user.id,
            ]
          );
        }

        await client.query("COMMIT");
        res.json({ extra_payment: extraPayment });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("POST extra payments error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// GENERATE monthly maintenance payments (cron job function)
async function generateMonthlyMaintenance(buildingId) {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // Get all active maintenance records
    const maintenanceRes = await client.query(
      `SELECT am.*, a.unit_number 
       FROM apartment_maintenance am
       JOIN apartments a ON am.apartment_id = a.id
       WHERE am.building_id = $1 AND am.is_active = true
         AND (am.effective_to IS NULL OR am.effective_to >= CURRENT_DATE)`,
      [buildingId]
    );

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const firstDayOfMonth = `${currentMonth}-01`;

    for (const maintenance of maintenanceRes.rows) {
      // Check if payment already exists for this month
      const existingRes = await client.query(
        `SELECT 1 FROM payments 
         WHERE building_id = $1 
           AND apartment_id = $2 
           AND apartment_maintenance_id = $3
           AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', $4::date)`,
        [
          maintenance.building_id,
          maintenance.apartment_id,
          maintenance.id,
          firstDayOfMonth,
        ]
      );

      if (existingRes.rows.length === 0) {
        // Create new payment
        await client.query(
          `INSERT INTO payments 
           (building_id, apartment_id, bill_name, amount, currency, due_date, 
            bill_type, apartment_maintenance_id, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            maintenance.building_id,
            maintenance.apartment_id,
            `Maintenance - ${new Date().toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}`,
            maintenance.monthly_amount,
            "INR",
            firstDayOfMonth,
            "maintenance",
            maintenance.id,
            "unpaid",
            maintenance.created_by,
          ]
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Generate monthly maintenance error:", err);
    throw err;
  } finally {
    client.release();
  }
}

// GET payment statistics
router.get(
  "/buildings/:buildingId/payments/stats",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role === "resident" &&
        Number(req.user.buildingId) !== Number(req.params.buildingId)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      let whereClause = "WHERE p.building_id = $1";
      const params = [req.params.buildingId];

      if (req.user.role === "resident") {
        whereClause += " AND p.apartment_id = $2";
        params.push(req.user.apartmentId);
      }

      const statsRes = await db.query(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN p.status = 'unpaid' THEN 1 END) as unpaid,
        SUM(CASE WHEN p.status = 'unpaid' THEN p.amount ELSE 0 END) as total_due,
        SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid
      FROM payments p
      ${whereClause}
    `,
        params
      );

      const recentRes = await db.query(
        `
      SELECT p.*, a.unit_number
      FROM payments p
      LEFT JOIN apartments a ON p.apartment_id = a.id
      ${whereClause}
      ORDER BY p.due_date DESC
      LIMIT 5
    `,
        params
      );

      res.json({
        stats: statsRes.rows[0],
        recent: recentRes.rows,
      });
    } catch (e) {
      console.error("GET payments stats error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// Mark payment as paid
router.post("/payments/:id/pay", authMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const r0 = await db.query("SELECT * FROM payments WHERE id = $1", [id]);
    if (!r0.rows.length) return res.status(404).json({ error: "not found" });

    const p = r0.rows[0];
    if (
      req.user.role === "resident" &&
      Number(req.user.apartmentId) !== Number(p.apartment_id)
    ) {
      return res.status(403).json({ error: "forbidden" });
    }

    // Use transaction: update payment status + insert event
    const client = await db.getClient();
    try {
      await client.query("BEGIN");
      await client.query(
        "UPDATE payments SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );
      await client.query(
        "INSERT INTO events (building_id,type,ref_id,message,created_by) VALUES ($1,$2,$3,$4,$5)",
        [
          p.building_id,
          "payment_made",
          id,
          `Payment made: ${p.bill_name}`,
          req.user.id,
        ]
      );
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("POST /payments/:id/pay error", e);
    res.status(500).json({ error: "failed" });
  }
});

// Add this route to generate a single monthly payment
router.post(
  "/admin/buildings/:buildingId/generate-monthly-payment",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "building_admin") {
        return res.status(403).json({ error: "forbidden" });
      }

      const {
        apartment_id,
        monthly_amount,
        due_date,
        apartment_maintenance_id,
      } = req.body;

      if (!apartment_id || !monthly_amount || !due_date) {
        return res.status(400).json({
          error: "Apartment ID, monthly amount, and due date are required",
        });
      }

      // Check if payment already exists for this month
      const existingRes = await db.query(
        `SELECT 1 FROM payments 
         WHERE building_id = $1 
           AND apartment_id = $2 
           AND apartment_maintenance_id = $3
           AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', $4::date)`,
        [
          req.params.buildingId,
          apartment_id,
          apartment_maintenance_id,
          due_date,
        ]
      );

      if (existingRes.rows.length > 0) {
        return res.status(400).json({
          error: "Payment already exists for this month",
        });
      }

      // Create new payment
      const q = `
        INSERT INTO payments 
        (building_id, apartment_id, bill_name, amount, currency, due_date, 
         bill_type, apartment_maintenance_id, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const params = [
        req.params.buildingId,
        apartment_id,
        `Maintenance - ${new Date(due_date).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}`,
        monthly_amount,
        "INR",
        due_date,
        "maintenance",
        apartment_maintenance_id,
        "unpaid",
        req.user.id,
      ];

      const result = await db.query(q, params);
      res.json({ payment: result.rows[0] });
    } catch (e) {
      console.error("POST generate monthly payment error", e);
      res.status(500).json({ error: "failed" });
    }
  }
);

// Generate monthly payments for all apartments
router.post(
  "/admin/buildings/:buildingId/generate-monthly-payments",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "building_admin") {
        return res.status(403).json({ error: "forbidden" });
      }

      const { due_date } = req.body;
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const targetDate = due_date || `${currentMonth}-01`;

      await generateMonthlyMaintenance(req.params.buildingId, targetDate);
      res.json({
        success: true,
        message: "Monthly payments generated successfully",
      });
    } catch (e) {
      console.error("Generate monthly payments error:", e);
      res.status(500).json({ error: "Failed to generate monthly payments" });
    }
  }
);

// Update the generateMonthlyMaintenance function
async function generateMonthlyMaintenance(buildingId, targetDate = null) {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    const dueDate = targetDate || `${new Date().toISOString().slice(0, 7)}-01`;

    // Get all active maintenance records
    const maintenanceRes = await client.query(
      `SELECT am.*, a.unit_number 
       FROM apartment_maintenance am
       JOIN apartments a ON am.apartment_id = a.id
       WHERE am.building_id = $1 AND am.is_active = true
         AND (am.effective_to IS NULL OR am.effective_to >= $2)`,
      [buildingId, dueDate]
    );

    let generatedCount = 0;

    for (const maintenance of maintenanceRes.rows) {
      // Check if payment already exists for this month
      const existingRes = await client.query(
        `SELECT 1 FROM payments 
         WHERE building_id = $1 
           AND apartment_id = $2 
           AND apartment_maintenance_id = $3
           AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', $4::date)`,
        [
          maintenance.building_id,
          maintenance.apartment_id,
          maintenance.id,
          dueDate,
        ]
      );

      if (existingRes.rows.length === 0) {
        // Create new payment
        await client.query(
          `INSERT INTO payments 
           (building_id, apartment_id, bill_name, amount, currency, due_date, 
            bill_type, apartment_maintenance_id, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            maintenance.building_id,
            maintenance.apartment_id,
            `Maintenance - ${new Date(dueDate).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}`,
            maintenance.monthly_amount,
            "INR",
            dueDate,
            "maintenance",
            maintenance.id,
            "unpaid",
            maintenance.created_by,
          ]
        );
        generatedCount++;
      }
    }

    await client.query("COMMIT");
    return {
      success: true,
      count: generatedCount,
      total: maintenanceRes.rows.length,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Generate monthly maintenance error:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = router;
