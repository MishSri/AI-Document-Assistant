import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Sun, Moon, Briefcase, Trash2, FolderOpen, Menu, X, ShieldCheck, UserCheck, Sparkles, LogOut } from "lucide-react";
import DocumentUpload from "./components/DocumentUpload";
import ChatInterface from "./components/ChatInterface";
import DocumentSummaryModal from "./components/DocumentSummaryModal";
import AuditLogModal from "./components/AuditLogModal";
import AuthModal from "./components/AuthModal";

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("default");
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [summaryTarget, setSummaryTarget] = useState(null); // { filename }
  
  const [newWsName, setNewWsName] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [newWsDept, setNewWsDept] = useState("General");
  const [modalError, setModalError] = useState("");

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : { username: "admin", full_name: "System Administrator", role: "admin" };
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const fetchWorkspaces = async () => {
    try {
      const response = await axios.get(`${API_BASE}/workspaces`);
      setWorkspaces(response.data);
      if (!response.data.some(w => w.id === activeWorkspaceId)) {
        setActiveWorkspaceId("default");
      }
    } catch (err) {
      console.error("Failed to load workspaces", err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleLoginSuccess = (data) => {
    setCurrentUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.access_token);
  };

  const handleLogout = () => {
    setCurrentUser({ username: "guest", full_name: "Guest User", role: "member" });
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setModalError("");
    try {
      const response = await axios.post(`${API_BASE}/workspaces?username=${encodeURIComponent(currentUser.username)}`, {
        name: newWsName.trim(),
        description: newWsDesc.trim(),
        department: newWsDept
      });
      setNewWsName("");
      setNewWsDesc("");
      setShowCreateModal(false);
      await fetchWorkspaces();
      setActiveWorkspaceId(response.data.id);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to create workspace");
    }
  };

  const handleDeleteWorkspace = async (e, id, name) => {
    e.stopPropagation();
    if (id === "default") return;
    if (!confirm(`Are you sure you want to delete workspace "${name}"? This deletes all uploaded documents in it.`)) return;
    try {
      await axios.delete(`${API_BASE}/workspaces/${id}?username=${encodeURIComponent(currentUser.username)}`);
      if (activeWorkspaceId === id) {
        setActiveWorkspaceId("default");
      }
      await fetchWorkspaces();
    } catch (err) {
      console.error("Failed to delete workspace", err);
    }
  };

  const getActiveWorkspaceName = () => {
    return workspaces.find(w => w.id === activeWorkspaceId)?.name || "Default Workspace";
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Mobile Hamburger Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm cursor-pointer text-slate-700 dark:text-slate-300"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              DocAssistant
            </h1>
          </div>
        </div>

        {/* Workspace Manager */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Workspaces ({workspaces.length})
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-md transition-all flex items-center justify-center cursor-pointer"
              title="Create Workspace"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => {
                  setActiveWorkspaceId(ws.id);
                  setIsMobileOpen(false);
                }}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                  activeWorkspaceId === ws.id
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium truncate max-w-[160px]">{ws.name}</span>
                </div>
                {ws.id !== "default" && (
                  <button
                    onClick={(e) => handleDeleteWorkspace(e, ws.id, ws.name)}
                    className={`p-1 rounded hover:bg-red-500/20 cursor-pointer ${
                      activeWorkspaceId === ws.id ? "text-white" : "text-slate-500 hover:text-red-500"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Document Uploader container */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <DocumentUpload
            workspaceId={activeWorkspaceId}
            onSummarize={(filename) => setSummaryTarget({ filename })}
          />
        </div>

        {/* Sidebar Footer / Theme Switcher & User info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-2 truncate mr-2">
            <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            <div className="truncate flex flex-col">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                {currentUser.full_name}
              </span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">
                {currentUser.role}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Desktop Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-6 pl-16 md:pl-6 shrink-0">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100 truncate">
              {getActiveWorkspaceName()}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* Audit Logs Trigger */}
            <button
              onClick={() => setShowAuditModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Audit Logs</span>
            </button>

            {/* Auth Trigger */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Switch User</span>
            </button>
          </div>
        </header>

        {/* Chat Pane */}
        <div className="flex-1 p-6 overflow-hidden">
          <ChatInterface workspaceId={activeWorkspaceId} />
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Create Workspace</h3>
            <p className="text-xs text-slate-500 mb-4">Group documents by department, project, or domain</p>
            
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. HR Department, Q3 Strategy"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Department
                </label>
                <select
                  value={newWsDept}
                  onChange={(e) => setNewWsDept(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="General">General</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR">Human Resources</option>
                  <option value="Legal">Legal & Compliance</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              {modalError && (
                <p className="text-xs text-red-500 font-medium">{modalError}</p>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewWsName("");
                    setNewWsDesc("");
                    setModalError("");
                  }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAuditModal && (
        <AuditLogModal onClose={() => setShowAuditModal(false)} />
      )}

      {showAuthModal && (
        <AuthModal
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {summaryTarget && (
        <DocumentSummaryModal
          workspaceId={activeWorkspaceId}
          filename={summaryTarget.filename}
          onClose={() => setSummaryTarget(null)}
        />
      )}
    </div>
  );
}
