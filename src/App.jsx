import { useState, useEffect } from "react"

const STORAGE_KEY = "debrief_jobs"
const CV_STORAGE_KEY = "debrief_cv"

const STAGES = ["Applied", "Screen", "Interview", "Final", "Offer"]

const STAGE_COLORS = {
  Applied: "bg-stone-100 text-stone-600",
  Screen: "bg-blue-50 text-blue-600",
  Interview: "bg-amber-50 text-amber-600",
  Final: "bg-purple-50 text-purple-600",
  Offer: "bg-green-50 text-green-600",
  Closed: "bg-red-50 text-red-400",
}

// Inline editable field component
function EditableField({ label, value, onChange, placeholder = "—", multiline = false, mono = false }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || "")

  function commit() {
    setEditing(false)
    onChange(draft)
  }

  const textClass = `text-sm ${mono ? "font-mono" : ""} text-[#333] bg-transparent focus:outline-none w-full resize-none`

  return (
    <div className="group">
      <span className="font-mono text-[9px] tracking-widest uppercase text-[#C4C4BE] block mb-1">{label}</span>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            rows={4}
            className={`${textClass} border border-[#E8E8E4] rounded-md p-2 focus:border-[#111] transition-colors`}
          />
        ) : (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === "Enter" && commit()}
            className={`${textClass} border border-[#E8E8E4] rounded-md px-2 py-1 focus:border-[#111] transition-colors`}
          />
        )
      ) : (
        <p
          onClick={() => { setDraft(value || ""); setEditing(true) }}
          className={`${textClass} cursor-text rounded-md px-2 py-1 -mx-2 hover:bg-[#F7F7F5] transition-colors min-h-[28px] ${!value ? "text-[#C4C4BE]" : ""}`}
        >
          {value || placeholder}
        </p>
      )}
    </div>
  )
}

