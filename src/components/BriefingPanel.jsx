import { useState } from "react";

// ─── Briefing Panel ───────────────────────────────────────────────────────────
// Drop this into src/components/BriefingPanel.jsx
// Usage: <BriefingPanel role={role} onClose={() => setBriefingRole(null)} />
// Where `role` is a pipeline entry: { company, role, jobDescription, ... }

export default function BriefingPanel({ role, onClose }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerTitle, setInterviewerTitle] = useState("");

  const generateBriefing = async () => {
    setLoading(true);
    setError(null);
    setBriefing(null);

    const interviewerSection = interviewerName.trim()
      ? `Interviewer: ${interviewerName.trim()}${interviewerTitle ? `, ${interviewerTitle}` : ""} at ${role.company}`
      : `No interviewer name provided — skip the interviewer section and mark it as "Add interviewer name for personalised intel."`;

    const prompt = `You are a career strategist preparing a PM for an interview. Be concise — every field max 1-2 sentences or 2 bullets.

Company: ${role.company}
Role: ${role.role || role.title || "Product Manager"}
${interviewerSection}

Search the web for recent news and context. Return ONLY a JSON object, no markdown:
{
  "company_snapshot": {
    "headline": "One sentence: the single most important thing to know right now",
    "recent_news": ["most important recent development", "second most important"],
    "strategic_context": "One sentence on where the company is headed"
  },
  "role_intel": {
    "what_they_actually_want": "One sentence reading between the lines of the role",
    "likely_interview_themes": ["theme 1", "theme 2"]
  },
  "interviewer": {
    "name": "${interviewerName || "Unknown"}",
    "background_summary": "One sentence on their background",
    "what_they_care_about": "One sentence on what they value",
    "angle": "One specific thing to reference or ask"
  },
  "talking_points": [
    { "topic": "label", "point": "one sentence: what to say and why it lands" },
    { "topic": "label", "point": "one sentence: what to say and why it lands" }
  ],
  "opening_question": "The single best opening question",
  "watch_out": "One sentence on what to avoid"
}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
},
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 3000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API error");
      }

      // Extract the final text block (comes after tool use blocks)
      const textBlock = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      const jsonMatch = textBlock.match(/\{[\s\S]*\}/);
if (!jsonMatch) throw new Error("No JSON found in response");
const parsed = JSON.parse(jsonMatch[0]);
      setBriefing(parsed);
      typeof pendo !== "undefined" && pendo.track("interview_briefing_generated", {
        company: role.company,
        role: role.role || role.title || "",
        hasInterviewerName: Boolean(interviewerName.trim()),
        hasInterviewerTitle: Boolean(interviewerTitle.trim()),
        talkingPointsCount: parsed.talking_points?.length || 0,
        hasInterviewerIntel: Boolean(parsed.interviewer && parsed.interviewer.name !== "Unknown")
      });
    } catch (err) {
      setError("Couldn't generate briefing. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const initials = (role.company || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative h-full w-full max-w-xl bg-[#F7F7F5] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E4] bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#111] text-white flex items-center justify-center text-xs font-bold font-mono">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-[#111]">
                {role.company}
              </div>
              <div className="text-xs text-[#8A8A8A] font-mono">
                Pre-interview briefing
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8A8A] hover:text-[#111] text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Generate form */}
          {!briefing && !loading && (
            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm text-[#333] mb-4">
                  Debrief will search the web for company intel, role signals,
                  and interviewer background — then build your briefing pack.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#555] mb-1">
                      Interviewer name{" "}
                      <span className="text-[#8A8A8A] font-normal">
                        (optional but recommended)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={interviewerName}
                      onChange={(e) => setInterviewerName(e.target.value)}
                      placeholder="e.g. Sarah Chen"
                      className="w-full px-3 py-2 text-sm border border-[#E8E8E4] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#D63C2A] focus:border-[#D63C2A] placeholder-[#C4C4BE]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#555] mb-1">
                      Their title{" "}
                      <span className="text-[#8A8A8A] font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={interviewerTitle}
                      onChange={(e) => setInterviewerTitle(e.target.value)}
                      placeholder="e.g. VP Product"
                      className="w-full px-3 py-2 text-sm border border-[#E8E8E4] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#D63C2A] focus:border-[#D63C2A] placeholder-[#C4C4BE]"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={generateBriefing}
                className="w-full py-2.5 bg-[#D63C2A] hover:bg-[#BF3525] text-white text-sm font-semibold rounded-md transition-colors"
              >
                Run briefing →
              </button>

              {error && (
                <p className="text-xs text-[#D63C2A] bg-[#FDF1EF] rounded-md px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[300px]">
              <div className="w-6 h-6 border-2 border-[#E8E8E4] border-t-[#D63C2A] rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-[#111]">
                  Searching the web…
                </p>
                <p className="text-xs text-[#8A8A8A] mt-1">
                  Pulling recent news, role signals
                  {interviewerName ? `, and intel on ${interviewerName}` : ""}
                </p>
              </div>
            </div>
          )}

          {/* Briefing output */}
          {briefing && (
            <div className="p-6 space-y-5">
              {/* Company snapshot */}
              <Section eyebrow="Company" title={briefing.company_snapshot.headline}>
                <ul className="space-y-2 mt-3">
                  {briefing.company_snapshot.recent_news.map((item, i) => (
                    <BulletItem key={i} text={item} />
                  ))}
                </ul>
                <p className="mt-3 text-xs text-[#555] leading-relaxed">
                  {briefing.company_snapshot.strategic_context}
                </p>
              </Section>

              {/* Role intel */}
              <Section eyebrow="Role intel" title="What they actually want">
                <p className="mt-2 text-xs text-[#333] leading-relaxed">
                  {briefing.role_intel.what_they_actually_want}
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-[#555] mb-2">
                    Likely interview themes
                  </p>
                  {briefing.role_intel.likely_interview_themes.map(
                    (theme, i) => (
                      <div
                        key={i}
                        className="text-xs bg-[#F0F0EE] rounded px-2.5 py-1.5 text-[#333]"
                      >
                        {theme}
                      </div>
                    )
                  )}
                </div>
              </Section>

              {/* Interviewer */}
              {briefing.interviewer &&
                briefing.interviewer.name !== "Unknown" && (
                  <Section
                    eyebrow="Interviewer"
                    title={briefing.interviewer.name}
                    accent
                  >
                    <p className="mt-2 text-xs text-[#333] leading-relaxed">
                      {briefing.interviewer.background_summary}
                    </p>
                    <div className="mt-3 space-y-2">
                      <InsightRow
                        label="They care about"
                        text={briefing.interviewer.what_they_care_about}
                      />
                      <InsightRow
                        label="Your angle"
                        text={briefing.interviewer.angle}
                        highlight
                      />
                    </div>
                  </Section>
                )}

              {/* Talking points */}
              <Section eyebrow="Talking points" title="Bring these up">
                <div className="mt-3 space-y-2.5">
                  {briefing.talking_points.map((tp, i) => (
                    <div
                      key={i}
                      className="border border-[#E8E8E4] rounded-md p-3 bg-white"
                    >
                      <div className="text-xs font-semibold text-[#D63C2A] mb-1 font-mono uppercase tracking-wide">
                        {tp.topic}
                      </div>
                      <div className="text-xs text-[#333] leading-relaxed">
                        {tp.point}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Opening question */}
              <div className="bg-[#111] rounded-md p-4">
                <div className="text-xs font-mono text-[#8A8A8A] uppercase tracking-wider mb-2">
                  Open with this
                </div>
                <p className="text-sm text-white leading-relaxed italic">
                  "{briefing.opening_question}"
                </p>
              </div>

              {/* Watch out */}
              <div className="bg-[#FDF1EF] border border-[#F5C9C4] rounded-md p-3">
                <div className="text-xs font-semibold text-[#D63C2A] mb-1">
                  Watch out
                </div>
                <p className="text-xs text-[#555] leading-relaxed">
                  {briefing.watch_out}
                </p>
              </div>

              {/* Regenerate */}
              <button
                onClick={() => {
                  setBriefing(null);
                  setError(null);
                }}
                className="w-full py-2 border border-[#E8E8E4] text-xs text-[#8A8A8A] hover:text-[#333] hover:border-[#C4C4BE] rounded-md transition-colors bg-white"
              >
                ↺ Regenerate briefing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ eyebrow, title, children, accent }) {
  return (
    <div className="bg-white rounded-lg border border-[#E8E8E4] p-4 shadow-sm">
      <div
        className={`text-[10px] font-mono uppercase tracking-widest mb-0.5 ${
          accent ? "text-[#D63C2A]" : "text-[#8A8A8A]"
        }`}
      >
        {eyebrow}
      </div>
      <div className="text-sm font-semibold text-[#111] leading-snug">
        {title}
      </div>
      {children}
    </div>
  );
}

function BulletItem({ text }) {
  return (
    <li className="flex gap-2 text-xs text-[#333] leading-relaxed">
      <span className="text-[#D63C2A] mt-0.5 shrink-0">·</span>
      <span>{text}</span>
    </li>
  );
}

function InsightRow({ label, text, highlight }) {
  return (
    <div
      className={`rounded px-2.5 py-2 text-xs ${
        highlight
          ? "bg-[#111] text-white"
          : "bg-[#F0F0EE] text-[#333]"
      }`}
    >
      <span
        className={`font-semibold mr-1.5 ${
          highlight ? "text-[#D63C2A]" : "text-[#555]"
        }`}
      >
        {label}
      </span>
      {text}
    </div>
  );
}