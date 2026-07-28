# API hook contracts (UI → network seam)

Pages import hooks from `src/data/` only. Mock adapters in `src/mocks/adapters.ts` stand in with the **same names, args, and return shape** until real TanStack Query hooks land in `src/network/`.

## Return shape (do not change unilaterally)

```ts
type MockRowResult<T> = {
  status: 'loading' | 'error' | 'empty' | 'ready';
  data: T | null;
  refetch: () => void;
};
```

List endpoints use teammate envelope `{ data: T[]; meta: { page; size; total } }` (`PageResponse<T>` in `network/core/types.ts`). UI rows may still receive a flattened view model; mapping belongs in the network layer.

Errors: `{ code, message, requestId }` (`ApiErrorBody`). Show `requestId` in mono on row error fallbacks.

Base URL: `VITE_API_BASE_URL` (e.g. `http://localhost:8080/api/v1`). Paths below are relative to that prefix.

---

## Master

| Screen | Mock hook (today) | Primary endpoints | Notes |
| --- | --- | --- | --- |
| Dashboard KPI | `useMasterKpiRow()` | `GET /analytics/overview` | KPI StatCard row |
| Dashboard tracks / managers | `useMasterTracksRow()` | `GET /tracks?sort=classCount,desc&size=5`, `GET /users?role=MANAGER&sort=activity,desc&size=3` | Bundle OK for UI; may split later |
| Dashboard reports | `useMasterReportsRow()` | `GET /notices?size=5&sort=createdAt,desc` or reports list per product | Align payload with fixture `ReportRow` |
| Track List | `useTrackListRow()` | `GET /tracks?q=&tech=&page=&size=&sort=`, `POST /tracks` | Mutations: create / delete `?cascade=` |
| Track Detail | `useTrackDetailRow(trackId)` | `GET /tracks/{id}`, `GET /tracks/{id}/classes`, `GET /tracks/{id}/managers` | Prefer accepting `trackId` when real hook ships |
| Class Management | `useClassListRow()` | `GET /classes?trackId=&tech=&status=&q=&page=`, `POST /classes`, `PATCH\|DELETE /classes/{id}` | |
| Member Management | `useMemberKpiRow()`, `useMemberListRow()` | `GET /users?role=&q=&page=`, `GET /invitations?status=PENDING`, `POST /invitations`, resend/cancel | Class role: `ADMIN` \| `STUDENT` only |
| Announcements | `useNoticesRow()` | `GET /notices?scope=&trackId=&classId=&page=`, `POST /notices`, `PUT\|DELETE /notices/{id}` | |
| Track Analytics | `useTrackAnalyticsRow(trackId)` | `GET /analytics/tracks/{id}?from=&to=` | |
| Class Analytics | `useClassAnalyticsRow(classId)` | `GET /analytics/classes/{id}?metric=&from=&to=&dimension=` | |

## Manager

| Screen | Mock hook (today) | Primary endpoints | Notes |
| --- | --- | --- | --- |
| Dashboard | `useManagerDashboardRow()` | `GET /sessions?classId=&status=ACTIVE`, members top/at-risk, groups preview | `flag=at-risk` for risk row |
| Student Management | `useManagerStudentsRow()` | `GET /classes/{id}/members?role=STUDENT&page=`, groups list | Invite: `POST /invitations` `{email, role:'STUDENT', classId}` |
| Student Overview | `useStudentOverviewRow(userId)` | `GET /users/{id}`, `GET /analytics/users/{id}`, `GET /reports?userId=` | |
| Session List | `useManagerSessionsRow()` | `GET /sessions?classId=&status=`, `POST /sessions`, `PATCH\|DELETE /sessions/{id}` | Teammate already has `useCreateSession` |
| Group List | `useManagerGroupsRow()` | `GET\|POST /classes/{id}/groups`, `GET\|PUT\|DELETE /groups/{id}`, participants | Status: `ACTIVE` \| `ENDED` |

## Student (Member)

| Screen | Mock hook (today) | Primary endpoints | Notes |
| --- | --- | --- | --- |
| Dashboard | `useStudentDashboardRow()` | `GET /sessions?mine=true&status=ACTIVE`, grades/reviews as available | |
| Class Lobby | `useClassLobbyRow(classId)` | `GET /sessions?classId=&mine=true`, `GET /classes/{id}/groups?mine=true`, `GET /notices?classId=` | |
| My Page | `useMyPageRow()` | `GET /users/{id}` / `PATCH`, `PATCH /auth/password` | |
| Final Report | `useFinalReportRow(userId)` | `GET /users/{id}/report-summary`, `GET /reports?userId=&page=` | |

---

## Swap checklist (teammate)

1. Implement query hooks under `src/network/**` matching names above (or re-export aliases in `src/data/index.ts`).
2. Keep `{ status, data, refetch }` **or** teach `MockRowBoundary` to read Suspense-only (then pages drop `status` — coordinate with UI).
3. Replace `src/data/index.ts` re-exports; delete `src/mocks/` when unused.
4. Wire mutations used by create/invite/delete modals (`useCreateSession` already exists — align path to `/sessions`).
