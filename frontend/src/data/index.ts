/**
 * Page data import surface.
 *
 * Today pages pull mock adapters from here. When teammate ships network query
 * hooks with the same call signature + {@link MockRowResult} return shape,
 * swap the re-exports in this file only — do not chase imports across pages.
 *
 * Hook contracts (screen → endpoint → expected hook): see
 * `docs/API_HOOK_CONTRACTS.md`.
 */

export type {
  MockRowResult,
} from '../mocks/adapters';

export {
  useMasterKpiRow,
  useMasterTracksRow,
  useMasterReportsRow,
  useTrackListRow,
  useTrackDetailRow,
  useClassListRow,
  useMemberKpiRow,
  useMemberListRow,
  useNoticesRow,
  useTrackAnalyticsRow,
  useClassAnalyticsRow,
  useManagerDashboardRow,
  useManagerStudentsRow,
  useStudentOverviewRow,
  useManagerSessionsRow,
  useManagerGroupsRow,
  useStudentDashboardRow,
  useClassLobbyRow,
  useMyPageRow,
  useFinalReportRow,
  useInvitationPreviewRow,
} from '../mocks/adapters';

export type {
  AnalyticsClassSummary,
  ClassCard,
  ClassRole,
  HrAlert,
  InvitationPreview,
  KpiItem,
  ManagerActivity,
  MemberRow,
  NoticeItem,
  PendingInvite,
  ReportRow,
  RowStatus,
  SessionSummaryRow,
  TrackAlert,
  TrackCard,
  TrackDetailClass,
  TrackListItem,
  TrackManager,
} from '../mocks/fixtures';

/** Shared API envelope types already used by `network/` (teammate). */
export type {
  ApiErrorBody,
  AsyncJobResponse,
  AsyncJobStatus,
  ListParams,
  PageMeta,
  PageResponse,
  UserRole,
} from '../network/core/types';

/**
 * Auth / user / session hooks — re-exported from teammate's `network/`.
 * Pages and shells import from here only (never deep-import network query modules).
 */
export { useLogin, useLogout, useMe } from '../network/auth';
export type { AuthUserResponse, LoginRequest } from '../network/auth';
export {
  useSignUp,
  useGetUserProfile,
  useUpdateUserProfile,
} from '../network/user';
export type {
  UserSignUpRequest,
  UserSignUpResponse,
  UserProfileResponse,
  UserProfileUpdateRequest,
} from '../network/user';
export {
  useCreateSession,
  useGetSessions,
  useGetSession,
  useUpdateSession,
  useDeleteSession,
} from '../network/session';
export type {
  SessionCreateRequest,
  SessionResponse,
  SessionUpdateRequest,
} from '../network/session';
export {
  useCreateGroup,
  useGetGroups,
  useGetGroup,
  useUpdateGroup,
  useDeleteGroup,
} from '../network/group';
export type {
  GroupCreateRequest,
  GroupUpdateRequest,
  GroupResponse,
} from '../network/group';

/** Teammate boundary — UI supplies fallbacks only. */
export { QueryAsyncBoundary } from '../network/boundaries/QueryAsyncBoundary';

/**
 * Admin console (Qurie staff) — local mock until admin login / bootcamp APIs land.
 * Replace with network hooks via this seam only.
 */
export {
  ADMIN_SAMPLE,
  createBootcamp,
  getAdminSession,
  getBootcamp,
  inviteMaster,
  listBootcamps,
  loginAdmin,
  logoutAdmin,
  signupInviteUrl,
} from '../mocks/adminStore';
export type {
  AdminBootcamp,
  AdminSession,
  MasterInvite,
  MasterInviteStatus,
} from '../mocks/adminStore';
