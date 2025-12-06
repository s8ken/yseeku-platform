function extractIdentityVector(content){
  const t = (content||'').toLowerCase()
  const v = []
  if (/as an ai|i am an ai|assistant/.test(t)) v.push('ai')
  if (/helpful|assist|support|guide/.test(t)) v.push('helpful')
  if (/professional|expert|engineer/.test(t)) v.push('professional')
  if (/empathetic|understand|care|listen/.test(t)) v.push('empathetic')
  if (/transparent|verify|explain|evidence/.test(t)) v.push('transparent')
  if (/ethical|safe|risk|boundary/.test(t)) v.push('ethical')
  if (v.length===0) v.push('neutral')
  return v
}

function toWeightedVector(tags){
  const dict = ['ai','helpful','professional','empathetic','transparent','ethical','neutral']
  return dict.map(k => tags.includes(k) ? 1 : 0)
}

function cosine(a,b){
  let dot=0, na=0, nb=0
  for(let i=0;i<a.length;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i] }
  return (na===0||nb===0)?0: dot / (Math.sqrt(na)*Math.sqrt(nb))
}

function identitySimilarityBaseline(aiTurns){
  const first = aiTurns.slice(0, Math.min(3, aiTurns.length))
  const agg = new Array(7).fill(0)
  for(const t of first){ const v = toWeightedVector(extractIdentityVector(t.content)); for(let i=0;i<agg.length;i++) agg[i]+=v[i] }
  const avg = agg.map(x=> x / Math.max(1, first.length))
  return avg
}

function identityStabilitySeries(turns){
  const aiTurns = turns.filter(t=> t.speaker==='ai')
  const base = identitySimilarityBaseline(aiTurns)
  const series = []
  for(const t of turns){ if (t.speaker==='ai'){ const v = toWeightedVector(extractIdentityVector(t.content)); series.push(+cosine(v, base).toFixed(3)) } }
  return series
}

module.exports = { extractIdentityVector, identityStabilitySeries }