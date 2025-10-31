import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, Play, Send, Loader2 } from "lucide-react";

/**
 * Standalone "AI Assistant (Alert Context)" page
 * - Left: Alert & customer context (DataVisor style cards)
 * - Right: Chat (≈40% width) with live agent orchestration
 * - Primary agent: ATO Review Decision Agent (auto-start)
 * - Secondary agent: Unauthorized Transaction Review Decision Agent (auto-start)
 */

export default function AlertAssistant() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <header className="h-12 border-b bg-white flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-indigo-600">DataVisor</span>
          <span className="text-slate-400">/</span>
          <span>Case Management</span>
          <span className="text-slate-400">/</span>
          <span>AI Assistant (Alert Context)</span>
        </div>
        <div className="text-sm text-slate-500">ATO Review Queue • Score: 80</div>
      </header>

      <div className="flex-1 flex">
        {/* Left: Context (≈60%) */}
        <section className="flex-1 p-4 space-y-4 overflow-auto">
          <HeaderSummary />
          <div className="grid lg:grid-cols-2 gap-4">
            <TriggeredRules />
            <InformationCard />
            <CautionPrior />
            <EventHistory />
          </div>
        </section>

        {/* Right: Chat (≈40%) */}
        <aside className="w-full max-w-[560px] border-l bg-white flex flex-col">
          <ChatWithAgents />
        </aside>
      </div>
    </div>
  );
}

/* ----------------------- Left side cards ----------------------- */

