import React, { useState } from "react";
import axios from "axios";
import { X, Lock, UserCheck, KeyRound } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function AuthModal({ onLoginSuccess, onClose }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username,
        password
      });
      onLoginSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const setQuickRole = (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-slide-up">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Enterprise Login</h3>
              <p className="text-xs text-slate-500">Authenticate for department-based document access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Role Selection */}
        <div className="mb-4 space-y-1.5">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Quick Role Switch
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setQuickRole("admin", "admin")}
              className={`p-2 rounded-xl text-xs border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                username === "admin"
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <div>
                <div className="truncate font-semibold">Administrator</div>
                <div className="text-[9px] text-slate-500">Full Enterprise Access</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setQuickRole("employee", "admin")}
              className={`p-2 rounded-xl text-xs border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                username === "employee"
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <div>
                <div className="truncate font-semibold">Staff Member</div>
                <div className="text-[9px] text-slate-500">Standard Access</div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
