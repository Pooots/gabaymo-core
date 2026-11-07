import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import { registerSessionHandlers, router } from './router'
import { queryClient } from './lib/queryClient'
import { applyTheme } from './lib/theme'
import { registerServiceWorker } from './lib/pwa'
import './i18n'
import './styles.css'

applyTheme()
registerSessionHandlers(router)
registerServiceWorker()

const rootElement = document.getElementById('app')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
