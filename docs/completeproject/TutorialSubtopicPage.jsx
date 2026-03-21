import { useState } from "react";

// ─── MOCK DATA (matches JSON schema from Universal Content Generator) ───────
const MOCK_DATA = {
  domain: "Web Development",
  subject: "JavaScript",
  subtopic: "JavaScript Promises",
  progress: { completed: 4, total: 6 },
  domainColor: "indigo",
  content: {
    layman: {
      simpleExplanation:
        "Imagine you promise your friend to bring a pizza. They don't know when, but they trust you'll deliver. JavaScript Promises are like that — a Promise is an object that represents the eventual completion or failure of an asynchronous operation. It's initially pending and can either be fulfilled (success) or rejected (failure).",
      analogyOrStory:
        "You order a pizza online. The restaurant immediately confirms your order (Promise created), but you have to wait while they prepare it (Promise pending). You can check for updates (Promise chaining) and once the pizza arrives (Promise fulfilled), you enjoy it!",
      example1: { company: "Zomato", content: "When you place a Zomato order, the app creates a 'promise' of delivery. While waiting, you see a live tracker — that's Promise chaining in action, updating you through each state." },
      example2: { company: "Netflix", content: "Netflix uses Promises when loading your watchlist. It fetches your data asynchronously — you see a spinner (pending), then your shows appear (fulfilled), or an error if the server is down (rejected)." },
      illustration: "pizza"
    },
    real_life: {
      title: "Ordering Pizza Online",
      scenario: "You're hungry and order a pizza online. The restaurant immediately confirms your order (promise created), but you have to wait while they prepare it (promise pending). You can check for updates (promise chaining) and once the pizza arrives (promise fulfilled), you enjoy it!",
      bullets: [
        { label: "Promise created", detail: "Order confirmed immediately" },
        { label: "Promise pending", detail: "Waiting for preparation" },
        { label: "Promise fulfilled", detail: "Pizza arrives, you enjoy it" }
      ],
      tip: "Use .catch() to handle rejected promises gracefully."
    },
    technical: {
      markdown: "A JavaScript Promise is an object that represents an asynchronous operation.",
      bullets: [
        { term: "States", detail: "A promise has three states: pending, fulfilled, and rejected." },
        { term: "Consuming Promises", detail: "Use .then() for fulfilled and .catch() for rejected." },
        { term: "Chaining", detail: "Promises can be chained to handle multiple async operations." }
      ],
      tip: "Always return values in .then() handlers to enable proper chaining."
    },
    code: {
      language: "javascript",
      intro: "Here's an example of using a Promise in JavaScript:",
      code: `const myPromise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Pizza is ready!");
  }, 3000);
});

myPromise
  .then(result => {
    console.log(result); // "Pizza is ready!"
  })
  .catch(error => {
    console.error(error);
  });`,
      steps: [
        "Create a Promise with resolve and reject callbacks",
        "Use setTimeout to simulate async work (3 seconds)",
        "Chain .then() to handle the fulfilled value",
        "Use .catch() to handle any errors"
      ]
    },
    ai_tutor: {
      greeting: "Hello! Ask me anything about JavaScript Promises. How can I help you today?",
      qa_pairs: [
        { question: "What is a JavaScript Promise?", answer: "A Promise is an object representing the eventual completion or failure of an asynchronous operation." },
        { question: "How do you handle errors in promises?", answer: "Use .catch() at the end of your promise chain to handle rejected promises." },
        { question: "Can you explain promise chaining?", answer: "Promise chaining allows you to run async operations in sequence by returning promises from .then() handlers." }
      ]
    },
    notes: [
      { term: "Promise", detail: "Represents an eventual completion" },
      { term: "States", detail: "pending, fulfilled, rejected" },
      { term: "Methods", detail: ".then(), .catch(), .finally()" },
      { term: "Chaining", detail: "Chain multiple promises" }
    ]
  },
  sidebar: {
    currentDomain: {
      name: "Web Development",
      topics: [
        { name: "JavaScript Promises", status: "active" },
        { name: "Async/Await", status: "completed" },
        { name: "Fetch API", status: "locked" },
        { name: "Error Handling", status: "locked" },
        { name: "Topic", status: "not_started" },
        { name: "Topic", status: "not_started" }
      ]
    },
    topicGroups: [
      {
        name: "JavaScript",
        items: [
          { name: "Web Development", status: "completed" },
          { name: "JavaScript", status: "active" },
          { name: "JavaScript Promises", status: "active" },
          { name: "Async/Await", status: "completed" },
          { name: "Fetch API", status: "locked" },
          { name: "Error Handling", status: "locked" }
        ]
      },
      {
        name: "Topic",
        items: [
          { name: "Topic", status: "not_started" },
          { name: "Topic", status: "not_started" },
          { name: "Topic", status: "not_started" },
          { name: "Topic", status: "not_started" }
        ]
      }
    ]
  }
};

