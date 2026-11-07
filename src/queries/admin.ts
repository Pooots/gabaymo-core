import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryRoots } from './keys'
import type { RoleInput } from '@/services/roles'
import type { SubscriptionInput } from '@/services/subscriptions'
import type { MemberStatusFilter, OrganizationInput, TicketStatusFilter } from '@/services/adminOps'
import { fetchAudit, fetchOverview } from '@/services/adminAuth'
import { grantExtraUsage } from '@/services/memberAuth'
import {
  addOrganizationMember,
  changeMemberPlan,
  closeAdminTicket,
  createAccessKey,
  createReferralCode,
  deleteOrganization,
  fetchAccessKeys,
  fetchAdminMember,
  fetchAdminMembers,
  fetchAdminPartners,
  fetchAdminPayments,
  fetchAdminTicket,
  fetchAdminTickets,
  fetchAiAnalytics,
  fetchAiFeedback,
  fetchOrganizations,
  fetchPaymentsSummary,
  fetchReferralCodes,
  invitePartner,
  inviteStaff,
  removeOrganizationMember,
  resendPartnerInvite,
  resendStaffInvite,
  resetPartnerPassword,
  resetStaffPassword,
  revokeAccessKey,
  revokeReferralCode,
  saveOrganization,
  suspendMember,
  suspendPartner,
  suspendStaff,
  unsuspendMember,
  unsuspendPartner,
  unsuspendStaff,
} from '@/services/adminOps'
import { deleteRole, fetchRoles, saveRole } from '@/services/roles'
import { fetchSubscriptions, saveSubscription } from '@/services/subscriptions'
import { fetchMemberUsage } from '@/services/usage'

/**
 * Admin console data: query keys + hooks. Everything sits under
 * queryRoots.admin so signing out drops the whole area at once.
 */
export const adminKeys = {
  all: queryRoots.admin,
  overview: () => [...queryRoots.admin, 'overview'] as const,
  members: () => [...queryRoots.admin, 'members'] as const,
  member: (id: number) => [...queryRoots.admin, 'members', id] as const,
  memberUsage: (id: number) => [...queryRoots.admin, 'members', id, 'usage'] as const,
  audit: () => [...queryRoots.admin, 'audit'] as const,
  subscriptions: () => [...queryRoots.admin, 'subscriptions'] as const,
  roles: () => [...queryRoots.admin, 'roles'] as const,
  partners: () => [...queryRoots.admin, 'partners'] as const,
  partnerList: (params: object) => [...queryRoots.admin, 'partners', 'list', params] as const,
  memberList: (params: object) => [...queryRoots.admin, 'members', 'list', params] as const,
  tickets: () => [...queryRoots.admin, 'tickets'] as const,
  ticketList: (params: object) => [...queryRoots.admin, 'tickets', 'list', params] as const,
  ticket: (id: number) => [...queryRoots.admin, 'tickets', 'one', id] as const,
  payments: () => [...queryRoots.admin, 'payments'] as const,
  paymentList: (params: object) => [...queryRoots.admin, 'payments', 'list', params] as const,
  paymentsSummary: () => [...queryRoots.admin, 'payments', 'summary'] as const,
  accessKeys: () => [...queryRoots.admin, 'access-keys'] as const,
  accessKeyList: (params: object) => [...queryRoots.admin, 'access-keys', params] as const,
  referralCodes: () => [...queryRoots.admin, 'referral-codes'] as const,
  referralCodeList: (params: object) => [...queryRoots.admin, 'referral-codes', params] as const,
  organizations: () => [...queryRoots.admin, 'organizations'] as const,
  organizationList: (params: object) => [...queryRoots.admin, 'organizations', params] as const,
  aiFeedback: (params: object) => [...queryRoots.admin, 'ai', 'feedback', params] as const,
  aiAnalytics: (days: number) => [...queryRoots.admin, 'ai', 'analytics', days] as const,
}

type ListParams = { page: number; search?: string }

/** How often the overview refreshes while its tab is visible. */
export const OVERVIEW_REFRESH_MS = 30_000

/** Dashboard numbers; kept fresh while the tab is open (paused in the background, refreshed on focus). */
export function useOverview() {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: fetchOverview,
    staleTime: 0,
    refetchInterval: OVERVIEW_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
}

