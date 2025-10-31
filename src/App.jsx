import React, { useState } from "react";
import Agents from "./pages/Agents.jsx";
import Tasks from "./pages/Tasks.jsx";
import Usage from "./pages/Usage.jsx";

export default function App() {
  const [tab, setTab] = useState("agents");
  const menu = [
    { id: "agents", label: "Agents" },
    { id: "tasks", label: "Tasks" },
    { id: "usage", label: "Usage Admin" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <header className="h-12 border-b bg-white flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-indigo-600">DataVisor</span>
          <span className="text-slate-400">/</span>
          <span>AI Agent Portal</span>
        </div>
        <div className="text-sm text-slate-500">Admin Console</div>
      </header>

      <div className="h-10 border-b bg-white flex items-center px-4 text-sm text-slate-600">
        Agents Management / {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </div>

      <div className="flex flex-1">
        <aside className="w-52 border-r bg-white p-2 space-y-1">
          {menu.map((m) => (
            <button
              key={m.id}
              onClick={() => setTab(m.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm border hover:bg-slate-50 mb-1 ${
                tab === m.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-4 overflow-auto">
          {tab === "agents" && <Agents />}
          {tab === "tasks" && <Tasks />}
          {tab === "usage" && <Usage />}
        </main>
      </div>
    </div>
  );
}
