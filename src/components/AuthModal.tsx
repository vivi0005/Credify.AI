import React, { useState } from 'react';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<User['role']>('Underwriting Officer');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = async (demoRole: User['role'], demoEmail: string, demoName: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, role: demoRole }),
      });
      const data = await res.json();
      if (data.user) {
        onLoginSuccess(data.user);
        onClose();
      }
    } catch {
      onLoginSuccess({
        id: `demo-${Date.now()}`,
        name: demoName,
        email: demoEmail,
        role: demoRole,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, role } : { email, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.user) {
        onLoginSuccess(data.user);
        onClose();
      }
    } catch {
      onLoginSuccess({
        id: `usr-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        role,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-emerald-950/20">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isRegister ? 'Create Credify AI Account' : 'Sign In to Credify AI'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Access the Underwriting Engine &amp; Regulatory Audits
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quick Demo Role Picker */}
        <div className="my-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            1-Click Demo Profiles
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('Underwriting Officer', 's.jenkins@credify.ai', 'Sarah Jenkins, CRCM')}
              className="px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 text-left transition-all group"
            >
              <div className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 truncate">Officer</div>
              <div className="text-[10px] text-slate-500 truncate">Underwriting</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('Risk Analyst', 'm.vance@credify.ai', 'Marcus Vance, PhD')}
              className="px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 text-left transition-all group"
            >
              <div className="text-xs font-medium text-slate-200 group-hover:text-blue-300 truncate">Analyst</div>
              <div className="text-[10px] text-slate-500 truncate">Model Risk</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('Loan Applicant', 'alex.chen@applicant.io', 'Alex Chen')}
              className="px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 text-left transition-all group"
            >
              <div className="text-xs font-medium text-slate-200 group-hover:text-amber-300 truncate">Applicant</div>
              <div className="text-[10px] text-slate-500 truncate">Borrower View</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Hayes"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Institutional Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. officer@credify.ai"
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Role Designation</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as User['role'])}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Underwriting Officer">Underwriting Officer (Full Authority)</option>
              <option value="Risk Analyst">Risk Analyst (Auditing &amp; Model Monitoring)</option>
              <option value="Loan Applicant">Loan Applicant (Borrower Portal)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              defaultValue="password123"
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 text-xs font-semibold rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In to Workspace'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isRegister
              ? 'Already registered? Click here to Sign In'
              : 'New to Credify AI? Register institutional credentials'}
          </button>
        </div>
      </div>
    </div>
  );
};
