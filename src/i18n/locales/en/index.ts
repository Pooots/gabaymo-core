import { common } from './common'
import { home } from './home'
import { auth } from './auth'
import { account } from './account'
import { ask } from './ask'
import { tickets } from './tickets'
import { plan } from './plan'
import { settings } from './settings'
import { notifications } from './notifications'
import { usage } from './usage'
import { admin } from './admin'
import { adminKnowledge } from './adminKnowledge'
import { partner } from './partner'
import { adminOps } from './adminOps'
import { security } from './security'
import { legal } from './legal'
import { memberAccount } from './memberAccount'
import { conversations } from './conversations'
import { setup } from './setup'

/** English is the source of truth; add a namespace by adding a file here and in ../fil. */
export const en = {
  common,
  home,
  auth,
  account,
  ask,
  tickets,
  plan,
  settings,
  notifications,
  usage,
  admin,
  adminKnowledge,
  partner,
  adminOps,
  security,
  legal,
  memberAccount,
  conversations,
  setup,
}

export type Messages = { [N in keyof typeof en]: Record<keyof (typeof en)[N], string> }
