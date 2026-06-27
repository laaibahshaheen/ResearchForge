import { useState, useRef, useEffect } from "react";
import "./App.css";

const API_BASE = "http://localhost:8000";

const WELCOME = {
  role: "ai",
  content: "Upload a research paper and ask me anything about it — I will search the full text and give you grounded answers with source references.",
};

// ── Utilities ─────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  );
}

function formatAnswer(text) {
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={`list-${elements.length}`} className="answer-list">{listItems}</ul>);
      listItems = [];
    }
  };

  text.split("\n").forEach((line, i) => {
    if (line.startsWith("## ")) {
      flushList();
      elements.push(<span key={i} className="answer-heading">{line.slice(3)}</span>);
    } else if (line.startsWith("* ") || line.startsWith("- ")) {
      listItems.push(<li key={i}>{line.slice(2)}</li>);
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(<p key={i} className="answer-para">{line}</p>);
    }
  });
  flushList();
  return elements;
}

function PageChips({ content }) {
  const refs = content.match(/\(Page \d+\)/g);
  const unique = refs ? [...new Set(refs)] : [];
  if (!unique.length) return null;
  return (
    <div className="sources">
      <span className="sources-label">Pages</span>
      {unique.map((p, i) => <span key={i} className="source-chip">{p}</span>)}
    </div>
  );
}

// ── Chat Message ──────────────────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`chat-row ${isUser ? "chat-row--user" : "chat-row--ai"}`}>
      <span className="role-label">{isUser ? "You" : "AI"}</span>
      <div className={`bubble ${isUser ? "bubble--user" : "bubble--ai"}`}>
        {msg.content === "__loading__" ? (
          <div className="loading-state">
            <TypingDots />
            <span className="loading-label">Analyzing paper…</span>
          </div>
        ) : (
          <div className="answer-body">{formatAnswer(msg.content)}</div>
        )}
        {msg.content !== "__loading__" && <PageChips content={msg.content} />}
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ pdfs, activePdf, onSelect, onUpload, uploading, uploadStatus, chunkCount }) {
  const fileRef = useRef();
  const maxChunks = 60;

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
            <div className="logo-sub">RAG · LLM · v2</div>
          </div>
        </div>
      </div>

      <div className="sidebar-body">
        <button className="upload-btn" onClick={() => fileRef.current.click()} disabled={uploading}>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={onUpload} />
          {uploading ? <><span className="spinner-sq" /> Indexing…</> : <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v7M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              <path d="M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
            </svg>
            Upload PDF
          </>}
        </button>

        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.ok ? "status--ok" : "status--err"}`}>
            {uploadStatus.message}
          </div>
        )}

        {chunkCount > 0 && (
          <div className="chunk-info">
            <div className="chunk-row">
              <span className="chunk-label">Chunks indexed</span>
              <span className="chunk-val">{chunkCount}</span>
            </div>
            <div className="chunk-bar">
              <div className="chunk-fill" style={{ width: `${Math.min((chunkCount / maxChunks) * 100, 100)}%` }} />
            </div>
          </div>
        )}

        <div className="section-label">Papers ({pdfs.length})</div>

        <div className="pdf-list">
          {pdfs.length === 0 && <p className="pdf-empty">No papers yet.<br />Upload a PDF to begin.</p>}
          {pdfs.map((pdf, i) => (
            <button
              key={i}
              className={`pdf-item ${activePdf === pdf.name ? "pdf-item--active" : ""}`}
              onClick={() => onSelect(pdf.name)}
              title={pdf.name}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect x="1" y="0.5" width="7" height="10" stroke="currentColor" strokeWidth="1"/>
                <path d="M3 3h4M3 5h4M3 7h2" stroke="currentColor" strokeWidth="1" strokeLinecap="square"/>
              </svg>
              <span className="pdf-name">{pdf.displayName}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-foot">
        <span className="model-badge">LLaMA 3.3 70B</span>
        <span className="model-badge">Groq · ChromaDB</span>
        <span className="model-badge">MiniLM Embeddings</span>
      </div>
    </aside>
  );
}

// ── Tab Bar ───────────────────────────────────────────────────────────────
function TabBar({ tab, setTab, hasPdfs }) {
  const tabs = [
    { id: "chat", label: "Chat" },
    { id: "compare", label: "Compare", disabled: !hasPdfs },
    { id: "gaps", label: "Gap Analysis", disabled: !hasPdfs },
    { id: "litreview", label: "Lit Review", disabled: !hasPdfs },
  ];
  return (
    <div className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn ${tab === t.id ? "tab-btn--active" : ""}`}
          onClick={() => !t.disabled && setTab(t.id)}
          disabled={t.disabled}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Compare Panel ─────────────────────────────────────────────────────────
