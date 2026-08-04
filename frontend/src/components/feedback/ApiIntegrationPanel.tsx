import { Badge } from '../../ds';
import {
  getApiIntegrationGroup,
  type ApiEndpointSpec,
  type ApiIntegrationGroupId,
} from '../../config/apiIntegrationRegistry';

function statusBadge(ready: boolean, readyLabel: string, missingLabel: string) {
  return (
    <Badge status={ready ? 'success' : 'warning'}>{ready ? readyLabel : missingLabel}</Badge>
  );
}

function EndpointRow({ endpoint }: { endpoint: ApiEndpointSpec }) {
  const backendReady = endpoint.backend === 'ready';
  const frontendReady = endpoint.frontendHook === 'ready';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto auto',
        gap: '10px 16px',
        padding: '12px 0',
        borderBottom: '1px solid var(--divider)',
        fontSize: 13,
        alignItems: 'start',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{endpoint.label}</span>
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              background: 'var(--surface-sunken)',
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            {endpoint.method} {endpoint.path}
          </code>
        </div>
        {endpoint.description ? (
          <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-muted)' }}>
            {endpoint.description}
          </p>
        ) : null}
        {endpoint.hookName ? (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            프론트 훅: <code style={{ fontFamily: 'var(--font-mono)' }}>{endpoint.hookName}</code>
          </p>
        ) : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>백엔드</span>
        {statusBadge(backendReady, '구현됨', '미구현')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>프론트</span>
        {statusBadge(frontendReady, '연동됨', '미연동')}
      </div>
    </div>
  );
}

type ApiIntegrationPanelProps = {
  groupId: ApiIntegrationGroupId;
  /** compact: single endpoint rows without outer title block */
  variant?: 'default' | 'compact';
  title?: string;
};

/** Shows which APIs a screen needs and whether backend / frontend hooks exist. */
export function ApiIntegrationPanel({ groupId, variant = 'default', title }: ApiIntegrationPanelProps) {
  const group = getApiIntegrationGroup(groupId);
  const heading = title ?? group.title;

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: variant === 'compact' ? '16px 20px' : '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: variant === 'compact' ? 8 : 12,
        minWidth: 0,
      }}
    >
      {variant === 'default' ? (
        <>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>{heading}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {group.description}
            </p>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            아래 API가 모두 연동되어야 이 영역의 데이터가 표시됩니다.
          </p>
        </>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{heading}</span>
      )}
      <div>
        {group.endpoints.map((endpoint) => (
          <EndpointRow key={endpoint.id} endpoint={endpoint} />
        ))}
      </div>
    </div>
  );
}
