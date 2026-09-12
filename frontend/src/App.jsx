import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LABELS, ROUTES, STORAGE_KEYS } from './config/constants.js';
import { api } from './services/http.js';
import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ComposePage from './pages/ComposePage.jsx';
import InboxPage from './pages/InboxPage.jsx';
import ThreadPage from './pages/ThreadPage.jsx';
import './styles/global.css';

function AppShell({ children }) {
  const navigate = useNavigate();
  const [penName, setPenName] = useState(api.getPenName());

  useEffect(() => {
    setPenName(api.getPenName());
  }, []);

  const logout = () => {
    api.clearToken();
    localStorage.removeItem(STORAGE_KEYS.PEN_NAME);
    setPenName(null);
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" onClick={() => navigate(ROUTES.HOME)}>
          <span className="brand-dot" />
          <span className="brand-title">{LABELS.APP_TITLE}</span>
          <span className="brand-sub">{LABELS.APP_SUBTITLE}</span>
        </div>
        <nav className="app-nav">
          <button className="nav-btn" onClick={() => navigate(ROUTES.COMPOSE)}>
            ✉ {LABELS.COMPOSE}
          </button>
          <button className="nav-btn" onClick={() => navigate(ROUTES.INBOX)}>
            📭 {LABELS.MY_INBOX}
          </button>
          {penName && (
            <>
              <span className="pen-name">@{penName}</span>
              <button className="nav-btn ghost" onClick={logout}>
                {LABELS.LOGOUT}
              </button>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        寄给陌生人的，也许会寄到你自己。· ports 8178 / 9178 / 10178
      </footer>
    </div>
  );
}

function RequireAuth({ children }) {
  if (!api.getToken()) return <Navigate to={ROUTES.LOGIN} replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<AuthPage mode="login" />} />
      <Route path={ROUTES.REGISTER} element={<AuthPage mode="register" />} />
      <Route
        path={ROUTES.HOME}
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path={ROUTES.COMPOSE}
        element={
          <RequireAuth>
            <ComposePage />
          </RequireAuth>
        }
      />
      <Route
        path={ROUTES.INBOX}
        element={
          <RequireAuth>
            <InboxPage />
          </RequireAuth>
        }
      />
      <Route
        path={ROUTES.THREAD}
        element={
          <RequireAuth>
            <ThreadPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
