// Material Status
export const MATERIAL_STATUS = {
  QUARANTINE: "QUARANTINE",
  UNDER_TEST: "UNDER_TEST",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  DISPENSED: "DISPENSED",
};

// User Roles
export const ROLES = {
  OPERATOR: "Operator",
  VIEWER: "Viewer",
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
  },
  MATERIALS: {
    CREATE: "/materials/create",
    SCAN: "/materials/scan",
    GET: "/materials",
    SAMPLING: "/materials",
    APPROVE: "/materials",
    REJECT: "/materials",
    UPDATE_RACK: "/materials",
    DISPENSE: "/materials",
    HISTORY: "/materials",
    QR_LABEL: "/materials",
  },
  INVENTORY: {
    INWARD: "/inventory/inward",
    OUTWARD: "/inventory/outward",
    EXPIRY_ALERTS: "/inventory/expiry-alerts",
  },
};

// Colors
export const COLORS = {
  primary: "#007AFF",
  secondary: "#5856D6",
  success: "#34C759",
  danger: "#FF3B30",
  warning: "#FF9500",
  info: "#5AC8FA",
  light: "#F2F2F7",
  dark: "#1C1C1E",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#8E8E93",
};

// Status Colors
export const STATUS_COLORS = {
  [MATERIAL_STATUS.QUARANTINE]: COLORS.warning,
  [MATERIAL_STATUS.UNDER_TEST]: COLORS.info,
  [MATERIAL_STATUS.APPROVED]: COLORS.success,
  [MATERIAL_STATUS.REJECTED]: COLORS.danger,
  [MATERIAL_STATUS.DISPENSED]: COLORS.gray,
};