function ComparePanel({ pdfs }) {
  const [pdf1, setPdf1] = useState("");
  const [pdf2, setPdf2] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCompare() {
    if (!pdf1 || !pdf2 || pdf1 === pdf2) {
      setError("Select two different papers to compare.");
      return;
    }
    setLoading(true);
    setResult("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_name_1: pdf1, pdf_name_2: pdf2 }),
      });
      const data = await res.json();
      if (res.ok) setResult(data.comparison);
      else setError(data.detail || "Comparison failed.");
    } catch {
      setError("Backend unreachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Compare Papers</span>
        <span className="panel-sub">Side-by-side AI analysis of two research papers</span>
      </div>

      <div className="panel-controls">
        <div className="select-row">
          <div className="select-group">
            <label className="select-label">Paper A</label>
            <select className="paper-select" value={pdf1} onChange={e => setPdf1(e.target.value)}>
              <option value="">Select paper…</option>
              {pdfs.map((p, i) => <option key={i} value={p.name}>{p.displayName}</option>)}
            </select>
          </div>
          <div className="vs-divider">VS</div>
          <div className="select-group">
            <label className="select-label">Paper B</label>
            <select className="paper-select" value={pdf2} onChange={e => setPdf2(e.target.value)}>
              <option value="">Select paper…</option>
              {pdfs.map((p, i) => <option key={i} value={p.name}>{p.displayName}</option>)}
            </select>
          </div>
        </div>
        <button
          className={`action-btn ${loading ? "" : "action-btn--active"}`}
          onClick={handleCompare}
          disabled={loading || !pdf1 || !pdf2}
        >
          {loading ? <><span className="spinner-sq" /> Comparing…</> : "Run Comparison →"}
        </button>
      </div>

      {error && <div className="panel-error">{error}</div>}

      {loading && (
        <div className="panel-loading">
          <TypingDots />
          <span className="loading-label">Analyzing both papers…</span>
        </div>
      )}

      {result && (
        <div className="panel-result">
          <div className="answer-body">{formatAnswer(result)}</div>
        </div>
      )}
    </div>
  );
}

// ── Gap Analysis Panel ────────────────────────────────────────────────────
function GapsPanel({ pdfs, activePdf }) {
  const [selectedPdf, setSelectedPdf] = useState(activePdf || "");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (activePdf) setSelectedPdf(activePdf); }, [activePdf]);

  async function handleGaps() {
    if (!selectedPdf) { setError("Select a paper first."); return; }
    setLoading(true);
    setResult("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/gaps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_name: selectedPdf }),
      });
      const data = await res.json();
      if (res.ok) setResult(data.gaps);
      else setError(data.detail || "Gap analysis failed.");
    } catch {
      setError("Backend unreachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Research Gap Analysis</span>
        <span className="panel-sub">Identify limitations, gaps, and future research directions</span>
      </div>

      <div className="panel-controls">
        <div className="select-group" style={{ maxWidth: 340 }}>
          <label className="select-label">Select Paper</label>
          <select className="paper-select" value={selectedPdf} onChange={e => setSelectedPdf(e.target.value)}>
            <option value="">Select paper…</option>
            {pdfs.map((p, i) => <option key={i} value={p.name}>{p.displayName}</option>)}
          </select>
        </div>
        <button
          className={`action-btn ${loading ? "" : "action-btn--active"}`}
          onClick={handleGaps}
          disabled={loading || !selectedPdf}
        >
          {loading ? <><span className="spinner-sq" /> Analyzing…</> : "Find Research Gaps →"}
        </button>
      </div>

      {error && <div className="panel-error">{error}</div>}

      {loading && (
        <div className="panel-loading">
          <TypingDots />
          <span className="loading-label">Identifying gaps and future directions…</span>
        </div>
      )}

      {result && (
        <div className="panel-result">
          <div className="answer-body">{formatAnswer(result)}</div>
        </div>
      )}
    </div>
  );
}