// ─── DOMAIN THEME CONFIG ─────────────────────────────────────────────────────
const DOMAIN_THEMES = {
  "indigo": {
    breadcrumbBg: "linear-gradient(135deg, #3b4f7a 0%, #4f6292 50%, #6b82b5 100%)",
    sidebarAccent: "#3d5a9e",
    activeItem: "#4f6aad",
    blockLayman: "linear-gradient(135deg, #e8f0fe 0%, #dce8fd 100%)",
    blockLaymanHeader: "#3d5a9e",
    blockRealLife: "linear-gradient(135deg, #e6f4ea 0%, #d4edda 100%)",
    blockRealLifeHeader: "#2e7d46",
    blockTechnical: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
    blockTechnicalHeader: "#e65100",
    blockCode: "linear-gradient(135deg, #263238 0%, #1e272e 100%)",
    blockCodeHeader: "#546e7a",
    blockAITutor: "linear-gradient(135deg, #f3e5f5 0%, #e8d5f0 100%)",
    blockAITutorHeader: "#6a1b9a",
    blockNotes: "linear-gradient(135deg, #fffde7 0%, #fff9c4 100%)",
    progressFill: "#f9a825",
    quizBtn: "linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)",
    domainIcon: "🌐"
  },
  "teal": {
    breadcrumbBg: "linear-gradient(135deg, #1a5c5c 0%, #2e7d72 50%, #4caf9f 100%)",
    sidebarAccent: "#2e7d72",
    activeItem: "#3d9e92",
    blockLayman: "linear-gradient(135deg, #e0f5f2 0%, #d0ece8 100%)",
    blockLaymanHeader: "#2e7d72",
    blockRealLife: "linear-gradient(135deg, #e8f5e9 0%, #d4edda 100%)",
    blockRealLifeHeader: "#2e7d46",
    blockTechnical: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
    blockTechnicalHeader: "#e65100",
    blockCode: "linear-gradient(135deg, #1a2332 0%, #0d1520 100%)",
    blockCodeHeader: "#4a7c7e",
    blockAITutor: "linear-gradient(135deg, #f3e5f5 0%, #e1d0ee 100%)",
    blockAITutorHeader: "#6a1b9a",
    blockNotes: "linear-gradient(135deg, #fffde7 0%, #fff8e1 100%)",
    progressFill: "#f9a825",
    quizBtn: "linear-gradient(135deg, #f57c00 0%, #e65100 100%)",
    domainIcon: "📊"
  }
};

// ─── STATUS ICON COMPONENT ────────────────────────────────────────────────────
function StatusIcon({ status, color = "#3d5a9e" }) {
  const styles = {
    width: 18, height: 18, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 10, flexShrink: 0
  };
  if (status === "completed") return <div style={{ ...styles, background: "#43a047", color: "#fff" }}>✓</div>;
  if (status === "active") return <div style={{ ...styles, background: color, color: "#fff" }}>●</div>;
  if (status === "locked") return <div style={{ ...styles, background: "#ccc", color: "#888" }}>🔒</div>;
  return <div style={{ ...styles, border: "2px solid #ccc", background: "transparent" }} />;
}

