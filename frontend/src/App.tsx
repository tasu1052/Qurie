import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthGate } from './components/auth/AuthGate';
import { AdminGate } from './components/auth/AdminGate';
import LandingPage from './pages/marketing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ResetPage from './pages/auth/ResetPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminBootcampListPage from './pages/admin/AdminBootcampListPage';
import AdminBootcampDetailPage from './pages/admin/AdminBootcampDetailPage';
import MasterDashboardPage from './pages/master/MasterDashboardPage';
import TrackListPage from './pages/master/TrackListPage';
import TrackDetailPage from './pages/master/TrackDetailPage';
import ClassManagementPage from './pages/master/ClassManagementPage';
import MemberManagementPage from './pages/master/MemberManagementPage';
import AnnouncementsPage from './pages/master/AnnouncementsPage';
import TrackAnalyticsPage from './pages/master/TrackAnalyticsPage';
import ClassAnalyticsDetailPage from './pages/master/ClassAnalyticsDetailPage';
import MasterMyPage from './pages/master/MasterMyPage';
import MasterSettingsPage from './pages/master/MasterSettingsPage';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import StudentManagementPage from './pages/manager/StudentManagementPage';
import StudentOverviewPage from './pages/manager/StudentOverviewPage';
import SessionListPage from './pages/manager/SessionListPage';
import GroupListPage from './pages/manager/GroupListPage';
import GroupEditPage from './pages/manager/GroupEditPage';
import ManagerMyPage from './pages/manager/ManagerMyPage';
import ManagerSettingsPage from './pages/manager/ManagerSettingsPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import ClassLobbyPage from './pages/student/ClassLobbyPage';
import MyPage from './pages/student/MyPage';
import SessionPage from './pages/session/SessionPage';
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset" element={<ResetPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminGate />}>
          <Route path="/admin" element={<AdminBootcampListPage />} />
          <Route path="/admin/bootcamps/:id" element={<AdminBootcampDetailPage />} />
        </Route>

        <Route element={<AuthGate />}>
          <Route path="/master" element={<MasterDashboardPage />} />
          <Route path="/master/tracks" element={<TrackListPage />} />
          <Route path="/master/tracks/:id" element={<TrackDetailPage />} />
          <Route path="/master/classes" element={<ClassManagementPage />} />
          <Route path="/master/members" element={<MemberManagementPage />} />
          <Route path="/master/announcements" element={<AnnouncementsPage />} />
          <Route path="/master/analytics" element={<TrackAnalyticsPage />} />
          <Route path="/master/analytics/:classId" element={<ClassAnalyticsDetailPage />} />
          <Route path="/master/me" element={<MasterMyPage />} />
          <Route path="/master/settings" element={<MasterSettingsPage />} />

          <Route path="/manager" element={<ManagerDashboardPage />} />
          <Route path="/manager/students" element={<StudentManagementPage />} />
          <Route path="/manager/students/:id" element={<StudentOverviewPage />} />
          <Route path="/manager/sessions" element={<SessionListPage />} />
          <Route path="/manager/groups" element={<GroupListPage />} />
          <Route path="/manager/groups/:id" element={<GroupEditPage />} />
          <Route path="/manager/me" element={<ManagerMyPage />} />
          <Route path="/manager/settings" element={<ManagerSettingsPage />} />

          <Route path="/app" element={<StudentDashboardPage />} />
          <Route path="/app/classes/:id" element={<ClassLobbyPage />} />
          <Route path="/app/me" element={<MyPage />} />
          <Route path="/app/report" element={<FinalReportPage />} />

          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/session/:id/report" element={<PlaceholderPage title="세션 리포트" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
