import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AdminShell, PageMain } from '../../components/layout/AdminShell';
import { Badge, Button, DataTable, EmptyState, Input, Modal } from '../../ds';
import {
  createBootcamp,
  listBootcamps,
  type AdminBootcamp,
} from '../../data';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ko-KR');
  } catch {
    return iso;
  }
}

function inviteBadge(bootcamp: AdminBootcamp) {
  const invite = bootcamp.masterInvite;
  if (!invite) return <Badge status="neutral">마스터 미초대</Badge>;
  if (invite.status === 'PENDING') return <Badge status="warning">초대 대기</Badge>;
  if (invite.status === 'ACCEPTED') return <Badge status="success">마스터 등록</Badge>;
  return <Badge status="error">초대 만료</Badge>;
}

export default function AdminBootcampListPage() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const bootcamps = useMemo(() => listBootcamps(), [tick]);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onCreate = () => {
    setError(null);
    if (!name.trim()) {
      setError('부트캠프 이름을 입력해 주세요.');
      return;
    }
    const created = createBootcamp(name);
    setName('');
    setCreateOpen(false);
    setTick((t) => t + 1);
    navigate(`/admin/bootcamps/${created.id}`);
  };

  return (
    <AdminShell activeKey="bootcamps" breadcrumbs={['어드민', '부트캠프']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>부트캠프 관리</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
              부트캠프(엔터프라이즈)를 생성하고 마스터를 초대합니다.
            </p>
          </div>
          <Button variant="primary" icon={<Plus size={16} strokeWidth={1.75} />} onClick={() => setCreateOpen(true)}>
            부트캠프 생성
          </Button>
        </div>

        {bootcamps.length === 0 ? (
          <EmptyState
            message="부트캠프가 없습니다"
            description="새 부트캠프를 생성해 마스터를 초대하세요."
            actionLabel="부트캠프 생성"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <DataTable
              columns={[
                { key: 'id', label: 'ID', width: 72 },
                { key: 'name', label: '이름' },
                { key: 'createdAt', label: '생성일', width: 120, render: (row) => formatDate(row.createdAt) },
                { key: 'invite', label: '마스터 초대', width: 140, render: (row) => inviteBadge(row) },
                {
                  key: 'action',
                  label: '',
                  width: 100,
                  align: 'right',
                  render: (row) => (
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/bootcamps/${row.id}`)}>
                      관리
                    </Button>
                  ),
                },
              ]}
              rows={bootcamps}
              rowKey="id"
              onRowClick={(row) => navigate(`/admin/bootcamps/${row.id}`)}
            />
          </div>
        )}

        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="부트캠프 생성"
          description="생성 후 엔터프라이즈 ID가 발급되고, 마스터 초대에 고정됩니다."
          primaryLabel="생성"
          secondaryLabel="취소"
          onPrimary={onCreate}
          onSecondary={() => setCreateOpen(false)}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>부트캠프 이름</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: SSAFY 서울캠퍼스"
              width="100%"
            />
            {error ? (
              <span style={{ fontSize: 13, color: 'var(--status-error)' }}>{error}</span>
            ) : null}
          </label>
        </Modal>
      </PageMain>
    </AdminShell>
  );
}
