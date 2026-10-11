import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Sparkles, CheckCircle2, Tag, Loader2, FileText } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function DocumentSummaryModal({ workspaceId, filename, onClose }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE}/documents/summarize/${workspaceId}/${filename}`);
        setSummaryData(response.data);
      } catch (err) {
        console.error("Failed to generate summary", err);
        setError("Could not generate summary for this document.");
      } finally {
        setLoading(false);
      }
    };
    if (workspaceId && filename) {
      fetchSummary();
    }
  }, [workspaceId, filename]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative animate-slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <span>AI Document Summary</span>
              </h3>
              <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                <FileText className="w-3 h-3" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{filename}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-medium text-slate-500">Analyzing document structure & extracting insights...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
              {error}
            </div>
          ) : summaryData ? (
            <>
              {/* Executive Overview */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Executive Summary
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {summaryData.summary}
                </p>
              </div>

              {/* Key Takeaways */}
              {summaryData.key_takeaways && summaryData.key_takeaways.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Key Takeaways
                  </h4>
                  <div className="space-y-2">
                    {summaryData.key_takeaways.map((takeaway, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-normal">{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {summaryData.topics && summaryData.topics.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Core Topics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {summaryData.topics.map((topic, idx) => (
                      <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 rounded-lg text-xs font-medium">
                        <Tag className="w-3 h-3 mr-1" />
                        <span>{topic}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-500 transition-colors cursor-pointer shadow-sm"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
}