export function useMembers(params: ListParams & { status?: MemberStatusFilter }) {
  return useQuery({
    queryKey: adminKeys.memberList(params),
    queryFn: () => fetchAdminMembers(params),
    placeholderData: keepPreviousData,
  })
}

export function useMember(id: number) {
  return useQuery({
    queryKey: adminKeys.member(id),
    queryFn: () => fetchAdminMember(id),
    enabled: Number.isFinite(id),
  })
}

export function useMemberUsage(id: number) {
  return useQuery({
    queryKey: adminKeys.memberUsage(id),
    queryFn: () => fetchMemberUsage(id),
    enabled: Number.isFinite(id),
  })
}

/** Suspend / unsuspend / change plan; each puts the fresh member in the cache and refreshes lists. */
export function useMemberActions(id: number) {
  const client = useQueryClient()
  const onSuccess = (member: Awaited<ReturnType<typeof fetchAdminMember>>) => {
    client.setQueryData(adminKeys.member(id), member)
    void client.invalidateQueries({ queryKey: [...adminKeys.members(), 'list'] })
  }
  return {
    suspend: useMutation({ mutationFn: (reason: string) => suspendMember(id, reason), onSuccess }),
    unsuspend: useMutation({ mutationFn: () => unsuspendMember(id), onSuccess }),
    plan: useMutation({
      mutationFn: (input: { subscription_plan_id: number; period_end?: string | null }) => changeMemberPlan(id, input),
      onSuccess,
    }),
  }
}

/** Grant extra usage (percent of plan); updates the member and refreshes lists + history. */
export function useGrantExtraUsage(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { percent: number; note: string }) => grantExtraUsage(id, input.percent, input.note),
    onSuccess: (member) => {
      client.setQueryData(adminKeys.member(id), member)
      void client.invalidateQueries({ queryKey: [...adminKeys.members(), 'list'] })
      void client.invalidateQueries({ queryKey: adminKeys.memberUsage(id) })
    },
  })
}

export function useAuditLog() {
  return useQuery({ queryKey: adminKeys.audit(), queryFn: fetchAudit })
}

export function useSubscriptions() {
  return useQuery({ queryKey: adminKeys.subscriptions(), queryFn: fetchSubscriptions })
}

/** Create (id null) or update a plan. Resolves after the list has been refetched. */
export function useSaveSubscription() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: number | null; plan: SubscriptionInput }) => saveSubscription(input.id, input.plan),
    onSuccess: async () => {
      void client.invalidateQueries({ queryKey: adminKeys.overview() })
      await client.invalidateQueries({ queryKey: adminKeys.subscriptions() })
    },
  })
}

export type RolesData = Awaited<ReturnType<typeof fetchRoles>>

export function useRoles() {
  return useQuery({ queryKey: adminKeys.roles(), queryFn: fetchRoles })
}

/** Role mutations; each resolves after the roles list has been refetched. */
export function useRoleActions() {
  const client = useQueryClient()
  const onSuccess = () => client.invalidateQueries({ queryKey: adminKeys.roles() })
  return {
    save: useMutation({
      mutationFn: (input: { id: number | null; role: RoleInput }) => saveRole(input.id, input.role),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: deleteRole, onSuccess }),
    invite: useMutation({
      mutationFn: (input: { roleId: number; account: { name: string; email: string } }) => inviteStaff(input.roleId, input.account),
      onSuccess,
    }),
    resendInvite: useMutation({
      mutationFn: (input: { roleId: number; adminId: number }) => resendStaffInvite(input.roleId, input.adminId),
      onSuccess,
    }),
    resetPassword: useMutation({
      mutationFn: (input: { roleId: number; adminId: number }) => resetStaffPassword(input.roleId, input.adminId),
      onSuccess,
    }),
    suspend: useMutation({
      mutationFn: (input: { roleId: number; adminId: number }) => suspendStaff(input.roleId, input.adminId),
      onSuccess,
    }),
    unsuspend: useMutation({
      mutationFn: (input: { roleId: number; adminId: number }) => unsuspendStaff(input.roleId, input.adminId),
      onSuccess,
    }),
  }
}

export function usePartners(params: ListParams) {
  return useQuery({
    queryKey: adminKeys.partnerList(params),
    queryFn: () => fetchAdminPartners(params),
    placeholderData: keepPreviousData,
  })
}

