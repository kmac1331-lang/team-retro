import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, runTransaction } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const COLUMNS = [
  { id: "well",    label: "What Went Well",              color: "bg-green-500",  light: "bg-green-50 border-green-200",   icon: "✅" },
  { id: "better",  label: "What Could Have Been Better", color: "bg-orange-500", light: "bg-orange-50 border-orange-200", icon: "🔧" },
  { id: "actions", label: "Actions",                     color: "bg-blue-500",   light: "bg-blue-50 border-blue-200",     icon: "🎯" },
  { id: "ideas",   label: "Ideas",                       color: "bg-purple-500", light: "bg-purple-50 border-purple-200", icon: "💡" },
];

function exportToPDF(sessionName, cards) {
  const date = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const colColors = { well: "#22c55e", better: "#f97316", actions: "#3b82f6", ideas: "#a855f7" };

  let html = `
    <html><head><title>${sessionName} — Retro</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
      h1 { font-size: 24px; margin-bottom: 4px; }
      .date { color: #64748b; font-size: 13px; margin-bottom: 32px; }
      .column { margin-bottom: 28px; }
      .col-header { padding: 10px 16px; border-radius: 8px 8px 0 0; color: white; font-weight: bold; font-size: 15px; }
      .col-body { border: 2px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; padding: 12px; }
      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
      .card-text { font-size: 14px; margin: 0 0 4px 0; }
      .card-author { font-size: 11px; color: #94a3b8; margin: 0; }
      .empty { font-size: 13px; color: #94a3b8; font-style: italic; padding: 8px 0; }
      @media print { body { margin: 20px; } }
    </style></head><body>
    <h1>🔄 ${sessionName}</h1>
    <p class="date">Exported ${date}</p>
  `;

  COLUMNS.forEach(col => {
    const colCards = cards.filter(c => c.col === col.id);
    html += `<div class="column">
      <div class="col-header" style="background:${colColors[col.id]}">${col.icon} ${col.label} (${colCards.length})</div>
      <div class="col-body">`;
    if (colCards.length === 0) {
      html += `<p class="empty">No cards submitted.</p>`;
    } else {
      colCards.forEach(c => {
        html += `<div class="card"><p class="card-text">${c.text}</p><p class="card-author">${c.author}</p></div>`;
      });
    }
    html += `</div></div>`;
  });

  html += `</body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [sessionId, setSessionId] = useState("");
  const [session, setSession] = useState(null);
  const [sessionInput, setSessionInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [newSessionName, setNewSessionName] = useState("");
  const [userName, setUserName] = useState("");
  const [isFacilitator, setIsFacilitator] = useState(false);
  const [cardText, setCardText] = useState("");
  const [cardCol, setCardCol] = useState("well");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (screen !== "board" || !sessionId) return;
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const unsub = onValue(sessionRef, snap => {
      if (snap.exists()) setSession(snap.val());
    });
    return () => unsub();
  }, [screen, sessionId]);

  const createSession = async () => {
    const name = newSessionName.trim();
    const uname = nameInput.trim();
    if (!name) return setError("Please enter a session name.");
    if (!uname) return setError("Please enter your name.");
    setLoading(true);
    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    const data = { name, cards: {}, revealed: false, created: Date.now() };
    await set(ref(db, `sessions/${id}`), data);
    setSessionId(id);
    setSession(data);
    setUserName(uname);
    setIsFacilitator(true);
    setScreen("board");
    setError("");
    setLoading(false);
  };

  const joinSession = async () => {
    const id = sessionInput.trim().toUpperCase();
    const uname = nameInput.trim();
    if (!id) return setError("Please enter a session ID.");
    if (!uname) return setError("Please enter your name.");
    setLoading(true);
    const { get } = await import("firebase/database");
    const snap = await get(ref(db, `sessions/${id}`));
    if (!snap.exists()) {
      setError("Session not found. Check the ID and try again.");
      setLoading(false);
      return;
    }
    setSessionId(id);
    setSession(snap.val());
    setUserName(uname);
    setIsFacilitator(false);
    setScreen("board");
    setError("");
    setLoading(false);
  };

  const submitCard = useCallback(async () => {
    if (!cardText.trim()) return;
    const cardId = Date.now().toString();
    const card = { col: cardCol, text: cardText.trim(), author: userName };
    await set(ref(db, `sessions/${sessionId}/cards/${cardId}`), card);
    setCardText("");
  }, [cardText, cardCol, userName, sessionId]);

  const deleteCard = async (cardId) => {
    const { remove } = await import("firebase/database");
    await remove(ref(db, `sessions/${sessionId}/cards/${cardId}`));
  };

  const toggleReveal = async () => {
    await runTransaction(ref(db, `sessions/${sessionId}/revealed`), cur => !cur);
  };

  const copyId = () => {
    navigator.clipboard?.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveSession = () => {
    setScreen("home");
    setSessionId("");
    setSession(null);
    setIsFacilitator(false);
    setSessionInput("");
    setNewSessionName("");
  };

  if (screen === "home") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔄</div>
          <h1 className="text-3xl font-bold text-white">Team Retro</h1>
          <p className="text-slate-400 mt-1">Simple retrospectives for your team</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
            <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. Kieran" value={nameInput} onChange={e => setNameInput(e.target.value)} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Create a new session</p>
            <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Session name (e.g. Sprint 42 Retro)" value={newSessionName}
              onChange={e => setNewSessionName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createSession()} />
            <button onClick={createSession} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition">
              {loading ? "Creating…" : "Create Session (Facilitator)"}
            </button>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Join an existing session</p>
            <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="6-character session ID (e.g. AB12CD)" value={sessionInput}
              onChange={e => setSessionInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && joinSession()} />
            <button onClick={joinSession} disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition">
              {loading ? "Joining…" : "Join Session"}
            </button>
          </div>
        </div>
        <p className="text-center text-slate-500 text-xs mt-4">No account needed — just share the URL and session ID.</p>
      </div>
    </div>
  );

  const cardsObj = session?.cards || {};
  const cards = Object.entries(cardsObj).map(([id, c]) => ({ id, ...c }));
  const revealed = session?.revealed || false;
  const myCards = cards.filter(c => c.author === userName);
  const canSeeAll = revealed || isFacilitator;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">🔄</span>
            <span className="font-bold text-lg">{session?.name || "Retro"}</span>
            {isFacilitator && <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded-full">Facilitator</span>}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Signed in as <span className="text-slate-200 font-medium">{userName}</span></div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isFacilitator && (
            <button onClick={toggleReveal}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${revealed ? "bg-yellow-400 text-slate-900 hover:bg-yellow-300" : "bg-green-500 text-white hover:bg-green-400"}`}>
              {revealed ? "🙈 Hide Cards" : "👁 Reveal All"}
            </button>
          )}
          {canSeeAll && (
            <button onClick={() => exportToPDF(session?.name || "Retro", cards)}
              className="text-xs bg-slate-600 hover:bg-slate-500 text-white font-semibold px-3 py-1.5 rounded-lg transition">
              📄 Export PDF
            </button>
          )}
          <button onClick={leaveSession} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition">Leave</button>
        </div>
      </div>

      <div className="bg-slate-800 text-slate-300 text-xs px-4 py-2 flex items-center gap-2 flex-wrap">
        <span>Session ID:</span>
        <code className="font-mono text-indigo-300 tracking-widest text-sm font-bold">{sessionId}</code>
        <button onClick={copyId} className={`px-2 py-0.5 rounded text-xs transition ${copied ? "bg-green-600 text-white" : "bg-slate-600 hover:bg-slate-500 text-slate-300"}`}>
          {copied ? "✓ Copied!" : "Copy"}
        </button>
        <span className="ml-auto">
          {revealed ? <span className="text-green-400">● Cards revealed</span> : <span className="text-yellow-400">● Cards hidden</span>}
        </span>
      </div>

      <div className="bg-white border-b shadow-sm px-4 py-3 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Your card</label>
          <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Write your thought…" value={cardText}
            onChange={e => setCardText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitCard()} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
          <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={cardCol} onChange={e => setCardCol(e.target.value)}>
            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <button onClick={submitCard}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition">
          Submit
        </button>
      </div>

      <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-auto">
        {COLUMNS.map(col => {
          const colCards = cards.filter(c => c.col === col.id);
          const myColCards = myCards.filter(c => c.col === col.id);
          const displayCards = canSeeAll ? colCards : myColCards;
          return (
            <div key={col.id} className="flex flex-col">
              <div className={`${col.color} text-white rounded-t-xl px-4 py-2.5 flex items-center justify-between`}>
                <span className="font-semibold text-sm flex items-center gap-1.5">{col.icon} {col.label}</span>
                <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">{displayCards.length}</span>
              </div>
              <div className={`flex-1 border-2 ${col.light} rounded-b-xl p-3 space-y-2 min-h-48`}>
                {displayCards.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center mt-6">
                    {canSeeAll ? "No cards yet." : "Your cards appear here. Others hidden until revealed."}
                  </p>
                )}
                {displayCards.map(card => (
                  <div key={card.id} className="bg-white rounded-lg px-3 py-2 shadow-sm text-sm border border-slate-200 group relative">
                    <p className="text-slate-800 pr-5">{card.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{card.author === userName ? "You" : card.author}</p>
                    {(isFacilitator || card.author === userName) && (
                      <button onClick={() => deleteCard(card.id)}
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs text-slate-400 py-2">
        {cards.length} card{cards.length !== 1 ? "s" : ""} submitted · Live sync via Firebase
      </div>
    </div>
  );
}
