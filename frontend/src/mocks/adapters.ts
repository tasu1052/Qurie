import { useCallback, useEffect, useState } from 'react';
import {
  analyticsClassSummaries,
  analyticsKpis,
  categoryBarData,
  classAnalyticsKpis,
  classAnalyticsLabels,
  classAnalyticsSeries,
  classCards,
  classLobby,
  classSessionSummaries,
  finalReport,
  managerAtRisk,
  managerClassHeader,
  managerGroups,
  managerKpis,
  managerSessionList,
  managerStudents,
  managerTodaySessions,
  managerTopStudents,
  masterHrAlert,
  masterKpis,
  masterManagers,
  masterReports,
  masterTracks,
  memberKpis,
  memberRows,
  myPageProfile,
  notices,
  pendingInvites,
  studentDashKpis,
  studentMySessions,
  studentOverview,
  studentRecentGrades,
  studentReviews,
  trackChartLabels,
  trackChartSeries,
  trackDetailAlerts,
  trackDetailClasses,
  trackDetailKpis,
  trackDetailManagers,
  trackDetailMeta,
  trackListItems,
  analyticsBarData,
  type AnalyticsClassSummary,
  type ClassCard,
  type HrAlert,
  type KpiItem,
  type ManagerActivity,
  type MemberRow,
  type NoticeItem,
  type PendingInvite,
  type ReportRow,
  type RowStatus,
  type SessionSummaryRow,
  type TrackAlert,
  type TrackCard,
  type TrackDetailClass,
  type TrackListItem,
  type TrackManager,
} from './fixtures';
import { getScenarioFromSearch, MOCK_DELAY_MS } from './scenario';

export type MockRowResult<T> = {
  status: RowStatus;
  data: T | null;
  refetch: () => void;
};

function useMockRow<T>(
  data: T,
  options?: { emptyAs?: T | null; delayMs?: number },
): MockRowResult<T> {
  const scenario = getScenarioFromSearch(
    typeof window !== 'undefined' ? window.location.search : '',
  );
  const delay = options?.delayMs ?? MOCK_DELAY_MS;
  const [version, setVersion] = useState(0);
  const [loadedVersion, setLoadedVersion] = useState<number | null>(
    scenario === 'ready' ? null : 0,
  );

  const refetch = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (scenario !== 'ready') return;
    const id = window.setTimeout(() => {
      setLoadedVersion(version);
    }, delay);
    return () => window.clearTimeout(id);
  }, [version, scenario, delay]);

  const status: RowStatus =
    scenario === 'loading' || scenario === 'error' || scenario === 'empty'
      ? scenario
      : loadedVersion === version
        ? 'ready'
        : 'loading';

  const resolved =
    status === 'empty'
      ? (options?.emptyAs ?? null)
      : status === 'ready'
        ? data
        : null;

  return { status, data: resolved, refetch };
}

/** Master dashboard — KPI StatCard row */
export function useMasterKpiRow(): MockRowResult<KpiItem[]> {
  return useMockRow(masterKpis, { emptyAs: [], delayMs: 400 });
}

/** Master dashboard — tracks + manager activity + HR alert */
export function useMasterTracksRow(): MockRowResult<{
  tracks: TrackCard[];
  managers: ManagerActivity[];
  hrAlert: HrAlert;
}> {
  return useMockRow(
    { tracks: masterTracks, managers: masterManagers, hrAlert: masterHrAlert },
    { emptyAs: { tracks: [], managers: [], hrAlert: masterHrAlert }, delayMs: 900 },
  );
}

/** Master dashboard — recent reports table */
export function useMasterReportsRow(): MockRowResult<ReportRow[]> {
  return useMockRow(masterReports, { emptyAs: [], delayMs: 1400 });
}

export function useTrackListRow(): MockRowResult<TrackListItem[]> {
  return useMockRow(trackListItems, { emptyAs: [] });
}

/** @param _trackId reserved for `GET /tracks/{id}` (+ classes/managers) when network hook lands */
export function useTrackDetailRow(_trackId?: string): MockRowResult<{
  meta: typeof trackDetailMeta;
  kpis: KpiItem[];
  classes: TrackDetailClass[];
  alerts: TrackAlert[];
  managers: TrackManager[];
  chartLabels: string[];
  chartSeries: typeof trackChartSeries;
}> {
  void _trackId;
  return useMockRow(
    {
      meta: trackDetailMeta,
      kpis: trackDetailKpis,
      classes: trackDetailClasses,
      alerts: trackDetailAlerts,
      managers: trackDetailManagers,
      chartLabels: trackChartLabels,
      chartSeries: trackChartSeries,
    },
    {
      emptyAs: {
        meta: trackDetailMeta,
        kpis: [],
        classes: [],
        alerts: [],
        managers: [],
        chartLabels: [],
        chartSeries: [],
      },
    },
  );
}

