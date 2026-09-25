/**
 * Role helpers shared by middleware, API routes and UI.
 * Kept free of Prisma/Node imports so it can run in the Edge middleware.
 */
export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HOTEL_MANAGER', 'TOUR_OPERATOR', 'TOUR_GUIDE', 'CUSTOMER'] as const;
export type Role = (typeof USER_ROLES)[number];

/** Roles that get the management dashboard (/admin) instead of the traveller UI. */
export const MANAGEMENT_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN'];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  HOTEL_MANAGER: 'Hotel Manager',
  TOUR_OPERATOR: 'Tour Operator',
  TOUR_GUIDE: 'Tour Guide',
  CUSTOMER: 'Customer'
};

export function isManagementRole(role: string | null | undefined): boolean {
  return !!role && (MANAGEMENT_ROLES as readonly string[]).includes(role);
}

/**
 * Which accounts an actor may create or edit. Super admins manage everyone;
 * admins manage every account below admin level, so an admin can never
 * create, edit or promote another admin (no privilege escalation).
 */
export function canManageRole(actorRole: string, targetRole: string): boolean {
  if (actorRole === 'SUPER_ADMIN') return true;
  if (actorRole === 'ADMIN') return !isManagementRole(targetRole);
  return false;
}

/** Roles the actor may assign when creating or editing an account. */
export function assignableRoles(actorRole: string): Role[] {
  return USER_ROLES.filter((r) => canManageRole(actorRole, r));
}
