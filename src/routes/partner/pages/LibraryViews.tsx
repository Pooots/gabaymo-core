import type { DocumentRow } from '@/services/ai'
import type { usePartnerLibraryDocument } from '@/queries/partner'
import { ErrorState, Skeleton } from '@/components/ui'
import { useI18n } from '@/i18n'
import { LegalBadge, RegionPills } from '@/routes/admin/knowledge/KnowledgeUi'
import { formatDate } from '@/services/ai'

/** One source in the library list. */
export function LibraryRow({ row, selected, onOpen }: { row: DocumentRow; selected: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      className={`w-full rounded-2xl border px-4 py-3 text-left ${selected ? 'border-brand bg-surface' : 'border-line bg-surface hover:border-moss-220'}`}
    >
      <p className="text-sm font-medium break-words">{row.title}</p>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-moss-555">
        {row.document_type_label}
        {row.document_number ? ` · ${row.document_number}` : ''}
        <RegionPills document={row} />
        {row.legal_status && row.legal_status !== 'in_force' ? <LegalBadge status={row.legal_status} /> : null}
      </p>
    </button>
  )
}

/** The reading pane: pick prompt, skeleton, error with retry, or the document's pages. */
export function LibraryReader({ openId, query }: { openId: string | null; query: ReturnType<typeof usePartnerLibraryDocument> }) {
  const { t, tn } = useI18n()

  if (!openId) return <p className="text-sm text-ash-573">{t('partner.libraryPick')}</p>
  if (query.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">{t('partner.libraryOpening')}</span>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="mt-5 h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <ErrorState
        compact
        title={t('partner.libraryOpenError')}
        error={query.error}
        retrying={query.isRefetching}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const open = query.data
  const newer = open.newer_issuances
  return (
    <>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-brand">
        {open.document.document_type_label}
        {open.document.document_number ? ` · ${open.document.document_number}` : ''}
      </p>
      <h2 className="serif mt-2 text-3xl font-medium tracking-[-0.03em] break-words">{open.document.title}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <RegionPills document={open.document} />
      </div>
      {open.version.description ? <p className="mt-3 text-sm leading-relaxed text-moss-731">{open.version.description}</p> : null}
      {open.version.effectivity_date ? (
        <p className="mt-1 text-xs text-moss-555">{t('partner.libraryEffective', { date: formatDate(open.version.effectivity_date) })}</p>
      ) : null}
      {newer.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-rust-124 bg-rust-33 px-4 py-3 text-xs text-rust-620">
          {tn('partner.libraryOutdated', newer.length, {
            list: newer.map((n) => `${n.document_number ?? n.title} (${n.relation})`).join(', '),
          })}
        </div>
      ) : null}
      <div className="mt-5 space-y-5">
        {open.pages.map((page) => (
          <section key={page.page_number}>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-ash-447 uppercase">
              {t('partner.libraryPage', { page: page.page_number })}
            </p>
            <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap text-moss-833">{page.text}</p>
          </section>
        ))}
      </div>
    </>
  )
}
