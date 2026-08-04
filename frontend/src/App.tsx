import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AuthGate } from './components/auth/AuthGate';
import { AdminGate } from './components/auth/AdminGate';
import { LogoutSync } from './components/auth/LogoutSync';
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
import ClassDetailPage from './pages/master/ClassDetailPage';
import MemberManagementPage from './pages/master/MemberManagementPage';
import AnnouncementsPage from './pages/master/AnnouncementsPage';
import MasterMyPage from './pages/master/MasterMyPage';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import ManagerAnnouncementsPage from './pages/manager/ManagerAnnouncementsPage';
import StudentManagementPage from './pages/manager/StudentManagementPage';
import StudentOverviewPage, {
  RedirectLegacyStudentDetail,
} from './pages/manager/StudentOverviewPage';
import SessionListPage from './pages/manager/SessionListPage';
import GroupListPage from './pages/manager/GroupListPage';
import GroupEditPage from './pages/manager/GroupEditPage';
import ManagerMyPage from './pages/manager/ManagerMyPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import MyPage from './pages/student/MyPage';
import SessionPage from './pages/session/SessionPage';
import SessionReportPage from './pages/session/SessionReportPage';
import FinalReportPage from './pages/student/FinalReportPage';
import PastQuizListPage from './pages/learning/PastQuizListPage';
import PastQuizDetailPage from './pages/learning/PastQuizDetailPage';
import NoticeDetailPage from './pages/notices/NoticeDetailPage';

function RedirectClassAnalytics() {
  const { classId } = useParams<{ classId: string }>();
  return <Navigate to={classId ? `/master/classes/${classId}` : '/master/classes'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <LogoutSync />
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
          <Route path="/master/classes/:classId" element={<ClassDetailPage />} />
          <Route path="/master/members" element={<MemberManagementPage />} />
          <Route path="/master/announcements" element={<AnnouncementsPage />} />
          <Route path="/master/announcements/:noticeId" element={<NoticeDetailPage />} />
          <Route path="/master/analytics" element={<Navigate to="/master/classes" replace />} />
          <Route path="/master/analytics/:classId" element={<RedirectClassAnalytics />} />
          <Route path="/master/me" element={<MasterMyPage />} />
          <Route path="/master/settings" element={<Navigate to="/master/me" replace />} />

          <Route path="/manager" element={<ManagerDashboardPage />} />
          <Route path="/manager/students" element={<StudentManagementPage />} />
          <Route path="/manager/students/detail/:userId" element={<StudentOverviewPage />} />
          <Route path="/manager/students/:id" element={<RedirectLegacyStudentDetail />} />
          <Route path="/manager/sessions" element={<SessionListPage />} />
          <Route path="/manager/quizzes" element={<PastQuizListPage />} />
          <Route path="/manager/quizzes/:quizSetId" element={<PastQuizDetailPage />} />
          <Route path="/manager/groups" element={<GroupListPage />} />
          <Route path="/manager/groups/:id" element={<GroupEditPage />} />
          <Route path="/manager/announcements" element={<ManagerAnnouncementsPage />} />
          <Route path="/manager/announcements/:noticeId" element={<NoticeDetailPage />} />
          <Route path="/manager/me" element={<ManagerMyPage />} />
          <Route path="/manager/settings" element={<Navigate to="/manager/me" replace />} />

          <Route path="/app" element={<StudentDashboardPage />} />
          <Route path="/app/announcements/:noticeId" element={<NoticeDetailPage />} />
          <Route path="/app/classes" element={<Navigate to="/app" replace />} />
          <Route path="/app/classes/:id" element={<Navigate to="/app" replace />} />
          <Route path="/app/me" element={<MyPage />} />
          <Route path="/app/sessions" element={<Navigate to="/app/report" replace />} />
          <Route path="/app/quizzes" element={<PastQuizListPage />} />
          <Route path="/app/quizzes/:quizSetId" element={<PastQuizDetailPage />} />
          <Route path="/app/report" element={<FinalReportPage />} />

          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/session/:id/report" element={<SessionReportPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
