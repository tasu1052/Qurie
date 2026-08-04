import { Outlet } from 'react-router-dom';

/** Admin auth API 연동 전까지 라우트를 열어 API 연동 안내 화면을 볼 수 있게 한다. */
export function AdminGate() {
  return <Outlet />;
}
