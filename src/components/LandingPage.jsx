import { useEffect, useState } from "react"

export default function LandingPage({ onEnter }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  const fade = (delay = 0) => ({
    transition: `opacity 900ms ${delay}ms`,
    opacity: visible ? 1 : 0,
  })

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F7F7F5", minHeight: "100vh" }}>

      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: "8vh",
      }}>

        <div style={{
          ...fade(0),
          position: "absolute",
          fontSize: "22vw",
          fontWeight: 800,
          letterSpacing: "-0.05em",
          color: "#111",
          opacity: 0.028,
          userSelect: "none",
          pointerEvents: "none",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}>
          DEBRIEF
        </div>

        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 0,
          position: "relative", zIndex: 1,
        }}>

          <div style={{ ...fade(0), marginBottom: 4 }}>
            <img
              src="/horse.png"
              alt=""
              style={{ width: 96, height: 96, objectFit: "contain", mixBlendMode: "multiply" }}
            />
          </div>

          <div style={{ ...fade(150), marginBottom: 28 }}>
            <span style={{
              fontWeight: 800, fontSize: 36, color: "#111",
              letterSpacing: "-0.04em", display: "block",
            }}>
              Debrief
            </span>
          </div>

          <p style={{
            ...fade(350),
            fontSize: 13, color: "#8A8A8A", lineHeight: 1.65,
            maxWidth: 280, margin: 0,
          }}>
            You spend your career building products.<br />
            Now build a strategy for finding your next one.
          </p>

          <div style={{ ...fade(550), marginTop: 24 }}>
            <button
              onClick={onEnter}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#8A8A8A", padding: 0,
                transition: "color 200ms",
              }}
              onMouseEnter={e => e.target.style.color = "#111"}
              onMouseLeave={e => e.target.style.color = "#8A8A8A"}
            >
              Get started →
            </button>
          </div>
        </div>

        <div style={{
          ...fade(900),
          position: "absolute",
          bottom: 96,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{
            fontFamily: "monospace", fontSize: 8, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#C4C4BE",
          }}>scroll</span>
          <div style={{
            width: 1, height: 32,
            background: "linear-gradient(to bottom, #C4C4BE, transparent)",
          }} />
        </div>
      </section>

      <section style={{
        borderTop: "1px solid #E8E8E4",
        padding: "96px 48px",
        maxWidth: 680,
        margin: "0 auto",
      }}>
        <p style={{
          fontFamily: "monospace", fontSize: 9, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "#C4C4BE",
          marginBottom: 64, textAlign: "center",
        }}>
          How it works
        </p>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            { step: "01", label: "Track", title: "Add a role in seconds", desc: "Paste any job posting. Claude extracts the company, role, salary, and what kind of PM they're actually looking for — including how well it fits your CV." },
            { step: "02", label: "Brief", title: "Walk in prepared", desc: "Before every interview, run a briefing. Debrief searches the web for company news, decodes the role, researches your interviewer, and hands you talking points and an opening question." },
            { step: "03", label: "Debrief", title: "Learn from every conversation", desc: "Paste your interview transcript from Granola. Get a score, coaching on what went well and what to sharpen, and a signal on where this is heading." },
            { step: "04", label: "Negotiate", title: "Don't leave money on the table", desc: "When an offer lands, Claude analyses your whole pipeline — salary signals, competing offers, late-stage interviews — and builds a negotiation strategy with a script you can actually use." },
          ].map((item, i) => (
            <div key={item.step} style={{
              display: "grid", gridTemplateColumns: "56px 1fr", gap: "0 40px",
              paddingBottom: i < 3 ? 56 : 0,
              borderBottom: i < 3 ? "1px solid #E8E8E4" : "none",
              marginBottom: i < 3 ? 56 : 0,
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2 }}>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: "#C4C4BE", letterSpacing: "0.06em", marginBottom: 12 }}>
                  {item.step}
                </span>
                {i < 3 && <div style={{ width: 1, flex: 1, background: "#E8E8E4", minHeight: 32 }} />}
              </div>
              <div>
                <span style={{
                  fontFamily: "monospace", fontSize: 9, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: "#D63C2A", display: "block", marginBottom: 6,
                }}>
                  {item.label}
                </span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111", letterSpacing: "-0.02em", marginBottom: 8 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: "#8A8A8A", lineHeight: 1.7, maxWidth: 420 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 72 }}>
          <button
            onClick={onEnter}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#8A8A8A",
              transition: "color 200ms",
            }}
            onMouseEnter={e => e.target.style.color = "#111"}
            onMouseLeave={e => e.target.style.color = "#8A8A8A"}
          >
            Get started →
          </button>
        </div>
      </section>

      <footer style={{
        borderTop: "1px solid #E8E8E4",
        padding: "20px 48px", marginTop: 80,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/horse.png" alt="" style={{ width: 14, height: 14, objectFit: "contain", mixBlendMode: "multiply", opacity: 0.5 }} />
          <span style={{ fontFamily: "monospace", fontSize: 9, color: "#C4C4BE", letterSpacing: "0.08em", textTransform: "uppercase" }}>Debrief</span>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          <span style={{ fontFamily: "monospace", fontSize: 9, color: "#C4C4BE", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mind the Product Hackathon 2026</span>
          <span style={{ fontFamily: "monospace", fontSize: 9, color: "#C4C4BE", letterSpacing: "0.08em", textTransform: "uppercase" }}>Powered by Claude</span>
        </div>
      </footer>

    </div>
  )
}