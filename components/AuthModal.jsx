import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, AlertCircle } from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  githubProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../lib/firebase';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const AuthModal = ({ isOpen, onClose, defaultIsLogin = true }) => {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsLogin(defaultIsLogin);
      setError(null);
    }
  }, [isOpen, defaultIsLogin]);

  if (!isOpen) return null;

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose(); // Close modal on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
        />
        
        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass"
          style={{ position: 'relative', width: '100%', maxWidth: '420px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(15, 23, 42, 0.85)' }}
        >
          <button 
            onClick={onClose} 
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? 'Sign in to continue to your account' : 'Sign up to unlock premium features'}
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', padding: '0.75rem', borderRadius: '8px', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" 
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '0.875rem', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, marginTop: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => handleSocialAuth(googleProvider)}
              disabled={loading}
              style={{ flex: 1, padding: '0.75rem', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', gap: '0.5rem' }}
            >
              <GoogleIcon />
              <span style={{ color: '#fff', fontWeight: 500 }}>Google</span>
            </button>
            <button 
              onClick={() => handleSocialAuth(githubProvider)}
              disabled={loading}
              style={{ flex: 1, padding: '0.75rem', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', gap: '0.5rem' }}
            >
              <GithubIcon />
              <span style={{ color: '#fff', fontWeight: 500 }}>GitHub</span>
            </button>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
