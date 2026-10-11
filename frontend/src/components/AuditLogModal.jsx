import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, ShieldCheck, Search, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:8000/api"; 

export default function AuditLogModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await axios.get(`${API_BASE}/audit`);
        setLogs(response.data);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter(log =>
    log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.workspace_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative animate-slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Enterprise Audit Logs</h3>
              <p className="text-xs text-slate-500">Security audit trail of user actions & document modifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Input */}
        <div className="mb-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit logs by action, user, or details..."
            className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              No audit logs found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Workspace</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-indigo-600 dark:text-indigo-400">
                      {log.username}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 truncate max-w-[100px]">
                      {log.workspace_id}
                    </td>
                    <td className="py-2.5 px-3 max-w-[250px] truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span className="text-[10px] text-slate-500">
            Total entries: {filteredLogs.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-500 transition-colors cursor-pointer shadow-sm"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
}
