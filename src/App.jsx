import { useState, useEffect } from "react"

const STORAGE_KEY = "debrief_jobs"

const STAGES = ["Applied", "Screen", "Interview", "Final", "Offer"]

const STAGE_COLORS = {
  Applied: "bg-stone-100 text-stone-600",
  Screen: "bg-blue-50 text-blue-600",
  Interview: "bg-amber-50 text-amber-600",
  Final: "bg-purple-50 text-purple-600",
  Offer: "bg-green-50 text-green-600",
  Closed: "bg-red-50 text-red-400",
}

function App() {
  const [jobs, setJobs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch { return [] }
  })
  const [showModal, setShowModal] = useState(false)
  const [jobText, setJobText] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeStage, setActiveStage] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
  }, [jobs])

  async function extractJob() {
    if (!jobText.trim()) return
    setLoading(true)
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
  "notes": "one sentence on what kind of PM they want"
}

Job posting:
${jobText}`
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
    setJobs(prev => prev.map(j => j.id === id ? { ...j, stage } : j))
  }

  function deleteJob(id) {
    setJobs(prev => prev.filter(j => j.id !== id))
    if (selectedJob?.id === id) setSelectedJob(null)
  }

  const filtered = activeStage ? jobs.filter(j => j.stage === activeStage) : jobs

  const stageCounts = STAGES.reduce((acc, s) => {
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
              onClick={() => setActiveStage(null)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm mb-0.5 transition-colors ${!activeStage ? "bg-[#F7F7F5] font-semibold text-[#111]" : "text-[#8A8A8A] hover:text-[#111] hover:bg-[#F7F7F5]"}`}
            >
              All roles
              <span className="ml-auto font-mono text-[10px] bg-[#D63C2A] text-white px-1.5 py-0.5 rounded-full">{jobs.length}</span>
            </button>
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => { setActiveStage(s === activeStage ? null : s); setSelectedJob(null); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm mb-0.5 transition-colors ${activeStage === s ? "bg-[#F7F7F5] font-semibold text-[#111]" : "text-[#8A8A8A] hover:text-[#111] hover:bg-[#F7F7F5]"}`}
              >
                {s}
                {stageCounts[s] > 0 && (
                  <span className="ml-auto font-mono text-[10px] text-[#8A8A8A]">{stageCounts[s]}</span>
                )}
              </button>
            ))}
          </nav>

          {/* SIDEBAR STATS */}
          <div className="border-t border-[#E8E8E4] p-4 mt-auto">
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
                onClick={() => { setActiveStage(s === activeStage ? null : s); setSelectedJob(null); }}
                className={`bg-white border rounded-lg p-4 text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${activeStage === s ? "border-[#111] border-[1.5px] shadow-md -translate-y-0.5" : "border-[#E8E8E4] shadow-sm"}`}
              >
                <p className="font-mono text-[9px] tracking-widest uppercase text-[#8A8A8A] mb-2">{s}</p>
                <p className="text-3xl font-bold tracking-tight">{stageCounts[s]}</p>
                {activeStage === s && <div className="mt-2 h-0.5 bg-[#D63C2A] rounded-full" />}
              </button>
            ))}
          </div>

          {/* JOBS TABLE */}
          {jobs.length === 0 ? (
            <div className="bg-white border border-[#E8E8E4] rounded-lg shadow-sm flex flex-col items-center justify-center py-20 text-center">
              <p className="text-2xl mb-2">🐴</p>
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
              {/* Table header */}
              <div className="grid gap-4 px-5 py-2.5 bg-[#F7F7F5] border-b border-[#E8E8E4]" style={{ gridTemplateColumns: "2fr 0.7fr 0.9fr 0.9fr 80px" }}>
                {["Role", "Type", "Salary", "Stage", ""].map(h => (
                  <span key={h} className="font-mono text-[9px] tracking-widest uppercase text-[#C4C4BE]">{h}</span>
                ))}
              </div>
              {filtered.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  className="grid gap-4 px-5 py-3.5 border-b border-[#E8E8E4] last:border-0 hover:bg-[#F7F7F5] cursor-pointer items-center transition-colors"
                  style={{ gridTemplateColumns: "2fr 0.7fr 0.9fr 0.9fr 80px" }}
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{selectedJob.company}</h2>
                  <p className="text-sm text-[#8A8A8A]">{selectedJob.role} · {selectedJob.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  {STAGES.map(s => (
                    <button
                      key={s}
                      onClick={() => { updateStage(selectedJob.id, s); setSelectedJob(prev => ({ ...prev, stage: s })) }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedJob.stage === s ? "bg-[#111] text-white border-[#111]" : "border-[#E8E8E4] text-[#8A8A8A] hover:border-[#111] hover:text-[#111]"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {selectedJob.notes && (
                <div className="bg-[#F7F7F5] rounded-lg p-3 text-sm text-[#333]">
                  <span className="font-mono text-[9px] tracking-widest uppercase text-[#C4C4BE] block mb-1">Role signal</span>
                  {selectedJob.notes}
                </div>
              )}
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
    </div>
  )
}

export default App