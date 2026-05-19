// ========================================
// Auth Page — Login / Register
// ========================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { signIn, signUp, signInWithGoogle, resetPassword, getAuthErrorMessage } from '../services/auth';
import './AuthPage.css';

export default function AuthPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName);
      } else if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-page">
      {/* Background decoration */}
      <div className="auth-bg">
        <div className="auth-bg__circle auth-bg__circle--1" />
        <div className="auth-bg__circle auth-bg__circle--2" />
        <div className="auth-bg__circle auth-bg__circle--3" />
      </div>

      <div className="auth-container">
        {/* Left: Branding */}
        <div className="auth-branding">
          <div className="auth-branding__logo">
            <div className="auth-branding__icon">
              <PenLine />
            </div>
            <h1>Write<span>AI</span></h1>
          </div>
          <p className="auth-branding__tagline">
            {t('auth.tagline')}
          </p>
          <div className="auth-branding__features">
            <div className="auth-feature">
              <span className="auth-feature__icon">✨</span>
              <div>
                <strong>{t('auth.feature1Title')}</strong>
                <p>{t('auth.feature1Desc')}</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature__icon">🔍</span>
              <div>
                <strong>{t('auth.feature2Title')}</strong>
                <p>{t('auth.feature2Desc')}</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature__icon">🎨</span>
              <div>
                <strong>{t('auth.feature3Title')}</strong>
                <p>{t('auth.feature3Desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>
              {mode === 'signin' && t('auth.welcomeBack')}
              {mode === 'signup' && t('auth.createAccount')}
              {mode === 'reset' && t('auth.resetPassword')}
            </h2>
            <p>
              {mode === 'signin' && t('auth.welcomeBackDesc')}
              {mode === 'signup' && t('auth.createAccountDesc')}
              {mode === 'reset' && t('auth.resetPasswordDesc')}
            </p>
          </div>

          {/* Google Sign In */}
          {mode !== 'reset' && (
            <>
              <button
                className="auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t('auth.continueWithGoogle')}
              </button>
              <div className="auth-divider">
                <span>{t('auth.or')}</span>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="displayName">
                  <User size={14} />
                  {t('auth.fullName')}
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('auth.namePlaceholder')}
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">
                <Mail size={14} />
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>

            {mode !== 'reset' && (
              <div className="auth-field">
                <label htmlFor="password">
                  <Lock size={14} />
                  {t('auth.password')}
                </label>
                <div className="auth-field__password">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="auth-field__toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="confirmPassword">
                  <Lock size={14} />
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            )}

            {mode === 'signin' && (
              <button
                type="button"
                className="auth-forgot"
                onClick={() => switchMode('reset')}
              >
                {t('auth.forgotPassword')}
              </button>
            )}

            {error && (
              <div className="auth-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="auth-success">
                ✅ {success}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={18} className="auth-spinner" />
              ) : (
                <>
                  {mode === 'signin' && t('auth.signIn')}
                  {mode === 'signup' && t('auth.createAccountBtn')}
                  {mode === 'reset' && t('auth.sendResetLink')}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="auth-footer">
            {mode === 'signin' && (
              <p>
                {t('auth.noAccount')}{' '}
                <button onClick={() => switchMode('signup')}>{t('auth.signUp')}</button>
              </p>
            )}
            {mode === 'signup' && (
              <p>
                {t('auth.hasAccount')}{' '}
                <button onClick={() => switchMode('signin')}>{t('auth.signIn')}</button>
              </p>
            )}
            {mode === 'reset' && (
              <p>
                {t('auth.rememberPassword')}{' '}
                <button onClick={() => switchMode('signin')}>{t('auth.signIn')}</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
