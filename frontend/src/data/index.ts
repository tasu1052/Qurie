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
} from '../mocks/adapters';

export type {
  AnalyticsClassSummary,
  ClassCard,
  ClassRole,
  HrAlert,
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
