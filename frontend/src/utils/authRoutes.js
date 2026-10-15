// Where each role lands after login, and which staff areas each role may enter.
export const homes = { USER: '/', PARTNER: '/partner', MANAGER: '/manager', ADMIN: '/admin' }

const areas = [
  ['/admin', ['ADMIN']],
  ['/manager', ['MANAGER', 'ADMIN']],
  ['/partner', ['PARTNER']],
]

const rolesOf = (user) => (user?.roles?.length ? user.roles : [user?.role]).filter(Boolean)

export function homeFor(user) {
  const roles = rolesOf(user)
  const best = ['ADMIN', 'MANAGER', 'PARTNER'].find((role) => roles.includes(role))
  return homes[best || user?.role] || '/'
}

/** True when a remembered path (e.g. login's `from`) belongs to an area this user can open. */
export function canOpen(path, user) {
  if (!path) return false
  const area = areas.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  return !area || area[1].some((role) => rolesOf(user).includes(role))
}
