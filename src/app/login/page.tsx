/* cspell:disable */
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogIn, Lock, Mail } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('logout') === 'success') {
        toast.info('Anda telah berhasil keluar dari akun.');
        // Clean URL to avoid repeating toast on refresh
        window.history.replaceState({}, document.title, '/login');
      }
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Access granted. Welcome back, Al!');
        // Use window.location for a clean redirect and state reload
        window.location.href = '/dashboard';
      } else {
        setErrorMsg(data.error || 'Authentication failed. Please check your credentials.');
        toast.error(data.error || 'Login failed.');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setErrorMsg('A network error occurred. Please try again.');
      toast.error('Network error during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative neon glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <div className="glass w-full max-w-md rounded-[2rem] border border-white/5 shadow-2xl p-8 relative z-10 space-y-8 animate-fade-in">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">
              HUSTLE<span className="text-indigo-500 font-extrabold">.NUNN</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Career Momentum Portal
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-2xl flex items-start gap-2.5 animate-bounce">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 block">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-[#090d22] border border-[#1e293b] rounded-xl py-3 pl-10 pr-3.5 text-xs text-white outline-none focus:border-indigo-500 focus:bg-[#0c1230] transition duration-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 block">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-[#090d22] border border-[#1e293b] rounded-xl py-3 pl-10 pr-3.5 text-xs text-white outline-none focus:border-indigo-500 focus:bg-[#0c1230] transition duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl btn-gradient font-black text-white uppercase text-xs tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] transition duration-150 mt-6"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authorizing...
              </>
            ) : (
              'Unlock Access'
            )}
          </button>
        </form>

        {/* Footer Notice */}
        <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-widest mt-4 leading-normal">
          This system is private and restricted.
        </p>
      </div>
    </div>
  );
}
