import { useEffect, useRef, useState } from 'react'

import { useI18n } from '@/i18n'
import { apiErrorMessage } from '@/lib/errors'
import { useConfirmPayment } from '@/queries/member'

/**
 * Back from PayMongo (`/account?payment=<ref>[&cancelled=1]`): confirm the
 * payment once, refresh the profile and say what happened. `onReturn` opens
 * the plan panel. Returns the message to show (null when there is none).
 */
export function usePaymentReturn(onReturn: () => void) {
  const { t } = useI18n()
  const confirm = useConfirmPayment()
  const [message, setMessage] = useState<string | null>(null)
  const handled = useRef(false)
  const onReturnRef = useRef(onReturn)
  useEffect(() => {
    onReturnRef.current = onReturn
  })

  const { mutate } = confirm
  useEffect(() => {
    if (handled.current) return
    const params = new URLSearchParams(window.location.search)
    const reference = params.get('payment')
    if (!reference) return
    handled.current = true
    const cancelled = params.get('cancelled') === '1'
    window.history.replaceState({}, '', '/account')
    if (cancelled) {
      onReturnRef.current()
      setMessage(t('plan.paymentCancelled'))
      return
    }
    mutate(reference, {
      onSuccess: ({ status, member }) => {
        onReturnRef.current()
        setMessage(status === 'paid' ? t('plan.paymentReceived', { plan: member.plan }) : t('plan.paymentPending'))
      },
      onError: (error) => {
        onReturnRef.current()
        setMessage(apiErrorMessage(error, t('plan.paymentError')))
      },
    })
  }, [mutate, t])

  return message
}
