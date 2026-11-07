import { createRoute, redirect } from '@tanstack/react-router'

import { rootRoute } from './root'
import { AccountPage } from '@/routes/account/AccountPage'
import { loadMemberSession, memberHome } from '@/services/memberAuth'

/** Customer portal. Kept in the main bundle: it is the app's main screen. */
export const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  // ?verified=1|0 from the email verification link (gabaymo-ws redirects here).
  validateSearch: (search: Record<string, unknown>): { verified?: '1' | '0' } => {
    const value = String(search.verified ?? '')
    return { verified: value === '1' || value === '0' ? value : undefined }
  },
  beforeLoad: async () => {
    const user = await loadMemberSession()
    if (!user) throw redirect({ to: '/login' })
    if (memberHome(user) !== '/account') throw redirect({ to: '/partner' })
  },
  component: AccountPage,
})

export const memberRoutes = [accountRoute] as const
