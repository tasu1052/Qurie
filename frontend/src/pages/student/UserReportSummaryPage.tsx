import { Navigate } from 'react-router-dom';

/** `/app/report/summary` → `/app/report` (merged in FinalReportPage). */
export default function UserReportSummaryPage() {
  return <Navigate to="/app/report" replace />;
}
