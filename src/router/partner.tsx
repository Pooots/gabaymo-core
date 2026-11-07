import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router'

import { rootRoute } from './root'
import { loadMemberSession, memberHome } from '@/services/memberAuth'

/** Partner portal: every screen is code-split and loaded on first visit. */
const partnerLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/partner',
  beforeLoad: async () => {
    const user = await loadMemberSession()
    if (!user) throw redirect({ to: '/login' })
    if (memberHome(user) !== '/partner') throw redirect({ to: '/account' })
  },
  component: lazyRouteComponent(() => import('@/routes/partner/PartnerLayout'), 'PartnerLayout'),
})

const pages = () => import('@/routes/partner/PartnerPages')
const desk = () => import('@/routes/partner/PartnerTicketDesk')

const partnerDashboardRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: '/',
  component: lazyRouteComponent(pages, 'PartnerDashboard'),
})

const partnerTicketsRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'tickets',
  component: lazyRouteComponent(desk, 'PartnerTickets'),
})

const partnerAcceptedRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'accepted',
  component: lazyRouteComponent(desk, 'PartnerAccepted'),
})

export const partnerThreadRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'accepted/$ticketId',
  component: lazyRouteComponent(desk, 'PartnerThread'),
})

const partnerTrainRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'train',
  component: lazyRouteComponent(() => import('@/routes/partner/PartnerTraining'), 'PartnerTraining'),
})

const partnerAnswersRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'answers',
  component: lazyRouteComponent(() => import('@/routes/partner/PartnerAnswers'), 'PartnerAnswers'),
})

const partnerInstructionsRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'instructions',
  component: lazyRouteComponent(pages, 'PartnerInstructions'),
})

const partnerLibraryRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'library',
  component: lazyRouteComponent(pages, 'PartnerLibrary'),
})

const partnerProfileRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'profile',
  component: lazyRouteComponent(pages, 'PartnerProfile'),
})

export const partnerRouteTree = partnerLayoutRoute.addChildren([
  partnerDashboardRoute,
  partnerTicketsRoute,
  partnerAcceptedRoute,
  partnerThreadRoute,
  partnerTrainRoute,
  partnerAnswersRoute,
  partnerInstructionsRoute,
  partnerLibraryRoute,
  partnerProfileRoute,
])
