// lib/roles.ts — Permissions map and role helpers.
// Single source of truth for what each siteRole can do in the dashboard.
// To add a new role: add a key to PERMISSIONS.
// To add a capability to a role: add an action string to that role's Set.
import type { Member } from '@/types/member'

const PERMISSIONS: Record<string, Set<string>> = {
  admin: new Set([
    'post:announcement',
    'post:event',
    'manage:gallery',
    'manage:users',
  ]),
  member: new Set([]),
  pledge: new Set([]),
}

export function can(member: Member, action: string): boolean {
  return PERMISSIONS[member.siteRole]?.has(action) ?? false
}

export function isAdmin(member: Member): boolean {
  return member.siteRole === 'admin'
}