function App() {
  const [jobs, setJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch { return [] }
  })
  const [cvText, setCvText] = useState(() => localStorage.getItem(CV_STORAGE_KEY) || "")
  const [showModal, setShowModal] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [jobText, setJobText] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeStage, setActiveStage] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [cvDraft, setCvDraft] = useState("")
  const [emailText, setEmailText] = useState("")
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailResult, setEmailResult] = useState(null) // { suggestedStage, reason, signals }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
  }, [jobs])

  useEffect(() => {
    localStorage.setItem(CV_STORAGE_KEY, cvText)
  }, [cvText])

  // Sync selectedJob with jobs array so edits reflect immediately
  useEffect(() => {
    if (selectedJob) {
      const updated = jobs.find(j => j.id === selectedJob.id)
      if (updated) setSelectedJob(updated)
    }
  }, [jobs])

  function updateJob(id, fields) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...fields } : j))
  }

  async function extractJob() {
    if (!jobText.trim()) return
    setLoading(true)
    try {
      const cvContext = cvText
        ? `\n\nCandidate CV for context (use to assess fit signals):\n${cvText.slice(0, 2000)}`
        : ""

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Extract job details from this posting and return ONLY valid JSON with these fields:
{
  "company": "company name",
  "role": "job title",
  "salary": "salary range or null",
  "type": "one of: Growth, Technical, AI, Generalist, Design, Data",
  "location": "location or Remote",
  "url": null,
  "notes": "1-2 sentences on what kind of PM they actually want and key signals from the posting",
  "fitSignal": "one of: Strong fit, Good fit, Partial fit, Unclear — based on candidate CV if provided"
}

Job posting:
${jobText}${cvContext}`
          }]
        })
      })
      const data = await res.json()
      const text = data.content[0].text
      const clean = text.replace(/```json|```/g, "").trim()
      const extracted = JSON.parse(clean)
      const newJob = {
        id: Date.now(),
        ...extracted,
        stage: "Applied",
        coverLetter: "",
        added: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      }
      setJobs(prev => [newJob, ...prev])
      setShowModal(false)
      setJobText("")
    } catch (e) {
      alert("Something went wrong extracting the job. Try again.")
      console.error(e)
    }
    setLoading(false)
  }

  function updateStage(id, stage) {
    updateJob(id, { stage })
  }

  function deleteJob(id) {
    setJobs(prev => prev.filter(j => j.id !== id))
    if (selectedJob?.id === id) setSelectedJob(null)
  }

  function closeRole(id) {
    updateJob(id, { stage: "Closed" })
    setSelectedJob(null)
  }

  async function parseEmail(job) {
    if (!emailText.trim()) return
    setEmailLoading(true)
    setEmailResult(null)
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{
            role: "user",
            content: `You are analysing a recruiter or hiring email for a job application.

Current role: ${job.role} at ${job.company}
Current stage: ${job.stage}
Available stages: Applied, Screen, Interview, Final, Offer, Closed

Email:
${emailText}

Return ONLY valid JSON:
{
  "suggestedStage": "one of the available stages, or null if unclear",
  "reason": "one sentence explaining why this stage",
  "signals": "2-3 bullet points of useful signals from the email — feedback, next steps, tone, timeline, anything relevant. Use \\n to separate bullets."
}`
          }]
        })
      })
      const data = await res.json()
      const text = data.content[0].text
      const clean = text.replace(/```json|```/g, "").trim()
      setEmailResult(JSON.parse(clean))
    } catch (e) {
      alert("Something went wrong parsing the email. Try again.")
      console.error(e)
    }
    setEmailLoading(false)
  }

  function applyEmailResult(job) {
    if (!emailResult) return
    const updates = {}
    if (emailResult.suggestedStage) updates.stage = emailResult.suggestedStage
    if (emailResult.signals) {
      const existing = job.userNotes ? job.userNotes + "\n\n" : ""
      updates.userNotes = existing + `Email signals (${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}):\n${emailResult.signals}`
    }
    updateJob(job.id, updates)
    setShowEmailInput(false)
    setEmailText("")
    setEmailResult(null)
  }

  const filtered = activeStage
    ? jobs.filter(j => j.stage === activeStage)
    : jobs.filter(j => j.stage !== "Closed")

  const allFiltered = activeStage === "Closed"
    ? jobs.filter(j => j.stage === "Closed")
    : filtered

  const stageCounts = [...STAGES, "Closed"].reduce((acc, s) => {
    acc[s] = jobs.filter(j => j.stage === s).length
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* TOPBAR */}
      <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-7 border-b border-[#E8E8E4] bg-white/85 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-bold tracking-tight text-[#111]">Debrief</span>
        </div>
        <div className="flex items-center gap-3">
          {jobs.length > 0 && (
            <span className="font-mono text-xs text-[#8A8A8A]">{jobs.length} role{jobs.length !== 1 ? "s" : ""} tracked</span>
          )}
          <button
            onClick={() => { setShowProfile(true); setCvDraft(cvText) }}
            className="text-xs text-[#8A8A8A] px-3 py-2 rounded-lg hover:bg-[#F7F7F5] transition-colors border border-[#E8E8E4]"
          >
            {cvText ? "✓ Profile" : "Add CV"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#111] text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-[#333] transition-colors"
          >
            + Add role
          </button>
        </div>
      </header>

      <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>

        {/* SIDEBAR */}
        <aside className="w-[220px] shrink-0 border-r border-[#E8E8E4] bg-white flex flex-col sticky top-14 h-[calc(100vh-56px)]">
          <nav className="flex-1 px-3 pt-5">
            <p className="font-mono text-[9px] tracking-widest uppercase text-[#C4C4BE] px-2 pb-1.5">Pipeline</p>
            <button
              onClick={() => { setActiveStage(null); setSelectedJob(null) }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm mb-0.5 transition-colors ${!activeStage ? "bg-[#F7F7F5] font-semibold text-[#111]" : "text-[#8A8A8A] hover:text-[#111] hover:bg-[#F7F7F5]"}`}
            >
              All active
              <span className="ml-auto font-mono text-[10px] bg-[#D63C2A] text-white px-1.5 py-0.5 rounded-full">
                {jobs.filter(j => j.stage !== "Closed").length}
              </span>
            </button>
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => { setActiveStage(s === activeStage ? null : s); setSelectedJob(null) }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm mb-0.5 transition-colors ${activeStage === s ? "bg-[#F7F7F5] font-semibold text-[#111]" : "text-[#8A8A8A] hover:text-[#111] hover:bg-[#F7F7F5]"}`}
              >
                {s}
                {stageCounts[s] > 0 && (
                  <span className="ml-auto font-mono text-[10px] text-[#8A8A8A]">{stageCounts[s]}</span>
                )}
              </button>
            ))}
            {stageCounts.Closed > 0 && (
              <button
                onClick={() => { setActiveStage("Closed"); setSelectedJob(null) }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm mb-0.5 transition-colors ${activeStage === "Closed" ? "bg-[#F7F7F5] font-semibold text-[#111]" : "text-[#8A8A8A] hover:text-[#111] hover:bg-[#F7F7F5]"}`}
              >
                Closed
                <span className="ml-auto font-mono text-[10px] text-[#8A8A8A]">{stageCounts.Closed}</span>
              </button>
            )}
          </nav>

          {/* SIDEBAR BOTTOM */}
          <div className="border-t border-[#E8E8E4] p-4 mt-auto">
            <img src="/horse.png" alt="" className="w-10 mb-3 opacity-70" />
            <p className="font-mono text-[9px] tracking-widest uppercase text-[#C4C4BE] mb-2">Stats</p>
            <div className="flex justify-between items-baseline py-1">
              <span className="font-mono text-[10px] text-[#8A8A8A]">Active</span>
              <span className="text-sm font-bold tracking-tight">{jobs.filter(j => j.stage !== "Closed").length}</span>
            </div>
            <div className="flex justify-between items-baseline py-1">
              <span className="font-mono text-[10px] text-[#8A8A8A]">Interviews</span>
              <span className="text-sm font-bold tracking-tight">{stageCounts.Interview + stageCounts.Final}</span>
            </div>
            <div className="flex justify-between items-baseline py-1">
              <span className="font-mono text-[10px] text-[#8A8A8A]">Offers</span>
              <span className="text-sm font-bold tracking-tight">{stageCounts.Offer}</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-8 overflow-y-auto">

          {/* FUNNEL TILES */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => { setActiveStage(s === activeStage ? null : s); setSelectedJob(null) }}
                className={`bg-white border rounded-lg p-4 text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${activeStage === s ? "border-[#111] border-[1.5px] shadow-md -translate-y-0.5" : "border-[#E8E8E4] shadow-sm"}`}
              >
                <p className="font-mono text-[9px] tracking-widest uppercase text-[#8A8A8A] mb-2">{s}</p>
                <p className="text-3xl font-bold tracking-tight">{stageCounts[s]}</p>
                {activeStage === s && <div className="mt-2 h-0.5 bg-[#D63C2A] rounded-full" />}
              </button>
            ))}
          </div>

          {/* JOBS TABLE */}
          {jobs.filter(j => j.stage !== "Closed").length === 0 && !activeStage ? (
            <div className="bg-white border border-[#E8E8E4] rounded-lg shadow-sm flex flex-col items-center justify-center py-20 text-center">
              <img src="/horse.png" alt="Debrief horse" className="w-24 mb-4" />
              <p className="font-semibold text-[#111] mb-1">No roles yet</p>
              <p className="text-sm text-[#8A8A8A] mb-4">Paste a job posting and Claude will extract everything</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-[#111] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#333] transition-colors"
              >
                + Add your first role
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E8E4] rounded-lg shadow-sm overflow-hidden">
              <div className="grid gap-4 px-5 py-2.5 bg-[#F7F7F5] border-b border-[#E8E8E4]" style={{ gridTemplateColumns: "2fr 0.6fr 0.9fr 0.9fr 0.6fr 80px" }}>
                {["Role", "Type", "Salary", "Stage", "Fit", ""].map(h => (
                  <span key={h} className="font-mono text-[9px] tracking-widest uppercase text-[#C4C4BE]">{h}</span>
                ))}
              </div>
              {allFiltered.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  className={`grid gap-4 px-5 py-3.5 border-b border-[#E8E8E4] last:border-0 cursor-pointer items-center transition-colors ${selectedJob?.id === job.id ? "bg-[#F7F7F5]" : "hover:bg-[#F7F7F5]"}`}
                  style={{ gridTemplateColumns: "2fr 0.6fr 0.9fr 0.9fr 0.6fr 80px" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#F0F0EE] flex items-center justify-center font-semibold text-xs text-[#333] shrink-0">
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#111] text-sm leading-tight">{job.company}</p>
                      <p className="text-xs text-[#8A8A8A]">{job.role}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#8A8A8A]">{job.type}</span>
                  <span className="font-mono text-xs text-[#8A8A8A]">{job.salary || "—"}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit ${STAGE_COLORS[job.stage]}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    {job.stage}
                  </span>
                  <span className="font-mono text-[10px] text-[#8A8A8A]">{job.fitSignal || "—"}</span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteJob(job.id) }}
                    className="text-[#C4C4BE] hover:text-red-400 text-xs transition-colors ml-auto"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* JOB DETAIL PANEL */}
          {selectedJob && (
            <div className="mt-4 bg-white border border-[#E8E8E4] rounded-lg shadow-sm p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{selectedJob.company}</h2>
                  <p className="text-sm text-[#8A8A8A]">{selectedJob.role}</p>
                  {selectedJob.added && (
                    <p className="font-mono text-[10px] text-[#C4C4BE] mt-0.5">Added {selectedJob.added}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {STAGES.map(s => (
                    <button
                      key={s}
                      onClick={() => updateJob(selectedJob.id, { stage: s })}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedJob.stage === s ? "bg-[#111] text-white border-[#111]" : "border-[#E8E8E4] text-[#8A8A8A] hover:border-[#111] hover:text-[#111]"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields grid */}
              <div className="grid grid-cols-3 gap-5 mb-5">
                <EditableField
                  label="Salary"
                  value={selectedJob.salary}
                  onChange={val => updateJob(selectedJob.id, { salary: val })}
                  placeholder="Not specified"
                  mono
                />
                <EditableField
                  label="Location"
                  value={selectedJob.location}
                  onChange={val => updateJob(selectedJob.id, { location: val })}
                  placeholder="Not specified"
                />
                <EditableField
                  label="Job URL"
                  value={selectedJob.url}
                  onChange={val => updateJob(selectedJob.id, { url: val })}
                  placeholder="Paste link"
                />
              </div>

              {/* Role signal */}
              {selectedJob.notes && (
                <div className="bg-[#F7F7F5] rounded-lg p-3 mb-5">
                  <EditableField
                    label="Role signal"
                    value={selectedJob.notes}
                    onChange={val => updateJob(selectedJob.id, { notes: val })}
                    multiline
                  />
                </div>
              )}

              {/* Notes */}
              <div className="mb-5">
                <EditableField
                  label="Your notes"
                  value={selectedJob.userNotes}
                  onChange={val => updateJob(selectedJob.id, { userNotes: val })}
                  placeholder="Add notes, contacts, next steps..."
                  multiline
                />
              </div>

              {/* Cover letter */}
              <div className="border-t border-[#E8E8E4] pt-5">
                <EditableField
                  label="Cover letter / application notes"
                  value={selectedJob.coverLetter}
                  onChange={val => updateJob(selectedJob.id, { coverLetter: val })}
                  placeholder="Paste your cover letter or key application points here..."
                  multiline
                />
              </div>

              {/* Email parser */}
              <div className="border-t border-[#E8E8E4] mt-5 pt-5">
                {!showEmailInput ? (
                  <button
                    onClick={() => { setShowEmailInput(true); setEmailResult(null) }}
                    className="text-xs text-[#8A8A8A] hover:text-[#111] transition-colors border border-[#E8E8E4] rounded-lg px-3 py-2 hover:border-[#111]"
                  >
                    + Update from email
                  </button>
                ) : (
                  <div>
                    <span className="font-mono text-[9px] tracking-widest uppercase text-[#C4C4BE] block mb-2">Paste recruiter email</span>
                    <textarea
                      value={emailText}
                      onChange={e => setEmailText(e.target.value)}
                      placeholder="Paste the email here..."
                      autoFocus
                      rows={5}
                      className="w-full text-sm border border-[#E8E8E4] rounded-lg p-3 resize-none focus:outline-none focus:border-[#111] transition-colors mb-3"
                    />

                    {/* Email result */}
                    {emailResult && (
                      <div className="bg-[#F7F7F5] rounded-lg p-4 mb-3">
                        {emailResult.suggestedStage && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-mono text-[9px] tracking-widest uppercase text-[#C4C4BE]">Suggested stage</span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${STAGE_COLORS[emailResult.suggestedStage] || "bg-stone-100 text-stone-600"}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                              {emailResult.suggestedStage}
                            </span>
                            <span className="text-xs text-[#8A8A8A]">— {emailResult.reason}</span>
                          </div>
                        )}
                        {emailResult.signals && (
                          <div>
                            <span className="font-mono text-[9px] tracking-widest uppercase text-[#C4C4BE] block mb-1.5">Signals</span>
                            {emailResult.signals.split("\n").filter(Boolean).map((s, i) => (
                              <p key={i} className="text-xs text-[#333] mb-1">• {s.replace(/^•\s*/, "")}</p>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => applyEmailResult(selectedJob)}
                          className="mt-3 bg-[#111] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#333] transition-colors"
                        >
                          Apply update
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!emailResult && (
                        <button
                          onClick={() => parseEmail(selectedJob)}
                          disabled={emailLoading || !emailText.trim()}
                          className="bg-[#111] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#333] disabled:opacity-40 transition-colors flex items-center gap-2"
                        >
                          {emailLoading ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Analysing...
                            </>
                          ) : "Analyse with Claude"}
                        </button>
                      )}
                      <button
                        onClick={() => { setShowEmailInput(false); setEmailText(""); setEmailResult(null) }}
                        className="text-xs text-[#8A8A8A] px-4 py-2 rounded-lg hover:bg-[#F7F7F5] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="border-t border-[#E8E8E4] mt-5 pt-4 flex items-center justify-between">
                <button
                  onClick={() => closeRole(selectedJob.id)}
                  className="text-xs text-[#8A8A8A] hover:text-[#D63C2A] transition-colors"
                >
                  Close role
                </button>
                {selectedJob.url && (
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#8A8A8A] hover:text-[#111] transition-colors underline underline-offset-2"
                  >
                    View job posting ↗
                  </a>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ADD ROLE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-[#E8E8E4]">
              <h2 className="font-bold text-base tracking-tight">Add a role</h2>
              <p className="text-xs text-[#8A8A8A] mt-0.5">Paste the job posting — Claude will extract the details</p>
            </div>
            <div className="p-6">
              <textarea
                value={jobText}
                onChange={e => setJobText(e.target.value)}
                placeholder="Paste job description here..."
                className="w-full h-48 text-sm border border-[#E8E8E4] rounded-lg p-3 resize-none focus:outline-none focus:border-[#111] transition-colors"
                autoFocus
              />
              {cvText && (
                <p className="text-[10px] text-[#8A8A8A] mt-2 font-mono">✓ CV loaded — Claude will assess fit</p>
              )}
            </div>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <button
                onClick={() => { setShowModal(false); setJobText("") }}
                className="text-sm text-[#8A8A8A] px-4 py-2 rounded-lg hover:bg-[#F7F7F5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={extractJob}
                disabled={loading || !jobText.trim()}
                className="bg-[#111] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#333] disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Extracting...
                  </>
                ) : "Extract with Claude"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV / PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-[#E8E8E4]">
              <h2 className="font-bold text-base tracking-tight">Your profile</h2>
              <p className="text-xs text-[#8A8A8A] mt-0.5">Paste your CV — Claude uses this to assess fit and personalise analysis</p>
            </div>
            <div className="p-6">
              <textarea
                value={cvDraft}
                onChange={e => setCvDraft(e.target.value)}
                placeholder="Paste your CV or a summary of your background, skills, and experience..."
                className="w-full h-56 text-sm border border-[#E8E8E4] rounded-lg p-3 resize-none focus:outline-none focus:border-[#111] transition-colors"
                autoFocus
              />
              <p className="text-[10px] text-[#8A8A8A] mt-2 font-mono">Stored locally on your device only</p>
            </div>
            <div className="px-6 pb-6 flex justify-between items-center">
              {cvText && (
                <button
                  onClick={() => { setCvText(""); setCvDraft(""); setShowProfile(false) }}
                  className="text-xs text-[#8A8A8A] hover:text-red-400 transition-colors"
                >
                  Clear CV
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowProfile(false)}
                  className="text-sm text-[#8A8A8A] px-4 py-2 rounded-lg hover:bg-[#F7F7F5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setCvText(cvDraft); setShowProfile(false) }}
                  disabled={!cvDraft.trim()}
                  className="bg-[#111] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#333] disabled:opacity-40 transition-colors"
                >
                  Save profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App