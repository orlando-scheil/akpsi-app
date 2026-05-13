import { describe, it, expect } from 'vitest'
import { can, isAdmin } from '@/lib/roles'
import type { Member } from '@/types/member'

function makeMember(siteRole: string): Member {
  return {
    uid: 'test-uid',
    firstName: 'Test',
    lastName: 'User',
    preferredName: null,
    profilePhotoUrl: null,
    pledgeClassQuarter: 'Fall',
    pledgeClassYear: 2024,
    status: 'active',
    role: null,
    familyId: null,
    familyName: null,
    bigUid: null,
    bigName: null,
    major: 'CS',
    graduationYear: 2026,
    email: 'test@uw.edu',
    phone: null,
    preferredContact: null,
    socialLinks: [],
    bio: null,
    industries: [],
    joinedAt: new Date(),
    lastActive: new Date(),
    siteRole,
  }
}

describe('can', () => {
  it('returns true for admin with a known action', () => {
    expect(can(makeMember('admin'), 'post:announcement')).toBe(true)
  })

  it('returns true for admin with post:event', () => {
    expect(can(makeMember('admin'), 'post:event')).toBe(true)
  })

  it('returns true for admin with manage:gallery', () => {
    expect(can(makeMember('admin'), 'manage:gallery')).toBe(true)
  })

  it('returns false for member with admin action', () => {
    expect(can(makeMember('member'), 'post:announcement')).toBe(false)
  })

  it('returns false for pledge with admin action', () => {
    expect(can(makeMember('pledge'), 'post:event')).toBe(false)
  })

  it('returns false for unknown role', () => {
    expect(can(makeMember('unknown'), 'post:announcement')).toBe(false)
  })

  it('returns false for known role with unknown action', () => {
    expect(can(makeMember('admin'), 'unknown:action')).toBe(false)
  })
})

describe('isAdmin', () => {
  it('returns true for admin', () => {
    expect(isAdmin(makeMember('admin'))).toBe(true)
  })

  it('returns false for member', () => {
    expect(isAdmin(makeMember('member'))).toBe(false)
  })

  it('returns false for pledge', () => {
    expect(isAdmin(makeMember('pledge'))).toBe(false)
  })
})
