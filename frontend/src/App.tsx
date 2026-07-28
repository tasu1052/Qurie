import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MasterDashboardPage from './pages/master/MasterDashboardPage';
import TrackListPage from './pages/master/TrackListPage';
import TrackDetailPage from './pages/master/TrackDetailPage';
import ClassManagementPage from './pages/master/ClassManagementPage';
import MemberManagementPage from './pages/master/MemberManagementPage';
import AnnouncementsPage from './pages/master/AnnouncementsPage';
import TrackAnalyticsPage from './pages/master/TrackAnalyticsPage';
import ClassAnalyticsDetailPage from './pages/master/ClassAnalyticsDetailPage';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import StudentManagementPage from './pages/manager/StudentManagementPage';
import StudentOverviewPage from './pages/manager/StudentOverviewPage';
import SessionListPage from './pages/manager/SessionListPage';
import GroupListPage from './pages/manager/GroupListPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import ClassLobbyPage from './pages/student/ClassLobbyPage';
import MyPage from './pages/student/MyPage';
import FinalReportPage from './pages/student/FinalReportPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-secondary)',
        fontSize: 17,
      }}
    >
      {title} — 준비 중
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Master */}
        <Route path="/master" element={<MasterDashboardPage />} />
        <Route path="/master/tracks" element={<TrackListPage />} />
        <Route path="/master/tracks/:id" element={<TrackDetailPage />} />
        <Route path="/master/classes" element={<ClassManagementPage />} />
        <Route path="/master/members" element={<MemberManagementPage />} />
        <Route path="/master/announcements" element={<AnnouncementsPage />} />
        <Route path="/master/analytics" element={<TrackAnalyticsPage />} />
        <Route path="/master/analytics/:classId" element={<ClassAnalyticsDetailPage />} />
        <Route path="/master/settings" element={<PlaceholderPage title="설정" />} />

        {/* Manager */}
        <Route path="/manager" element={<ManagerDashboardPage />} />
        <Route path="/manager/students" element={<StudentManagementPage />} />
        <Route path="/manager/students/:id" element={<StudentOverviewPage />} />
        <Route path="/manager/sessions" element={<SessionListPage />} />
        <Route path="/manager/groups" element={<GroupListPage />} />
        <Route path="/manager/settings" element={<PlaceholderPage title="설정" />} />

        {/* Member (Student) */}
        <Route path="/app" element={<StudentDashboardPage />} />
        <Route path="/app/classes/:id" element={<ClassLobbyPage />} />
        <Route path="/app/me" element={<MyPage />} />
        <Route path="/app/report" element={<FinalReportPage />} />

        <Route path="*" element={<Navigate to="/master" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
