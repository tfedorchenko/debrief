import { useState } from "react"

const STEPS = [
  {
    step: 1,
    title: "Welcome to Debrief",
    desc: "Your job search intelligence layer. Let's get you set up in 60 seconds.",
    action: null,
    visual: "👋",
  },
  {
    step: 2,
    title: "First, add your CV",
    desc: "Paste your CV once. Claude uses it to assess fit for every role you track — and to personalise every brief and debrief.",
    action: "Open Profile →",
    actionKey: "profile",
    visual: "📄",
  },
  {
    step: 3,
    title: "Add a role",
    desc: "Paste any job posting. Claude extracts the company, role, salary, and what kind of PM they're actually looking for.",
    action: "Add your first role →",
    actionKey: "addrole",
    visual: "➕",
  },
  {
    step: 4,
    title: "Set your interview date",
    desc: "When you land an interview, add the date and your interviewer's name. Debrief will prompt you to run your brief before you walk in.",
    action: null,
    visual: "📅",
    image: true,
  },
  {
    step: 5,
    title: "Brief before. Debrief after.",
    desc: "Before the interview: get company intel, role signals, interviewer background, and talking points. After: paste your transcript and get a coaching debrief with a score, what went well, and what to sharpen.",
    action: null,
    visual: "✦",
  },
  {
    step: 6,
    title: "Negotiate from strength",
    desc: "When an offer lands, Claude analyses your whole pipeline — competing offers, salary signals — and builds you a negotiation strategy with a script you can actually use.",
    action: null,
    visual: "💰",
  },
]

export default function Onboarding({ onComplete, onOpenProfile, onAddRole }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function handleAction() {
    if (current.actionKey === "profile") {
      onOpenProfile()
      next()
    } else if (current.actionKey === "addrole") {
      onAddRole()
      next()
    }
  }

  function next() {
    if (isLast) onComplete()
    else setStep(s => s + 1)
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "white", borderRadius: 16, width: "100%", maxWidth: 480,
        padding: "40px 40px 32px", position: "relative",
        boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
      }}>

        {/* Skip */}
        <button
          onClick={onComplete}
          style={{
            position: "absolute", top: 20, right: 20,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#C4C4BE",
          }}
        >
          Skip
        </button>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 2, flex: 1, borderRadius: 2,
              background: i <= step ? "#111" : "#E8E8E4",
              transition: "background 300ms",
            }} />
          ))}
        </div>

        {/* Visual */}
        <div style={{
          fontSize: 36, marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 64, height: 64, background: "#F7F7F5", borderRadius: 12,
        }}>
          {current.visual}
        </div>

        {/* Step label */}
        <p style={{
          fontFamily: "monospace", fontSize: 9, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#C4C4BE", marginBottom: 8,
        }}>
          Step {current.step} of {STEPS.length}
        </p>

        {/* Title */}
        <h2 style={{
          fontSize: 20, fontWeight: 700, color: "#111",
          letterSpacing: "-0.02em", marginBottom: 12,
        }}>
          {current.title}
        </h2>

        {/* Description */}
        <p style={{
          fontSize: 13, color: "#8A8A8A", lineHeight: 1.7,
          marginBottom: 32,
        }}>
          {current.desc}
        </p>

        {/* Interview date mockup for step 4 */}
        {current.image && (
          <div style={{
            background: "#F7F7F5", borderRadius: 8, padding: 16,
            marginBottom: 24, border: "1px solid #E8E8E4",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {["Interview date", "Interviewer name", "Interviewer title"].map((label, i) => (
                <div key={i}>
                  <p style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C4C4BE", marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 12, color: i === 0 ? "#111" : "#8A8A8A" }}>
                    {i === 0 ? "25 Jun" : i === 1 ? "Sarah Chen" : "VP Product"}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#FEF3C7", borderRadius: 6, border: "1px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#333" }}>◆ Interview on 25 Jun with Sarah Chen</span>
              <span style={{ fontSize: 11, color: "#D63C2A", fontWeight: 600 }}>Run your brief →</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
  <button
    onClick={next}
    style={{
      background: "#111", color: "white", border: "none", cursor: "pointer",
      padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    }}
  >
    {isLast ? "Let's go →" : "Next →"}
  </button>
</div>
</div>
    </div>
  )
}