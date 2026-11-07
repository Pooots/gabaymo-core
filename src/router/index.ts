import { createRouter } from '@tanstack/react-router'

import { adminRouteTree } from './admin'
import { memberRoutes } from './member'
import { partnerRouteTree } from './partner'
import { publicRoutes } from './public'
import { rootRoute } from './root'
import { onUnauthorized } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { queryRoots } from '@/queries/keys'
import { NotFoundPage } from '@/routes/system/NotFoundPage'
import { RouteErrorPage, RoutePending } from '@/routes/system/RouteErrorPage'
import { clearAdminSession } from '@/services/adminAuth'
import { clearMemberSession } from '@/services/memberAuth'

/**
 * Route tree, assembled from one file per area:
 *   public.tsx  /, /login, /register
 *   member.tsx  /account
 *   partner.tsx /partner/* (lazy)
 *   admin.tsx   /admin/*   (lazy)
 */
export const routeTree = rootRoute.addChildren([
  ...publicRoutes,
  ...memberRoutes,
  partnerRouteTree,
  ...adminRouteTree,
])

export function createAppRouter() {
  return createRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: RouteErrorPage,
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 300,
    defaultPreload: 'intent',
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>

/**
 * Session expired or was signed out elsewhere: each area drops its cached
 * profile and data, then sends the user to its own sign-in page (only while
 * they are inside that area). Returns a cleanup for tests.
 */
export function registerSessionHandlers(router: AppRouter) {
  const offAdmin = onUnauthorized('admin', () => {
    clearAdminSession()
    queryClient.removeQueries({ queryKey: queryRoots.admin })
    const path = router.state.location.pathname
    if (path.startsWith('/admin') && path !== '/admin/login') void router.navigate({ to: '/admin/login' })
  })

  const offMember = onUnauthorized('member', () => {
    clearMemberSession()
    queryClient.removeQueries({ queryKey: queryRoots.member })
    queryClient.removeQueries({ queryKey: queryRoots.partner })
    const path = router.state.location.pathname
    if (path.startsWith('/account') || path.startsWith('/partner')) void router.navigate({ to: '/login' })
  })

  return () => {
    offAdmin()
    offMember()
  }
}

export const router = createAppRouter()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
