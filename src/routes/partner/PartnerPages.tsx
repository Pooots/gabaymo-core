import { useState } from 'react'
import { MessageSquareText } from 'lucide-react'

import { DUTIES, DashboardSkeleton, DashboardView } from './pages/DashboardView'
import { LibraryReader, LibraryRow } from './pages/LibraryViews'
import { ProfileForm } from './pages/ProfileForm'
import { Banner, Card, ErrorState, LoadingState, PageHeader, QueryState, Skeleton, inputClass } from '@/components/ui'
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm'
import { useI18n } from '@/i18n'
import { changePartnerPassword } from '@/services/partners'
import { usePartnerDashboard, usePartnerLibrary, usePartnerLibraryDocument } from '@/queries/partner'
import { InstructionEditor } from '@/routes/admin/knowledge/InstructionEditor'

export function PartnerDashboard() {
  const query = usePartnerDashboard()
  return (
    <QueryState query={query} loading={<DashboardSkeleton />}>
      {(data) => <DashboardView data={data} />}
    </QueryState>
  )
}

export function PartnerInstructions() {
  const { t } = useI18n()
  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow={t('partner.instructionsEyebrow')}
        title={t('partner.navInstructions')}
        description={t('partner.instructionsDescription')}
      />

      <Banner className="mt-6">{t('partner.instructionsBanner')}</Banner>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <InstructionEditor base="partner" scope="partner" partnerId={null} icon={MessageSquareText} />

        <Card className="p-6">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-ash-447 uppercase">{t('partner.onEveryTicket')}</p>
          <ol className="mt-3 space-y-3">
            {DUTIES.map((duty, index) => (
              <li key={duty} className="flex gap-3 text-sm leading-relaxed text-ash-773">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-moss-53 text-[11px] font-semibold text-brand-strong">
                  {index + 1}
                </span>
                {t(duty)}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}

export function PartnerLibrary() {
  const { t } = useI18n()
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const list = usePartnerLibrary(search)
  const docQuery = usePartnerLibraryDocument(openId)

  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">{t('partner.libraryEyebrow')}</p>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">{t('partner.navLibrary')}</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t('partner.libraryDescription')}</p>
      <form
        role="search"
        className="mt-6 max-w-md"
        onSubmit={(event) => {
          event.preventDefault()
          setSearch(draft.trim())
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('partner.librarySearchPlaceholder')}
          aria-label={t('partner.librarySearchLabel')}
          className={`${inputClass} h-10`}
        />
      </form>
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-2">
          <QueryState
            query={list}
            compact
            errorTitle={t('partner.libraryLoadError')}
            loading={<LoadingState rows={4} label={t('partner.libraryLoading')} />}
            isEmpty={(rows) => rows.length === 0}
            empty={
              <p className="rounded-3xl border border-line bg-surface px-6 py-16 text-center text-sm text-ash-573">
                {t('partner.libraryEmpty')}
              </p>
            }
          >
            {(rows) =>
              rows.map((row) => (
                <LibraryRow key={row.id} row={row} selected={openId === row.id} onOpen={() => setOpenId(row.id)} />
              ))
            }
          </QueryState>
        </div>
        <article aria-live="polite" className="min-w-0 rounded-3xl border border-line bg-surface p-6">
          <LibraryReader openId={openId} query={docQuery} />
        </article>
      </div>
    </div>
  )
}

export function PartnerProfile() {
  const { t } = useI18n()
  const query = usePartnerDashboard()

  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">{t('partner.profileEyebrow')}</p>
      <h1 className="serif mt-3 text-4xl font-medium tracking-[-0.03em]">{t('partner.navProfile')}</h1>
      {query.isPending ? (
        <div role="status" aria-busy="true" className="mt-2 max-w-xl space-y-4">
          <span className="sr-only">{t('common.loading')}</span>
          <Skeleton className="h-4 w-48" />
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-11 w-full rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          className="mt-4 max-w-xl"
          compact
          title={t('partner.profileLoadError')}
          error={query.error}
          retrying={query.isRefetching}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          <p className="mt-2 text-sm break-words text-muted">{query.data.partner.email}</p>
          <ProfileForm profile={query.data.partner} />
          <section className="mt-10 max-w-xl">
            <h2 className="text-lg font-semibold">{t('security.changePassword')}</h2>
            <div className="mt-4">
              <ChangePasswordForm submit={changePartnerPassword} minLength={8} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
