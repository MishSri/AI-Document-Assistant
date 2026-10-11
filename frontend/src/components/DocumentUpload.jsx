import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileText, FileSpreadsheet, FileUp, Trash2, Loader2, FileCode, AlertTriangle, Sparkles, Search } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function DocumentUpload({ workspaceId, onUploadSuccess, onSummarize }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDocuments = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/documents/${workspaceId}`);
      setDocuments(response.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
      setError("Could not load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [workspaceId]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("workspace_id", workspaceId);

        await axios.post(`${API_BASE}/documents/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
      await fetchDocuments();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error("Failed to upload file", err);
      setError(err.response?.data?.detail || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      await axios.delete(`${API_BASE}/documents/${workspaceId}/${filename}`);
      await fetchDocuments();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error("Failed to delete document", err);
      setError("Could not delete document");
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    if (ext === "pdf") return <FileText className="w-4 h-4 text-red-500 shrink-0" />;
    if (["xlsx", "xls", "csv"].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (["docx", "doc"].includes(ext)) return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    if (["pptx", "ppt"].includes(ext)) return <FileText className="w-4 h-4 text-orange-500 shrink-0" />;
    return <FileCode className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  const filteredDocs = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative ${
          dragActive 
            ? "border-indigo-500 bg-indigo-50/10" 
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400"
        }`}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center space-y-1.5">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          ) : (
            <FileUp className="w-8 h-8 text-indigo-500 hover:scale-110 transition-transform" />
          )}
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {uploading ? "Processing documents..." : "Drag & drop files here"}
          </span>
          <span className="text-[10px] text-slate-500">
            PDF, DOCX, PPTX, XLSX, TXT, Images
          </span>
        </label>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-2.5 bg-red-100/10 border border-red-500/20 text-red-500 rounded-lg text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Document List Header & Search */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace Documents ({documents.length})
          </h4>
        </div>

        {documents.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter documents..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
        
        {loading && documents.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No documents uploaded yet.</p>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {filteredDocs.map((doc) => (
              <div
                key={doc.filename}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs hover:shadow-sm transition-shadow group"
              >
                <div className="flex items-center space-x-2 overflow-hidden mr-1">
                  {getFileIcon(doc.filename)}
                  <div className="truncate flex flex-col">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {doc.filename}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      Pages: {doc.page_count}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {/* Summarize button */}
                  <button
                    onClick={() => onSummarize && onSummarize(doc.filename)}
                    className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded transition-all cursor-pointer"
                    title="Summarize with AI"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(doc.filename)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
