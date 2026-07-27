import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MasterDashboardPage from './pages/master/MasterDashboardPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', fontSize: 17 }}>
      {title} — 준비 중
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/master" element={<MasterDashboardPage />} />
        <Route path="/master/classes" element={<PlaceholderPage title="클래스 관리" />} />
        <Route path="/master/members" element={<PlaceholderPage title="회원 관리" />} />
        <Route path="/master/announcements" element={<PlaceholderPage title="공지사항" />} />
        <Route path="/master/analytics" element={<PlaceholderPage title="분석 리포트" />} />
        <Route path="*" element={<Navigate to="/master" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
