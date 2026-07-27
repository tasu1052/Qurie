import { useCallback, useEffect, useState } from 'react';
import {
  masterHrAlert,
  masterKpis,
  masterManagers,
  masterReports,
  masterTracks,
  type HrAlert,
  type KpiItem,
  type ManagerActivity,
  type ReportRow,
  type RowStatus,
  type TrackCard,
} from './fixtures';
import { getScenarioFromSearch, MOCK_DELAY_MS } from './scenario';

export type MockRowResult<T> = {
  status: RowStatus;
  data: T | null;
  refetch: () => void;
};

function useMockRow<T>(
  data: T,
  options?: { emptyAs?: T | null },
): MockRowResult<T> {
  const scenario = getScenarioFromSearch(
    typeof window !== 'undefined' ? window.location.search : '',
  );
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
    }, MOCK_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [version, scenario]);

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
  return useMockRow(masterKpis, { emptyAs: [] });
}

/** Master dashboard — tracks + manager activity + HR alert */
export function useMasterTracksRow(): MockRowResult<{
  tracks: TrackCard[];
  managers: ManagerActivity[];
  hrAlert: HrAlert;
}> {
  return useMockRow(
    { tracks: masterTracks, managers: masterManagers, hrAlert: masterHrAlert },
    { emptyAs: { tracks: [], managers: [], hrAlert: masterHrAlert } },
  );
}

/** Master dashboard — recent reports table */
export function useMasterReportsRow(): MockRowResult<ReportRow[]> {
  return useMockRow(masterReports, { emptyAs: [] });
}
