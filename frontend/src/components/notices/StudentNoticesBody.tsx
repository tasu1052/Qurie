import { useMemo, useState } from 'react';
import { useGetNotices } from '../../data';
import { useOpenNoticeDetail } from '../../hooks/useOpenNoticeDetail';
import {
  NOTICE_LIST_PAGE_SIZE,
  NoticeCard,
  NoticesPagination,
  ScopeFilterTabs,
  type ScopeFilter,
} from './noticesShared';

const scopeOptions = [
  { key: '전체' as const, label: '전체' },
  { key: 'TRACK' as const, label: '트랙' },
  { key: 'CLASS' as const, label: '클래스' },
] as const;

export function StudentNoticesBody({ classId }: { classId: number }) {
  const openNotice = useOpenNoticeDetail();
  const [scope, setScope] = useState<ScopeFilter>('전체');
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      page,
      size: NOTICE_LIST_PAGE_SIZE,
      scope: scope === '전체' ? undefined : scope,
      classId,
      forAudience: true as const,
    }),
    [scope, classId, page],
  );

  const onScopeChange = (next: ScopeFilter) => {
    setScope(next);
    setPage(1);
  };

  const { data } = useGetNotices(filters);
  const notices = data.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>공지사항</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          클래스·트랙 공지를 확인할 수 있어요.
        </span>
      </div>

      <ScopeFilterTabs options={scopeOptions} scope={scope} onChange={onScopeChange} />

      {notices.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>공지가 없습니다.</p>
      ) : (
        notices.map((item) => (
          <NoticeCard
            key={item.id}
            item={item}
            canEdit={false}
            deleting={false}
            onOpen={() => openNotice(item.id)}
            onEdit={() => undefined}
            onDelete={() => undefined}
          />
        ))
      )}

      <NoticesPagination page={page} total={data.meta.total} onPage={setPage} />
    </div>
  );
}
