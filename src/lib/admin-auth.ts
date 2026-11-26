export {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  evaluatePasswordStrength,
} from "./auth/password";

export {
  hasPermission,
  canManageRole,
  normalizeRole,
  type AdminRole,
  type AdminPermission,
} from "./auth/permissions";

export {
  SESSION_COOKIE_NAME,
  hasAnyAdminUser,
  createAdminSession,
  getAdminSession,
  requireAdminSession,
  requireAdminApiSession,
  destroyAdminSession,
  revokeAllUserSessions,
  type AdminSessionUser,
  type AdminApiAuthResult,
} from "./auth/session";

export { logAdminActivity } from "./auth/audit";

