import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminShell, PageMain } from '../../components/layout/AdminShell';
import { ApiIntegrationPanel } from '../../components/feedback/ApiIntegrationPanel';
import { EmptyState } from '../../ds';

export default function AdminBootcampDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const bootcampId = Number(id);

  return (
    <AdminShell activeKey="bootcamps" breadcrumbs={['어드민', '부트캠프', id ?? '상세']}>
      <PageMain>
        <div>
          <Link to="/admin" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
            ← 부트캠프 목록
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0' }}>
            {Number.isFinite(bootcampId) ? `부트캠프 #${bootcampId}` : '부트캠프 상세'}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            로컬 목업 저장소를 제거했습니다. 아래 API가 구현·연동되면 화면이 채워집니다.
          </p>
        </div>

        <EmptyState
          message="어드민 데이터 없음"
          description="GET /admin/bootcamps 및 초대 API가 필요합니다."
          actionLabel="목록으로"
          onAction={() => navigate('/admin')}
        />

        <ApiIntegrationPanel groupId="adminConsole" />
      </PageMain>
    </AdminShell>
  );
}
