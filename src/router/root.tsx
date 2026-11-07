import { Outlet, createRootRoute } from '@tanstack/react-router'

import { usePageMeta } from '@/lib/pageMeta'
import { NotFoundPage } from '@/routes/system/NotFoundPage'
import { RouteErrorPage } from '@/routes/system/RouteErrorPage'

function RootLayout() {
  usePageMeta()
  return <Outlet />
}

export const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage,
})
