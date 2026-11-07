import { admin as en } from '../en/admin'

/** The admin console stays in English for now; every string still goes through t(). */
export const admin: Record<keyof typeof en, string> = { ...en }