export function usePartnerActions() {
  const client = useQueryClient()
  const onSuccess = () => client.invalidateQueries({ queryKey: adminKeys.partners() })
  return {
    invite: useMutation({ mutationFn: invitePartner, onSuccess }),
    suspend: useMutation({ mutationFn: (input: { id: number; reason: string }) => suspendPartner(input.id, input.reason), onSuccess }),
    unsuspend: useMutation({ mutationFn: unsuspendPartner, onSuccess }),
    resetPassword: useMutation({ mutationFn: resetPartnerPassword, onSuccess }),
    resendInvite: useMutation({ mutationFn: resendPartnerInvite, onSuccess }),
  }
}

export function useAdminTickets(params: ListParams & { status?: TicketStatusFilter; practice_area?: string }) {
  return useQuery({
    queryKey: adminKeys.ticketList(params),
    queryFn: () => fetchAdminTickets(params),
    placeholderData: keepPreviousData,
  })
}

export function useAdminTicket(id: number | null) {
  return useQuery({
    queryKey: adminKeys.ticket(id ?? -1),
    queryFn: () => fetchAdminTicket(id ?? -1),
    enabled: id !== null,
  })
}

export function useCloseAdminTicket() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: closeAdminTicket,
    onSuccess: () => client.invalidateQueries({ queryKey: adminKeys.tickets() }),
  })
}

export function usePaymentsSummary() {
  return useQuery({ queryKey: adminKeys.paymentsSummary(), queryFn: fetchPaymentsSummary })
}

export function useAdminPayments(params: ListParams & { status?: string }) {
  return useQuery({
    queryKey: adminKeys.paymentList(params),
    queryFn: () => fetchAdminPayments(params),
    placeholderData: keepPreviousData,
  })
}

export function useAccessKeys(params: ListParams) {
  return useQuery({ queryKey: adminKeys.accessKeyList(params), queryFn: () => fetchAccessKeys(params), placeholderData: keepPreviousData })
}

export function useAccessKeyActions() {
  const client = useQueryClient()
  const onSuccess = () => client.invalidateQueries({ queryKey: adminKeys.accessKeys() })
  return {
    create: useMutation({ mutationFn: createAccessKey, onSuccess }),
    revoke: useMutation({ mutationFn: revokeAccessKey, onSuccess }),
  }
}

export function useReferralCodes(params: ListParams) {
  return useQuery({
    queryKey: adminKeys.referralCodeList(params),
    queryFn: () => fetchReferralCodes(params),
    placeholderData: keepPreviousData,
  })
}

export function useReferralCodeActions() {
  const client = useQueryClient()
  const onSuccess = () => client.invalidateQueries({ queryKey: adminKeys.referralCodes() })
  return {
    create: useMutation({ mutationFn: createReferralCode, onSuccess }),
    revoke: useMutation({ mutationFn: revokeReferralCode, onSuccess }),
  }
}

export function useOrganizations(params: ListParams) {
  return useQuery({
    queryKey: adminKeys.organizationList(params),
    queryFn: () => fetchOrganizations(params),
    placeholderData: keepPreviousData,
  })
}

export function useOrganizationActions() {
  const client = useQueryClient()
  const onSuccess = () => client.invalidateQueries({ queryKey: adminKeys.organizations() })
  return {
    save: useMutation({ mutationFn: (input: { id: number | null; organization: OrganizationInput }) => saveOrganization(input.id, input.organization), onSuccess }),
    addMember: useMutation({ mutationFn: (input: { id: number; email: string }) => addOrganizationMember(input.id, input.email), onSuccess }),
    removeMember: useMutation({ mutationFn: (input: { id: number; userId: number }) => removeOrganizationMember(input.id, input.userId), onSuccess }),
    remove: useMutation({ mutationFn: (id: number) => deleteOrganization(id), onSuccess }),
  }
}

export function useAiFeedback(params: { page: number; rating: '' | 'up' | 'down' }) {
  return useQuery({ queryKey: adminKeys.aiFeedback(params), queryFn: () => fetchAiFeedback(params), placeholderData: keepPreviousData })
}

export function useAiAnalytics(days: number) {
  return useQuery({ queryKey: adminKeys.aiAnalytics(days), queryFn: () => fetchAiAnalytics(days), placeholderData: keepPreviousData })
}
