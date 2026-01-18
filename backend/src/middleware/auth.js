const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require("../config/constants");

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    const result = await pool.query(
      "SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1 AND u.is_active = TRUE",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid token. User not found." });
    }

    req.user = result.rows[0];
    req.user.permissions = ROLE_PERMISSIONS[req.user.role_name] || [];
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired." });
    }
    res.status(500).json({ error: "Authentication error." });
  }
};

// Middleware to check permissions
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
        required: requiredPermissions,
        userRole: req.user.role_name,
      });
    }

    next();
  };
};

// Middleware to check if user is Operator
const requireOperator = authorize(PERMISSIONS.CREATE_MATERIAL);

// Middleware to check if user can view (all users can view)
const canView = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  requireOperator,
  canView,
};

