import type { usage as en } from '../en/usage'

export const usage: Record<keyof typeof en, string> = {
  barLabel: 'Usage ng plan',
  used: '{percent} nagamit',
  limitReached: 'Naabot na ang usage limit',
  pill: 'Usage',
  thisPeriod: 'Ngayong period',
  thisMonth: 'Ngayong buwan',
  trial: 'Trial usage',
  heldAll: 'Nakareserba ang natitira mong usage para sa mga tanong na sinasagot pa.',
  monthUsedUp: 'Naubos mo na ang usage ngayong buwan. Magre-refresh ito sa {date}.',
  trialUsedUp: 'Naubos mo na ang trial usage mo. I-upgrade ang plan para makapagtanong pa.',
  left: '{percent} natitira',
  leftRefreshes: '{left} · magre-refresh sa {date}',
  held: '{percent} ang nakareserba para sa mga tanong na sinasagot pa.',
  extraLabel: 'Extra usage:',
  extraBody: 'ng plan mo, gagamitin kapag naubos na ang allowance ng plan mo. Hindi ito nag-e-expire.',
}
