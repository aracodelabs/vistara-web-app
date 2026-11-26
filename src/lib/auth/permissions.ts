export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR";

export type AdminPermission =
  | "dashboard:view"
  | "inquiries:read"
  | "inquiries:write"
  | "inquiries:delete"
  | "testimonials:read"
  | "testimonials:moderate"
  | "testimonials:delete"
  | "services:read"
  | "services:write"
  | "categories:read"
  | "categories:write"
  | "content:read"
  | "content:write"
  | "media:read"
  | "media:write"
  | "media:delete"
  | "seo:read"
  | "seo:write"
  | "settings:read"
  | "settings:write"
  | "users:manage";

const ALL_PERMISSIONS: AdminPermission[] = [
  "dashboard:view",
  "inquiries:read",
  "inquiries:write",
  "inquiries:delete",
  "testimonials:read",
  "testimonials:moderate",
  "testimonials:delete",
  "services:read",
  "services:write",
  "categories:read",
  "categories:write",
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "media:delete",
  "seo:read",
  "seo:write",
  "settings:read",
  "settings:write",
  "users:manage",
];

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  SUPER_ADMIN: new Set(ALL_PERMISSIONS),
  ADMIN: new Set<AdminPermission>([
    "dashboard:view",
    "inquiries:read",
    "inquiries:write",
    "inquiries:delete",
    "testimonials:read",
    "testimonials:moderate",
    "testimonials:delete",
    "services:read",
    "services:write",
    "categories:read",
    "categories:write",
    "content:read",
    "content:write",
    "media:read",
    "media:write",
    "media:delete",
    "seo:read",
    "seo:write",
    "settings:read",
  ]),
  EDITOR: new Set<AdminPermission>([
    "dashboard:view",
    "testimonials:read",
    "testimonials:moderate",
    "services:read",
    "categories:read",
    "content:read",
    "content:write",
    "media:read",
    "media:write",
    "seo:read",
    "seo:write",
  ]),
};

export function normalizeRole(role: string): AdminRole {
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR") {
    return role;
  }
  return "EDITOR";
}

export function hasPermission(
  role: string,
  permission: AdminPermission
): boolean {
  const normalized = normalizeRole(role);
  return ROLE_PERMISSIONS[normalized].has(permission);
}

export function canManageRole(
  actorRole: string,
  targetRole: AdminRole
): boolean {
  if (actorRole !== "SUPER_ADMIN") {
    return false;
  }
  return (
    targetRole === "SUPER_ADMIN" ||
    targetRole === "ADMIN" ||
    targetRole === "EDITOR"
  );
}