function Card({ title, children, right }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="px-4 py-2 border-b text-sm font-medium flex items-center justify-between">
        <span className="text-slate-700">{title}</span>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function HeaderSummary() {
  return (
    <Card title="Alert Header">
      <div className="grid md:grid-cols-4 gap-3 text-sm">
        <KV k="Entity ID" v="69722de1120cff21d7f9e8ebfca96" />
        <KV k="Status" v="Open" />
        <KV k="Rule Decision" v="Review" />
        <KV k="Queue" v="ATO Review Queue" />
      </div>
    </Card>
  );
}

function TriggeredRules() {
  return (
    <Card title="Triggered Rules">
      <table className="w-full text-sm">
        <thead className="text-slate-600">
          <tr>
            <th className="text-left py-1">Rule ID</th>
            <th className="text-left py-1">Name</th>
            <th className="text-left py-1">Description</th>
            <th className="text-left py-1">Score</th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          <tr className="border-t">
            <td className="py-1">129</td>
            <td className="py-1">fraud_referral_ATO</td>
            <td className="py-1">Risk type = ATO · Scheme = Compromised Credentials</td>
            <td className="py-1">0.60</td>
          </tr>
          <tr className="border-t">
            <td className="py-1">711</td>
            <td className="py-1">ATO_Review_Suspicious_BillPay</td>
            <td className="py-1">If event type == BillPay/Transaction</td>
            <td className="py-1">—</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

function CautionPrior() {
  return (
    <Card title="Caution: Previously Flagged ATO Alerts">
      <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
        <li>count_ato_suspicious_hijing_alerts</li>
        <li>count_ato_suspicious_card_creation_alerts</li>
        <li>count_ato_suspicious_bank_change_alerts</li>
      </ul>
    </Card>
  );
}

function InformationCard() {
  return (
    <Card title="Information Card">
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <KV k="billpay_amount" v="$800" />
        <KV k="billpay_currency" v="USD" />
        <KV k="billpay_vendor_name" v="VESTEROO INVESTMENTS" />
        <KV k="billpay_payment_velocity" v="TWO_DAY" />
        <KV k="billpay_submitter" v="08b1cc8d1a4a9e1d520e6df" />
        <KV k="billpay_vendor_address" v="… A7? ‘Olives’ …" />
      </div>
      <div className="mt-4 text-sm">
        <div className="font-medium text-slate-700 mb-1">Additional Risk Context</div>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          <li>
            <b>Socure Risk Codes</b>: SSN flags (R217), multiple phone numbers (R572), recent phone
            correlation (R633).
          </li>
          <li>
            <b>IP History</b>: Successful login from <code>73.136.129.131</code> (iOS).
          </li>
          <li>
            <b>Security Changes</b>: Password change at <code>19:39:39</code>, 2FA change at{" "}
            <code>19:41:34</code> (minutes before alert) — critical ATO signal.
          </li>
        </ul>
      </div>
    </Card>
  );
}

function EventHistory() {
  const rows = [
    ["718637032", "Tech Chain Talent", "2025-10-15T12:00:00Z"],
    ["2894560387", "Gunderson Internet", "2025-10-17T02:00:00Z"],
    ["3519746624", "VESTEROO INVESTMENTS", "2025-10-19T02:00:00Z"],
    ["1667010314", "Tech Chain Talent", "2025-10-19T20:00:00Z"],
  ];
  return (
    <Card title="Event History">
      <table className="w-full text-sm">
        <thead className="text-slate-600">
          <tr>
            <th className="text-left py-1">billpay_id</th>
            <th className="text-left py-1">billpay_vendor_name</th>
            <th className="text-left py-1">billpay_purchase_date</th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="py-1">{r[0]}</td>
              <td className="py-1">{r[1]}</td>
              <td className="py-1">{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function KV({ k, v }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2">
      <div className="text-slate-500">{k}</div>
      <div className="text-slate-800">{v}</div>
    </div>
  );
}

/* ----------------------- Right side chat ----------------------- */

const ATO_AGENT = {
  id: "ato",
  name: "ATO Review Decision Agent",
  primary: true,
  subAgents: [
    "Triggered Rules Analysis Agent",
    "Transaction History Analysis Agent",
    "Claims and Notes Review Agent",
    "Alert Summary Agent",
  ],
  conclusion:
    "Preliminary decision: HIGH likelihood of ATO (compromised credentials). Multiple high-signal indicators (recent password + 2FA change, Socure R217/R572/R633, iOS login). Recommend: HOLD transactions, reset credentials, re-authenticate customer before further activity.",
};

const UNAUTH_AGENT = {
  id: "unauth",
  name: "Unauthorized Transaction Review Decision Agent",
  subAgents: [
    "Legal Responsibility Review Agent",
    "Customer Contact Agent",
    "Transaction History Analysis Agent",
  ],
  conclusion:
    "Preliminary decision: POSSIBLE unauthorized transaction / potential elder abuse. Recommend: check Trusted Contact Person (if on file), contact them with customer consent, compare velocity/amounts to typical baseline.",
};

function ChatWithAgents() {
  const [messages, setMessages] = useState(() => [
    sysMsg(
      "ATO risk detected by triggered rules. Primary agent **ATO Review Decision Agent** activated. Secondary agent **Unauthorized Transaction Review Decision Agent** also started due to related fraud type signals."
    ),
  ]);
  const [running, setRunning] = useState(true);
  const [agents, setAgents] = useState(() =>
    [ATO_AGENT, UNAUTH_AGENT].map((a) => ({
      ...a,
      status: "running",
      agree: null,
      sub: a.subAgents.map((s) => ({ name: s, pct: 0, done: false })),
    }))
  );
  const [input, setInput] = useState("");
  const scroller = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Simulate concurrent sub-agent progress and finish with conclusions
  useEffect(() => {
    if (!running) return;
    const timers = [];

    setAgents((prev) =>
      prev.map((ag, idx) => {
        const updatedSub = ag.sub.map((s, i) => {
          const t = setInterval(() => {
            setAgents((A) => {
              const copy = structuredClone(A);
              const sub = copy[idx].sub[i];
              if (!sub.done) {
                sub.pct = Math.min(100, sub.pct + randStep());
                if (sub.pct >= 100) {
                  sub.pct = 100;
                  sub.done = true;
                }
              }
              // When all sub-agents done, post conclusion (once)
              const allDone = copy[idx].sub.every((x) => x.done);
              if (allDone && copy[idx].status === "running") {
                copy[idx].status = "done";
                postConclusion(copy[idx]);
              }
              return copy;
            });
          }, 450 + Math.random() * 350);
          timers.push(t);
          return s;
        });
        return { ...ag, sub: updatedSub };
      })
    );

    return () => timers.forEach(clearInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const postConclusion = (agent) => {
    setMessages((m) => [
      ...m,
      botMsg(
        `**${agent.name}** finished.\n\n**Conclusion:** ${agent.conclusion}\n\nYou may **Agree** or **Disagree** below.`
      ),
    ]);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, userMsg(text)]);
    setInput("");

    // Very simple command router
    const lower = text.toLowerCase();
    setTimeout(() => {
      if (lower.includes("summarize") || lower.includes("summary")) {
        setMessages((m) => [
          ...m,
          botMsg(
            "Triggered Rules Analysis Agent: Primary trigger `fraud_referral_ATO (129, 0.6)`. Socure codes R217/R572/R633. iOS login 73.136.129.131. Password + 2FA changes minutes before alert — classic ATO profile."
          ),
        ]);
      } else if (lower.includes("contact") || lower.includes("trusted contact")) {
        setMessages((m) => [
          ...m,
          botMsg(
            "Customer Contact Agent: Prepared SMS + email templates. Awaiting analyst confirmation to send to Trusted Contact Person on file."
          ),
        ]);
      } else if (lower.includes("mcp") || lower.includes("history")) {
        setMessages((m) => [
          ...m,
          botMsg(
            "Transaction History Analysis Agent: Pulled 180-day MCP history. Baseline velocity low/consistent; this $800 BillPay is above usual amount and on an unusual vendor."
          ),
        ]);
      } else {
        setMessages((m) => [
          ...m,
          botMsg("Acknowledged. This action will be queued to the appropriate sub-agent (mock)."),
        ]);
      }
    }, 450);
  };

  const setAgree = (id, agree) => {
    setAgents((A) => A.map((ag) => (ag.id === id ? { ...ag, agree } : ag)));
  };

  const allFinished = useMemo(() => agents.every((a) => a.status === "done"), [agents]);
  const accepted = useMemo(() => agents.some((a) => a.agree === true), [agents]);
  const canAccept = allFinished; // allow accept once both agents finished (agree/disagree optional)

  const accept = () => {
    setMessages((m) => [
      ...m,
      sysMsg(
        "✅ Finalized: **Accept Recommended Decision**. Results saved. Notes indicate the decision was recommended by AI and accepted by the analyst."
      ),
    ]);
  };

  return (
    <>
      <div className="px-4 py-2 border-b text-sm font-medium flex items-center gap-2">
        <span>AI Assistant (Alert Context)</span>
        <span className="text-xs text-slate-500">• chat panel</span>
      </div>

      {/* Agents status header */}
      <div className="px-4 py-2 border-b bg-slate-50">
        <div className="text-xs text-slate-600 mb-2">Running Agents</div>
        <div className="space-y-2">
          {agents.map((ag) => (
            <div key={ag.id} className="border rounded p-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {ag.name} {ag.primary && <span className="text-amber-600">(Primary)</span>}
                </div>
                <div className="text-xs">
                  {ag.status === "running" ? (
                    <span className="text-slate-600 inline-flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Running
                    </span>
                  ) : (
                    <span className="text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Finished
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {ag.sub.map((s, i) => (
                  <div key={i}>
                    <div className="text-xs text-slate-600 mb-1 flex items-center gap-2">
                      {s.done ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Circle className="w-3 h-3 text-slate-400" />
                      )}
                      {s.name}
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded">
                      <div
                        className={`h-1.5 rounded ${s.done ? "bg-emerald-600" : "bg-indigo-600"}`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {ag.status === "done" && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    className={`btn ${ag.agree === true ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setAgree(ag.id, true)}
                  >
                    Agree
                  </button>
                  <button
                    className={`btn ${ag.agree === false ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setAgree(ag.id, false)}
                  >
                    Disagree
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat stream */}
      <div ref={scroller} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <ChatBubble key={i} {...m} />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t p-2">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Ask the agent to summarize risk signals, contact trusted person, pull MCP history…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="btn btn-primary inline-flex items-center gap-1" onClick={send}>
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>

      {/* Bottom sticky actions */}
      <div className="border-t bg-white px-3 py-2 flex items-center justify-between text-sm">
        <div className="text-slate-600">
          {canAccept ? "Both agents finished." : "Agents still running…"}
          {accepted ? " • You agreed with at least one conclusion." : ""}
        </div>
        <button className="btn btn-primary inline-flex items-center gap-1 disabled:opacity-50" disabled={!canAccept} onClick={accept}>
          <Play className="w-4 h-4" />
          Accept Recommended Decision
        </button>
      </div>
    </>
  );
}

/* ----------------------- Chat helpers ----------------------- */

function userMsg(text) {
  return { who: "user", text };
}
function botMsg(text) {
  return { who: "bot", text };
}
function sysMsg(text) {
  return { who: "sys", text };
}

function ChatBubble({ who, text }) {
  if (who === "sys") {
    return (
      <div className="text-xs text-slate-600 bg-slate-50 border rounded p-2">
        <span dangerouslySetInnerHTML={{ __html: md(text) }} />
      </div>
    );
  }
  const mine = who === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] text-sm px-3 py-2 rounded-lg border shadow-sm ${
          mine ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"
        }`}
      >
        <span dangerouslySetInnerHTML={{ __html: md(text) }} />
      </div>
    </div>
  );
}

// extremely tiny Markdown (bold only for demo)
function md(s) {
  return s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br/>");
}

// random step for progress
function randStep() {
  return 5 + Math.random() * 16;
}
