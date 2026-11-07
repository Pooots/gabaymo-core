import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router'

import { rootRoute } from './root'
import { loadAdminSession } from '@/services/adminAuth'

/** Staff console: every screen is code-split and loaded on first visit. */
const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  // After /setup-account when the API could not sign in directly (e.g. two-factor is on).
  validateSearch: (search: Record<string, unknown>): { notice?: 'password_reset' | 'account_ready' } => ({
    notice: search.notice === 'password_reset' || search.notice === 'account_ready' ? search.notice : undefined,
  }),
  beforeLoad: async () => {
    if (await loadAdminSession()) throw redirect({ to: '/admin' })
  },
  component: lazyRouteComponent(() => import('@/routes/admin/AdminLoginPage'), 'AdminLoginPage'),
})

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: async () => {
    if (!(await loadAdminSession())) throw redirect({ to: '/admin/login' })
  },
  component: lazyRouteComponent(() => import('@/routes/admin/AdminLayout'), 'AdminLayout'),
})

const overviewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: lazyRouteComponent(() => import('@/routes/admin/OverviewPage'), 'OverviewPage'),
})

const membersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'members',
  component: lazyRouteComponent(() => import('@/routes/admin/modules/MembersPage'), 'MembersPage'),
})

export const memberDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'members/$memberId',
  component: lazyRouteComponent(() => import('@/routes/admin/MemberDetailPage'), 'MemberDetailPage'),
})

const rolesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'roles',
  component: lazyRouteComponent(() => import('@/routes/admin/RolesPage'), 'RolesPage'),
})

const partnersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'partners',
  component: lazyRouteComponent(() => import('@/routes/admin/PartnersPage'), 'PartnersPage'),
})

const ticketsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'tickets',
  component: lazyRouteComponent(() => import('@/routes/admin/modules/TicketsPage'), 'TicketsPage'),
})

const codes = () => import('@/routes/admin/modules/CodesPages')

const accessKeysRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'access-keys',
  component: lazyRouteComponent(codes, 'AccessKeysPage'),
})

const referralCodesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'referral-codes',
  component: lazyRouteComponent(codes, 'ReferralCodesPage'),
})

const organizationsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'organizations',
  component: lazyRouteComponent(() => import('@/routes/admin/modules/OrganizationsPage'), 'OrganizationsPage'),
})

const securityRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'security',
  component: lazyRouteComponent(() => import('@/routes/admin/SecurityPage'), 'SecurityPage'),
})

const aiFeedbackRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'ai/feedback',
  component: lazyRouteComponent(() => import('@/routes/admin/ai/FeedbackPage'), 'FeedbackPage'),
})

export const ANALYTICS_DAYS = [7, 30, 90] as const

export const aiAnalyticsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'ai/analytics',
  validateSearch: (search: Record<string, unknown>): { days: number } => {
    const days = Number(search.days)
    return { days: (ANALYTICS_DAYS as ReadonlyArray<number>).includes(days) ? days : 30 }
  },
  component: lazyRouteComponent(() => import('@/routes/admin/ai/AnalyticsPage'), 'AnalyticsPage'),
})

const plansRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'plans',
  component: lazyRouteComponent(() => import('@/routes/admin/modules/PlansPage'), 'PlansPage'),
})

const subscriptionsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'subscriptions',
  component: lazyRouteComponent(() => import('@/routes/admin/SubscriptionsPage'), 'SubscriptionsPage'),
})

const knowledgeLibraryRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'knowledge-library',
  component: lazyRouteComponent(() => import('@/routes/admin/KnowledgeBasePage'), 'KnowledgeBasePage'),
})

const sourceReviewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'source-review',
  component: lazyRouteComponent(() => import('@/routes/admin/SourceReviewPage'), 'SourceReviewPage'),
})

const knowledgeSearchRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'knowledge-search',
  component: lazyRouteComponent(() => import('@/routes/admin/KnowledgeSearchPage'), 'KnowledgeSearchPage'),
})

const serviceInstructionsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'service-instructions',
  component: lazyRouteComponent(() => import('@/routes/admin/ServiceInstructionsPage'), 'ServiceInstructionsPage'),
})

const aiReviewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'ai-review',
  component: lazyRouteComponent(() => import('@/routes/admin/AiReviewPage'), 'AiReviewPage'),
})

// Old URLs for the knowledge library.
const knowledgeBaseRedirect = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'knowledge-base',
  beforeLoad: () => {
    throw redirect({ to: '/admin/knowledge-library' })
  },
})

const libraryRedirect = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'library',
  beforeLoad: () => {
    throw redirect({ to: '/admin/knowledge-library' })
  },
})

const paymentsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'payments',
  component: lazyRouteComponent(() => import('@/routes/admin/modules/PaymentsPage'), 'PaymentsPage'),
})

const auditLogRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'audit-log',
  component: lazyRouteComponent(() => import('@/routes/admin/modules/AuditLogPage'), 'AuditLogPage'),
})

export const adminRouteTree = [
  adminLoginRoute,
  adminLayoutRoute.addChildren([
    overviewRoute,
    membersRoute,
    memberDetailRoute,
    rolesRoute,
    partnersRoute,
    ticketsRoute,
    accessKeysRoute,
    referralCodesRoute,
    organizationsRoute,
    securityRoute,
    aiFeedbackRoute,
    aiAnalyticsRoute,
    plansRoute,
    subscriptionsRoute,
    knowledgeLibraryRoute,
    sourceReviewRoute,
    knowledgeSearchRoute,
    serviceInstructionsRoute,
    aiReviewRoute,
    knowledgeBaseRedirect,
    libraryRedirect,
    paymentsRoute,
    auditLogRoute,
  ]),
] as const
