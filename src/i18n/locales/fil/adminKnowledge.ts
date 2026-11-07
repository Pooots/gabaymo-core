import { adminKnowledge as en } from '../en/adminKnowledge'

/** Filipino: falls back to English for now; every admin-knowledge string already goes through t(). */
export const adminKnowledge: Record<keyof typeof en, string> = { ...en }
