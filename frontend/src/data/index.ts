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
 * Auth / user / session / class / track / group / … hooks — re-exported from `network/`.
 * Pages and shells import from here only (never deep-import network query modules).
 */
export { useLogin, useLogout, useMe, useMeOptional, useRefresh } from '../network/auth';
export type { AuthUserResponse, LoginRequest } from '../network/auth';
export {
  useSignUp,
  useGetUsers,
  useGetUserProfile,
  useUpdateUserProfile,
} from '../network/user';
export type {
  UserSignUpRequest,
  UserSignUpResponse,
  UserProfileResponse,
  UserProfileUpdateRequest,
  UserSummaryResponse,
  UserListParams,
} from '../network/user';
export {
  useCreateSession,
  useCreateSessionReport,
  useGetSessions,
  useGetSession,
  useGetSessionParticipants,
  useGetSessionMessages,
  useUpdateSession,
  useDeleteSession,
} from '../network/session';
export type {
  SessionCreateRequest,
  SessionResponse,
  SessionUpdateRequest,
  SessionParticipantResponse,
  ChatMessageResponse,
  ChatMessageListParams,
  SessionReportCreateRequest,
  SessionReportCreateResponse,
} from '../network/session';
export {
  useGetMyClasses,
  useGetClasses,
  useGetClass,
  useGetClassMembers,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from '../network/class';
export type {
  ClassCreateRequest,
  ClassUpdateRequest,
  ClassResponse,
  ClassMemberResponse,
} from '../network/class';
export type { ClassListFilters, ClassMemberListFilters } from '../network/core/queryKeys/class.keys';
export {
  useGetTracks,
  useGetTrack,
  useCreateTrack,
  useUpdateTrack,
  useDeleteTrack,
} from '../network/track';
export type {
  TrackCreateRequest,
  TrackUpdateRequest,
  TrackResponse,
  TrackSummaryResponse,
} from '../network/track';
export type { TrackListFilters } from '../network/core/queryKeys/track.keys';
export {
  useCreateGroup,
  useGetGroups,
  useGetGroup,
  useGetGroupDetail,
  useGetGroupCandidates,
  useUpdateGroup,
  useEditGroup,
  useDuplicateGroup,
  useShuffleGroups,
  useDeleteGroup,
} from '../network/group';
export type {
  GroupCreateRequest,
  GroupUpdateRequest,
  GroupResponse,
  GroupDetailResponse,
  GroupMemberResponse,
  GroupMemberCandidateResponse,
  GroupEditRequest,
  GroupDuplicateRequest,
  GroupShuffleRequest,
  GroupParticipantRole,
} from '../network/group';
export { useCreateInvitation, useGetInvitationPreview } from '../network/invitation';
export type {
  InvitationCreateRequest,
  InvitationCreateResponse,
  InvitationPreviewResponse,
} from '../network/invitation';
export { useGetNotices } from '../network/notice';
export type { NoticeResponse, NoticeScope, NoticeListFilters } from '../network/notice';
export { useGetAnalyticsOverview } from '../network/analytics';
export type { AnalyticsOverviewResponse } from '../network/analytics';
export {
  useCreateProject,
  useGetProjectFileContent,
  useGetProjectFiles,
  useImportProjectGit,
  useImportProjectLocal,
} from '../network/project';
export type {
  ProjectCreateRequest,
  ProjectResponse,
  ProjectImportLocalRequest,
  ProjectImportGitRequest,
  ProjectImportResponse,
  ProjectFileSummaryResponse,
  ProjectFileContentResponse,
  ProjectSkippedFileResponse,
} from '../network/project';
export { useGenerateQuiz, useGetQuizSet } from '../network/quiz';
export type {
  QuizGenerateRequest,
  QuizGenerateResponse,
  QuizSetDetailResponse,
  QuizItem,
  QuizChoiceItem,
  QuizGenerationMode,
  QuizType,
  QuizPurpose,
  QuizDifficulty,
  QuizSetStatus,
} from '../network/quiz';
export { useCreateUserReport } from '../network/report';
export type { UserReportCreateRequest, UserReportCreateResponse } from '../network/report';

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
