// backend/routes/auth.routes.js
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const { signToken } = require("../auth.middleware");

const router = express.Router();

// helper to fetch user row (by phone)
async function findUserByPhone(phone) {
  const r = await db.query("SELECT * FROM users WHERE phone = $1 LIMIT 1", [
    phone,
  ]);
  return r.rows[0];
}

// signup (DEV/SEED use only)
// You may disable public signup in production.
router.post("/signup", async (req, res) => {
  try {
    const { phone, password, name, role, building_id, apartment_id } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: "phone & password required" });

    const existing = await findUserByPhone(phone);
    if (existing) return res.status(400).json({ error: "phone exists" });

    const hash = await bcrypt.hash(password, 10);
    const r = await db.query(
      `INSERT INTO users (phone, name, password_hash, role, building_id, apartment_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, phone, name, role, building_id, apartment_id`,
      [
        phone,
        name || null,
        hash,
        role || "resident",
        building_id || null,
        apartment_id || null,
      ]
    );
    const user = r.rows[0];
    // sign token with important claims so frontend can read building/apartment from token payload if needed
    const tokenPayload = {
      id: user.id,
      role: user.role,
      buildingId: user.building_id,
      apartmentId: user.apartment_id,
    };
    const token = signToken(tokenPayload);
    // return both user and token
    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        buildingId: user.building_id,
        apartmentId: user.apartment_id,
      },
      token,
    });
  } catch (e) {
    console.error("POST /auth/signup error", e);
    res.status(500).json({ error: "signup failed" });
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: "phone & password required" });

    const user = await findUserByPhone(phone);
    if (!user) return res.status(401).json({ error: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    // optional: update last_login
    await db.query("UPDATE users SET last_login = now() WHERE id = $1", [
      user.id,
    ]);

    // sign token. include building/apartment ids for client convenience
    const tokenPayload = {
      id: user.id,
      role: user.role,
      buildingId: user.building_id,
      apartmentId: user.apartment_id,
    };
    const token = signToken(tokenPayload);

    // return user object normalized
    const outUser = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      buildingId: user.building_id,
      apartmentId: user.apartment_id,
    };

    res.json({ user: outUser, token });
  } catch (e) {
    console.error("POST /auth/login error", e);
    res.status(500).json({ error: "login failed" });
  }
});

module.exports = router;
