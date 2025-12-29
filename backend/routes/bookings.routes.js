// backend/routes/bookings.routes.js - SIMPLIFIED
const express = require("express");
const db = require("../db");
const { authMiddleware, requireRole } = require("../auth.middleware");

const router = express.Router();

// Get all common amenities
router.get("/amenities", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM amenities 
             WHERE is_active = true 
             ORDER BY name`
    );

    res.json({
      success: true,
      amenities: result.rows.map((amenity) => ({
        ...amenity,
        slots: amenity.booking_slots || [
          { name: "Default", start: "08:00", end: "20:00", max_per_day: 1 },
        ],
      })),
    });
  } catch (error) {
    console.error("Get amenities error:", error);
    res.status(500).json({ error: "Failed to fetch amenities" });
  }
});

// Get available dates for an amenity
router.get(
  "/amenities/:amenityId/available",
  authMiddleware,
  async (req, res) => {
    try {
      const amenityId = req.params.amenityId;
      const buildingId = req.user.buildingId;
      const {
        month = new Date().getMonth() + 1,
        year = new Date().getFullYear(),
      } = req.query;

      // Get amenity details
      const amenityResult = await db.query(
        `SELECT *, 
                    COALESCE(booking_slots, '[{"name": "Default", "start": "08:00", "end": "20:00", "max_per_day": 1}]'::jsonb) as slots
             FROM amenities 
             WHERE id = $1 AND is_active = true`,
        [amenityId]
      );

      if (amenityResult.rows.length === 0) {
        return res.status(404).json({ error: "Amenity not found" });
      }

      const amenity = amenityResult.rows[0];
      const slots = amenity.slots;

      // Get existing bookings for this amenity in this building
      const bookings = await db.query(
        `SELECT date, slot_name, status 
             FROM bookings 
             WHERE amenity_id = $1 
               AND building_id = $2
               AND EXTRACT(MONTH FROM date) = $3 
               AND EXTRACT(YEAR FROM date) = $4
               AND status IN ('pending', 'approved')`,
        [amenityId, buildingId, month, year]
      );

      // Generate available dates for the next 30 days
      const availableDates = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Skip if beyond requested month/year
        if (date.getMonth() + 1 != month || date.getFullYear() != year) {
          continue;
        }

        const dateString = date.toISOString().split("T")[0];
        const dateBookings = bookings.rows.filter(
          (b) => b.date.toISOString().split("T")[0] === dateString
        );

        // Check slot availability
        const availableSlots = slots
          .map((slot) => {
            const slotBookings = dateBookings.filter(
              (b) => b.slot_name === slot.name
            );
            const bookedCount = slotBookings.length;
            const maxPerDay = slot.max_per_day || 1;
            const available = bookedCount < maxPerDay;

            return {
              name: slot.name,
              start_time: slot.start,
              end_time: slot.end,
              available,
              booked_count: bookedCount,
              max_per_day: maxPerDay,
              is_full: bookedCount >= maxPerDay,
            };
          })
          .filter((slot) => slot.available);

        if (availableSlots.length > 0) {
          availableDates.push({
            date: dateString,
            day: date.getDate(),
            weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
            month: date.toLocaleDateString("en-US", { month: "short" }),
            available_slots: availableSlots,
          });
        }
      }

      res.json({
        success: true,
        amenity: {
          id: amenity.id,
          name: amenity.name,
          description: amenity.description,
          icon: amenity.icon,
          color: amenity.color,
          operating_hours: amenity.operating_hours,
          slots: slots,
        },
        available_dates: availableDates,
      });
    } catch (error) {
      console.error("Get available dates error:", error);
      res.status(500).json({ error: "Failed to fetch available dates" });
    }
  }
);

// Create a new booking
router.post("/bookings", authMiddleware, async (req, res) => {
  console.log("POST /bookings - Request:", req.body);

  try {
    const userId = req.user.id;
    const buildingId = req.user.buildingId;
    const apartmentId = req.user.apartmentId;

    if (req.user.role !== "resident") {
      return res
        .status(403)
        .json({ error: "Only residents can create bookings" });
    }

    const { amenity_id, date, slot_name, purpose = "" } = req.body;

    // Validation
    if (!amenity_id || !date || !slot_name) {
      return res.status(400).json({
        error: "Missing required fields: amenity, date, and slot",
      });
    }

    // Check date is not in past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({ error: "Cannot book for past dates" });
    }

    // Get amenity and slot details
    const amenityResult = await db.query(
      `SELECT *, 
                    COALESCE(booking_slots, '[{"name": "Default", "start": "08:00", "end": "20:00", "max_per_day": 1}]'::jsonb) as slots
             FROM amenities 
             WHERE id = $1 AND is_active = true`,
      [amenity_id]
    );

    if (amenityResult.rows.length === 0) {
      return res.status(404).json({ error: "Amenity not found" });
    }

    const amenity = amenityResult.rows[0];
    const slots = amenity.slots;
    const slot = slots.find((s) => s.name === slot_name);

    if (!slot) {
      return res.status(400).json({ error: "Invalid slot selected" });
    }

    // Check max bookings for this slot
    const existingBookings = await db.query(
      `SELECT COUNT(*) as count 
             FROM bookings 
             WHERE amenity_id = $1 
               AND building_id = $2
               AND date = $3 
               AND slot_name = $4
               AND status IN ('pending', 'approved')`,
      [amenity_id, buildingId, date, slot_name]
    );

    const bookedCount = parseInt(existingBookings.rows[0].count);
    const maxPerDay = slot.max_per_day || 1;

    if (bookedCount >= maxPerDay) {
      return res.status(400).json({
        error: `All "${slot_name}" slots are booked for ${date}. Please choose another date or time.`,
        available_slots: slots
          .filter((s) => s.name !== slot_name)
          .map((s) => s.name),
      });
    }

    // Check if user already has a booking for this amenity on same date
    const userExistingBooking = await db.query(
      `SELECT id FROM bookings 
             WHERE amenity_id = $1 
               AND building_id = $2
               AND date = $3 
               AND created_by = $4
               AND status IN ('pending', 'approved')`,
      [amenity_id, buildingId, date, userId]
    );

    if (userExistingBooking.rows.length > 0) {
      return res.status(400).json({
        error: "You already have a booking for this amenity on this date",
      });
    }

    // Create booking
    const result = await db.query(
      `INSERT INTO bookings (
                building_id, apartment_id, amenity_id, 
                date, slot_name, start_time, end_time, 
                purpose, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
      [
        buildingId,
        apartmentId,
        amenity_id,
        date,
        slot_name,
        slot.start,
        slot.end,
        purpose,
        "pending",
        userId,
      ]
    );

    const booking = result.rows[0];

    // Get user details for event log
    const userResult = await db.query(
      `SELECT u.name, a.unit_number 
             FROM users u
             LEFT JOIN apartments a ON u.apartment_id = a.id
             WHERE u.id = $1`,
      [userId]
    );

    const userInfo = userResult.rows[0] || {};

    // Log event
    await db.query(
      `INSERT INTO events (building_id, type, ref_id, message, created_by) 
             VALUES ($1, $2, $3, $4, $5)`,
      [
        buildingId,
        "booking_created",
        booking.id,
        `New booking for ${amenity.name} (${slot_name}) from ${
          userInfo.name || "Resident"
        } (Unit ${userInfo.unit_number || "N/A"}) on ${date}`,
        userId,
      ]
    );

    res.status(201).json({
      success: true,
      booking,
      message: `Booking request submitted. Waiting for admin approval.`,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (error.code === "23505") {
      return res.status(400).json({ error: "Duplicate booking detected" });
    }

    res.status(500).json({
      error: "Failed to create booking",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get user's bookings
router.get("/bookings/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT b.*, 
                    a.name as amenity_name,
                    a.icon as amenity_icon,
                    a.color as amenity_color,
                    ap.unit_number,
                    u.name as approved_by_name
             FROM bookings b
             JOIN amenities a ON b.amenity_id = a.id
             LEFT JOIN apartments ap ON b.apartment_id = ap.id
             LEFT JOIN users u ON b.approved_by = u.id
             WHERE b.created_by = $1
             ORDER BY 
                CASE b.status 
                    WHEN 'pending' THEN 1
                    WHEN 'approved' THEN 2
                    WHEN 'rejected' THEN 3
                    WHEN 'cancelled' THEN 4
                END,
                b.date DESC,
                b.start_time DESC`,
      [userId]
    );

    res.json({
      success: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Cancel booking
router.post("/bookings/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    // Get booking details
    const bookingResult = await db.query(
      `SELECT b.* FROM bookings b
             WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    // Check permissions
    const isOwner = booking.created_by == userId;
    const isAdmin =
      req.user.role === "building_admin" || req.user.role === "super_admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    // Cancel booking
    const result = await db.query(
      `UPDATE bookings 
             SET status = 'cancelled',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
      [bookingId]
    );

    res.json({
      success: true,
      booking: result.rows[0],
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// Admin: Get all bookings for building
router.get(
  "/buildings/:buildingId/bookings",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const buildingId = req.params.buildingId;
      const { status, amenity_id, date_from, date_to } = req.query;

      // Build query
      let query = `
                SELECT b.*, 
                       a.name as amenity_name,
                       a.icon as amenity_icon,
                       a.color as amenity_color,
                       ap.unit_number,
                       u.name as resident_name,
                       u.phone as resident_phone,
                       au.name as approved_by_name
                FROM bookings b
                JOIN amenities a ON b.amenity_id = a.id
                LEFT JOIN apartments ap ON b.apartment_id = ap.id
                LEFT JOIN users u ON b.created_by = u.id
                LEFT JOIN users au ON b.approved_by = au.id
                WHERE b.building_id = $1
            `;

      const params = [buildingId];
      let paramCounter = 2;

      // Apply filters
      if (status && status !== "all") {
        query += ` AND b.status = $${paramCounter}`;
        params.push(status);
        paramCounter++;
      }

      if (amenity_id && amenity_id !== "all") {
        query += ` AND b.amenity_id = $${paramCounter}`;
        params.push(amenity_id);
        paramCounter++;
      }

      if (date_from) {
        query += ` AND b.date >= $${paramCounter}`;
        params.push(date_from);
        paramCounter++;
      }

      if (date_to) {
        query += ` AND b.date <= $${paramCounter}`;
        params.push(date_to);
        paramCounter++;
      }

      query += " ORDER BY b.date DESC, b.start_time DESC";

      const result = await db.query(query, params);

      res.json({
        success: true,
        bookings: result.rows,
      });
    } catch (error) {
      console.error("Get building bookings error:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }
);

// Admin: Approve booking
router.post(
  "/bookings/:id/approve",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const adminId = req.user.id;

      // Get booking with amenity details
      const bookingResult = await db.query(
        `SELECT b.*, a.name as amenity_name
                 FROM bookings b
                 JOIN amenities a ON b.amenity_id = a.id
                 WHERE b.id = $1`,
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      // Check permission (building admin can only approve in their building)
      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(booking.building_id)
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check status
      if (booking.status !== "pending") {
        return res.status(400).json({
          error: `Booking is already ${booking.status}`,
        });
      }

      // Approve booking
      const result = await db.query(
        `UPDATE bookings 
                 SET status = 'approved',
                     approved_by = $1,
                     approved_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING *`,
        [adminId, bookingId]
      );

      // Log event
      await db.query(
        `INSERT INTO events (building_id, type, ref_id, message, created_by) 
                 VALUES ($1, $2, $3, $4, $5)`,
        [
          booking.building_id,
          "booking_approved",
          bookingId,
          `Booking for ${booking.amenity_name} on ${booking.date} approved`,
          adminId,
        ]
      );

      res.json({
        success: true,
        booking: result.rows[0],
        message: "Booking approved successfully",
      });
    } catch (error) {
      console.error("Approve booking error:", error);
      res.status(500).json({ error: "Failed to approve booking" });
    }
  }
);

// Admin: Reject booking
router.post(
  "/bookings/:id/reject",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const adminId = req.user.id;
      const { rejection_reason } = req.body;

      if (!rejection_reason || rejection_reason.trim().length < 5) {
        return res.status(400).json({
          error: "Rejection reason is required (minimum 5 characters)",
        });
      }

      // Get booking details
      const bookingResult = await db.query(
        `SELECT b.*, a.name as amenity_name
                 FROM bookings b
                 JOIN amenities a ON b.amenity_id = a.id
                 WHERE b.id = $1`,
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookingResult.rows[0];

      // Check permission
      if (
        req.user.role === "building_admin" &&
        Number(req.user.buildingId) !== Number(booking.building_id)
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check status
      if (booking.status !== "pending") {
        return res.status(400).json({
          error: `Booking is already ${booking.status}`,
        });
      }

      // Reject booking
      const result = await db.query(
        `UPDATE bookings 
                 SET status = 'rejected',
                     rejection_reason = $1,
                     approved_by = $2,
                     approved_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3
                 RETURNING *`,
        [rejection_reason.trim(), adminId, bookingId]
      );

      // Log event
      await db.query(
        `INSERT INTO events (building_id, type, ref_id, message, created_by) 
                 VALUES ($1, $2, $3, $4, $5)`,
        [
          booking.building_id,
          "booking_rejected",
          bookingId,
          `Booking for ${booking.amenity_name} rejected: ${rejection_reason}`,
          adminId,
        ]
      );

      res.json({
        success: true,
        booking: result.rows[0],
        message: "Booking rejected successfully",
      });
    } catch (error) {
      console.error("Reject booking error:", error);
      res.status(500).json({ error: "Failed to reject booking" });
    }
  }
);

// Get amenities list for admin filter
router.get(
  "/amenities/list",
  authMiddleware,
  requireRole("building_admin", "super_admin"),
  async (req, res) => {
    try {
      const result = await db.query(
        `SELECT id, name FROM amenities 
                 WHERE is_active = true 
                 ORDER BY name`
      );

      res.json({
        success: true,
        amenities: result.rows,
      });
    } catch (error) {
      console.error("Get amenities list error:", error);
      res.status(500).json({ error: "Failed to fetch amenities" });
    }
  }
);

module.exports = router;
