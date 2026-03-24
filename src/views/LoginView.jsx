import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Check, Eye, EyeOff } from 'lucide-react';
import './LoginView.css';

const LoginView = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Nome é obrigatório'); setLoading(false); return; }
        await register(name, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <span className="login-logo">Mavenflow.</span>
          <p className="login-tagline">Organize projetos. Mova tarefas. Entregue resultados.</p>
        </div>
        <div className="login-features">
          {['Boards e Kanban em tempo real', 'Colaboração com sua equipe', 'Checklists, labels e muito mais'].map(f => (
            <div key={f} className="login-feature">
              <div className="feature-check"><Check size={12} /></div>
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
          <p className="login-sub">
            {mode === 'login' ? 'Novo por aqui? ' : 'Já tem conta? '}
            <button className="login-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="login-field">
                <label>Nome completo</label>
                <input
                  autoFocus
                  type="text"
                  className="login-input"
                  placeholder="Seu nome"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="login-field">
              <label>E-mail</label>
              <input
                type="email"
                className="login-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus={mode === 'login'}
              />
            </div>

            <div className="login-field">
              <label>Senha</label>
              <div className="login-pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="login-input"
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
