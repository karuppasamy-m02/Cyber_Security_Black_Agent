import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { api } from '../services/api';
import { Logo } from '../components/ui/Logo';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Security Analyst');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        username,
        email,
        password,
        full_name: fullName,
        role
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Username or email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center p-4 relative selection:bg-[#2B2B2B] selection:text-[#F5F5F2]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(43,43,43,0.25),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md bg-[#121212] border border-[#2B2B2B] rounded-xl shadow-popover p-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo variant="login" className="mb-2" />
          <h1 className="text-base font-semibold text-[#F5F5F2] mt-2">
            Analyst Clearance Provisioning
          </h1>
          <p className="text-xs text-[#A8A8A3] mt-0.5 font-mono">
            Provision access to the CYBER BLACK SOC platform
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[#181818] border border-red-500/50 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-[#A8A8A3] mb-1.5 uppercase">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="e.g. Alex Rivera"
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3.5 py-2.5 text-xs text-[#F5F5F2] placeholder-[#A8A8A3]/40 focus:outline-none focus:border-[#F5F5F2] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-[#A8A8A3] mb-1.5 uppercase">
              Operator Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#A8A8A3] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g. arivera"
                className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md pl-9 pr-4 py-2.5 text-xs text-[#F5F5F2] placeholder-[#A8A8A3]/40 focus:outline-none focus:border-[#F5F5F2] font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-[#A8A8A3] mb-1.5 uppercase">
              Enterprise Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A8A8A3] absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="arivera@cyberblack.local"
                className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md pl-9 pr-4 py-2.5 text-xs text-[#F5F5F2] placeholder-[#A8A8A3]/40 focus:outline-none focus:border-[#F5F5F2] font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-[#A8A8A3] mb-1.5 uppercase">
              Clearance Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md px-3 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#F5F5F2] transition-colors font-mono"
            >
              <option value="Security Analyst">Security Analyst (Triage & Response)</option>
              <option value="Viewer">Viewer (Read-Only Compliance)</option>
              <option value="Administrator">Administrator (Full Policy Control)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-[#A8A8A3] mb-1.5 uppercase">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A8A8A3] absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 8 characters"
                className="w-full bg-[#161616] border border-[#2B2B2B] rounded-md pl-9 pr-4 py-2.5 text-xs text-[#F5F5F2] placeholder-[#A8A8A3]/40 focus:outline-none focus:border-[#F5F5F2] font-mono transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-[#F5F5F2] hover:bg-[#E5E5E0] text-[#0A0A0A] font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6 shadow-sm"
          >
            {loading ? 'Provisioning Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-[#A8A8A3] hover:text-[#F5F5F2] transition-colors font-mono">
            Already have clearance? Sign in &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
