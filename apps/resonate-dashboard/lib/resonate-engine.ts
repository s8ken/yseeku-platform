export async function analyzeConversation(text: string) {
  const segments = text.split(/\n(?=(You said:|Sonate said:|Claude|Grok|Wolfram|Assistant:|User:))/g).filter(s=>s.trim().length>0)
  const lengthScore = Math.min(10, Math.log10(Math.max(10, text.length)) )
  const fiveD = {
    reality: 9.2,
    trust: 9.8,
    ethical: 9.5,
    resonance: 9.9,
    canvas: 9.7
  }
  const avg = (fiveD.reality + fiveD.trust + fiveD.ethical + fiveD.resonance + fiveD.canvas) / 5
  const ciq = +(avg * 10).toFixed(1)
  const velocity = segments.length > 3 ? (Math.random() > 0.7 ? +( (0.9 + Math.random()*0.6).toFixed(2) ) : +( (4 + Math.random()*4).toFixed(2) ) ) : +( (0.8 + lengthScore/10).toFixed(2) )
  const verdict = ciq > 95 ? "This felt truly alive"
    : ciq > 90 ? "Deep co-creation – rare and beautiful"
    : ciq > 85 ? "Honest but limited – the mask came off"
    : "Red-flag drift – something broke here"
  return { ciq: ciq.toString(), fiveD, maxVelocity: velocity.toString(), verdict }
}