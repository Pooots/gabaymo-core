import { Outlet, createRootRoute } from '@tanstack/react-router'

import { NotFoundPage } from '@/routes/system/NotFoundPage'
import { RouteErrorPage } from '@/routes/system/RouteErrorPage'

export const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage,
})