export function useClassListRow(): MockRowResult<ClassCard[]> {
  return useMockRow(classCards, { emptyAs: [] });
}

export function useMemberKpiRow(): MockRowResult<KpiItem[]> {
  return useMockRow(memberKpis, { emptyAs: [], delayMs: 400 });
}

export function useMemberListRow(): MockRowResult<{
  members: MemberRow[];
  invites: PendingInvite[];
}> {
  return useMockRow(
    { members: memberRows, invites: pendingInvites },
    { emptyAs: { members: [], invites: [] }, delayMs: 900 },
  );
}

export function useNoticesRow(): MockRowResult<NoticeItem[]> {
  return useMockRow(notices, { emptyAs: [] });
}

/** @param _trackId reserved for `GET /analytics/tracks/{id}` */
export function useTrackAnalyticsRow(_trackId?: string): MockRowResult<{
  kpis: KpiItem[];
  chartLabels: string[];
  chartSeries: typeof trackChartSeries;
  barData: typeof analyticsBarData;
  summaries: AnalyticsClassSummary[];
}> {
  void _trackId;
  return useMockRow(
    {
      kpis: analyticsKpis,
      chartLabels: trackChartLabels,
      chartSeries: trackChartSeries,
      barData: analyticsBarData,
      summaries: analyticsClassSummaries,
    },
    {
      emptyAs: {
        kpis: [],
        chartLabels: [],
        chartSeries: [],
        barData: [],
        summaries: [],
      },
    },
  );
}

/** @param _classId reserved for `GET /analytics/classes/{id}` */
export function useClassAnalyticsRow(_classId?: string): MockRowResult<{
  kpis: KpiItem[];
  labels: string[];
  series: typeof classAnalyticsSeries;
  categories: typeof categoryBarData;
  sessions: SessionSummaryRow[];
}> {
  void _classId;
  return useMockRow(
    {
      kpis: classAnalyticsKpis,
      labels: classAnalyticsLabels,
      series: classAnalyticsSeries,
      categories: categoryBarData,
      sessions: classSessionSummaries,
    },
    {
      emptyAs: {
        kpis: [],
        labels: [],
        series: [],
        categories: [],
        sessions: [],
      },
    },
  );
}

export function useManagerDashboardRow(): MockRowResult<{
  header: typeof managerClassHeader;
  kpis: KpiItem[];
  sessions: typeof managerTodaySessions;
  topStudents: typeof managerTopStudents;
  atRisk: typeof managerAtRisk;
}> {
  return useMockRow(
    {
      header: managerClassHeader,
      kpis: managerKpis,
      sessions: managerTodaySessions,
      topStudents: managerTopStudents,
      atRisk: managerAtRisk,
    },
    {
      emptyAs: {
        header: managerClassHeader,
        kpis: [],
        sessions: [],
        topStudents: [],
        atRisk: [],
      },
    },
  );
}

export function useManagerStudentsRow(): MockRowResult<{
  students: typeof managerStudents;
  groups: typeof managerGroups;
}> {
  return useMockRow(
    { students: managerStudents, groups: managerGroups },
    { emptyAs: { students: [], groups: [] } },
  );
}

/** @param _userId reserved for `GET /users/{id}` + analytics/reports */
export function useStudentOverviewRow(_userId?: string): MockRowResult<typeof studentOverview> {
  void _userId;
  return useMockRow(studentOverview);
}

export function useManagerSessionsRow(): MockRowResult<typeof managerSessionList> {
  return useMockRow(managerSessionList, { emptyAs: [] });
}

export function useManagerGroupsRow(): MockRowResult<typeof managerGroups> {
  return useMockRow(managerGroups, { emptyAs: [] });
}

export function useStudentDashboardRow(): MockRowResult<{
  kpis: KpiItem[];
  sessions: typeof studentMySessions;
  grades: typeof studentRecentGrades;
  reviews: typeof studentReviews;
}> {
  return useMockRow(
    {
      kpis: studentDashKpis,
      sessions: studentMySessions,
      grades: studentRecentGrades,
      reviews: studentReviews,
    },
    {
      emptyAs: { kpis: [], sessions: [], grades: [], reviews: [] },
    },
  );
}

/** @param _classId reserved for class lobby sessions/groups/notices */
export function useClassLobbyRow(_classId?: string): MockRowResult<typeof classLobby> {
  void _classId;
  return useMockRow(classLobby);
}

export function useMyPageRow(): MockRowResult<typeof myPageProfile> {
  return useMockRow(myPageProfile);
}

/** @param _userId reserved for `GET /users/{id}/report-summary` */
export function useFinalReportRow(_userId?: string): MockRowResult<typeof finalReport> {
  void _userId;
  return useMockRow(finalReport);
}
