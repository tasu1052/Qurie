import { AdminShell, PageMain } from '../../components/layout/AdminShell';
import { ApiIntegrationPanel } from '../../components/feedback/ApiIntegrationPanel';
import { Button } from '../../ds';

export default function AdminBootcampListPage() {
  return (
    <AdminShell activeKey="bootcamps" breadcrumbs={['어드민', '부트캠프']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>부트캠프 관리</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
              어드민 API 연동 후 부트캠프 생성·마스터 초대가 가능합니다.
            </p>
          </div>
          <Button variant="primary" disabled>
            부트캠프 생성
          </Button>
        </div>

        <ApiIntegrationPanel groupId="adminConsole" />
      </PageMain>
    </AdminShell>
  );
}
