import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import PageHeader from '../components/PageHeader';

export default function AuditLog() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const LIMIT = 30;

  const load = useCallback(async (s = search, tg = tag, off = offset) => {
    const params: any = { limit: LIMIT, offset: off };
    if (s) params.search = s;
    if (tg) params.tag = tg;
    const result = await api.audit.list(params);
    setItems(result.items || []);
    setTotal(result.total || 0);
  }, []);

  useEffect(() => {
    api.audit.tags().then(setTags);
    load();
  }, []);

  const doSearch = () => { setOffset(0); load(search, tag, 0); };

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader
        title={t('auditLog')}
        subtitle={`${total} ${lang === 'th' ? 'รายการ' : 'records'}`}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input
          placeholder={t('search') + '...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          style={{ width: 280 }}
        />
        <select value={tag} onChange={e => { setTag(e.target.value); setOffset(0); load(search, e.target.value, 0); }} style={{ width: 160 }}>
          <option value="">{lang === 'th' ? 'ทุก Tag' : 'All Tags'}</option>
          {tags.map((tg: any) => (
            <option key={tg.tag} value={tg.tag}>{tg.tag}</option>
          ))}
        </select>
        <button className="btn btn-secondary" onClick={doSearch}>{t('search')}</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{t('user')}</th>
              <th>{lang === 'th' ? 'การกระทำ' : 'Action'}</th>
              <th>{lang === 'th' ? 'รายละเอียด' : 'Detail'}</th>
              <th>{lang === 'th' ? 'IP' : 'IP'}</th>
              <th>{lang === 'th' ? 'เวลา' : 'Time'}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a: any) => (
              <tr key={a.id}>
                <td style={{ color: 'var(--text2)', fontSize: 12 }}>{a.id}</td>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{a.user}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.tag && (
                      <span className="tag" style={{ background: (a.color || '#888') + '22', color: a.color || '#888' }}>
                        {a.tag}
                      </span>
                    )}
                    <span style={{ fontSize: 13 }}>{a.action}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text2)', fontSize: 12 }}>{a.detail}</td>
                <td style={{ fontSize: 11, color: 'var(--text2)' }}>{a.ip}</td>
                <td style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{a.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="empty-state">{t('noData')}</div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary" disabled={offset === 0}
              onClick={() => { const o = Math.max(0, offset - LIMIT); setOffset(o); load(search, tag, o); }}>
              ← {lang === 'th' ? 'ก่อนหน้า' : 'Prev'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              {offset + 1}–{Math.min(offset + LIMIT, total)} / {total}
            </span>
            <button className="btn btn-secondary" disabled={offset + LIMIT >= total}
              onClick={() => { const o = offset + LIMIT; setOffset(o); load(search, tag, o); }}>
              {lang === 'th' ? 'ถัดไป' : 'Next'} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
