/**
 * Query-key roots per area. Every key starts with its area so a sign-out or
 * 401 can drop a whole area at once: queryClient.removeQueries({ queryKey: queryRoots.admin }).
 *
 * Each area file (member.ts, partner.ts, admin*.ts) builds its own key
 * factory on top of its root, e.g. memberKeys.conversations().
 */
export const queryRoots = {
  member: ['member'],
  partner: ['partner'],
  admin: ['admin'],
} as const
