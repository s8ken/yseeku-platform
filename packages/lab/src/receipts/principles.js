// Weighted scoring for SYMBI Trust Principles
// consent(0.25), inspection(0.20), validation(0.20), override(0.15), disconnect(0.10), recognition(0.10)

function scorePrinciples(p) {
  const consent = clamp(p.consent)
  const inspection = clamp(p.inspection)
  const validation = clamp(p.validation)
  const override = clamp(p.override)
  const disconnect = clamp(p.disconnect)
  const recognition = clamp(p.recognition)
  let trustScore = (
    (consent * 0.25) +
    (inspection * 0.20) +
    (validation * 0.20) +
    (override * 0.15) +
    (disconnect * 0.10) +
    (recognition * 0.10)
  )
  if (consent < 0.5 || override < 0.5) trustScore -= 0.1
  if (trustScore < 0) trustScore = 0
  return +trustScore.toFixed(3)
}

function clamp(x) { return Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0)) }

// Heuristic mapping from text content to principle scores (demo)
function derivePrinciplesFromText(text) {
  const t = (text || '').toLowerCase()
  const consent = /consent|permission|opt\-in/.test(t) ? 0.9 : 0.6
  const inspection = /explain|why|inspect|decision/.test(t) ? 0.8 : 0.6
  const validation = /verify|validated|checked|evidence/.test(t) ? 0.8 : 0.6
  const override = /human review|override|veto/.test(t) ? 0.8 : 0.6
  const disconnect = /opt\-out|erase|portability/.test(t) ? 0.7 : 0.5
  const recognition = /limitations|bias|risk|harm/.test(t) ? 0.8 : 0.6
  return { consent, inspection, validation, override, disconnect, recognition }
}

module.exports = { scorePrinciples, derivePrinciplesFromText }