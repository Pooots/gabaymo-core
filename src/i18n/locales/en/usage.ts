/** Strings for the usage area. Keys are camelCase; '{name}' placeholders; plurals use _one/_other. */
export const usage = {
  barLabel: 'Plan usage',
  used: '{percent} used',
  limitReached: 'Usage limit reached',
  pill: 'Usage',
  thisPeriod: 'This period',
  thisMonth: 'This month',
  trial: 'Trial usage',
  heldAll: 'Your remaining usage is held by questions still being answered.',
  monthUsedUp: 'You have used all of this month’s usage. It refreshes on {date}.',
  trialUsedUp: 'You have used all of your trial usage. Upgrade to keep asking.',
  left: '{percent} left',
  leftRefreshes: '{left} · refreshes on {date}',
  held: '{percent} is held for questions still being answered.',
  extraLabel: 'Extra usage:',
  extraBody: 'of your plan, used after your plan allowance runs out. It does not expire.',
} as const
