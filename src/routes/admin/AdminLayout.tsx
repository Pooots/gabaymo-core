import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'

import { api } from '@/lib/api'
import {
  logoutAdmin,
  readAdminToken,
  readAdminUser,
  writeAdminUser,
  type AdminUser,
} from '@/services/adminAuth'

import { AdminNav, adminModules } from './AdminNav'

export function AdminLayout() {
  const current = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const [admin, setAdmin] = useState<AdminUser | null>(readAdminUser())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const token = readAdminToken()
    if (!token) return
    void api
      .get<{ user: AdminUser }>('/v1/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        writeAdminUser(data.user)
        setAdmin(data.user)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const permissions = admin?.permissions
    if (!permissions) return
    const currentItem = adminModules.find((item) =>
      item.exact ? current === item.to : current === item.to || current.startsWith(`${item.to}/`),
    )
    if (!currentItem || permissions.includes(currentItem.key)) return
    const next = adminModules.find((item) => permissions.includes(item.key))
    if (next) void navigate({ to: next.to })
  }, [admin, current, navigate])
  const title =
    adminModules.find((item) =>
      'exact' in item && item.exact
        ? current === item.to
        : current === item.to || current.startsWith(`${item.to}/`),
    )?.label ?? 'Admin'
  const isOverview = current === '/admin'

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-[#1c1c1c]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#eceae6] bg-[#f7f6f3] px-3 py-5 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to="/" className="mb-5 block px-2" aria-label="GabayMo home">
          <img src="/gabaymo-logo.png" alt="GabayMo" className="h-10 w-auto" />
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNav
            current={current}
            permissions={admin?.permissions}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className={`lg:pl-64 ${isOverview ? 'xl:h-dvh xl:overflow-hidden' : ''}`}>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[#eceae6] bg-[#f6f5f2]/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#e4e1db] lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <p className="text-sm font-medium text-[#3a3a3a]">{title}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-[#6d6d6d] sm:block">
              {admin?.email}
            </p>
            <button
              type="button"
              className="text-sm font-medium text-[#1c1c1c]"
              onClick={() => {
                void logoutAdmin().finally(() => {
                  window.location.assign('/admin/login')
                })
              }}
            >
              Log out
            </button>
          </div>
        </header>
        <main
          className={
            isOverview
              ? 'px-4 py-4 sm:px-6 xl:h-[calc(100dvh-3.5rem)] xl:overflow-hidden'
              : 'px-4 py-8 sm:px-8'
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
