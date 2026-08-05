import { Download } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { ApiIntegrationPanel } from '../../components/feedback/ApiIntegrationPanel';
import { Button, Select } from '../../ds';

export default function TrackAnalyticsPage() {
  return (
    <MasterShell activeKey="analytics" breadcrumbs={['SSAFY 서울캠퍼스', '분석 리포트']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>트랙 분석</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              트랙 단위 KPI·추이·클래스 비교는 아래 API 연동 후 표시됩니다.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              options={[{ value: 'java-major', label: 'Java 전공 (서울)' }]}
              value="java-major"
              onChange={() => undefined}
              disabled
            />
            <Select options={[{ value: '8w', label: '최근 8주' }]} value="8w" onChange={() => undefined} disabled />
            <Button variant="secondary" icon={<Download size={14} strokeWidth={1.75} />} disabled>
              내보내기
            </Button>
          </div>
        </div>

        <ApiIntegrationPanel groupId="trackAnalytics" />
      </PageMain>
    </MasterShell>
  );
}
