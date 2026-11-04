import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'

import { AdminLayout } from './routes/admin/AdminLayout'
import { AdminLoginPage } from './routes/admin/AdminLoginPage'
import { ModulePage, type ModuleKind } from './routes/admin/ModulePage'
import { OverviewPage } from './routes/admin/OverviewPage'
import { RolesPage } from './routes/admin/RolesPage'
import { AiReviewPage } from './routes/admin/AiReviewPage'
import { KnowledgeBasePage } from './routes/admin/KnowledgeBasePage'
import { KnowledgeSearchPage } from './routes/admin/KnowledgeSearchPage'
import { ServiceInstructionsPage } from './routes/admin/ServiceInstructionsPage'
import { SourceReviewPage } from './routes/admin/SourceReviewPage'
import { SubscriptionsPage } from './routes/admin/SubscriptionsPage'
import { AccountPage } from './routes/account/AccountPage'
import { UserLoginPage } from './routes/account/UserLoginPage'
import { UserRegisterPage } from './routes/account/UserRegisterPage'
import { HomePage } from './routes/HomePage'
import { readAdminToken } from './services/adminAuth'
import { memberHome, readMember, readMemberToken } from './services/memberAuth'
import { PartnerLayout } from './routes/partner/PartnerLayout'
import {
  PartnerDashboard,
  PartnerInstructions,
  PartnerLibrary,
  PartnerProfile,
} from './routes/partner/PartnerPages'
import { PartnerAccepted, PartnerThread, PartnerTickets } from './routes/partner/PartnerTicketDesk'
import { PartnersPage } from './routes/admin/PartnersPage'
import './styles.css'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    if (readMemberToken()) throw redirect({ to: memberHome() })
  },
  component: UserLoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  beforeLoad: () => {
    if (readMemberToken()) throw redirect({ to: memberHome() })
  },
  component: UserRegisterPage,
})

const partnerLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/partner',
  beforeLoad: () => {
    if (!readMemberToken()) throw redirect({ to: '/login' })
    if (readMember()?.type !== 'partners') throw redirect({ to: '/account' })
  },
  component: PartnerLayout,
})

const partnerDashboardRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: '/',
  component: PartnerDashboard,
})

const partnerTicketsRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'tickets',
  component: PartnerTickets,
})

const partnerAcceptedRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'accepted',
  component: PartnerAccepted,
})

const partnerThreadRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'accepted/$ticketId',
  component: PartnerThread,
})

const partnerInstructionsRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'instructions',
  component: PartnerInstructions,
})

const partnerLibraryRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'library',
  component: PartnerLibrary,
})

const partnerProfileRoute = createRoute({
  getParentRoute: () => partnerLayoutRoute,
  path: 'profile',
  component: PartnerProfile,
})

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  beforeLoad: () => {
    if (!readMemberToken()) throw redirect({ to: '/login' })
    if (readMember()?.type === 'partners') throw redirect({ to: '/partner' })
  },
  component: AccountPage,
})

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  beforeLoad: () => {
    if (readAdminToken()) {
      throw redirect({ to: '/admin' })
    }
  },
  component: AdminLoginPage,
})

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: () => {
    if (!readAdminToken()) {
      throw redirect({ to: '/admin/login' })
    }
  },
  component: AdminLayout,
})

const overviewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: OverviewPage,
})

function moduleRoute<TPath extends string>(path: TPath, kind: ModuleKind) {
  return createRoute({
    getParentRoute: () => adminLayoutRoute,
    path,
    component: function AdminModule() {
      return <ModulePage kind={kind} />
    },
  })
}

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  accountRoute,
  partnerLayoutRoute.addChildren([
    partnerDashboardRoute,
    partnerTicketsRoute,
    partnerAcceptedRoute,
    partnerThreadRoute,
    partnerInstructionsRoute,
    partnerLibraryRoute,
    partnerProfileRoute,
  ]),
  adminLoginRoute,
  adminLayoutRoute.addChildren([
    overviewRoute,
    moduleRoute('members', 'members'),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'roles',
      component: RolesPage,
    }),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'partners',
      component: PartnersPage,
    }),
    moduleRoute('tickets', 'tickets'),
    moduleRoute('access-keys', 'access-keys'),
    moduleRoute('referral-codes', 'referral-codes'),
    moduleRoute('plans', 'plans'),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'subscriptions',
      component: SubscriptionsPage,
    }),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'knowledge-library',
      component: KnowledgeBasePage,
    }),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'source-review',
      component: SourceReviewPage,
    }),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'knowledge-search',
      component: KnowledgeSearchPage,
    }),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'service-instructions',
      component: ServiceInstructionsPage,
    }),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'ai-review',
      component: AiReviewPage,
    }),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'knowledge-base',
      beforeLoad: () => {
        throw redirect({ to: '/admin/knowledge-library' })
      },
    }),
    createRoute({
      getParentRoute: () => adminLayoutRoute,
      path: 'library',
      beforeLoad: () => {
        throw redirect({ to: '/admin/knowledge-library' })
      },
    }),
    moduleRoute('payments', 'payments'),
    moduleRoute('audit-log', 'audit-log'),
  ]),
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
})

const rootElement = document.getElementById('app')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
