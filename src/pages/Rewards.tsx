import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, fmtCurrency, initials } from '../lib/utils';
import PageHeader from '../components/PageHeader';

export default function Rewards() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [activeTab, setActiveTab] = useState<'programs' | 'cpm'>('programs');
  const [byProgram, setByProgram] = useState<any[]>([]);
  const [cpmData, setCpmData] = useState<any[]>([]);
  const [editReward, setEditReward] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');

  const load = async () => {
    const [bp, cpm] = await Promise.all([api.rewards.byProgram(), api.rewards.cpm()]);
    setByProgram(bp);
    setCpmData(cpm);
  };

  useEffect(() => { load(); }, []);

  const saveEdit = async () => {
    await api.rewards.update(editReward.id, { amount: Number(editAmount) });
    setEditReward(null);
    load();
  };

  const TABS = [
    { key: 'programs', label: lang === 'th' ? 'รายโปรแกรม' : 'By Program' },
    { key: 'cpm', label: 'CPM' },
  ];

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title={t('rewards')} subtitle={lang === 'th' ? 'งบประมาณและ CPM' : 'Budget and CPM'} />

      <div className="tab-bar">
        {TABS.map(tab => (
          <button key={tab.key}
            className={'tab-btn' + (activeTab === tab.key ? ' active' : '')}
            onClick={() => setActiveTab(tab.key as any)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'programs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {byProgram.map((prog: any) => (
            <div key={prog.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                background: prog.color + '11',
                borderLeft: `4px solid ${prog.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: prog.color }}>{prog.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {prog.creator_count} {lang === 'th' ? 'ครีเอเตอร์' : 'creators'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>{lang === 'th' ? 'งบรวม' : 'Total Budget'}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: prog.color }} className="num">
                    {fmtCurrency(prog.total_budget)}
                  </div>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{lang === 'th' ? 'ครีเอเตอร์' : 'Creator'}</th>
                    <th>{t('type')}</th>
                    <th style={{ textAlign: 'right' }}>{t('views')}</th>
                    <th style={{ textAlign: 'right' }}>{t('episodes')}</th>
                    <th style={{ textAlign: 'right' }}>{lang === 'th' ? 'งบ' : 'Budget'}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(prog.creators || []).map((c: any) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ background: c.avatar_color }}>{initials(c.creator_name)}</div>
                          <span style={{ fontWeight: 600 }}>{c.creator_name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>{c.creator_type}</td>
                      <td style={{ textAlign: 'right' }} className="num">{fmt(c.total_views)}</td>
                      <td style={{ textAlign: 'right' }} className="num">{c.episode_count}</td>
                      <td style={{ textAlign: 'right' }} className="num" style={{ fontWeight: 700 }}>
                        {fmtCurrency(c.amount)}
                      </td>
                      <td>
                        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => { setEditReward(c); setEditAmount(String(c.amount)); }}>
                          {t('edit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cpm' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>{lang === 'th' ? 'ครีเอเตอร์' : 'Creator'}</th>
                <th>{t('program')}</th>
                <th style={{ textAlign: 'right' }}>{lang === 'th' ? 'งบ' : 'Budget'}</th>
                <th style={{ textAlign: 'right' }}>{t('views')}</th>
                <th style={{ textAlign: 'right' }}>CPM</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cpmData.map((c: any) => (
                <tr key={c.creator_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ background: c.avatar_color }}>{initials(c.creator_name)}</div>
                      <span style={{ fontWeight: 600 }}>{c.creator_name}</span>
                    </div>
                  </td>
                  <td style={{ color: c.program_color, fontWeight: 600, fontSize: 12 }}>{c.program_name}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmtCurrency(c.amount)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(c.total_views)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      fontWeight: 700,
                      color: c.cpm < 3 ? 'var(--green)' : c.cpm < 10 ? 'var(--yellow)' : 'var(--red)',
                    }}>
                      ฿{c.cpm?.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => { setEditReward(c); setEditAmount(String(c.amount)); }}>
                      {t('edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editReward && (
        <div className="modal-overlay" onClick={() => setEditReward(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              {lang === 'th' ? 'แก้ไขงบประมาณ' : 'Edit Budget'} — {editReward.creator_name}
            </div>
            <div className="form-group">
              <label>{lang === 'th' ? 'จำนวน (฿)' : 'Amount (฿)'}</label>
              <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditReward(null)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={saveEdit}>{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
