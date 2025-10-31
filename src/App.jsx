import React, { useState } from "react";
import Agents from "./pages/Agents.jsx";
import Tasks from "./pages/Tasks.jsx";
import Usage from "./pages/Usage.jsx";
import AlertAssistant from "./pages/AlertAssistant.jsx";

export default function App() {
  const [section, setSection] = useState("platform");  // platform vs case_mgmt
  const [tab, setTab] = useState("agents");

  const nav = [
    { id: "insights", label: "Insights Center" },
    { id: "studio", label: "Data Studio" },
    { id: "features", label: "Feature Platform" },
    { id: "rules", label: "Rules Engine" },
    { id: "case", label: "Case Management" },
  ];

  const platformTabs = [
    { id: "agents", label: "Agents" },
    { id: "tasks", label: "Tasks" },
    { id: "usage", label: "Usage Admin" },
  ];

  const clickNav = (id) => {
    if (id === "case") {
      setSection("case_mgmt");
    } else {
      setSection("platform");
      setTab("agents");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Nav */}
      <header className="h-12 border-b bg-white flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-semibold text-indigo-600">DataVisor</span>
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => clickNav(n.id)}
              className={`px-1 pb-0.5 ${
                (section === "platform" && n.id !== "case") ||
                (section === "case_mgmt" && n.id === "case")
                  ? "text-indigo-600 font-medium border-b-2 border-indigo-600"
                  : "text-slate-600 hover:text-indigo-600"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </header>

      {/* Page Body */}
      <div className="flex-1 flex">

        {/* Case Management mode → show AlertAssistant */}
        {section === "case_mgmt" && (
          <div className="flex-1">
            <AlertAssistant />
          </div>
        )}

        {/* Platform (Agent Portal) */}
        {section === "platform" && (
          <div className="flex-1 flex">
            {/* Left Sidebar */}
            <aside className="w-52 border-r bg-white p-2 space-y-1">
              {platformTabs.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTab(m.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm border hover:bg-slate-50 mb-1 ${
                    tab === m.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </aside>

            {/* Main content */}
            <main className="flex-1 p-4 overflow-auto">
              {tab === "agents" && <Agents />}
              {tab === "tasks" && <Tasks />}
              {tab === "usage" && <Usage />}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
