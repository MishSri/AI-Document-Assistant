import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Send, Download, BookOpen, Trash2, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function ChatInterface({ workspaceId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchHistory = async () => {
    if (!workspaceId) return;
    try {
      const response = await axios.get(`${API_BASE}/chat/history/${workspaceId}`);
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    setActiveSnippet(null);
  }, [workspaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, timestamp: new Date().toISOString() }
    ]);

    try {
      await axios.post(`${API_BASE}/chat`, {
        question: userMsg,
        workspace_id: workspaceId
      });
      await fetchHistory();
    } catch (err) {
      console.error("Failed to submit question", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Could not retrieve answer. Check if backend server is running.",
          citations: [],
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear all conversation history in this workspace?")) return;
    try {
      await axios.delete(`${API_BASE}/chat/history/${workspaceId}`);
      setMessages([]);
      setActiveSnippet(null);
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const downloadAnswer = (content, idx) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `document_assistant_answer_${idx + 1}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMessage = (text) => {
    if (!text) return "";
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/^\s*[\-\*]\s+(.*)$/gm, "<li>$1</li>");
    escaped = escaped.replace(/(<li>.*<\/li>)/g, '<ul class="list-disc pl-4 my-2">$1</ul>');
    escaped = escaped.replace(/<\/ul>\s*<ul class="list-disc pl-4 my-2">/g, "");
    escaped = escaped.replace(/\n/g, "<br />");
    return escaped;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden relative shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">AI Assistant</h3>
          <p className="text-[10px] text-slate-500">Ask questions grounded in uploaded workspace files</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-10">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 animate-pulse" />
            <div className="max-w-md">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Start the conversation</p>
              <p className="text-xs text-slate-500 mt-1">
                Upload some documents in the sidebar, then ask questions like "Summarize the vacation policies" or "What is our company leave policy?"
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} space-y-1 animate-slide-up`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm relative group ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : msg.isError
                  ? "bg-red-500/10 border border-red-500/30 text-red-500 rounded-bl-none"
                  : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none"
              }`}
            >
              <div
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                className="leading-relaxed break-words"
              />

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    <BookOpen className="w-3 h-3 mr-1" />
                    <span>Citations & Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((cit, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => setActiveSnippet(cit)}
                        className="flex items-center space-x-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] border border-slate-200 dark:border-slate-700 font-medium transition-colors cursor-pointer"
                      >
                        <span className="w-3.5 h-3.5 flex items-center justify-center bg-indigo-500 text-white rounded-full text-[9px]">
                          {cit.index}
                        </span>
                        <span className="truncate max-w-[100px]">{cit.filename}</span>
                        <span>(p. {cit.page})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msg.role === "assistant" && !msg.isError && (
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-sm">
                  <button
                    onClick={() => downloadAnswer(msg.content, idx)}
                    className="p-1 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                    title="Download Answer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            
            <span className="text-[9px] text-slate-500 px-2 select-none">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col items-start space-y-1">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center space-x-2">
              <span className="flex space-x-1.5 items-center justify-center py-1">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {activeSnippet && (
        <div className="absolute inset-x-0 bottom-20 mx-4 bg-white dark:bg-slate-950 border border-indigo-500/20 dark:border-indigo-500/40 rounded-xl p-4 shadow-xl z-20 animate-slide-up">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-indigo-500 text-white rounded text-[10px] font-semibold">
                Source {activeSnippet.index}
              </span>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 max-w-[200px] truncate">
                {activeSnippet.filename}
              </span>
              <span className="text-[10px] text-slate-500">
                (Page/Slide: {activeSnippet.page})
              </span>
            </div>
            <button
              onClick={() => setActiveSnippet(null)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-100 dark:border-slate-900 leading-relaxed italic max-h-32 overflow-y-auto">
            "{activeSnippet.snippet}"
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
