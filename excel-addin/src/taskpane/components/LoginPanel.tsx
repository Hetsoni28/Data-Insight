import React, { useState } from 'react';
import { login } from '../../api/auth';

/* global document */

interface LoginPanelProps {
  onLoginSuccess: () => void;
}

const S = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '4px',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  title: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  subtitle: {
    fontSize: '11px',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.5,
  },
  errorBox: {
    padding: '10px 12px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    fontSize: '11px',
    color: '#B91C1C',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#334155',
    letterSpacing: '0.01em',
  },
  inputWrap: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '10px',
    width: '14px',
    height: '14px',
    color: '#94A3B8',
    pointerEvents: 'none' as const,
  },
  input: {
    width: '100%',
    height: '38px',
    paddingLeft: '32px',
    paddingRight: '10px',
    fontSize: '12px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputFocused: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.12)',
  },
  pwToggle: {
    position: 'absolute' as const,
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  },
  btn: {
    width: '100%',
    height: '40px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
    transition: 'background-color 0.15s, box-shadow 0.15s',
    letterSpacing: '0.01em',
  },
  btnDisabled: {
    backgroundColor: '#A7F3D0',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  footer: {
    borderTop: '1px solid #F1F5F9',
    paddingTop: '14px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '10px',
    color: '#94A3B8',
    margin: 0,
    lineHeight: 1.6,
  },
  securityBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    fontSize: '10px',
    color: '#94A3B8',
    marginTop: '16px',
  },
};

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch {
      setError('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Logo */}
        <div style={S.logoWrap}>
          <img src="/assets/logo.svg" alt="Data Insight" style={{ width: '200px', height: 'auto' }} />
        </div>

        {/* Title */}
        <div style={S.titleBlock}>
          <h2 style={S.title}>Enterprise Node Access</h2>
          <p style={S.subtitle}>Sign in with your organization credentials to access your AI workspace.</p>
        </div>

        {/* Error */}
        {error && (
          <div style={S.errorBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Email */}
          <div style={S.fieldWrap}>
            <label style={S.label}>Organization Work Email</label>
            <div style={S.inputWrap}>
              <svg style={S.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="your@email.com"
                style={{ ...S.input, ...(emailFocused ? S.inputFocused : {}) }}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={S.fieldWrap}>
            <label style={S.label}>Account Password</label>
            <div style={S.inputWrap}>
              <svg style={S.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                placeholder="••••••••••••"
                style={{ ...S.input, paddingRight: '36px', ...(pwFocused ? S.inputFocused : {}) }}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={S.pwToggle}>
                {showPassword
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                }
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{ ...S.btn, ...((loading || !email || !password) ? S.btnDisabled : {}) }}
          >
            {loading
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg><span>Authenticating...</span></>
              : <><span>Authenticate to Instance</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>
            }
          </button>
        </form>

        {/* Footer */}
        <div style={S.footer}>
          <p style={S.footerText}>
            Dedicated single-tenant infrastructure.<br />Public self-serve signups are disabled.
          </p>
        </div>
      </div>

      {/* Security badge */}
      <div style={S.securityBadge}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        <span>256-bit encrypted · SOC 2 compliant · Zero-trust security</span>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