// ─── CODE BLOCK COMPONENT ─────────────────────────────────────────────────────
function CodeHighlight({ code }) {
  const lines = code.split("\n");
  const keywords = ["const", "new", "Promise", "resolve", "reject", "setTimeout", "return", "function", "let", "var", "async", "await"];
  const strings = /("[^"]*"|'[^']*'|`[^`]*`)/g;
  const comments = /(\/\/.*)/g;

  function highlightLine(line) {
    let parts = [];
    let remaining = line;
    let offset = 0;

    const tokenized = line
      .replace(strings, '<STRING>$1</STRING>')
      .replace(comments, '<COMMENT>$1</COMMENT>');

    return (
      <span dangerouslySetInnerHTML={{
        __html: line
          .replace(/(".*?"|'.*?'|`.*?`)/g, '<span style="color:#a5d6a7">$1</span>')
          .replace(/(\b(const|let|var|new|return|function|async|await|import|export|from)\b)/g, '<span style="color:#80cbc4">$1</span>')
          .replace(/(Promise|setTimeout|console|resolve|reject|catch|then|finally)/g, '<span style="color:#ffcc80">$1</span>')
          .replace(/(\/\/.*)/g, '<span style="color:#78909c">$1</span>')
          .replace(/(\d+)/g, '<span style="color:#f48fb1">$1</span>')
      }} />
    );
  }

  return (
    <div style={{
      background: "#1e1e2e", borderRadius: 8, padding: "16px",
      fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: 13,
      lineHeight: 1.7, overflowX: "auto"
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", gap: 16 }}>
          <span style={{ color: "#4a5568", userSelect: "none", minWidth: 20, textAlign: "right" }}>{i + 1}</span>
          <span style={{ color: "#e0e0e0" }}>{highlightLine(line)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── PIZZA ILLUSTRATION ───────────────────────────────────────────────────────
function PizzaIllustration() {
  return (
    <svg viewBox="0 0 180 140" style={{ width: "100%", maxWidth: 180 }}>
      <ellipse cx="90" cy="115" rx="70" ry="12" fill="#e0c97e" opacity="0.3" />
      <circle cx="90" cy="75" r="52" fill="#f5c842" />
      <circle cx="90" cy="75" r="48" fill="#e8b84b" />
      <circle cx="90" cy="75" r="38" fill="#e8503a" />
      <circle cx="72" cy="65" r="7" fill="#c0392b" />
      <circle cx="105" cy="70" r="6" fill="#c0392b" />
      <circle cx="83" cy="85" r="5" fill="#c0392b" />
      <circle cx="97" cy="58" r="4" fill="#c0392b" />
      <circle cx="75" cy="83" r="8" fill="#e67e22" opacity="0.8" />
      <circle cx="106" cy="88" r="7" fill="#e67e22" opacity="0.8" />
      <circle cx="88" cy="62" r="6" fill="#e67e22" opacity="0.8" />
      <text x="55" y="30" fontSize="11" fill="#4a5568" fontFamily="Arial">
        <tspan fontWeight="700" fill="#2e7d32">fulfilled</tspan>
      </text>
      <text x="40" y="45" fontSize="10" fill="#78909c">promise.then(✓)</tspan></text>
      <line x1="90" y1="35" x2="90" y2="23" stroke="#a5d6a7" strokeWidth="1.5" strokeDasharray="3,2" />
    </svg>
  );
}

// ─── BLOCK HEADER ─────────────────────────────────────────────────────────────
function BlockHeader({ icon, title, bg, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", background: bg, borderRadius: "12px 12px 0 0",
      borderBottom: `1px solid ${color}22`
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color, fontFamily: "'Georgia', serif" }}>{title}</span>
      </div>
      <span style={{ color, opacity: 0.6, fontSize: 16 }}>›</span>
    </div>
  );
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function TutorialSubtopicPage() {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [activeQA, setActiveQA] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState({ 0: true, 1: true, 2: false });
  const theme = DOMAIN_THEMES[MOCK_DATA.domainColor] || DOMAIN_THEMES.indigo;
  const { content, sidebar, domain, subtopic, progress } = MOCK_DATA;

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: "user", text: chatInput }]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: "ai",
        text: "Great question! Let me explain that in context of what you've just learned about Promises..."
      }]);
    }, 800);
  };

  const pct = Math.round((progress.completed / progress.total) * 100);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f5f6fa", minHeight: "100vh" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 24px", height: 60, display: "flex",
        alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24 }}>📚</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#1a2340", letterSpacing: "-0.5px" }}>EduFlow</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="#" style={{ color: "#4a5568", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Dashboard</a>
          <span style={{ color: "#cbd5e0" }}>|</span>
          <a href="#" style={{ color: "#4a5568", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>My Progress</a>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", background: "#e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}>🔔</div>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer"
          }}>A</div>
        </div>
      </nav>

      {/* ── BREADCRUMB ── */}
      <div style={{
        background: theme.breadcrumbBg, padding: "10px 24px",
        display: "flex", alignItems: "center", gap: 8
      }}>
        <span style={{ fontSize: 16 }}>{theme.domainIcon}</span>
        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{domain}</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>›</span>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{subtopic}</span>
      </div>

      {/* ── BODY: SIDEBAR + MAIN ── */}
      <div style={{ display: "flex", maxWidth: 1280, margin: "0 auto" }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{
          width: 220, flexShrink: 0, background: "#fff",
          borderRight: "1px solid #e2e8f0", minHeight: "calc(100vh - 100px)",
          padding: "16px 0", position: "sticky", top: 60,
          height: "calc(100vh - 60px)", overflowY: "auto"
        }}>

          {/* Current domain section */}
          <div style={{ padding: "0 12px 12px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 10px", cursor: "pointer",
              background: "#f8f9fe", borderRadius: 8, marginBottom: 4
            }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#1a2340" }}>{domain}</span>
              <span style={{ fontSize: 12, color: "#888" }}>∨</span>
            </div>
            {sidebar.currentDomain.topics.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                borderRadius: 7, cursor: "pointer",
                background: item.status === "active" ? `${theme.sidebarAccent}18` : "transparent",
                marginBottom: 2
              }}>
                <StatusIcon status={item.status} color={theme.sidebarAccent} />
                <span style={{
                  fontSize: 12.5, fontWeight: item.status === "active" ? 600 : 400,
                  color: item.status === "active" ? theme.sidebarAccent :
                    item.status === "locked" ? "#bbb" : "#4a5568",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                }}>{item.name}</span>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: "#e2e8f0", margin: "4px 0" }} />

          {/* Topic groups */}
          {sidebar.topicGroups.map((group, gi) => (
            <div key={gi} style={{ padding: "8px 12px" }}>
              <div
                onClick={() => setSidebarExpanded(p => ({ ...p, [gi]: !p[gi] }))}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 10px", cursor: "pointer", borderRadius: 7,
                  background: "#f8f9fe", marginBottom: 4
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 12.5, color: "#1a2340" }}>Topic</span>
                <span style={{ fontSize: 11, color: "#888" }}>{sidebarExpanded[gi] ? "∨" : "›"}</span>
              </div>
              {sidebarExpanded[gi] && group.items.map((item, ii) => (
                <div key={ii} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                  background: item.status === "active" ? `${theme.sidebarAccent}15` : "transparent",
                  marginBottom: 2
                }}>
                  <StatusIcon status={item.status} color={theme.sidebarAccent} />
                  <span style={{
                    fontSize: 12, color: item.status === "locked" ? "#bbb" :
                      item.status === "active" ? theme.sidebarAccent : "#4a5568",
                    fontWeight: item.status === "active" ? 600 : 400
                  }}>{item.name}</span>
                </div>
              ))}
              <div style={{ height: 1, background: "#f0f0f0", margin: "8px 0 4px" }} />
            </div>
          ))}

          {/* Quick action icons */}
          <div style={{ display: "flex", gap: 8, padding: "8px 16px", marginTop: 8 }}>
            {["💡", "⚙️", "📚", "🎯"].map((icon, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: "50%", background: "#f0f2f8",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>{icon}</div>
            ))}
          </div>

          {/* Sidebar Notes */}
          <div style={{ padding: "12px 14px", margin: "8px 12px", background: "#fffde7", borderRadius: 10, border: "1px solid #ffe082" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span>📋</span>
              <span style={{ fontWeight: 700, fontSize: 12.5, color: "#5d4037" }}>Notes</span>
            </div>
            {content.notes.map((note, i) => (
              <div key={i} style={{ marginBottom: 5 }}>
                <span style={{ fontWeight: 600, fontSize: 11.5, color: "#e65100" }}>{note.term}: </span>
                <span style={{ fontSize: 11.5, color: "#5d4037" }}>{note.detail}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, padding: "24px 24px 40px", minWidth: 0 }}>

          {/* Title + Progress */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{
              fontSize: 32, fontWeight: 800, color: "#1a2340",
              fontFamily: "'Georgia', serif", marginBottom: 14, letterSpacing: "-0.5px"
            }}>{subtopic}</h1>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Progress bar */}
              <div style={{
                flex: 1, height: 36, background: "#f0f2f8", borderRadius: 8,
                display: "flex", alignItems: "center", padding: "0 14px", gap: 10,
                border: "1px solid #e2e8f0"
              }}>
                <span style={{ fontSize: 14 }}>✏️</span>
                <span style={{ fontSize: 13, color: "#4a5568", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {progress.completed}/{progress.total} Completed
                </span>
                <div style={{ flex: 1, height: 8, background: "#dde1ef", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: theme.progressFill, borderRadius: 4,
                    transition: "width 0.5s ease"
                  }} />
                </div>
                <span style={{ fontSize: 14, color: "#888" }}>⚙️</span>
                <span style={{ fontSize: 14, color: "#888" }}>🔍</span>
              </div>
              <button style={{
                background: theme.quizBtn, color: "#fff", border: "none",
                padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 14,
                cursor: "pointer", boxShadow: "0 2px 8px rgba(245,124,0,0.35)",
                whiteSpace: "nowrap"
              }}>Take Quiz</button>
            </div>
          </div>

          {/* ── LAYMAN BLOCK (full width) ── */}
          <div style={{
            background: content.layman ? undefined : "#fff",
            borderRadius: 14, marginBottom: 16, overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #e8edf8"
          }}>
            <BlockHeader
              icon="🎓" title="Layman Explanation"
              bg={`${theme.blockLaymanHeader}15`} color={theme.blockLaymanHeader}
            />
            <div style={{
              background: theme.blockLayman, padding: "20px",
              display: "flex", gap: 24, alignItems: "flex-start"
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 14px", fontSize: 14.5, lineHeight: 1.75, color: "#2d3748" }}>
                  {content.layman.simpleExplanation}
                </p>
                <div style={{
                  background: "rgba(255,255,255,0.6)", borderRadius: 10,
                  padding: "12px 16px", border: "1px solid rgba(255,255,255,0.8)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>📦</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: theme.blockLaymanHeader }}>Analogy</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "#4a5568", fontStyle: "italic" }}>
                    {content.layman.analogyOrStory}
                  </p>
                </div>
              </div>
              <div style={{ width: 180, flexShrink: 0, opacity: 0.9 }}>
                <PizzaIllustration />
              </div>
            </div>
            {/* Examples row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderTop: "1px solid #dce8f8" }}>
              {[content.layman.example1, content.layman.example2].map((ex, i) => (
                <div key={i} style={{
                  padding: "14px 20px",
                  background: i === 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)",
                  borderLeft: i === 1 ? "1px solid #dce8f8" : "none"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>📊</span>
                    <span style={{ fontWeight: 700, fontSize: 12.5, color: theme.blockLaymanHeader }}>
                      Example {i + 1}: {ex.company}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#4a5568" }}>{ex.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── ROW: REAL-LIFE + TECHNICAL ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

            {/* Real-Life Block */}
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #d4edda" }}>
              <BlockHeader icon="🏪" title="Real-Life Scenario" bg={`${theme.blockRealLifeHeader}15`} color={theme.blockRealLifeHeader} />
              <div style={{ background: theme.blockRealLife, padding: "18px", minHeight: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#1b5e20", margin: "0 0 10px" }}>
                      {content.real_life.title}
                    </p>
                    <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.7, color: "#2e7d32" }}>
                      {content.real_life.scenario}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {content.real_life.bullets.map((b, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#43a047", marginTop: 5, flexShrink: 0 }} />
                          <span style={{ fontSize: 12.5, color: "#2d5a2e" }}>
                            <strong>{b.label}</strong> — {b.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 48, opacity: 0.5, flexShrink: 0 }}>🍕</div>
                </div>
              </div>
              <div style={{
                background: "#c8e6c9", padding: "8px 16px",
                fontSize: 12, color: "#1b5e20", fontWeight: 500
              }}>
                💡 Tip: {content.real_life.tip}
              </div>
            </div>

            {/* Technical Block */}
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #ffe0b2" }}>
              <BlockHeader icon="⚙️" title="Technical Explanation" bg={`${theme.blockTechnicalHeader}15`} color={theme.blockTechnicalHeader} />
              <div style={{ background: theme.blockTechnical, padding: "18px", minHeight: 200 }}>
                <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.7, color: "#3e2723" }}>
                  {content.technical.markdown}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {content.technical.bullets.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef6c00", marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#bf360c" }}>{b.term}: </span>
                        <span style={{ fontSize: 13, color: "#4e342e", lineHeight: 1.6 }}>{b.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{
                background: "#ffe0b2", padding: "8px 16px",
                fontSize: 12, color: "#bf360c", fontWeight: 500
              }}>
                💡 Tip: {content.technical.tip}
              </div>
            </div>
          </div>

          {/* ── ROW: CODE + AI TUTOR ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

            {/* Code Block */}
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", border: "1px solid #37474f" }}>
              <BlockHeader icon="💻" title="Code Explanation" bg="#2e3a45" color="#90a4ae" />
              <div style={{ background: theme.blockCode, padding: "18px" }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#b0bec5" }}>{content.code.intro}</p>
                <CodeHighlight code={content.code.code} />
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontWeight: 700, fontSize: 12.5, color: "#90a4ae", margin: "0 0 8px" }}>Steps Explained:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {content.code.steps.map((step, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#80cbc4", marginTop: 5, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: "#b0bec5", lineHeight: 1.6 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Tutor Block */}
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #e1d0ee" }}>
              <BlockHeader icon="🤖" title="AI Tutor Chat" bg={`${theme.blockAITutorHeader}18`} color={theme.blockAITutorHeader} />
              <div style={{
                background: theme.blockAITutor, padding: "18px",
                display: "flex", flexDirection: "column", minHeight: 280
              }}>
                {/* Greeting */}
                <div style={{
                  background: "rgba(255,255,255,0.6)", borderRadius: 10,
                  padding: "10px 14px", marginBottom: 14, fontSize: 13,
                  color: "#4a148c", lineHeight: 1.6, border: "1px solid rgba(255,255,255,0.8)"
                }}>
                  {content.ai_tutor.greeting}
                </div>

                {/* Chat messages */}
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%", marginBottom: 8,
                    background: msg.role === "user" ? theme.blockAITutorHeader : "rgba(255,255,255,0.7)",
                    color: msg.role === "user" ? "#fff" : "#4a148c",
                    padding: "8px 12px", borderRadius: 10, fontSize: 12.5, lineHeight: 1.6
                  }}>{msg.text}</div>
                ))}

                {/* Pre-generated Q&A */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  {content.ai_tutor.qa_pairs.map((qa, i) => (
                    <div key={i}>
                      <div
                        onClick={() => setActiveQA(activeQA === i ? null : i)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: "rgba(255,255,255,0.65)", borderRadius: 8, padding: "9px 14px",
                          cursor: "pointer", border: "1px solid rgba(255,255,255,0.8)",
                          fontSize: 13, color: "#4a148c", fontWeight: 500,
                          transition: "all 0.2s"
                        }}
                      >
                        <span>{qa.question}</span>
                        <span style={{ opacity: 0.6 }}>{activeQA === i ? "∨" : "›"}</span>
                      </div>
                      {activeQA === i && (
                        <div style={{
                          background: "rgba(255,255,255,0.45)", borderRadius: "0 0 8px 8px",
                          padding: "8px 14px", fontSize: 12.5, color: "#6a1b9a",
                          lineHeight: 1.65, marginTop: -4, border: "1px solid rgba(255,255,255,0.6)",
                          borderTop: "none"
                        }}>{qa.answer}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div style={{
                  display: "flex", gap: 8, marginTop: 14,
                  background: "rgba(255,255,255,0.7)", borderRadius: 8,
                  padding: "6px 8px", border: "1px solid rgba(106,27,154,0.2)"
                }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type your question..."
                    style={{
                      flex: 1, border: "none", background: "transparent",
                      fontSize: 13, outline: "none", color: "#4a148c"
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    style={{
                      background: theme.blockAITutorHeader, color: "#fff", border: "none",
                      borderRadius: 6, width: 32, height: 32, cursor: "pointer",
                      fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >➤</button>
                </div>
              </div>
            </div>
          </div>

          {/* ── NOTES BLOCK (full width) ── */}
          <div style={{
            borderRadius: 14, overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ffe082"
          }}>
            <BlockHeader icon="📋" title="Notes" bg="#fff8e1" color="#f57f17" />
            <div style={{ background: theme.blockNotes, padding: "18px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 32px" }}>
                {content.notes.map((note, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f9a825", marginTop: 5, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: "#4a3728", lineHeight: 1.6 }}>
                      <strong style={{ color: "#e65100" }}>{note.term}:</strong> {note.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
