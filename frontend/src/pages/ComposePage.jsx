import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LABELS, ROUTES } from '../config/constants.js';
import { LetterApi } from '../services/letterApi.js';

export default function ComposePage() {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    setError('');
    if (!content.trim()) return;
    setSending(true);
    try {
      await LetterApi.send({ content: content.trim() });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="compose-wrap" style={{ textAlign: 'center' }}>
        <h2 className="compose-title">信已投入驿站</h2>
        <p className="compose-hint">它正在寻找一位陌生的旅人……</p>
        <div className="home-actions">
          <button className="secondary-btn" onClick={() => { setDone(false); setContent(''); }}>
            再写一封
          </button>
          <button className="secondary-btn" onClick={() => navigate(ROUTES.INBOX)}>
            去看看我的信箱
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="compose-wrap">
      <h2 className="compose-title">{LABELS.COMPOSE}</h2>
      <p className="compose-hint">
        这封信会随机分配给另一位注册的旅人。你们彼此看不到真名，只以信会友。
      </p>
      <textarea
        className="compose-text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={LABELS.CONTENT_PLACEHOLDER}
        maxLength={2000}
      />
      <div className="compose-footer">
        <span className="count">{content.length} / 2000</span>
        <div>
          <button
            className="secondary-btn"
            style={{ marginRight: 10 }}
            onClick={() => navigate(ROUTES.HOME)}
          >
            {LABELS.BACK}
          </button>
          <button className="big-btn" onClick={submit} disabled={sending || !content.trim()}>
            {sending ? '投入中…' : LABELS.SEND}
          </button>
        </div>
      </div>
      <div className="error-text">{error}</div>
    </div>
  );
}
