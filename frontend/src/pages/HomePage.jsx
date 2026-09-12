import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LABELS, ROUTES } from '../config/constants.js';

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="home-hero">
      <h1>{LABELS.APP_TITLE}</h1>
      <p>
        投一封信给一位你永远不会知道名字的陌生人。
        也许会收到一封你从未期待的回信。
      </p>
      <button className="big-btn" onClick={() => navigate(ROUTES.COMPOSE)}>
        {LABELS.COMPOSE}
      </button>
      <div className="home-actions">
        <button className="secondary-btn" onClick={() => navigate(ROUTES.INBOX)}>
          去看看我的信箱
        </button>
      </div>
    </div>
  );
}
