import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import './Login.css';
import { FaGem, FaUser, FaLock } from 'react-icons/fa';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({ username, password });

      if (response.data.success) {
        const { token, role } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('userRole', role);

        onLogin(token, role);

        if (role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (role === 'STAFF') {
          navigate('/staff/dashboard');
        } else {
          navigate('/user/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || t('auth.invalid_credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FaGem className="login-icon" />
          <h1>{t('auth.login_title')}</h1>
          <p>{t('auth.login_subtitle')}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <FaUser className="input-icon"/>
            <input
              type="text"
              placeholder={t('auth.email')}
              value={username}
              onChange={(e)=>setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon"/>
            <input
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? t('auth.logging_in') : t('auth.login_btn')}
          </button>
        </form>

        <div className="login-footer">
          <p>{t('auth.no_account')} <a href="/signup">{t('auth.signup_btn')}</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;