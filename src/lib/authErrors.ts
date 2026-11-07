import axios from 'axios'

import { t as translate } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'

/**
 * Sign-in failures in the user's language: suspended (403
 * `account_suspended`), locked staff (429 `account_locked`), throttled (429),
 * else the API's own message or `fallback`.
 */
export function signInErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const code = (error.response?.data as { error?: string } | undefined)?.error
    if (code === 'account_suspended') return translate('auth.accountSuspended')
    if (code === 'account_locked') return translate('auth.accountLocked')
    if (status === 429) return translate('auth.tooManyAttempts')
  }
  return apiErrorMessage(error, fallback)
}
