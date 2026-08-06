/**
 * Page data import surface.
 *
 * Pages import hooks from here only — see `docs/API_HOOK_CONTRACTS.md`.
 */

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
export { useLogin, useLogout, useMe, useMeOptional, useRefresh, useRequestPasswordReset, useConfirmPasswordReset } from '../network/auth';
export type {
  AuthUserResponse,
  LoginRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
} from '../network/auth';
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
  useCreateSessionReportsForAll,
  useGetSessions,
  useGetSession,
  useGetSessionParticipants,
  useGetSessionMessages,
  useGetSessionPresence,
  useGetSessionReport,
  useGetSessionReportRoster,
  useUpdateSession,
  useDeleteSession,
  useAskSessionHelp,
  useGetClassHelpRequests,
  useDismissHelpRequest,
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
  SessionReportBulkResponse,
  SessionReportDetailResponse,
  SessionReportRosterItemResponse,
  SessionReportRosterResponse,
  HelpRequestResponse,
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
  useGetGroupCandidatesQuery,
  useGetMyGroups,
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
export { useCreateInvitation, useGetInvitationPreview, useCreateBulkInvitations } from '../network/invitation';
export type {
  InvitationCreateRequest,
  InvitationCreateResponse,
  InvitationPreviewResponse,
  BulkInvitationParams,
  BulkInvitationResponse,
  BulkInvitationRowResult,
} from '../network/invitation';
export {
  useGetClassMaterials,
  useUploadClassMaterial,
  useDeleteClassMaterial,
  useDownloadClassMaterial,
} from '../network/material';
export type { ClassMaterialResponse } from '../network/material';
export { useGetNotices, useGetNotice, useCreateNotice, useUpdateNotice, useDeleteNotice } from '../network/notice';
export type {
  NoticeResponse,
  NoticeScope,
  NoticeListFilters,
  NoticeCreateRequest,
  NoticeUpdateRequest,
  NoticeDetailResponse,
} from '../network/notice';
export { useGetAnalyticsOverview, useGetClassAnalytics } from '../network/analytics';
export type { AnalyticsOverviewResponse, ClassAnalyticsResponse } from '../network/analytics';
export {
  useCreateProject,
  useImportProjectLocal,
  useImportProjectGit,
  useGetSessionProject,
  useGetProjectFiles,
  useGetProjectFileContent,
  useUpdateProjectFileContent,
  getProjectFiles,
  getProjectFileContent,
} from '../network/project';
export type {
  ProjectCreateRequest,
  ProjectResponse,
  ProjectImportLocalRequest,
  ProjectImportGitRequest,
  ProjectImportResponse,
  ProjectSkippedFileResponse,
  ProjectFileSummaryResponse,
  ProjectFileContentResponse,
} from '../network/project';
export {
  useGenerateQuiz,
  useGetQuizSet,
  usePollQuizSet,
  useGetQuizQuestions,
  usePollQuizQuestions,
  useQuizSetsByProject,
  useSubmitQuizProgress,
  useGetQuizProgress,
  useSubmitQuizSatisfaction,
  formatQuizSource,
  normalizeQuizSetStatus,
} from '../network/quiz';
export type {
  QuizGenerateRequest,
  QuizGenerateResponse,
  QuizSetDetailResponse,
  QuizQuestionsResponse,
  QuizQuestionItem,
  QuizQuestionChoiceItem,
  QuizItem,
  QuizChoiceItem,
  QuizGenerationMode,
  QuizType,
  QuizPurpose,
  QuizDifficulty,
  QuizSetStatus,
  QuizSetSummaryResponse,
  QuizSatisfactionRequest,
  QuizProgressSubmitRequest,
  QuizProgressResponse,
  QuizProgressStatus,
  QuizProgressSummaryResponse,
  QuizProgressItem,
} from '../network/quiz';
/** 세션 실시간(STOMP) — 채팅 · 참여자 · 퀴즈/프로젝트 · 음성 채널을 한 연결에서 받는다. */
export { useSessionSocket } from '../realtime/useSessionSocket';
export type {
  QuizGenerationNotification,
  ProjectImportNotification,
  SessionParticipantEvent,
  SessionSocketStatus,
} from '../realtime/useSessionSocket';
export { useSessionVoice } from '../realtime/useSessionVoice';
export type { SessionVoiceStatus } from '../realtime/useSessionVoice';

export { useGetVoiceParticipants, useGetVoicePresence } from '../network/voice';
export type {
  VoiceParticipantResponse,
  VoiceChannelEventResponse,
  VoiceChannelEventType,
  VoiceStateUpdateRequest,
  VoiceSignalRequest,
  VoiceSignalResponse,
  VoiceSignalType,
} from '../network/voice';

export { useCreateUserReport, useGetUserReport, useGetUserSessionReports, useDownloadUserReportPdf, useDownloadSessionReportPdf } from '../network/report';
export type {
  UserReportCreateRequest,
  UserReportCreateResponse,
  UserReportDetailResponse,
  SessionReportSummaryResponse,
} from '../network/report';
export {
  useCreateStudentComment,
  useGetStudentComments,
  useUpdateStudentComment,
  useDeleteStudentComment,
} from '../network/comment';
export type {
  StudentCommentCreateRequest,
  StudentCommentUpdateRequest,
  StudentCommentResponse,
} from '../network/comment';

/** Teammate boundary — UI supplies fallbacks only. */
export { QueryAsyncBoundary } from '../network/boundaries/QueryAsyncBoundary';

/** HTTP 오류 → 비개발자용 한국어 문장. 화면에 err.message 를 그대로 노출하지 않는다. */
export { humanizeApiError } from '../network/core/humanizeError';
