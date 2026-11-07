import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router'

import { rootRoute } from './root'
import { HomePage } from '@/routes/HomePage'
import { UserLoginPage } from '@/routes/account/UserLoginPage'
import { UserRegisterPage } from '@/routes/account/UserRegisterPage'
import { loadMemberSession, memberHome } from '@/services/memberAuth'

/** Signed-in members skip the sign-in pages and land in their own portal. */
async function redirectSignedIn() {
  const user = await loadMemberSession()
  if (user) throw redirect({ to: memberHome(user) })
}

/** A string query param, or undefined (never a number/array from a hand-edited URL). */
function text(value: unknown, max = 512): string | undefined {
  if (typeof value === 'number') return String(value)
  return typeof value === 'string' && value.trim() !== '' ? value.trim().slice(0, max) : undefined
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

export type LoginNotice = 'password_reset' | 'account_ready'

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>): { notice?: LoginNotice } => ({
    notice: search.notice === 'password_reset' || search.notice === 'account_ready' ? search.notice : undefined,
  }),
  // One login for customers and partners: send each to their own portal.
  beforeLoad: redirectSignedIn,
  component: UserLoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: (search: Record<string, unknown>): { ref?: string } => ({ ref: text(search.ref, 40) }),
  beforeLoad: redirectSignedIn,
  component: UserRegisterPage,
})

const passwordPages = () => import('@/routes/account/PasswordResetPages')

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: lazyRouteComponent(passwordPages, 'ForgotPasswordPage'),
})

export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: (search: Record<string, unknown>): { token?: string; email?: string } => ({
    token: text(search.token),
    email: text(search.email, 200),
  }),
  component: lazyRouteComponent(passwordPages, 'ResetPasswordPage'),
})

/** Partners and staff: finish an invitation or a staff-sent password link. */
export const setupAccountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/setup-account',
  validateSearch: (search: Record<string, unknown>): { token?: string; email?: string } => ({
    token: text(search.token),
    email: text(search.email, 200),
  }),
  component: lazyRouteComponent(() => import('@/routes/account/SetupAccountPage'), 'SetupAccountPage'),
})

const legalPages = () => import('@/routes/LegalPages')

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/terms',
  component: lazyRouteComponent(legalPages, 'TermsPage'),
})

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy',
  component: lazyRouteComponent(legalPages, 'PrivacyPage'),
})

export const publicRoutes = [
  indexRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  setupAccountRoute,
  termsRoute,
  privacyRoute,
] as const
