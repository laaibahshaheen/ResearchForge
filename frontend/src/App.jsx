import { useState, useRef, useEffect } from "react";
import "./App.css";

const API_BASE = "http://localhost:8000";

const WELCOME = {
  role: "ai",
  content: "Upload a research paper and ask me anything about it — I will search the full text and give you grounded answers with source references.",
};

function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  );
}

function formatAnswer(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("* ") || line.startsWith("- ")) {
      return <li key={i}>{line.slice(2)}</li>;
    }
    if (line.startsWith("## ")) {
      return <strong key={i} style={{display:"block", marginTop:"10px"}}>{line.slice(3)}</strong>;
    }
    if (line.trim() === "") return <br key={i} />;
    return <p key={i} style={{margin:"2px 0"}}>{line}</p>;
  });
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  const lines = msg.content !== "__loading__" ? msg.content.split("\n") : [];
  const pageRefs = lines
    .join(" ")
    .match(/\(Page \d+\)/g);
  const uniquePages = pageRefs ? [...new Set(pageRefs)] : [];

  return (
    <div className={`chat-row ${isUser ? "chat-row--user" : "chat-row--ai"}`}>
      <span className="role-label">{isUser ? "You" : "AI"}</span>
      <div className={`bubble ${isUser ? "bubble--user" : "bubble--ai"}`}>
        {msg.content === "__loading__" ? (
          <TypingDots />
        ) : (
          <ul style={{listStyle:"none", padding:0, margin:0}}>
            {formatAnswer(msg.content)}
          </ul>
        )}
        {uniquePages.length > 0 && (
          <div className="sources">
            <span className="sources-label">Sources</span>
            {uniquePages.map((p, i) => (
              <span key={i} className="source-chip">{p}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function Sidebar({ pdfs, activePdf, onSelect, onUpload, uploading, uploadStatus }) {
  const fileRef = useRef();

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="logo-row">
          <div className="logo-sq">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" fill="#F5F0E8"/>
              <rect x="9" y="2" width="5" height="5" fill="#C8A97A"/>
              <rect x="2" y="9" width="5" height="5" fill="#C8A97A"/>
              <rect x="9" y="9" width="5" height="5" fill="#F5F0E8"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">ResearchForge</div>
            <div className="logo-sub">RAG · LLM</div>
          </div>
        </div>
      </div>

      <div className="sidebar-body">
        <button
          className="upload-btn"
          onClick={() => fileRef.current.click()}
          disabled={uploading}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={onUpload}
          />
          {uploading ? (
            <><span className="spinner-sq" /> Uploading…</>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                <path d="M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              </svg>
              Upload PDF
            </>
          )}
        </button>

        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.ok ? "status--ok" : "status--err"}`}>
            {uploadStatus.message}
          </div>
        )}

        <div className="section-label">Papers</div>

        <div className="pdf-list">
          {pdfs.length === 0 && (
            <p className="pdf-empty">No papers yet.<br/>Upload a PDF to begin.</p>
          )}
          {pdfs.map((pdf, i) => (
            <button
              key={i}
              className={`pdf-item ${activePdf === pdf ? "pdf-item--active" : ""}`}
              onClick={() => onSelect(pdf)}
              title={pdf}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="1" y="0.5" width="7" height="10" stroke="currentColor" strokeWidth="1"/>
                <path d="M3 3h4M3 5h4M3 7h2" stroke="currentColor" strokeWidth="1" strokeLinecap="square"/>
              </svg>
              <span className="pdf-name">{pdf}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-foot">
        <span className="model-badge">LLaMA 3 · Groq</span>
        <span className="model-badge">Qdrant · RAG</span>
      </div>
    </aside>
  );
}

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("rf_messages");
      return saved ? JSON.parse(saved) : [WELCOME];
    } catch { return [WELCOME]; }
  });

  const [pdfs, setPdfs] = useState(() => {
    try {
      const saved = localStorage.getItem("rf_pdfs");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [activePdf, setActivePdf] = useState(() => {
    try {
      return localStorage.getItem("rf_active_pdf") || null;
    } catch { return null; }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  useEffect(() => {
    try { localStorage.setItem("rf_messages", JSON.stringify(messages)); }
    catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem("rf_pdfs", JSON.stringify(pdfs)); }
    catch {}
  }, [pdfs]);

  useEffect(() => {
    try {
      if (activePdf) localStorage.setItem("rf_active_pdf", activePdf);
      else localStorage.removeItem("rf_active_pdf");
    } catch {}
  }, [activePdf]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        const name = file.name;
        setPdfs((prev) => prev.includes(name) ? prev : [...prev, name]);
        setActivePdf(name);
        setUploadStatus({ ok: true, message: `"${name}" indexed.` });
        setMessages((prev) => [...prev, { role: "ai", content: `I have indexed "${name}". What would you like to know?` }]);
      } else {
        setUploadStatus({ ok: false, message: data.detail || "Upload failed." });
      }
    } catch {
      setUploadStatus({ ok: false, message: "Backend unreachable on :8000" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSend() {
    const q = input.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "ai", content: "__loading__" }]);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, pdf_name: activePdf }),
      });
      const data = await res.json();
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "ai",
          content: data.answer || data.response || data.detail || "No response received.",
          sources: data.sources || [],
        };
        return next;
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "ai", content: "Connection error — is FastAPI running on port 8000?" };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function clearChat() {
    setMessages([WELCOME]);
    setInput("");
    setPdfs([]);
    setActivePdf(null);
    try {
      localStorage.removeItem("rf_messages");
      localStorage.removeItem("rf_pdfs");
      localStorage.removeItem("rf_active_pdf");
    } catch {}
  }

  return (
    <div className="app">
      <Sidebar
        pdfs={pdfs}
        activePdf={activePdf}
        onSelect={setActivePdf}
        onUpload={handleUpload}
        uploading={uploading}
        uploadStatus={uploadStatus}
      />
      <main className="chat-area">
        <header className="chat-header">
          {activePdf ? (
            <><span className="status-sq" /><span className="active-name">{activePdf}</span></>
          ) : (
            <span className="header-hint">Upload or select a paper to begin</span>
          )}
          {messages.length > 1 && (
            <button className="clear-btn" onClick={clearChat} title="Clear chat">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
              </svg>
              Clear
            </button>
          )}
        </header>

        <div className="messages">
          {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={activePdf ? `Ask anything about "${activePdf}"…` : "Upload a PDF first…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              className={`send-btn ${input.trim() && !loading ? "send-btn--active" : ""}`}
              onClick={handleSend}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              {loading ? (
                <span className="spinner-sq" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13 8H3M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"/>
                </svg>
              )}
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}