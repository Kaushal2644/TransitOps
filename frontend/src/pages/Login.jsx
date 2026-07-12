import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Dispatcher");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setAttemptsLeft(null);
    setLocked(false);
    setLoading(true);

    try {
      await login(email, password, role);
      navigate("/dashboard");
    } catch (err) {
      const res = err.response?.data;
      setError(res?.message || "Something went wrong. Please try again.");
      if (res?.locked) setLocked(true);
      if (res?.attemptsLeft !== undefined) setAttemptsLeft(res.attemptsLeft);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0d1117]">
      {/* Left panel */}
      <div className="hidden md:flex md:w-1/2 bg-[#12161c] flex-col justify-between p-12 border-r border-gray-800">
        <div>
          <div className="w-12 h-12 rounded bg-gradient-to-br from-amber-500 to-amber-700 mb-6" />
          <h1 className="text-2xl font-semibold text-white">TransitOps</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Transport Operations Platform</p>
        </div>

        <div>
          <p className="text-gray-300 font-medium mb-3">One login, Four roles:</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Fleet Manager
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Dispatcher
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Safety Officer
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Financial Analyst
            </li>
          </ul>

          <div className="text-xs text-gray-500 mt-6 space-y-1">
            <p>Access is scoped by role after login:</p>
            <p>• Fleet Manager → Fleet, Maintenance</p>
            <p>• Dispatcher → Dashboard, Trips</p>
            <p>• Safety Officer → Drivers, Compliance</p>
            <p>• Financial Analyst → Fuel & Expenses, Analytics</p>
          </div>
        </div>

        <p className="text-xs text-gray-600">TRANSITOPS © 2026 · RBAC ENABLED</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-white mb-1">Sign in to your account</h2>
          <p className="text-gray-500 text-sm mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={locked}
                className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600 disabled:opacity-50"
                placeholder="you@transitops.in"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={locked}
                className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Role (RBAC)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={locked}
                className="w-full bg-[#161b22] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600 disabled:opacity-50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Error / Lockout box — matches mockup exactly */}
            {error && (
              <div className="border border-red-900 bg-red-950/40 rounded p-3 text-xs">
                <p className="text-red-400 font-medium mb-1">
                  {locked ? "Account Locked" : "Error state"}
                </p>
                <p className="text-red-300">✗ {error}</p>
                {attemptsLeft !== null && !locked && (
                  <p className="text-red-400 mt-1">{attemptsLeft} attempt(s) remaining before lockout</p>
                )}
                {locked && (
                  <p className="text-red-400 mt-1">Account locked after 5 failed attempts.</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-amber-600"
                />
                Remember me
              </label>
              <button type="button" className="text-amber-500 hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || locked}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded transition"
            >
              {loading ? "Signing in..." : locked ? "Account Locked" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;