// ── Literature Review Panel ───────────────────────────────────────────────
function LitReviewPanel({ pdfs }) {
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function togglePdf(name) {
    setSelected(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  }

  async function handleLitReview() {
    if (selected.length === 0) { setError("Select at least one paper."); return; }
    setLoading(true);
    setResult("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/litreview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_names: selected }),
      });
      const data = await res.json();
      if (res.ok) setResult(data.literature_review);
      else setError(data.detail || "Literature review failed.");
    } catch {
      setError("Backend unreachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Literature Review Generator</span>
        <span className="panel-sub">Auto-generate an academic literature review from your papers</span>
      </div>

      <div className="panel-controls">
        <div className="select-label" style={{ marginBottom: 8 }}>Select papers to include</div>
        <div className="checkbox-list">
          {pdfs.map((p, i) => (
            <label key={i} className={`checkbox-item ${selected.includes(p.name) ? "checkbox-item--checked" : ""}`}>
              <input
                type="checkbox"
                checked={selected.includes(p.name)}
                onChange={() => togglePdf(p.name)}
                style={{ display: "none" }}
              />
              <span className="checkbox-sq">{selected.includes(p.name) ? "✕" : ""}</span>
              <span>{p.displayName}</span>
            </label>
          ))}
        </div>
        <button
          className={`action-btn ${loading ? "" : "action-btn--active"}`}
          onClick={handleLitReview}
          disabled={loading || selected.length === 0}
          style={{ marginTop: 10 }}
        >
          {loading ? <><span className="spinner-sq" /> Generating…</> : `Generate Lit Review (${selected.length} papers) →`}
        </button>
      </div>

      {error && <div className="panel-error">{error}</div>}

      {loading && (
        <div className="panel-loading">
          <TypingDots />
          <span className="loading-label">Writing literature review…</span>
        </div>
      )}

      {result && (
        <div className="panel-result">
          <div className="answer-body">{formatAnswer(result)}</div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("chat");

  const [messages, setMessages] = useState(() => {
    try { const s = localStorage.getItem("rf_messages"); return s ? JSON.parse(s) : [WELCOME]; }
    catch { return [WELCOME]; }
  });

  const [pdfs, setPdfs] = useState(() => {
    try { const s = localStorage.getItem("rf_pdfs"); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [activePdf, setActivePdf] = useState(() => {
    try { return localStorage.getItem("rf_active_pdf") || null; } catch { return null; }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [chunkCount, setChunkCount] = useState(0);
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  useEffect(() => {
    try { localStorage.setItem("rf_messages", JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem("rf_pdfs", JSON.stringify(pdfs)); } catch {}
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
        const displayName = file.name;
        const collectionName = data.pdf_name;
        setPdfs(prev => prev.find(p => p.name === collectionName)
          ? prev
          : [...prev, { name: collectionName, displayName }]
        );
        setActivePdf(collectionName);
        setChunkCount(data.chunks || 0);
        setUploadStatus({ ok: true, message: `✓ "${displayName}" — ${data.chunks} chunks indexed` });

        // Show auto-summary in chat
        let summaryMsg = `**${displayName}** has been indexed.\n\n`;
        if (data.summary) summaryMsg += `${data.summary}\n\n`;
        if (data.key_findings?.length) {
          summaryMsg += `## Key Findings\n`;
          data.key_findings.forEach(f => { summaryMsg += `* ${f}\n`; });
        }
        if (data.suggested_questions?.length) {
          summaryMsg += `\n## Suggested Questions\n`;
          data.suggested_questions.forEach(q => { summaryMsg += `* ${q}\n`; });
        }
        setMessages(prev => [...prev, { role: "ai", content: summaryMsg, isSummary: true, suggestedQuestions: data.suggested_questions || [] }]);
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

  async function handleSend(question) {
    const q = (question || input).trim();
    if (!q || loading) return;
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, { role: "ai", content: "__loading__" }]);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, pdf_name: activePdf }),
      });
      const data = await res.json();
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "ai", content: data.answer || data.detail || "No response." };
        return next;
      });
    } catch {
      setMessages(prev => {
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
    setChunkCount(0);
    try {
      localStorage.removeItem("rf_messages");
      localStorage.removeItem("rf_pdfs");
      localStorage.removeItem("rf_active_pdf");
    } catch {}
  }

  // Suggested question chips on summary messages
  function SuggestedChips({ questions }) {
    if (!questions?.length) return null;
    return (
      <div className="suggested-chips">
        <span className="sources-label">Ask</span>
        {questions.map((q, i) => (
          <button key={i} className="suggested-chip" onClick={() => { setTab("chat"); handleSend(q); }}>
            {q}
          </button>
        ))}
      </div>
    );
  }

  function EnhancedMessage({ msg }) {
    const isUser = msg.role === "user";
    return (
      <div className={`chat-row ${isUser ? "chat-row--user" : "chat-row--ai"}`}>
        <span className="role-label">{isUser ? "You" : "AI"}</span>
        <div className={`bubble ${isUser ? "bubble--user" : "bubble--ai"}`}>
          {msg.content === "__loading__" ? (
            <div className="loading-state"><TypingDots /><span className="loading-label">Analyzing paper…</span></div>
          ) : (
            <div className="answer-body">{formatAnswer(msg.content)}</div>
          )}
          {msg.content !== "__loading__" && <PageChips content={msg.content} />}
          {msg.suggestedQuestions?.length > 0 && <SuggestedChips questions={msg.suggestedQuestions} />}
        </div>
      </div>
    );
  }

  const activePdfDisplay = pdfs.find(p => p.name === activePdf)?.displayName || activePdf;

  return (
    <div className="app">
      <Sidebar
        pdfs={pdfs}
        activePdf={activePdf}
        onSelect={setActivePdf}
        onUpload={handleUpload}
        uploading={uploading}
        uploadStatus={uploadStatus}
        chunkCount={chunkCount}
      />

      <main className="chat-area">
        <header className="chat-header">
          {activePdf ? (
            <><span className="status-sq status-sq--pulse" /><span className="active-name">{activePdfDisplay}</span></>
          ) : (
            <span className="header-hint">Upload or select a paper to begin</span>
          )}
          <TabBar tab={tab} setTab={setTab} hasPdfs={pdfs.length > 0} />
          {messages.length > 1 && (
            <button className="clear-btn" onClick={clearChat}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
              </svg>
              Clear
            </button>
          )}
        </header>

        {tab === "chat" && (
          <>
            <div className="messages">
              {messages.length === 1 && messages[0] === WELCOME ? (
                <div className="welcome-card">
                  <div className="welcome-grid">
                    <div className="welcome-sq" />
                    <div className="welcome-sq welcome-sq--sand" />
                    <div className="welcome-sq welcome-sq--moss" />
                    <div className="welcome-sq" />
                  </div>
                  <div className="welcome-title">ResearchForge</div>
                  <div className="welcome-sub">AI Research Assistant · v2</div>
                  <div className="welcome-steps">
                    <div className="welcome-step"><span className="step-num">01</span><span className="step-text">Upload a research PDF — it gets chunked, embedded, and indexed</span></div>
                    <div className="welcome-step"><span className="step-num">02</span><span className="step-text">Ask any question — get grounded answers with page citations</span></div>
                    <div className="welcome-step"><span className="step-num">03</span><span className="step-text">Use Compare, Gap Analysis, or Lit Review tabs for deeper research</span></div>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => <EnhancedMessage key={i} msg={msg} />)
              )}
              <div ref={bottomRef} />
            </div>

            <div className="input-area">
              <div className="input-row">
                <textarea
                  ref={textareaRef}
                  className="chat-input"
                  placeholder={activePdf ? `Ask anything about "${activePdfDisplay}"…` : "Upload a PDF first…"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  disabled={loading || !activePdf}
                />
                <button
                  className={`send-btn ${input.trim() && !loading && activePdf ? "send-btn--active" : ""}`}
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim() || !activePdf}
                >
                  {loading ? <span className="spinner-sq" /> : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13 8H3M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className="input-hint">Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}

        {tab === "compare" && <ComparePanel pdfs={pdfs} />}
        {tab === "gaps" && <GapsPanel pdfs={pdfs} activePdf={activePdf} />}
        {tab === "litreview" && <LitReviewPanel pdfs={pdfs} />}
      </main>
    </div>
  );
}