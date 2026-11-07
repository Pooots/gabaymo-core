import { adminOps as en } from '../en/adminOps'

/** The admin console stays in English for now (like admin.ts); every string still goes through t(). */
export const adminOps: Record<keyof typeof en, string> = { ...en }
