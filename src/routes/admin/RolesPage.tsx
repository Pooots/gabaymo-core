import { useEffect, useState, type FormEvent } from 'react'

import {
  addRoleAccount,
  deleteRole,
  fetchRoles,
  roleError,
  saveRole,
  type PermissionModule,
  type StaffRole,
} from '@/services/roles'

type Draft = {
  name: string
  description: string
  permissions: string[]
}

const blank: Draft = { name: '', description: '', permissions: ['overview'] }

export function RolesPage() {
  const [modules, setModules] = useState<PermissionModule[]>([])
  const [roles, setRoles] = useState<StaffRole[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [person, setPerson] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    void fetchRoles()
      .then((data) => {
        setModules(data.modules)
        setRoles(data.roles)
        const admin = data.roles.find((role) => role.is_system) ?? data.roles[0]
        if (admin) {
          setSelectedId(admin.id)
          setDraft(toDraft(admin))
        }
      })
      .catch(() => setError('Could not load roles.'))
      .finally(() => setLoading(false))
  }, [])

  const selected = roles.find((role) => role.id === selectedId) ?? null
  const groups = [...new Set(modules.map((item) => item.group))]

  function selectRole(role: StaffRole) {
    setSelectedId(role.id)
    setDraft(toDraft(role))
    setPerson({ name: '', email: '', password: '' })
    setError('')
    setNotice('')
    setConfirmDelete(false)
  }

  function startNew() {
    setSelectedId(null)
    setDraft(blank)
    setPerson({ name: '', email: '', password: '' })
    setError('')
    setNotice('')
    setConfirmDelete(false)
  }

  function togglePermission(key: string) {
    if (selected?.is_system) return
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.includes(key)
        ? current.permissions.filter((item) => item !== key)
        : [...current.permissions, key],
    }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    setNotice('')
    try {
      const saved = await saveRole(selectedId, {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        permissions: draft.permissions,
      })
      const data = await fetchRoles()
      setRoles(data.roles)
      setSelectedId(saved.id)
      setDraft(toDraft(data.roles.find((role) => role.id === saved.id) ?? saved))
      setNotice(selectedId ? 'Role updated.' : 'Role created.')
    } catch (caught) {
      setError(roleError(caught))
    } finally {
      setPending(false)
    }
  }

  async function onAddPerson(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      const saved = await addRoleAccount(selected.id, {
        name: person.name.trim(),
        email: person.email.trim(),
        password: person.password,
      })
      const data = await fetchRoles()
      setRoles(data.roles)
      setDraft(toDraft(data.roles.find((role) => role.id === saved.id) ?? saved))
      setPerson({ name: '', email: '', password: '' })
      setNotice(`${person.email.trim()} can now sign in with this role.`)
    } catch (caught) {
      setError(roleError(caught))
    } finally {
      setPending(false)
    }
  }

  async function onDelete() {
    if (!selected || selected.is_system) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setPending(true)
    setError('')
    try {
      await deleteRole(selected.id)
      const data = await fetchRoles()
      setRoles(data.roles)
      const next = data.roles[0]
      if (next) selectRole(next)
      else startNew()
      setNotice('Role removed.')
    } catch (caught) {
      setError(roleError(caught))
    } finally {
      setPending(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-4xl font-medium tracking-[-0.03em]">Roles & permissions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6d6d6d]">
            The administrator account keeps full access. Create another role when someone should open only some modules.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[#171717] px-4 py-2 text-sm font-medium text-white"
          onClick={startNew}
        >
          Add role
        </button>
      </div>

      <div className="mt-6 grid items-start gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <section className="rounded-3xl border border-[#eceae6] bg-white">
          {loading ? (
            <p className="px-5 py-10 text-sm text-[#6d6d6d]">Loading roles…</p>
          ) : (
            <ul>
              {roles.map((role) => (
                <li key={role.id} className="border-b border-[#f3f1ed] last:border-0">
                  <button
                    type="button"
                    className={`w-full px-5 py-4 text-left ${
                      role.id === selectedId ? 'bg-[#f7f6f3]' : 'hover:bg-[#fafaf8]'
                    }`}
                    onClick={() => selectRole(role)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium">{role.name}</span>
                      {role.is_system ? (
                        <span className="rounded-full bg-[#171717] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                          ADMIN
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs text-[#6d6d6d]">
                      {role.accounts.length} account{role.accounts.length === 1 ? '' : 's'} · {role.permissions.length} modules
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form
          className="rounded-3xl border border-[#eceae6] bg-white p-5 sm:p-6"
          onSubmit={(event) => void onSubmit(event)}
        >
          <h2 className="text-lg font-semibold">{selected ? selected.name : 'New role'}</h2>
          {selected?.is_system ? (
            <p className="mt-1 text-xs text-[#6d6d6d]">
              This role is locked to the platform admin account and can open every module.
            </p>
          ) : null}

          <div className="mt-5 grid gap-4">
            <label>
              <span className="mb-1.5 block text-xs font-medium tracking-wide text-[#6d6d6d] uppercase">
                Name
              </span>
              <input
                required
                disabled={selected?.is_system}
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className={inputClass}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium tracking-wide text-[#6d6d6d] uppercase">
                Description
              </span>
              <input
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          <div className="mt-6 space-y-4">
            {groups.map((group) => (
              <fieldset key={group}>
                <legend className="text-xs font-semibold tracking-[0.14em] text-[#9a948c] uppercase">
                  {group}
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {modules
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <label key={item.key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draft.permissions.includes(item.key)}
                          disabled={selected?.is_system}
                          onChange={() => togglePermission(item.key)}
                        />
                        {item.label}
                      </label>
                    ))}
                </div>
              </fieldset>
            ))}
          </div>

          {selected ? (
            <div className="mt-6 rounded-2xl bg-[#f7f6f3] p-4">
              <p className="text-sm font-medium">Accounts</p>
              {selected.accounts.length === 0 ? (
                <p className="mt-2 text-sm text-[#6d6d6d]">No one is on this role yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {selected.accounts.map((account) => (
                    <li key={account.id} className="text-sm">
                      <span className="font-medium">{account.name}</span>
                      <span className="mt-0.5 block text-xs text-[#6d6d6d]">{account.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-xl bg-[#fff1f0] px-3 py-2 text-sm text-[#9f2d2d]">{error}</p>
          ) : null}
          {notice ? (
            <p className="mt-4 rounded-xl bg-[#eef7f1] px-3 py-2 text-sm text-[#0e5c3c]">{notice}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" className="btn-primary h-11 px-5" disabled={pending}>
              {pending ? 'Saving…' : selected ? 'Save role' : 'Create role'}
            </button>
            {selected && !selected.is_system ? (
              <button
                type="button"
                className="h-11 rounded-full border border-[#e4e1db] px-5 text-sm font-medium"
                disabled={pending}
                onClick={() => void onDelete()}
              >
                {confirmDelete ? 'Confirm remove' : 'Remove role'}
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {selected ? (
        <form
          className="mt-4 rounded-3xl border border-[#eceae6] bg-white p-5 sm:p-6"
          onSubmit={(event) => void onAddPerson(event)}
        >
          <h2 className="text-lg font-semibold">Give someone this role</h2>
          <p className="mt-1 text-sm text-[#6d6d6d]">
            They sign in at the admin page with this email and password, and only see the modules checked above.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              required
              placeholder="Name"
              value={person.name}
              onChange={(event) => setPerson({ ...person, name: event.target.value })}
              className={inputClass}
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={person.email}
              onChange={(event) => setPerson({ ...person, email: event.target.value })}
              className={inputClass}
            />
            <input
              required
              type="password"
              minLength={8}
              placeholder="Password"
              value={person.password}
              onChange={(event) => setPerson({ ...person, password: event.target.value })}
              className={inputClass}
            />
          </div>
          <button type="submit" className="btn-primary mt-4 h-11 px-5" disabled={pending}>
            Create access
          </button>
        </form>
      ) : null}
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-2xl border border-[#e4e1db] bg-[#fbfcfb] px-3 text-sm outline-none transition focus:border-[#0e6b3e] focus:ring-4 focus:ring-[#0e6b3e]/10 disabled:bg-[#f3f1ed]'

function toDraft(role: StaffRole): Draft {
  return {
    name: role.name,
    description: role.description ?? '',
    permissions: role.permissions,
  }
}
