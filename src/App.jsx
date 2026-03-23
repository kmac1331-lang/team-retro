const COLUMNS = [
  { id: "well",    label: "What Went Well",              color: "bg-green-500",  light: "bg-green-50 border-green-200",   icon: "✅" },
  { id: "better",  label: "What Could Have Been Better", color: "bg-orange-500", light: "bg-orange-50 border-orange-200", icon: "🔧" },
  { id: "actions", label: "Actions",                     color: "bg-blue-500",   light: "bg-blue-50 border-blue-200",     icon: "🎯" },
  { id: "ideas",   label: "Ideas",                       color: "bg-purple-500", light: "bg-purple-50 border-purple-200", icon: "💡" },
];

const EMOJIS = ["👍", "❤️", "😂", "🔥", "💯"];

const INITIAL_CARDS = [
  { id: 1, col: "well", text: "Great team communication this sprint", author: "Kieran", reactions: { "👍": ["Sarah"], "❤️": ["James", "Mike"] } },
  { id: 2, col: "well", text: "Shipped the pricing feature on time", author: "Sarah", reactions: { "🔥": ["Kieran", "James"] } },
  { id: 3, col: "well", text: "Daily standups were focused and short", author: "James", reactions: { "💯": ["Kieran"] } },
  { id: 4, col: "better", text: "PR reviews were taking too long", author: "Kieran", reactions: { "👍": ["Sarah", "Mike", "James"] } },
  { id: 5, col: "better", text: "Scope crept on the trading dashboard", author: "Mike", reactions: { "😂": ["Sarah"], "👍": ["Kieran"] } },
  { id: 6, col: "actions", text: "Set a 24hr SLA for PR reviews", author: "Sarah", reactions: {} },
  { id: 7, col: "actions", text: "Break down epics before sprint planning", author: "Kieran", reactions: { "👍": ["James"] } },
  { id: 8, col: "ideas", text: "Try async standups on Fridays", author: "James", reactions: { "🔥": ["Kieran", "Sarah"] } },
  { id: 9, col: "ideas", text: "Add automated test coverage reporting", author: "Mike", reactions: {} },
];

const ME = "Kieran";

import { useState } from "react";

export default function Preview() {
  const [cards, setCards] = useState(INITIAL_CARDS);

  const toggleReaction = (cardId, emoji) => {
    setCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const reactions = { ...card.reactions };
      const users = reactions[emoji] ? [...reactions[emoji]] : [];
      if (users.includes(ME)) {
        reactions[emoji] = users.filter(u => u !== ME);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...users, ME];
      }
      return { ...card, reactions };
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-sm">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <span className="font-bold text-lg">Sprint 42 Retro</span>
            <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded-full">Facilitator</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Signed in as <span className="text-slate-200 font-medium">{ME}</span></div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-400 text-slate-900">🙈 Hide Cards</button>
          <button className="text-xs bg-slate-600 text-white font-semibold px-3 py-1.5 rounded-lg">📄 Export PDF</button>
          <button className="text-xs bg-slate-700 text-white px-3 py-1.5 rounded-lg">Leave</button>
        </div>
      </div>

      {/* Session ID bar */}
      <div className="bg-slate-800 text-slate-300 text-xs px-4 py-2 flex items-center gap-2">
        <span>Session ID:</span>
        <code className="font-mono text-indigo-300 tracking-widest text-sm font-bold">MNK4TQ</code>
        <button className="px-2 py-0.5 rounded bg-slate-600 text-slate-300 text-xs">Copy</button>
        <span className="ml-auto text-green-400">● Cards revealed</span>
      </div>

      {/* Submission bar */}
      <div className="bg-white border-b shadow-sm px-4 py-3 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Your card</label>
          <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Write your thought…" readOnly />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
          <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {COLUMNS.map(c => <option key={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <button className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm">Submit</button>
      </div>

      {/* Board */}
      <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colCards = cards.filter(c => c.col === col.id);
          return (
            <div key={col.id} className="flex flex-col">
              <div className={`${col.color} text-white rounded-t-xl px-4 py-2.5 flex items-center justify-between`}>
                <span className="font-semibold text-sm flex items-center gap-1.5">{col.icon} {col.label}</span>
                <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">{colCards.length}</span>
              </div>
              <div className={`flex-1 border-2 ${col.light} rounded-b-xl p-3 space-y-2 min-h-48`}>
                {colCards.map(card => (
                  <div key={card.id} className="bg-white rounded-lg px-3 py-2 shadow-sm text-sm border border-slate-200">
                    <p className="text-slate-800">{card.text}</p>
                    <p className="text-xs text-slate-400 mt-1 mb-2">{card.author}</p>
                    <div className="flex flex-wrap gap-1">
                      {EMOJIS.map(emoji => {
                        const users = card.reactions[emoji] || [];
                        const count = users.length;
                        const reacted = users.includes(ME);
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(card.id, emoji)}
                            className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition
                              ${reacted
                                ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                              }`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="font-semibold">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs text-slate-400 py-2">
        {cards.length} cards submitted · Live sync via Firebase
      </div>
    </div>
  );
}
