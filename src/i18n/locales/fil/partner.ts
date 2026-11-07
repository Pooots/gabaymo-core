import { partner as en } from '../en/partner'

/** The partner portal stays in English for now; every string already goes through t(). */
export const partner: Record<keyof typeof en, string> = { ...en }
