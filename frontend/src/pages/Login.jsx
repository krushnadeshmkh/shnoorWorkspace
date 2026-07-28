import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const redirectByRole = (role) => {
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/employee/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);
      const { user, token } = res.data;
      login(user, token);
      redirectByRole(user.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong, try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-body">
      <div className="hidden lg:flex lg:w-[42%] bg-navy text-white px-8 py-10 lg:px-14 lg:py-16 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
            <span className="font-display text-xl font-bold">S</span>
          </div>
          <span className="font-display text-lg font-semibold">Workspace</span>
        </div>

        <div className="my-10 lg:my-0 max-w-sm">
          <p className="text-xs font-semibold tracking-widest text-cobalt uppercase mb-4">Welcome back</p>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Good to see<br />you again.
          </h1>
          <p className="text-white/60 text-sm lg:text-base mt-5">
            Pick up right where you left off, every email and every channel waiting in one place.
          </p>

          <ul className="mt-8 space-y-3">
            <li className="flex items-center gap-3 text-sm text-white/80">
              <svg className="h-5 w-5 text-cobalt shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
              Unified inbox for mail and chat
            </li>
            <li className="flex items-center gap-3 text-sm text-white/80">
              <svg className="h-5 w-5 text-cobalt shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
              Real-time sync across your whole team
            </li>
            <li className="flex items-center gap-3 text-sm text-white/80">
              <svg className="h-5 w-5 text-cobalt shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
              Enterprise-grade encryption, always on
            </li>
          </ul>
        </div>

        <p className="text-white/30 text-xs">© 2026 Workspace. Built for teams who hate switching tabs.</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-16 bg-paper">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="h-10 w-10 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center">
              <span className="font-display text-lg font-bold text-navy">S</span>
            </div>
            <span className="font-display text-base font-semibold text-navy">Workspace</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-navy">Welcome back</h2>
            <p className="text-slate text-sm mt-2">Log in to keep the conversation going</p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-4 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border border-navy/15 rounded-md px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-cobalt/40 focus:border-cobalt"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-navy">Password</label>
                <a href="#" className="text-xs text-cobalt hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border border-navy/15 rounded-md px-4 py-2.5 pr-11 text-navy focus:outline-none focus:ring-2 focus:ring-cobalt/40 focus:border-cobalt"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-navy"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4 10 7-.36 1.13-1.16 2.44-2.29 3.6M6.24 6.24C4.03 7.73 2.42 9.9 2 12c1 3 5 7 10 7 1.28 0 2.5-.24 3.6-.68" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white py-2.5 rounded-md font-medium hover:bg-navy/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? 'Logging in...' : 'Log in'}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </button>
          </form>

          <p className="text-sm text-slate text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-cobalt hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;