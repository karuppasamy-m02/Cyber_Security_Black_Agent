import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Logo } from '../components/ui/Logo';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post<any>('/auth/login', { username, password });
      setAuth(data.user, data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center p-4 relative selection:bg-[#2B2B2B] selection:text-[#F5F5F2]">
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(43,43,43,0.25),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md bg-[#121212] border border-[#2B2B2B] rounded-xl shadow-popover p-8 relative z-10">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo variant="login" className="mb-2" />
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[#181818] border border-red-500/50 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A8A8A3] mb-1.5 font-mono">
              Operator Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#A8A8A3] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter operator username"
                className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md pl-9 pr-4 py-2.5 text-xs text-[#F5F5F2] placeholder-[#A8A8A3]/40 focus:outline-none focus:border-[#F5F5F2] font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A8A3] mb-1.5 font-mono">
              Clearance Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A8A8A3] absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter clearance password"
                className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md pl-9 pr-4 py-2.5 text-xs text-[#F5F5F2] placeholder-[#A8A8A3]/40 focus:outline-none focus:border-[#F5F5F2] font-mono transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-[#F5F5F2] hover:bg-[#E5E5E0] text-[#0A0A0A] font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6 shadow-sm"
          >
            {loading ? 'Authenticating Clearance...' : 'Access Command Center'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-xs text-[#A8A8A3] hover:text-[#F5F5F2] transition-colors font-mono">
            Register a new SOC analyst account &rarr;
          </Link>
        </div>

        {/* Security Baseline Footer */}
        <div className="mt-8 pt-4 border-t border-[#2B2B2B] text-center">
          <span className="text-[10px] font-mono text-[#767672] flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-[#A8A8A3]" />
            SOC 2 TYPE II COMPLIANT &bull; LOCAL ON-PREMISE AI
          </span>
        </div>
      </div>
    </div>
  );
};
