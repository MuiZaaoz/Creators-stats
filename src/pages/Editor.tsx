import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial, relDate } from '../lib/utils';
import PageHeader from '../components/PageHeader';

export default function Editor() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [activeTab, setActiveTab] = useState<'review' | 'log' | 'edit'>('review');
  const [queue, setQueue] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [q, a] = await Promise.all([api.contents.review(), api.audit.list({ limit: 30 })]);
    setQueue(q);
    setAudit((a as any).items || a);
  };

  useEffect(() => { load(); }, []);

  const reviewAction = async (item: any, status: string, notes = '') => {
    await api.contents.updateReview(item.id, { status, reviewed_by: 'Admin User', notes });
    load();
  };

  const startEdit = (item: any) => {
    setEditTarget(item);
    setEditForm({
      url: item.url, views: item.views, engagement: item.engagement,
      likes: item.likes, comments: item.comments, shares: item.shares,
      saves: item.saves, uv: item.uv, video_views: item.video_views,
      edited_by: 'Admin User',
    });
    setActiveTab('edit');
  };

  const saveEdit = async () => {
    setSaving(true);
    await api.contents.updateLink(editTarget.content_link_id, editForm);
    setSaving(false);
    setEditTarget(null);
    setActiveTab('review');
    load();
  };

  const pending = queue.filter(q => q.status === 'pending');
  const done = queue.filter(q => q.status !== 'pending');

  const TABS = [
    { key: 'review', label: lang === 'th' ? 'คิวตรวจสอบ' : 'Review Queue', count: pending.length },
    { key: 'log', label: lang === 'th' ? 'ล็อกระบบ' : 'System Log' },
    { key: 'edit', label: lang === 'th' ? 'แก้ไขข้อมูล' : 'Edit Data' },
  ];

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title={t('editor')} subtitle={lang === 'th' ? 'ตรวจสอบและอนุมัติข้อมูล' : 'Review and approve content data'} />

      <div className="tab-bar">
        {TABS.map(tab => (
          <button key={tab.key}
            className={'tab-btn' + (activeTab === tab.key ? ' active' : '')}
            onClick={() => setActiveTab(tab.key as any)}>
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span style={{
                background: 'var(--red)', color: '#fff', borderRadius: 10,
                padding: '1px 6px', fontSize: 10, fontWeight: 700, marginLeft: 6,
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'review' && (
        <div>
          {pending.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-title">{lang === 'th' ? 'รอตรวจสอบ' : 'Pending'} ({pending.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map(item => (
                  <ReviewCard key={item.id} item={item} t={t} lang={lang}
                    onApprove={() => reviewAction(item, 'approved')}
                    onReject={() => reviewAction(item, 'rejected')}
                    onEdit={() => startEdit(item)} />
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <div className="section-title">{lang === 'th' ? 'ดำเนินการแล้ว' : 'Completed'} ({done.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {done.map(item => (
                  <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
                    <span className="platform-icon" style={{ background: platformColor(item.platform) }}>
                      {platformInitial(item.platform)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{item.creator_name} · {relDate(item.published_at)}</div>
                    </div>
                    <span className="badge" style={{
                      background: item.status === 'approved' ? '#14532d22' : '#7f1d1d22',
                      color: item.status === 'approved' ? 'var(--green)' : 'var(--red)',
                    }}>
                      {item.status === 'approved' ? (lang === 'th' ? 'อนุมัติ' : 'Approved') : (lang === 'th' ? 'ตีกลับ' : 'Rejected')}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{item.reviewed_by}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {queue.length === 0 && (
            <div className="empty-state"><div style={{ fontSize: 32 }}>✓</div><div>{lang === 'th' ? 'ไม่มีรายการรอตรวจสอบ' : 'No items to review'}</div></div>
          )}
        </div>
      )}

      {activeTab === 'log' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>{t('user')}</th>
                <th>{lang === 'th' ? 'การกระทำ' : 'Action'}</th>
                <th>{lang === 'th' ? 'รายละเอียด' : 'Detail'}</th>
                <th>{lang === 'th' ? 'เวลา' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a: any) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{a.user}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {a.tag && <span className="tag" style={{ background: a.color + '22', color: a.color }}>{a.tag}</span>}
                      <span style={{ fontSize: 13 }}>{a.action}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{a.detail}</td>
                  <td style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{a.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'edit' && editTarget && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{editTarget.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)' }}>
              <span className="platform-icon" style={{ background: platformColor(editTarget.platform) }}>
                {platformInitial(editTarget.platform)}
              </span>
              {editTarget.platform} · {editTarget.creator_name}
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { key: 'views', label: t('views') },
                { key: 'engagement', label: t('engagement') },
                { key: 'likes', label: t('likes') },
                { key: 'comments', label: t('comments') },
                { key: 'shares', label: t('shares') },
                { key: 'saves', label: t('saves') },
                { key: 'uv', label: 'UV' },
                { key: 'video_views', label: 'Video Views' },
              ].map(f => (
                <div key={f.key} className="form-group" style={{ margin: 0 }}>
                  <label>{f.label}</label>
                  <input type="number" value={editForm[f.key] || 0}
                    onChange={e => setEditForm({ ...editForm, [f.key]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }} className="form-group">
              <label>{t('url')}</label>
              <input value={editForm.url || ''} onChange={e => setEditForm({ ...editForm, url: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => { setEditTarget(null); setActiveTab('review'); }}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'edit' && !editTarget && (
        <div className="empty-state">
          <div style={{ fontSize: 32 }}>✎</div>
          <div>{lang === 'th' ? 'เลือกรายการจากคิวเพื่อแก้ไข' : 'Select an item from the review queue to edit'}</div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ item, t, lang, onApprove, onReject, onEdit }: any) {
  const fields = ['views', 'engagement', 'likes', 'comments', 'shares'];
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <span className="platform-icon" style={{ background: platformColor(item.platform) }}>
          {platformInitial(item.platform)}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {item.creator_name} · {item.program_name} · {relDate(item.published_at)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
            {lang === 'th' ? 'ส่งโดย' : 'Submitted by'}: {item.submitted_by}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {fields.map(f => (
          <div key={f} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', marginBottom: 2 }}>{f}</div>
            <div className="num" style={{ fontWeight: 700, fontSize: 14 }}>{fmt(item[f])}</div>
          </div>
        ))}
        {item.uv > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', marginBottom: 2 }}>UV</div>
            <div className="num" style={{ fontWeight: 700, fontSize: 14 }}>{fmt(item.uv)}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-success" onClick={onApprove}>{lang === 'th' ? 'อนุมัติ' : 'Approve'}</button>
        <button className="btn btn-danger" onClick={onReject}>{lang === 'th' ? 'ตีกลับ' : 'Reject'}</button>
        <button className="btn btn-ghost" onClick={onEdit}>{t('edit')}</button>
      </div>
    </div>
  );
}
