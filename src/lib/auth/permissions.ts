export type AppRole = 'user' | 'employer' | 'admin' | 'super_admin'

export type UserPermissionRow = {
  role: string | null
  perm_manage_users?: boolean | null
  perm_manage_content?: boolean | null
  perm_manage_system?: boolean | null
}

export function effectivePermissions(row: UserPermissionRow | null | undefined) {
  const role = (row?.role ?? 'user') as AppRole
  if (role === 'admin' || role === 'super_admin') {
    return {
      manageUsers: true,
      manageContent: true,
      manageSystem: true,
    }
  }
  return {
    manageUsers: !!row?.perm_manage_users,
    manageContent: !!row?.perm_manage_content,
    manageSystem: !!row?.perm_manage_system,
  }
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function canAccessAdminConsole(role: string | null | undefined): boolean {
  return isStaffRole(role)
}

export function canAccessEmployerDashboard(role: string | null | undefined): boolean {
  return role === 'employer' || role === 'admin' || role === 'super_admin'
}

/** Contact messages and similar content moderation */
export function canManageContent(role: string | null | undefined, row?: UserPermissionRow | null): boolean {
  return effectivePermissions(row ?? { role: role ?? 'user' }).manageContent
}

/** User/role management UI */
export function canManageRoles(role: string | null | undefined): boolean {
  return role === 'super_admin'
}

/** Read-only user directory in admin console (staff) */
export function canViewAdminUserDirectory(role: string | null | undefined): boolean {
  return canAccessAdminConsole(role)
}
