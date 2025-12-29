// backend/auth.middleware.js
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";
const DEFAULT_EXPIRES = "7d";

// sign token
function signToken(payload = {}, opts = {}) {
  // ensure normalized claim names in token payload
  const claims = {
    id: payload.id,
    role: payload.role,
    // prefer camelCase in the token so frontend can read easily:
    buildingId: payload.buildingId ?? payload.building_id ?? null,
    apartmentId: payload.apartmentId ?? payload.apartment_id ?? null,
    ...opts.extraClaims,
  };

  const expiresIn = opts.expiresIn || DEFAULT_EXPIRES;
  return jwt.sign(claims, SECRET, { expiresIn });
}

// auth middleware
function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    if (!header)
      return res.status(401).json({ error: "missing Authorization header" });

    const parts = String(header).split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
      return res.status(401).json({ error: "malformed Authorization header" });

    const token = parts[1];
    let payload;
    try {
      payload = jwt.verify(token, SECRET);
    } catch (err) {
      // token errors: expired / invalid
      return res.status(401).json({ error: "invalid or expired token" });
    }

    // normalize payload fields and attach to req.user
    req.user = {
      id: payload.id ?? null,
      role: payload.role ?? null,
      // normalize both snake_case and camelCase into camelCase on req.user
      buildingId: payload.buildingId ?? payload.building_id ?? null,
      apartmentId: payload.apartmentId ?? payload.apartment_id ?? null,
      // keep raw payload in case other claims are needed
      raw: payload,
    };

    return next();
  } catch (e) {
    console.error("authMiddleware unexpected error", e);
    return res.status(500).json({ error: "authentication error" });
  }
}

// role guard helper
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "unauthenticated" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "forbidden" });
    return next();
  };
}

module.exports = { signToken, authMiddleware, requireRole };
