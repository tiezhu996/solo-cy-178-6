import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LABELS, ROUTES } from '../config/constants.js';
import { AuthApi } from '../services/authApi.js';
import { api } from '../services/http.js';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const [penName, setPenName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!penName.trim() || !password) return;
    setLoading(true);
    try {
      const data = isLogin
        ? await AuthApi.login({ penName: penName.trim(), password })
        : await AuthApi.register({ penName: penName.trim(), password });
      api.setToken(data.token, data.penName);
      navigate(ROUTES.HOME, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <h1 className="auth-title">{isLogin ? LABELS.LOGIN : LABELS.REGISTER}</h1>
      <p className="auth-hint">{isLogin ? LABELS.LOGIN_HINT : LABELS.REGISTER_HINT}</p>
      <form onSubmit={submit}>
        <div className="field">
          <label>{LABELS.PEN_NAME}</label>
          <input
            value={penName}
            onChange={(e) => setPenName(e.target.value)}
            placeholder="给自己取个笔名"
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label>{LABELS.PASSWORD}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </div>
        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? '…' : isLogin ? LABELS.LOGIN : LABELS.REGISTER}
        </button>
        <div className="error-text">{error}</div>
      </form>
      <button
        className="switch-link"
        onClick={() => navigate(isLogin ? ROUTES.REGISTER : ROUTES.LOGIN)}
      >
        {isLogin ? LABELS.SWITCH_TO_REGISTER : LABELS.SWITCH_TO_LOGIN}
      </button>
    </div>
  );
}
