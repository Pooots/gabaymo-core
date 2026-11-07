import { useState } from 'react'
import { History, MessageSquareText, ShieldCheck } from 'lucide-react'

import { InstructionEditor } from './knowledge/InstructionEditor'
import { Banner, Card, CardTitle, ErrorState, LoadingState, PageHeader, Select, Tabs } from '@/components/ui'
import { useI18n } from '@/i18n'
import { useDocumentStatusCounts, usePartnerOptions } from '@/queries/adminKnowledge'

export function ServiceInstructionsPage() {
  const { t } = useI18n()
  const [scope, setScope] = useState<'global' | 'partner'>('global')
  const [chosenPartner, setChosenPartner] = useState<number | null>(null)
  const partnersQuery = usePartnerOptions()
  const countsQuery = useDocumentStatusCounts()
  const partners = partnersQuery.data ?? []
  // Default to the first partner until one is picked.
  const partnerId = chosenPartner ?? partners[0]?.id ?? null
  const counts = countsQuery.data

  const waiting = (counts?.awaiting_review ?? 0) + (counts?.corrected ?? 0)
  const excluded = (counts?.returned ?? 0) + (counts?.rejected ?? 0) + (counts?.failed ?? 0)

  return (
    <div className="w-full">
      <PageHeader title={t('adminKnowledge.instructionsTitle')} description={t('adminKnowledge.instructionsDescription')} />

      <Banner className="mt-6">{t('adminKnowledge.instructionsBanner')}</Banner>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Tabs<'global' | 'partner'>
          value={scope}
          onChange={setScope}
          label={t('adminKnowledge.instructionScope')}
          tabs={[
            { id: 'global', label: t('adminKnowledge.globalInstructions') },
            { id: 'partner', label: t('adminKnowledge.partnerInstructions') },
          ]}
        />
        {scope === 'partner' && !partnersQuery.isError ? (
          <div className="w-full sm:w-72">
            <Select aria-label={t('adminKnowledge.partner')} value={partnerId ?? ''} onChange={(e) => setChosenPartner(e.target.value ? Number(e.target.value) : null)}>
              {partners.length === 0 ? <option value="">{partnersQuery.isPending ? t('common.loading') : t('adminKnowledge.noPartnersYet')}</option> : null}
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (#{p.id})
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        {scope === 'global' ? (
          <InstructionEditor key="global" base="admin" scope="global" partnerId={null} icon={MessageSquareText} />
        ) : partnersQuery.isError ? (
          <Card>
            <ErrorState error={partnersQuery.error} title={t('adminKnowledge.partnersLoadError')} retrying={partnersQuery.isRefetching} onRetry={() => void partnersQuery.refetch()} />
          </Card>
        ) : partnersQuery.isPending ? (
          <LoadingState />
        ) : partnerId ? (
          <InstructionEditor key={`p-${partnerId}`} base="admin" scope="partner" partnerId={partnerId} icon={MessageSquareText} />
        ) : (
          <Card className="p-6 text-sm text-ash-573">{t('adminKnowledge.addPartnerFirst')}</Card>
        )}

        <Card className="p-6">
          <CardTitle icon={ShieldCheck}>{t('adminKnowledge.whatCanCite')}</CardTitle>
          {countsQuery.isPending ? (
            <LoadingState className="mt-4" rows={3} />
          ) : countsQuery.isError || !counts ? (
            <ErrorState compact className="mt-4" error={countsQuery.error} retrying={countsQuery.isRefetching} onRetry={() => void countsQuery.refetch()} />
          ) : (
            <div className="mt-4 space-y-2">
              <CountRow title={t('adminKnowledge.countPublished')} text={t('adminKnowledge.countPublishedHelp')} count={counts.published ?? 0} tone="green" />
              <CountRow title={t('adminKnowledge.countWaiting')} text={t('adminKnowledge.countWaitingHelp')} count={waiting} tone="amber" />
              <CountRow title={t('adminKnowledge.countExcluded')} text={t('adminKnowledge.countExcludedHelp')} count={excluded} tone="gray" />
            </div>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ash-447">
            <History size={12} aria-hidden /> {t('adminKnowledge.everyEditVersioned')}
          </p>
        </Card>
      </div>
    </div>
  )
}

function CountRow({ title, text, count, tone }: { title: string; text: string; count: number; tone: 'green' | 'amber' | 'gray' }) {
  const badge = { green: 'bg-moss-53 text-brand-strong', amber: 'bg-honey-47 text-honey-694', gray: 'bg-sand-53 text-ash-639' }[tone]
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-sand-73 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ash-573">{text}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>{count}</span>
    </div>
  )
}
