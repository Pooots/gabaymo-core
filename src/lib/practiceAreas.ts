import type { MessageKey } from '@/i18n'

/** Shared ticket-routing list (gabaymo-ws App\Support\PracticeAreas). */
export const PRACTICE_AREA_KEYS = [
  'leave',
  'discipline',
  'appointment_promotion',
  'salary_benefits',
  'child_protection',
  'school_operations',
  'ethics',
  'other',
] as const

export type PracticeArea = (typeof PRACTICE_AREA_KEYS)[number]

const LABELS: Record<PracticeArea, MessageKey> = {
  leave: 'tickets.areaLeave',
  discipline: 'tickets.areaDiscipline',
  appointment_promotion: 'tickets.areaAppointmentPromotion',
  salary_benefits: 'tickets.areaSalaryBenefits',
  child_protection: 'tickets.areaChildProtection',
  school_operations: 'tickets.areaSchoolOperations',
  ethics: 'tickets.areaEthics',
  other: 'tickets.areaOther',
}

export function isPracticeArea(value: unknown): value is PracticeArea {
  return typeof value === 'string' && (PRACTICE_AREA_KEYS as ReadonlyArray<string>).includes(value)
}

/** Translated label; unknown keys fall back to a readable version of the key. */
export function practiceAreaLabel(t: (key: MessageKey) => string, key: string | null | undefined): string {
  if (!key) return ''
  return isPracticeArea(key) ? t(LABELS[key]) : key.replace(/_/g, ' ')
}
